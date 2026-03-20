# Consent Form → Google Drive Sync

When a consent form is submitted, a JSON copy is automatically uploaded to a Google Drive folder.

## Setup

1. **Enable Google Drive API**
   - Go to [Google Cloud Console](https://console.cloud.google.com) → your Firebase project
   - APIs & Services → Enable APIs → search "Google Drive API" → Enable

2. **Create or use a Drive folder**
   - Create a folder in Google Drive (e.g. "Sally Health Consent Forms")
   - Note the folder ID from the URL: `https://drive.google.com/drive/folders/FOLDER_ID`

3. **Share folder with the Cloud Functions service account**
   - Firebase Console → Project Settings → Service accounts
   - Copy the service account email (e.g. `project-id@appspot.gserviceaccount.com`)
   - In Google Drive, right-click the folder → Share → add the service account email as Editor

4. **Set the folder ID**
   - Get it from the Drive folder URL: `https://drive.google.com/drive/folders/THIS_IS_THE_FOLDER_ID`
   - When you deploy, Firebase will prompt for `DRIVE_FOLDER_ID`; enter it then
   - Or create `functions/.env.YOUR_PROJECT_ID` with: `DRIVE_FOLDER_ID=your_folder_id`

5. **Deploy**
   ```bash
   cd functions && npm install && npm run build
   firebase deploy --only functions
   ```

## Output

Each submission creates a file: `consent-{docId}-{date}.json` in your Drive folder.
