/**
 * Firebase Cloud Functions for Sally Health
 *
 * Google Drive: Completed forms (consent, precision flows, and form builder submissions)
 * are saved as JSON under a subfolder named "completed forms" inside the folder
 * configured by DRIVE_FOLDER_ID
 * (e.g. your "Patient Directory" Drive folder).
 *
 * syncSubmissionToWebhook: POSTs form submission payloads to the form owner's webhook.
 *
 * Setup:
 * 1. Enable Google Drive API in Google Cloud Console
 * 2. Share the target Drive folder with the Cloud Functions service account (Editor)
 * 3. Deploy: firebase deploy --only functions (you'll be prompted for DRIVE_FOLDER_ID)
 *    Or add DRIVE_FOLDER_ID to functions/.env.PROJECT_ID
 */

import {
  onDocumentCreated,
  type FirestoreEvent,
} from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { defineSecret, defineString } from "firebase-functions/params";
import { findMatchingDirectoryProfilesServer, type PatientProfileLite } from "./patientMatch";
import * as geminiServer from "./geminiServer";
import * as admin from "firebase-admin";
import type { DocumentReference, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { google } from "googleapis";
import type { drive_v3 } from "googleapis";

admin.initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const COMPLETED_FORMS_FOLDER_NAME = "completed forms";

const driveFolderId = defineString("DRIVE_FOLDER_ID", {
  description:
    "Google Drive folder ID for patient directory root; JSON files go in a 'completed forms' subfolder",
});

function escapeDriveQueryString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findChildFolderId(
  drive: drive_v3.Drive,
  parentId: string,
  folderName: string
): Promise<string | null> {
  const name = escapeDriveQueryString(folderName);
  const q =
    `mimeType='application/vnd.google-apps.folder' and ` +
    `'${parentId}' in parents and name='${name}' and trashed=false`;
  const res = await drive.files.list({
    q,
    fields: "files(id, name)",
    pageSize: 5,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const id = res.data.files?.[0]?.id;
  return id ?? null;
}

async function getOrCreateCompletedFormsFolder(
  drive: drive_v3.Drive,
  rootFolderId: string
): Promise<string> {
  const existing = await findChildFolderId(drive, rootFolderId, COMPLETED_FORMS_FOLDER_NAME);
  if (existing) return existing;
  const created = await drive.files.create({
    requestBody: {
      name: COMPLETED_FORMS_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
      parents: [rootFolderId],
    },
    fields: "id",
    supportsAllDrives: true,
  });
  const id = created.data.id;
  if (!id) throw new Error("Drive API did not return folder id for completed forms");
  return id;
}

function consentBlockForDrive(consent: Record<string, unknown> | undefined): unknown {
  if (!consent || typeof consent !== "object") return consent;
  const { signatureImageDataUrl: _img, ...rest } = consent;
  return rest;
}

function firestoreTimestampToIso(value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return value;
    }
  }
  return value;
}

function createDriveClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  return google.drive({ version: "v3", auth });
}

async function uploadJsonToCompletedForms(params: {
  drive: drive_v3.Drive;
  rootFolderId: string;
  fileName: string;
  jsonBody: unknown;
  docRef: DocumentReference;
}): Promise<string | null> {
  const { drive, rootFolderId, fileName, jsonBody, docRef } = params;
  const parentId = await getOrCreateCompletedFormsFolder(drive, rootFolderId);
  const fileContent = JSON.stringify(jsonBody, null, 2);
  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [parentId],
    },
    media: {
      mimeType: "application/json",
      body: fileContent,
    },
    supportsAllDrives: true,
  });
  const fid = file.data.id;
  logger.info(`Uploaded ${fileName} to Drive completed forms: ${fid}`);
  await docRef.update({ googleDriveFileId: fid });
  return fid ?? null;
}

/**
 * Uploads consent form data to Google Drive as JSON under …/completed forms/
 */
export const syncConsentToGoogleDrive = onDocumentCreated(
  "consentSubmissions/{docId}",
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    const snap = event.data;
    if (!snap) return null;
    const docId = event.params.docId;
    const data = snap.data();
    const sendToDrive = data?.sendToGoogleDrive === true;

    if (!sendToDrive) {
      logger.info(`Skipping Drive sync for ${docId} (sendToGoogleDrive not set)`);
      return null;
    }

    const rootId = driveFolderId.value();
    if (!rootId) {
      logger.warn(
        "DRIVE_FOLDER_ID not configured. Run firebase deploy --only functions and set it when prompted, or add to functions/.env.PROJECT_ID"
      );
      return null;
    }

    try {
      const drive = createDriveClient();
      const fileName = `consent-${docId}-${new Date().toISOString().slice(0, 10)}.json`;
      const jsonBody = {
        id: docId,
        type: "consent",
        submittedAt: data.submittedAt,
        collectorName: data.collectorName,
        patient: data.patient,
        respiratory: data.respiratory,
        uti: data.uti,
        sti: data.sti,
        nailFungus: data.nailFungus,
        signature: data.signature,
        consentChecked: data.consentChecked,
      };
      return await uploadJsonToCompletedForms({
        drive,
        rootFolderId: rootId,
        fileName,
        jsonBody,
        docRef: snap.ref,
      });
    } catch (err) {
      logger.error("Google Drive upload failed", err);
      await snap.ref.update({
        googleDriveError: err instanceof Error ? err.message : "Upload failed",
      });
      throw err;
    }
  }
);

