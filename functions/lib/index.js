"use strict";
/**
 * Firebase Cloud Functions for Sally Health
 *
 * syncConsentToGoogleDrive: When a consent form is submitted, creates a JSON
 * copy and uploads it to a configured Google Drive folder.
 *
 * Setup:
 * 1. Enable Google Drive API in Google Cloud Console
 * 2. Share the target Drive folder with the Cloud Functions service account (Editor)
 * 3. Deploy: firebase deploy --only functions (you'll be prompted for DRIVE_FOLDER_ID)
 *    Or add DRIVE_FOLDER_ID to functions/.env.gen-lang-client-0777929601
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncConsentToGoogleDrive = void 0;
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
//# sourceMappingURL=index.js.map