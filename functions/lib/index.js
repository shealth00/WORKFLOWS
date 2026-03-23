"use strict";
/**
 * Firebase Cloud Functions for Sally Health
 *
 * syncConsentToGoogleDrive: When a consent form is submitted, creates a JSON
 * copy and uploads it to a configured Google Drive folder.
 *
 * syncSubmissionToWebhook: When a form submission is created, POSTs the payload
 * to the form owner's configured webhook URL (users/{uid}/integrations/webhook).
 *
 * Setup:
 * 1. Enable Google Drive API in Google Cloud Console
 * 2. Share the target Drive folder with the Cloud Functions service account (Editor)
 * 3. Deploy: firebase deploy --only functions (you'll be prompted for DRIVE_FOLDER_ID)
 *    Or add DRIVE_FOLDER_ID to functions/.env.gen-lang-client-0777929601
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncSubmissionToWebhook = exports.syncConsentToGoogleDrive = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
const googleapis_1 = require("googleapis");
admin.initializeApp();
const driveFolderId = (0, params_1.defineString)("DRIVE_FOLDER_ID", {
    description: "Google Drive folder ID where consent form JSON files are uploaded",
});
/**
 * Uploads consent form data to Google Drive as a JSON file.
 * Triggered when a document is created in consentSubmissions.
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
    const folderId = driveFolderId.value();
    if (!folderId) {
        firebase_functions_1.logger.warn("DRIVE_FOLDER_ID not configured. Run firebase deploy --only functions and set it when prompted, or add to functions/.env.PROJECT_ID");
        return null;
    }
    try {
        const auth = new googleapis_1.google.auth.GoogleAuth({
            scopes: ["https://www.googleapis.com/auth/drive.file"],
        });
        const drive = googleapis_1.google.drive({ version: "v3", auth });
        const fileName = `consent-${docId}-${new Date().toISOString().slice(0, 10)}.json`;
        const fileContent = JSON.stringify({
            id: docId,
            submittedAt: data.submittedAt,
            collectorName: data.collectorName,
            patient: data.patient,
            respiratory: data.respiratory,
            uti: data.uti,
            sti: data.sti,
            nailFungus: data.nailFungus,
            signature: data.signature,
            consentChecked: data.consentChecked,
        }, null, 2);
        const file = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [folderId],
            },
            media: {
                mimeType: "application/json",
                body: fileContent,
            },
        });
        firebase_functions_1.logger.info(`Uploaded consent ${docId} to Drive: ${file.data.id}`);
        await snap.ref.update({ googleDriveFileId: file.data.id });
        return file.data.id;
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
//# sourceMappingURL=index.js.map