/**
 * Precision screening → same completed forms folder
 */
export const syncPrecisionScreeningToGoogleDrive = onDocumentCreated(
  "precisionScreenings/{docId}",
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    const snap = event.data;
    if (!snap) return null;
    const docId = event.params.docId;
    const data = snap.data();
    if (data?.sendToGoogleDrive === false) {
      logger.info(`Skipping Drive sync for precision screening ${docId}`);
      return null;
    }

    const rootId = driveFolderId.value();
    if (!rootId) return null;

    try {
      const drive = createDriveClient();
      const fileName = `precision-screening-${docId}-${new Date().toISOString().slice(0, 10)}.json`;
      const jsonBody = {
        id: docId,
        type: "precisionScreening",
        createdAt: data.createdAt,
        createdByUid: data.createdByUid,
        patient: data.patient,
        responses: data.responses,
        results: data.results,
        consent: consentBlockForDrive(data.consent as Record<string, unknown> | undefined),
        nextStep: data.nextStep,
      };
      return await uploadJsonToCompletedForms({
        drive,
        rootFolderId: rootId,
        fileName,
        jsonBody,
        docRef: snap.ref,
      });
    } catch (err) {
      logger.error("Google Drive upload failed (precision screening)", err);
      await snap.ref.update({
        googleDriveError: err instanceof Error ? err.message : "Upload failed",
      });
      throw err;
    }
  }
);

/**
 * Precision diagnostic → same completed forms folder
 */
export const syncPrecisionDiagnosticToGoogleDrive = onDocumentCreated(
  "precisionDiagnosticScreenings/{docId}",
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    const snap = event.data;
    if (!snap) return null;
    const docId = event.params.docId;
    const data = snap.data();
    if (data?.sendToGoogleDrive === false) {
      logger.info(`Skipping Drive sync for precision diagnostic ${docId}`);
      return null;
    }

    const rootId = driveFolderId.value();
    if (!rootId) return null;

    try {
      const drive = createDriveClient();
      const fileName = `precision-diagnostic-${docId}-${new Date().toISOString().slice(0, 10)}.json`;
      const jsonBody = {
        id: docId,
        type: "precisionDiagnostic",
        createdAt: data.createdAt,
        createdByUid: data.createdByUid,
        patient: data.patient,
        responses: data.responses,
        results: data.results,
        consent: consentBlockForDrive(data.consent as Record<string, unknown> | undefined),
      };
      return await uploadJsonToCompletedForms({
        drive,
        rootFolderId: rootId,
        fileName,
        jsonBody,
        docRef: snap.ref,
      });
    } catch (err) {
      logger.error("Google Drive upload failed (precision diagnostic)", err);
      await snap.ref.update({
        googleDriveError: err instanceof Error ? err.message : "Upload failed",
      });
      throw err;
    }
  }
);

/**
 * POSTs form submission data to the form owner's webhook URL when configured.
 * Triggered when a document is created in forms/{formId}/submissions.
 */
export const syncSubmissionToWebhook = onDocumentCreated(
  "forms/{formId}/submissions/{submissionId}",
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    const snap = event.data;
    if (!snap) return null;
    const { formId, submissionId } = event.params;
    const submissionData = snap.data();

    const formSnap = await admin.firestore().doc(`forms/${formId}`).get();
    if (!formSnap.exists) return null;
    const ownerId = formSnap.data()?.ownerId;
    if (!ownerId) return null;

    const webhookSnap = await admin.firestore().doc(`users/${ownerId}/integrations/webhook`).get();
    const webhookUrl = webhookSnap.data()?.url;
    if (!webhookUrl || typeof webhookUrl !== "string") return null;

    try {
      const payload = {
        formId,
        submissionId,
        formTitle: formSnap.data()?.title,
        data: submissionData.data,
        results: submissionData.results,
        submittedAt: submissionData.submittedAt,
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        logger.warn(`Webhook POST to ${webhookUrl} returned ${response.status}`);
      } else {
        logger.info(`Webhook delivered for form ${formId}, submission ${submissionId}`);
      }
      return null;
    } catch (err) {
      logger.error("Webhook delivery failed", err);
      return null;
    }
  }
);

