# Patient Directory (import from `patient upload`)

Staff-only route: **`/patient-directory`**. Lists profiles imported from spreadsheets in the **`patient upload/`** folder and served as static JSON under **`/patient-directory/profiles.json`** after build.

## Workflow

1. Place **`*.xlsx`** in **`patient upload/`** (e.g. `Workflow_Cursor_Patient_Profiles.xlsx`).  
   Expected sheet: **Patient Profiles** with columns: **Patient Name**, **DOB**, **MRN / ID**, **Phone**, **Address**, **Recent Visit / Date**.

2. Generate JSON for the site:

   ```bash
   npm run generate:patient-profiles
   ```

   This writes **`public/patient-directory/profiles.json`** (gitignored; contains PHI if your sheet does).

3. Build and deploy:

   ```bash
   npm run build
   firebase deploy --only hosting
   ```

   (Or your usual CI pipeline, after the generate step runs in a trusted environment.)

4. If **`profiles.json`** is missing, the app falls back to **`profiles.demo.json`** (synthetic demo data only).

## Privacy / compliance

- **`patient upload/`** and **`public/patient-directory/profiles.json`** are **gitignored** so PHI is not committed by default.  
- Directory is behind **Firebase Auth** (same as other staff routes).  
- Treat static JSON on Hosting as sensitive: restrict access, use BAA-compliant hosting, and follow HIPAA policies. For stronger controls, move profiles to **Firestore** with tightened rules instead of public static files.

## Related

- [API-REQUIREMENTS.md](./API-REQUIREMENTS.md)
