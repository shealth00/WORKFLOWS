# Patient Directory (CSV merge or `patient upload` spreadsheet)

Staff-only route: **`/patient-directory`**. Profiles are served as static JSON under **`/patient-directory/profiles.json`** after build (and admin workspace **Patient directory** tab uses the same data).

## Workflow

**Option A — EMR / bulk CSV (preferred when you have facility exports)**

1. Place one or more **`*.csv`** files in **`Patient Directory/`** (repo root).  
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

**Patient Portal** (`/patient-portal`) loads the same JSON but only **shows rows that match** the signed-in user:

- Profile **email** equals Firebase **user email** (add an **Email** column to the spreadsheet when possible).
- **Display name** equals **Patient Name** (case/spacing normalized).
- **Phone** on the profile equals Firebase account phone (uncommon for email/password users).
- **Name or email** on a **consent form** the user previously submitted matches a directory row.

No link to the full staff directory is shown to patients—only their matched card(s).

## Privacy / compliance

- **`patient upload/`** and **`public/patient-directory/profiles.json`** are **gitignored** so PHI is not committed by default.  
- Directory is behind **Firebase Auth** (same as other staff routes).  
- Treat static JSON on Hosting as sensitive: restrict access, use BAA-compliant hosting, and follow HIPAA policies. For stronger controls, move profiles to **Firestore** with tightened rules instead of public static files.

## Related

- [API-REQUIREMENTS.md](./API-REQUIREMENTS.md)
