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

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { defineString } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { google } from "googleapis";

admin.initializeApp();

const driveFolderId = defineString("DRIVE_FOLDER_ID", {
  description: "Google Drive folder ID where consent form JSON files are uploaded",
});

/**
 * Uploads consent form data to Google Drive as a JSON file.
 * Triggered when a document is created in consentSubmissions.
 */
export const syncConsentToGoogleDrive = onDocumentCreated(
  "consentSubmissions/{docId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return null;
    const docId = event.params.docId;
    const data = snap.data();
    const sendToDrive = data?.sendToGoogleDrive === true;

    if (!sendToDrive) {
      logger.info(`Skipping Drive sync for ${docId} (sendToGoogleDrive not set)`);
      return null;
    }

    const folderId = driveFolderId.value();
    if (!folderId) {
      logger.warn(
        "DRIVE_FOLDER_ID not configured. Run firebase deploy --only functions and set it when prompted, or add to functions/.env.PROJECT_ID"
      );
      return null;
    }

    try {
      const auth = new google.auth.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/drive.file"],
      });
      const drive = google.drive({ version: "v3", auth });

      const fileName = `consent-${docId}-${new Date().toISOString().slice(0, 10)}.json`;
      const fileContent = JSON.stringify(
        {
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
        },
        null,
        2
      );

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

      logger.info(`Uploaded consent ${docId} to Drive: ${file.data.id}`);
      await snap.ref.update({ googleDriveFileId: file.data.id });
      return file.data.id;
    } catch (err) {
      logger.error("Google Drive upload failed", err);
      await snap.ref.update({
        googleDriveError: err instanceof Error ? err.message : "Upload failed",
      });
      throw err;
    }
  });
