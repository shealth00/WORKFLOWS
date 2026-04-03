"use strict";
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncFormSubmissionToGoogleDrive = exports.syncSubmissionToWebhook = exports.syncPrecisionDiagnosticToGoogleDrive = exports.syncPrecisionScreeningToGoogleDrive = exports.syncConsentToGoogleDrive = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
const googleapis_1 = require("googleapis");
admin.initializeApp();
const COMPLETED_FORMS_FOLDER_NAME = "completed forms";
const driveFolderId = (0, params_1.defineString)("DRIVE_FOLDER_ID", {
    description: "Google Drive folder ID for patient directory root; JSON files go in a 'completed forms' subfolder",
});
function escapeDriveQueryString(s) {
    return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
async function findChildFolderId(drive, parentId, folderName) {
    var _a, _b;
    const name = escapeDriveQueryString(folderName);
    const q = `mimeType='application/vnd.google-apps.folder' and ` +
        `'${parentId}' in parents and name='${name}' and trashed=false`;
    const res = await drive.files.list({
        q,
        fields: "files(id, name)",
        pageSize: 5,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    });
    const id = (_b = (_a = res.data.files) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id;
    return id !== null && id !== void 0 ? id : null;
}
async function getOrCreateCompletedFormsFolder(drive, rootFolderId) {
    const existing = await findChildFolderId(drive, rootFolderId, COMPLETED_FORMS_FOLDER_NAME);
    if (existing)
        return existing;
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
    if (!id)
        throw new Error("Drive API did not return folder id for completed forms");
    return id;
}
function consentBlockForDrive(consent) {
    if (!consent || typeof consent !== "object")
        return consent;
    const { signatureImageDataUrl: _img } = consent, rest = __rest(consent, ["signatureImageDataUrl"]);
    return rest;
}
function firestoreTimestampToIso(value) {
    if (value &&
        typeof value === "object" &&
        "toDate" in value &&
        typeof value.toDate === "function") {
        try {
            return value.toDate().toISOString();
        }
        catch (_a) {
            return value;
        }
    }
    return value;
}
function createDriveClient() {
    const auth = new googleapis_1.google.auth.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
    return googleapis_1.google.drive({ version: "v3", auth });
}
async function uploadJsonToCompletedForms(params) {
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
    firebase_functions_1.logger.info(`Uploaded ${fileName} to Drive completed forms: ${fid}`);
    await docRef.update({ googleDriveFileId: fid });
    return fid !== null && fid !== void 0 ? fid : null;
}
/**
 * Uploads consent form data to Google Drive as JSON under …/completed forms/
 */
exports.syncConsentToGoogleDrive = (0, firestore_1.onDocumentCreated)("consentSubmissions/{docId}", async (event) => {
    const snap = event.data;
    if (!snap)
        return null;
    const docId = event.params.docId;
    const data = snap.data();
    const sendToDrive = (data === null || data === void 0 ? void 0 : data.sendToGoogleDrive) === true;
    if (!sendToDrive) {
        firebase_functions_1.logger.info(`Skipping Drive sync for ${docId} (sendToGoogleDrive not set)`);
        return null;
    }
    const rootId = driveFolderId.value();
    if (!rootId) {
        firebase_functions_1.logger.warn("DRIVE_FOLDER_ID not configured. Run firebase deploy --only functions and set it when prompted, or add to functions/.env.PROJECT_ID");
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
    }
    catch (err) {
        firebase_functions_1.logger.error("Google Drive upload failed", err);
        await snap.ref.update({
            googleDriveError: err instanceof Error ? err.message : "Upload failed",
        });
        throw err;
    }
});
/**
 * Precision screening → same completed forms folder
 */
exports.syncPrecisionScreeningToGoogleDrive = (0, firestore_1.onDocumentCreated)("precisionScreenings/{docId}", async (event) => {
    const snap = event.data;
    if (!snap)
        return null;
    const docId = event.params.docId;
    const data = snap.data();
    if ((data === null || data === void 0 ? void 0 : data.sendToGoogleDrive) === false) {
        firebase_functions_1.logger.info(`Skipping Drive sync for precision screening ${docId}`);
        return null;
    }
    const rootId = driveFolderId.value();
    if (!rootId)
        return null;
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
            consent: consentBlockForDrive(data.consent),
            nextStep: data.nextStep,
        };
        return await uploadJsonToCompletedForms({
            drive,
            rootFolderId: rootId,
            fileName,
            jsonBody,
            docRef: snap.ref,
        });
    }
    catch (err) {
        firebase_functions_1.logger.error("Google Drive upload failed (precision screening)", err);
        await snap.ref.update({
            googleDriveError: err instanceof Error ? err.message : "Upload failed",
        });
        throw err;
    }
});
/**
 * Precision diagnostic → same completed forms folder
 */