/**
 * Form builder submissions → same completed forms folder (Patient Directory root).
 * Opt-out: set sendToGoogleDrive: false on the submission document.
 */
export const syncFormSubmissionToGoogleDrive = onDocumentCreated(
  "forms/{formId}/submissions/{submissionId}",
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    const snap = event.data;
    if (!snap) return null;
    const { formId, submissionId } = event.params;
    const submissionData = snap.data();
    if (submissionData?.sendToGoogleDrive === false) {
      logger.info(`Skipping Drive sync for form submission ${formId}/${submissionId}`);
      return null;
    }

    const rootId = driveFolderId.value();
    if (!rootId) return null;

    const formSnap = await admin.firestore().doc(`forms/${formId}`).get();
    const formTitle = formSnap.exists ? formSnap.data()?.title : undefined;

    try {
      const drive = createDriveClient();
      const fileName = `form-${formId}-${submissionId}-${new Date().toISOString().slice(0, 10)}.json`;
      const jsonBody = {
        id: submissionId,
        type: "formSubmission",
        formId,
        formTitle: typeof formTitle === "string" ? formTitle : null,
        submittedByUid: submissionData.submittedByUid ?? null,
        data: submissionData.data,
        results: submissionData.results ?? null,
        submittedAt: firestoreTimestampToIso(submissionData.submittedAt),
      };
      return await uploadJsonToCompletedForms({
        drive,
        rootFolderId: rootId,
        fileName,
        jsonBody,
        docRef: snap.ref,
      });
    } catch (err) {
      logger.error("Google Drive upload failed (form submission)", err);
      await snap.ref.update({
        googleDriveError: err instanceof Error ? err.message : "Upload failed",
      });
      throw err;
    }
  }
);

/** Gemini API proxy — key stored in Secret Manager; client never sees the key in production builds. */
export const geminiProxy = onCall(
  { secrets: [geminiApiKey], region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required");
    }
    const key = geminiApiKey.value();
    if (!key) {
      throw new HttpsError("failed-precondition", "GEMINI_API_KEY secret not set for functions");
    }
    const data = request.data as { action?: string; [key: string]: unknown };
    const action = data.action;
    try {
      switch (action) {
        case "generateForm":
          return {
            result: await geminiServer.geminiGenerateForm(key, String(data.prompt ?? "")),
          };
        case "chat":
          return { text: await geminiServer.geminiChat(key, (data.messages as never) || []) };
        case "transcribe":
          return { text: await geminiServer.geminiTranscribe(key, String(data.base64Audio ?? "")) };
        case "tts":
          return { audioBase64: await geminiServer.geminiTts(key, String(data.text ?? "")) };
        default:
          throw new HttpsError("invalid-argument", "Unknown Gemini action");
      }
    } catch (e: unknown) {
      if (e instanceof HttpsError) throw e;
      logger.error("geminiProxy error", e);
      const msg = e instanceof Error ? e.message : "Gemini error";
      throw new HttpsError("internal", msg);
    }
  }
);

/**
 * Returns only directory rows that match the signed-in user (no full directory to the client).
 * Reads payload from settings/patientDirectory.payloadJson (managed via Console or seed script).
 */
export const getPatientPortalMatches = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required");
  }
  const uid = request.auth.uid;
  const snap = await admin.firestore().doc("settings/patientDirectory").get();
  if (!snap.exists) {
    return { matches: [], generatedAt: null as string | null, source: "none" };
  }
  const docData = snap.data() as { payloadJson?: string };
  const raw = docData.payloadJson;
  if (!raw) {
    return { matches: [], generatedAt: null, source: "empty" };
  }
  let payload: { profiles?: unknown[]; generatedAt?: string };
  try {
    payload = JSON.parse(raw) as { profiles?: unknown[]; generatedAt?: string };
  } catch {
    return { matches: [], generatedAt: null, source: "invalid" };
  }
  const profiles = (payload.profiles || []) as PatientProfileLite[];

  const consentSnap = await admin
    .firestore()
    .collection("consentSubmissions")
    .where("submittedByUid", "==", uid)
    .get();
  const consentFullNames: string[] = [];
  const consentEmails: string[] = [];
  for (const d of consentSnap.docs) {
    const p = d.data().patient as { fullName?: string; email?: string } | undefined;
    if (p?.fullName) consentFullNames.push(String(p.fullName));
    if (p?.email) consentEmails.push(String(p.email));
  }

  const userRecord = await admin.auth().getUser(uid);
  const matches = findMatchingDirectoryProfilesServer(
    userRecord.email || undefined,
    userRecord.displayName || undefined,
    userRecord.phoneNumber || undefined,
    profiles,
    { consentFullNames, consentEmails }
  );

  return {
    matches,
    generatedAt: payload.generatedAt ?? null,
    source: "firestore",
  };
});
