# Patient Directory (CSV merge or `patient upload` spreadsheet)

Staff-only route: **`/patient-directory`**. In production, staff data comes from **Firestore `settings/patientDirectory`** (see below); **`npm run generate:patient-profiles`** only writes **`public/patient-directory/profiles.json` locally** (gitignored) for upload or dev—never rely on that file as a public Hosting URL for real PHI.

## Workflow

**Option A — EMR / bulk CSV (preferred when you have facility exports)**

1. Ensure folders exist: **`npm run ensure:patient-folders`**. Place one or more **`*.csv`** files in **`Patient Directory/`** (repo root; contents are gitignored).  
   Supported format: headers include **FirstName**, **LastName** (e.g. exports with **RecordId**, **DateOfBirth(mm/dd/yyyy)**, **Email ID**, phones, **Address Line1**, **City**, **State**, **Zip Code**, **Date Of Joining**). All CSVs in that folder are merged into one list.

2. Generate JSON:

   ```bash
   npm run generate:patient-profiles
   ```

   This writes **`public/patient-directory/profiles.json`** (gitignored if configured; may contain PHI).

**Option B — Single spreadsheet**

1. If **no** CSV files exist in **`Patient Directory/`**, the script looks for **`*.xlsx`** in **`patient upload/`** (e.g. `Workflow_Cursor_Patient_Profiles.xlsx`).  
   Expected sheet: **Patient Profiles** with columns: **Patient Name**, **DOB**, **MRN / ID**, **Phone**, **Address**, **Recent Visit / Date**, **Email** (optional).

2. Run the same command:

   ```bash
   npm run generate:patient-profiles
   ```

3. Build and deploy:

   ```bash
   npm run build
   firebase deploy --only hosting
   ```

   (Or your usual CI pipeline, after the generate step runs in a trusted environment.)

4. If **`profiles.json`** is missing, the app falls back to **`profiles.demo.json`** (synthetic demo data only).

### Staff directory in Firestore (no public `profiles.json`)

Production staff views load directory data from **`settings/patientDirectory`** in Firestore (field **`payloadJson`**: string containing the same JSON object as `profiles.json`). Only users with **`users/{uid}.role == 'admin'`** can read this document; it is not world-readable like a static Hosting file.

1. Run `npm run generate:patient-profiles` locally (outputs `public/patient-directory/profiles.json`).
2. In Firebase Console → Firestore → create document **`settings` / `patientDirectory`** with field **`payloadJson`** (type string) — paste the entire file contents.
3. Deploy Firestore rules so `settings/patientDirectory` is enforced (included in repo rules).

**Patient Portal** does not download the full directory: it calls the **`getPatientPortalMatches`** Cloud Function, which returns only rows that match the signed-in user.

## Patient Portal

**Patient Portal** (`/patient-portal`) calls **`getPatientPortalMatches`** (or browser-imported directory data) and only **shows rows that match** the signed-in user:

- Profile **email** equals Firebase **user email** (add an **Email** column to the spreadsheet when possible).
- **Display name** equals **Patient Name** (case/spacing normalized).
- **Phone** on the profile equals Firebase account phone (uncommon for email/password users).
- **Name or email** on a **consent form** the user previously submitted matches a directory row.

No link to the full staff directory is shown to patients—only their matched card(s).

## Privacy / compliance

- **`patient upload/*`**, **`Patient Directory/*`**, and **`public/patient-directory/profiles.json`** are **gitignored** (only empty **`.gitkeep`** files keep folders in git). Do not commit facility CSVs or generated JSON.  
- If PHI ever entered git history on a shared remote, coordinate **history cleanup** (e.g. BFG Repo-Cleaner) with compliance.  
- Staff directory in production uses **Firestore `settings/patientDirectory`** (admin-read only per rules), not a world-readable Hosting static file.  
- Directory UI is behind **Firebase Auth**; Patient Portal uses **`getPatientPortalMatches`** only.

## Related

- [API-REQUIREMENTS.md](./API-REQUIREMENTS.md)