exports.syncPrecisionDiagnosticToGoogleDrive = (0, firestore_1.onDocumentCreated)("precisionDiagnosticScreenings/{docId}", async (event) => {
    const snap = event.data;
    if (!snap)
        return null;
    const docId = event.params.docId;
    const data = snap.data();
    if ((data === null || data === void 0 ? void 0 : data.sendToGoogleDrive) === false) {
        firebase_functions_1.logger.info(`Skipping Drive sync for precision diagnostic ${docId}`);
        return null;
    }
    const rootId = driveFolderId.value();
    if (!rootId)
        return null;
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
            consent: consentBlockForDrive(data.consent),
        };
        return await uploadJsonToCompletedForms({
            drive,
            rootFolderId: rootId,
            fileName,
            jsonBody,
            docRef: snap.ref,
        });
    }
    catch (err) {
        firebase_functions_1.logger.error("Google Drive upload failed (precision diagnostic)", err);
        await snap.ref.update({
            googleDriveError: err instanceof Error ? err.message : "Upload failed",
        });
        throw err;
    }
});
/**
 * POSTs form submission data to the form owner's webhook URL when configured.
 * Triggered when a document is created in forms/{formId}/submissions.
 */
exports.syncSubmissionToWebhook = (0, firestore_1.onDocumentCreated)("forms/{formId}/submissions/{submissionId}", async (event) => {
    var _a, _b, _c;
    const snap = event.data;
    if (!snap)
        return null;
    const { formId, submissionId } = event.params;
    const submissionData = snap.data();
    const formSnap = await admin.firestore().doc(`forms/${formId}`).get();
    if (!formSnap.exists)
        return null;
    const ownerId = (_a = formSnap.data()) === null || _a === void 0 ? void 0 : _a.ownerId;
    if (!ownerId)
        return null;
    const webhookSnap = await admin.firestore().doc(`users/${ownerId}/integrations/webhook`).get();
    const webhookUrl = (_b = webhookSnap.data()) === null || _b === void 0 ? void 0 : _b.url;
    if (!webhookUrl || typeof webhookUrl !== "string")
        return null;
    try {
        const payload = {
            formId,
            submissionId,
            formTitle: (_c = formSnap.data()) === null || _c === void 0 ? void 0 : _c.title,
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
            firebase_functions_1.logger.warn(`Webhook POST to ${webhookUrl} returned ${response.status}`);
        }
        else {
            firebase_functions_1.logger.info(`Webhook delivered for form ${formId}, submission ${submissionId}`);
        }
        return null;
    }
    catch (err) {
        firebase_functions_1.logger.error("Webhook delivery failed", err);
        return null;
    }
});
/**
 * Form builder submissions → same completed forms folder (Patient Directory root).
 * Opt-out: set sendToGoogleDrive: false on the submission document.
 */
exports.syncFormSubmissionToGoogleDrive = (0, firestore_1.onDocumentCreated)("forms/{formId}/submissions/{submissionId}", async (event) => {
    var _a, _b, _c;
    const snap = event.data;
    if (!snap)
        return null;
    const { formId, submissionId } = event.params;
    const submissionData = snap.data();
    if ((submissionData === null || submissionData === void 0 ? void 0 : submissionData.sendToGoogleDrive) === false) {
        firebase_functions_1.logger.info(`Skipping Drive sync for form submission ${formId}/${submissionId}`);
        return null;
    }
    const rootId = driveFolderId.value();
    if (!rootId)
        return null;
    const formSnap = await admin.firestore().doc(`forms/${formId}`).get();
    const formTitle = formSnap.exists ? (_a = formSnap.data()) === null || _a === void 0 ? void 0 : _a.title : undefined;
    try {
        const drive = createDriveClient();
        const fileName = `form-${formId}-${submissionId}-${new Date().toISOString().slice(0, 10)}.json`;
        const jsonBody = {
            id: submissionId,
            type: "formSubmission",
            formId,
            formTitle: typeof formTitle === "string" ? formTitle : null,
            submittedByUid: (_b = submissionData.submittedByUid) !== null && _b !== void 0 ? _b : null,
            data: submissionData.data,
            results: (_c = submissionData.results) !== null && _c !== void 0 ? _c : null,
            submittedAt: firestoreTimestampToIso(submissionData.submittedAt),
        };
        return await uploadJsonToCompletedForms({
            drive,
            rootFolderId: rootId,
            fileName,
            jsonBody,
            docRef: snap.ref,
        });
    }
    catch (err) {
        firebase_functions_1.logger.error("Google Drive upload failed (form submission)", err);
        await snap.ref.update({
            googleDriveError: err instanceof Error ? err.message : "Upload failed",
        });
        throw err;
    }
});
//# sourceMappingURL=index.js.map