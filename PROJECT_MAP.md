# WORKFLOWS project map

Generated: **2026-04-12T17:01:26Z**

Companion archive: **WORKFLOWS-project-source.zip** (same inclusion rules as this map).

**Excluded** from the map and ZIP: `node_modules/`, `.git/`, `dist/`, `build/`, `coverage/`, `.gradle/` (Android cache), `.cache-gh/`, `.DS_Store`, and this zip file.

---

## Directory tree

```
WORKFLOWS-main/
├── 📁 .cursor/
│   ├── 📁 plans/
│   │   └── 📄 workflow_architecture_plan_e65eb391.plan.md
│   └── 📁 rules/
│       └── 📄 agents-workflow.mdc
├── 📁 .github/
│   └── 📁 workflows/
│       ├── 📄 docker-image.yml
│       └── 📄 firebase-hosting.yml
├── 📁 android/
│   ├── 📁 .idea/
│   │   ├── 📁 caches/
│   │   │   └── 📄 deviceStreaming.xml
│   │   ├── 📄 .gitignore
│   │   ├── 📄 AndroidProjectSystem.xml
│   │   ├── 📄 appInsightsSettings.xml
│   │   ├── 📄 compiler.xml
│   │   ├── 📄 deploymentTargetSelector.xml
│   │   ├── 📄 deviceManager.xml
│   │   ├── 📄 gradle.xml
│   │   ├── 📄 migrations.xml
│   │   ├── 📄 misc.xml
│   │   ├── 📄 runConfigurations.xml
│   │   ├── 📄 vcs.xml
│   │   └── 📄 workspace.xml
│   ├── 📁 app/
│   │   ├── 📁 src/
│   │   │   ├── 📁 androidTest/
│   │   │   │   └── 📁 java/
│   │   │   │       └── 📁 com/
│   │   │   │           └── 📁 getcapacitor/
│   │   │   │               └── 📁 myapp/
│   │   │   │                   └── 📄 ExampleInstrumentedTest.java
│   │   │   ├── 📁 main/
│   │   │   │   ├── 📁 assets/
│   │   │   │   │   ├── 📁 public/
│   │   │   │   │   │   ├── 📁 assets/
│   │   │   │   │   │   │   ├── 📄 index-DChT5hrY.js
│   │   │   │   │   │   │   └── 📄 index-rk99Gh0F.css
│   │   │   │   │   │   ├── 📄 cordova_plugins.js
│   │   │   │   │   │   ├── 📄 cordova.js
│   │   │   │   │   │   └── 📄 index.html
│   │   │   │   │   ├── 📄 capacitor.config.json
│   │   │   │   │   └── 📄 capacitor.plugins.json
│   │   │   │   ├── 📁 java/
│   │   │   │   │   └── 📁 com/
│   │   │   │   │       └── 📁 sallyhealth/
│   │   │   │   │           └── 📁 workflows/
│   │   │   │   │               ├── 📄 HealthConnectPlugin.java
│   │   │   │   │               └── 📄 MainActivity.java
│   │   │   │   ├── 📁 res/
│   │   │   │   │   ├── 📁 drawable/
│   │   │   │   │   │   ├── 📄 ic_launcher_background.xml
│   │   │   │   │   │   └── 📄 splash.png
│   │   │   │   │   ├── 📁 drawable-land-hdpi/
│   │   │   │   │   │   └── 📄 splash.png
│   │   │   │   │   ├── 📁 drawable-land-mdpi/
│   │   │   │   │   │   └── 📄 splash.png
│   │   │   │   │   ├── 📁 drawable-land-xhdpi/
│   │   │   │   │   │   └── 📄 splash.png
│   │   │   │   │   ├── 📁 drawable-land-xxhdpi/
│   │   │   │   │   │   └── 📄 splash.png
│   │   │   │   │   ├── 📁 drawable-land-xxxhdpi/
│   │   │   │   │   │   └── 📄 splash.png
│   │   │   │   │   ├── 📁 drawable-port-hdpi/
│   │   │   │   │   │   └── 📄 splash.png
│   │   │   │   │   ├── 📁 drawable-port-mdpi/
│   │   │   │   │   │   └── 📄 splash.png
│   │   │   │   │   ├── 📁 drawable-port-xhdpi/
│   │   │   │   │   │   └── 📄 splash.png
│   │   │   │   │   ├── 📁 drawable-port-xxhdpi/
│   │   │   │   │   │   └── 📄 splash.png
│   │   │   │   │   ├── 📁 drawable-port-xxxhdpi/
│   │   │   │   │   │   └── 📄 splash.png
│   │   │   │   │   ├── 📁 drawable-v24/
│   │   │   │   │   │   └── 📄 ic_launcher_foreground.xml
│   │   │   │   │   ├── 📁 layout/
│   │   │   │   │   │   └── 📄 activity_main.xml
│   │   │   │   │   ├── 📁 mipmap-anydpi-v26/
│   │   │   │   │   │   ├── 📄 ic_launcher_round.xml
│   │   │   │   │   │   └── 📄 ic_launcher.xml
│   │   │   │   │   ├── 📁 mipmap-hdpi/
│   │   │   │   │   │   ├── 📄 ic_launcher_foreground.png
│   │   │   │   │   │   ├── 📄 ic_launcher_round.png
│   │   │   │   │   │   └── 📄 ic_launcher.png
│   │   │   │   │   ├── 📁 mipmap-mdpi/
│   │   │   │   │   │   ├── 📄 ic_launcher_foreground.png
│   │   │   │   │   │   ├── 📄 ic_launcher_round.png
│   │   │   │   │   │   └── 📄 ic_launcher.png
│   │   │   │   │   ├── 📁 mipmap-xhdpi/
│   │   │   │   │   │   ├── 📄 ic_launcher_foreground.png
│   │   │   │   │   │   ├── 📄 ic_launcher_round.png
│   │   │   │   │   │   └── 📄 ic_launcher.png
│   │   │   │   │   ├── 📁 mipmap-xxhdpi/
│   │   │   │   │   │   ├── 📄 ic_launcher_foreground.png
│   │   │   │   │   │   ├── 📄 ic_launcher_round.png
│   │   │   │   │   │   └── 📄 ic_launcher.png
│   │   │   │   │   ├── 📁 mipmap-xxxhdpi/
│   │   │   │   │   │   ├── 📄 ic_launcher_foreground.png
│   │   │   │   │   │   ├── 📄 ic_launcher_round.png
│   │   │   │   │   │   └── 📄 ic_launcher.png
│   │   │   │   │   ├── 📁 values/
│   │   │   │   │   │   ├── 📄 ic_launcher_background.xml
│   │   │   │   │   │   ├── 📄 strings.xml
│   │   │   │   │   │   └── 📄 styles.xml
│   │   │   │   │   └── 📁 xml/
│   │   │   │   │       ├── 📄 config.xml
│   │   │   │   │       └── 📄 file_paths.xml
│   │   │   │   └── 📄 AndroidManifest.xml
│   │   │   └── 📁 test/
│   │   │       └── 📁 java/
│   │   │           └── 📁 com/
│   │   │               └── 📁 getcapacitor/
│   │   │                   └── 📁 myapp/
│   │   │                       └── 📄 ExampleUnitTest.java
│   │   ├── 📄 .gitignore
│   │   ├── 📄 build.gradle
│   │   ├── 📄 capacitor.build.gradle
│   │   └── 📄 proguard-rules.pro
│   ├── 📁 capacitor-cordova-android-plugins/
│   │   ├── 📁 src/
│   │   │   └── 📁 main/
│   │   │       ├── 📁 java/
│   │   │       │   └── 📄 .gitkeep
│   │   │       ├── 📁 res/
│   │   │       │   └── 📄 .gitkeep
│   │   │       └── 📄 AndroidManifest.xml
│   │   ├── 📄 build.gradle
│   │   └── 📄 cordova.variables.gradle
│   ├── 📁 gradle/
│   │   ├── 📁 wrapper/
│   │   │   ├── 📄 gradle-wrapper.jar
│   │   │   └── 📄 gradle-wrapper.properties
│   │   └── 📄 gradle-daemon-jvm.properties
│   ├── 📄 .gitignore
│   ├── 📄 build.gradle
│   ├── 📄 capacitor.settings.gradle
│   ├── 📄 gradle.properties
│   ├── 📄 gradlew
│   ├── 📄 gradlew.bat
│   ├── 📄 local.properties
│   ├── 📄 settings.gradle
│   └── 📄 variables.gradle
├── 📁 docs/
│   ├── 📄 AGENTS.md
│   ├── 📄 ANDROID.md
│   ├── 📄 API-REQUIREMENTS.md
│   ├── 📄 ARCHITECTURE-STATUS.md
│   ├── 📄 FIREBASE-AUTH-SETUP.md
│   ├── 📄 PATIENT-DIRECTORY.md
│   ├── 📄 RUNBOOK.md
│   └── 📄 TEST-ACCOUNT.md
├── 📁 functions/
│   ├── 📁 lib/
│   │   ├── 📄 geminiServer.js
│   │   ├── 📄 geminiServer.js.map
│   │   ├── 📄 index.js
│   │   ├── 📄 index.js.map
│   │   ├── 📄 patientMatch.js
│   │   └── 📄 patientMatch.js.map
│   ├── 📁 scripts/
│   │   └── 📄 create-test-user.js
│   ├── 📁 src/
│   │   ├── 📄 geminiServer.ts
│   │   ├── 📄 index.ts
│   │   └── 📄 patientMatch.ts
│   ├── 📄 .env.gen-lang-client-0777929601
│   ├── 📄 package-lock.json
│   ├── 📄 package.json
│   ├── 📄 README.md
│   └── 📄 tsconfig.json
├── 📁 Patient Directory/
│   ├── 📁 completed forms /
│   │   └── 📄 Fac- MIsc Patients 
│   ├── 📄 .gitkeep
│   ├── 📄 BHI FEB 2026 Billable Summary Report.xlsx
│   ├── 📄 BHI MARCH 2026 Billable Summary Report.xlsx
│   ├── 📄 CCM Feb 2026 Billable Summary Report-.xlsx
│   ├── 📄 CCM MARCH 2026 Billable Summary Report-.xlsx
│   ├── 📄 oak dearborn PatientsDetails_02Apr2026.csv
│   ├── 📄 Pioneer gardens PatientsDetails_02Apr2026.csv
│   ├── 📄 Senior Suites PatientsDetails_02Apr2026.csv
│   └── 📄 Workflow_Cursor_Patient_Profiles.xlsx
├── 📁 patient upload/
│   └── 📄 .gitkeep
├── 📁 public/
│   └── 📁 patient-directory/
│       ├── 📄 profiles.demo.json
│       └── 📄 profiles.json
├── 📁 scripts/
│   ├── 📄 ensure-patient-folders.mjs
│   ├── 📄 generate-patient-profiles.mjs
│   ├── 📄 generate-project-map-and-zip.mjs
│   └── 📄 preflight.mjs
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📄 ChatBot.tsx
│   │   ├── 📄 FormCard.tsx
│   │   ├── 📄 Navbar.tsx
│   │   ├── 📄 PatientDirectoryPanel.tsx
│   │   └── 📄 TemplatePanel.tsx
│   ├── 📁 data/
│   │   ├── 📄 templateCategories.ts
│   │   ├── 📄 templateLibrary.ts
│   │   └── 📄 templates.ts
│   ├── 📁 logic/
│   │   ├── 📄 precisionScreening.test.ts
│   │   └── 📄 precisionScreening.ts
│   ├── 📁 pages/
│   │   ├── 📄 Builder.tsx
│   │   ├── 📄 ConsentForm.tsx
│   │   ├── 📄 ConsentSubmissions.tsx
│   │   ├── 📄 Dashboard.tsx
│   │   ├── 📄 HealthDashboard.tsx
│   │   ├── 📄 Integrations.tsx
│   │   ├── 📄 Login.tsx
│   │   ├── 📄 PatientDirectory.tsx
│   │   ├── 📄 PatientPortal.tsx
│   │   ├── 📄 PrecisionDiagnostic.tsx
│   │   ├── 📄 PrecisionScreening.tsx
│   │   ├── 📄 Products.tsx
│   │   ├── 📄 Register.tsx
│   │   ├── 📄 Settings.tsx
│   │   ├── 📄 Submissions.tsx
│   │   ├── 📄 TemplateLibrary.tsx
│   │   ├── 📄 TemplatePreview.tsx
│   │   ├── 📄 Templates.tsx
│   │   ├── 📄 ViewForm.tsx
│   │   └── 📄 Workspace.tsx
│   ├── 📁 types/
│   │   └── 📄 patientDirectory.ts
│   ├── 📁 utils/
│   │   ├── 📄 isAdminUser.ts
│   │   ├── 📄 patientCsv.test.ts
│   │   ├── 📄 patientCsv.ts
│   │   ├── 📄 patientDirectoryBrowserImport.ts
│   │   ├── 📄 patientProfileMatch.test.ts
│   │   └── 📄 patientProfileMatch.ts
│   ├── 📄 App.tsx
│   ├── 📄 AuthContext.tsx
│   ├── 📄 firebase.ts
│   ├── 📄 geminiService.ts
│   ├── 📄 health-connect-client.ts
│   ├── 📄 index.css
│   ├── 📄 main.tsx
│   ├── 📄 types.ts
│   └── 📄 vite-env.d.ts
├── 📄 .dockerignore
├── 📄 .env.example
├── 📄 .firebaserc
├── 📄 .gitignore
├── 📄 ARCHITECTURE.md
├── 📄 capacitor.config.ts
├── 📄 CONCEPT.md
├── 📄 Dockerfile
├── 📄 Dockerfile.vite
├── 📄 eslint.config.js
├── 📄 firebase-applet-config.json
├── 📄 firebase-blueprint.json
├── 📄 firebase.json
├── 📄 firestore.indexes.json
├── 📄 firestore.rules
├── 📄 index.html
├── 📄 metadata.json
├── 📄 package-lock.json
├── 📄 package.json
├── 📄 patient_intake_automation_template.xlsx
├── 📄 PROJECT_MAP.md
├── 📄 README.md
├── 📄 tsconfig.json
└── 📄 vite.config.ts
```

---

## Flat file index (196 files)

- `.cursor/plans/workflow_architecture_plan_e65eb391.plan.md`
- `.cursor/rules/agents-workflow.mdc`
- `.dockerignore`
- `.env.example`
- `.firebaserc`
- `.github/workflows/docker-image.yml`
- `.github/workflows/firebase-hosting.yml`
- `.gitignore`
- `ARCHITECTURE.md`
- `CONCEPT.md`
- `Dockerfile`
- `Dockerfile.vite`
- `PROJECT_MAP.md`
- `Patient Directory/.gitkeep`
- `Patient Directory/BHI FEB 2026 Billable Summary Report.xlsx`
- `Patient Directory/BHI MARCH 2026 Billable Summary Report.xlsx`
- `Patient Directory/CCM Feb 2026 Billable Summary Report-.xlsx`
- `Patient Directory/CCM MARCH 2026 Billable Summary Report-.xlsx`
- `Patient Directory/Pioneer gardens PatientsDetails_02Apr2026.csv`
- `Patient Directory/Senior Suites PatientsDetails_02Apr2026.csv`
- `Patient Directory/Workflow_Cursor_Patient_Profiles.xlsx`
- `Patient Directory/completed forms /Fac- MIsc Patients `
- `Patient Directory/oak dearborn PatientsDetails_02Apr2026.csv`
- `README.md`
- `android/.gitignore`
- `android/.idea/.gitignore`
- `android/.idea/AndroidProjectSystem.xml`
- `android/.idea/appInsightsSettings.xml`
- `android/.idea/caches/deviceStreaming.xml`
- `android/.idea/compiler.xml`
- `android/.idea/deploymentTargetSelector.xml`
- `android/.idea/deviceManager.xml`
- `android/.idea/gradle.xml`
- `android/.idea/migrations.xml`
- `android/.idea/misc.xml`
- `android/.idea/runConfigurations.xml`
- `android/.idea/vcs.xml`
- `android/.idea/workspace.xml`
- `android/app/.gitignore`
- `android/app/build.gradle`
- `android/app/capacitor.build.gradle`
- `android/app/proguard-rules.pro`
- `android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/assets/capacitor.config.json`
- `android/app/src/main/assets/capacitor.plugins.json`
- `android/app/src/main/assets/public/assets/index-DChT5hrY.js`
- `android/app/src/main/assets/public/assets/index-rk99Gh0F.css`
- `android/app/src/main/assets/public/cordova.js`
- `android/app/src/main/assets/public/cordova_plugins.js`
- `android/app/src/main/assets/public/index.html`
- `android/app/src/main/java/com/sallyhealth/workflows/HealthConnectPlugin.java`
- `android/app/src/main/java/com/sallyhealth/workflows/MainActivity.java`
- `android/app/src/main/res/drawable-land-hdpi/splash.png`
- `android/app/src/main/res/drawable-land-mdpi/splash.png`
- `android/app/src/main/res/drawable-land-xhdpi/splash.png`
- `android/app/src/main/res/drawable-land-xxhdpi/splash.png`
- `android/app/src/main/res/drawable-land-xxxhdpi/splash.png`
- `android/app/src/main/res/drawable-port-hdpi/splash.png`
- `android/app/src/main/res/drawable-port-mdpi/splash.png`
- `android/app/src/main/res/drawable-port-xhdpi/splash.png`
- `android/app/src/main/res/drawable-port-xxhdpi/splash.png`
- `android/app/src/main/res/drawable-port-xxxhdpi/splash.png`
- `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml`
- `android/app/src/main/res/drawable/ic_launcher_background.xml`
- `android/app/src/main/res/drawable/splash.png`
- `android/app/src/main/res/layout/activity_main.xml`
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png`
- `android/app/src/main/res/values/ic_launcher_background.xml`
- `android/app/src/main/res/values/strings.xml`
- `android/app/src/main/res/values/styles.xml`
- `android/app/src/main/res/xml/config.xml`
- `android/app/src/main/res/xml/file_paths.xml`
- `android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java`
- `android/build.gradle`
- `android/capacitor-cordova-android-plugins/build.gradle`
- `android/capacitor-cordova-android-plugins/cordova.variables.gradle`
- `android/capacitor-cordova-android-plugins/src/main/AndroidManifest.xml`
- `android/capacitor-cordova-android-plugins/src/main/java/.gitkeep`
- `android/capacitor-cordova-android-plugins/src/main/res/.gitkeep`
- `android/capacitor.settings.gradle`
- `android/gradle.properties`
- `android/gradle/gradle-daemon-jvm.properties`
- `android/gradle/wrapper/gradle-wrapper.jar`
- `android/gradle/wrapper/gradle-wrapper.properties`
- `android/gradlew`
- `android/gradlew.bat`
- `android/local.properties`
- `android/settings.gradle`
- `android/variables.gradle`
- `capacitor.config.ts`
- `docs/AGENTS.md`
- `docs/ANDROID.md`
- `docs/API-REQUIREMENTS.md`
- `docs/ARCHITECTURE-STATUS.md`
- `docs/FIREBASE-AUTH-SETUP.md`
- `docs/PATIENT-DIRECTORY.md`
- `docs/RUNBOOK.md`
- `docs/TEST-ACCOUNT.md`
- `eslint.config.js`
- `firebase-applet-config.json`
- `firebase-blueprint.json`
- `firebase.json`
- `firestore.indexes.json`
- `firestore.rules`
- `functions/.env.gen-lang-client-0777929601`
- `functions/README.md`
- `functions/lib/geminiServer.js`
- `functions/lib/geminiServer.js.map`
- `functions/lib/index.js`
- `functions/lib/index.js.map`
- `functions/lib/patientMatch.js`
- `functions/lib/patientMatch.js.map`
- `functions/package-lock.json`
- `functions/package.json`
- `functions/scripts/create-test-user.js`
- `functions/src/geminiServer.ts`
- `functions/src/index.ts`
- `functions/src/patientMatch.ts`
- `functions/tsconfig.json`
- `index.html`
- `metadata.json`
- `package-lock.json`
- `package.json`
- `patient upload/.gitkeep`
- `patient_intake_automation_template.xlsx`
- `public/patient-directory/profiles.demo.json`
- `public/patient-directory/profiles.json`
- `scripts/ensure-patient-folders.mjs`
- `scripts/generate-patient-profiles.mjs`
- `scripts/generate-project-map-and-zip.mjs`
- `scripts/preflight.mjs`
- `src/App.tsx`
- `src/AuthContext.tsx`
- `src/components/ChatBot.tsx`
- `src/components/FormCard.tsx`
- `src/components/Navbar.tsx`
- `src/components/PatientDirectoryPanel.tsx`
- `src/components/TemplatePanel.tsx`
- `src/data/templateCategories.ts`
- `src/data/templateLibrary.ts`
- `src/data/templates.ts`
- `src/firebase.ts`
- `src/geminiService.ts`
- `src/health-connect-client.ts`
- `src/index.css`
- `src/logic/precisionScreening.test.ts`
- `src/logic/precisionScreening.ts`
- `src/main.tsx`
- `src/pages/Builder.tsx`
- `src/pages/ConsentForm.tsx`
- `src/pages/ConsentSubmissions.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/HealthDashboard.tsx`
- `src/pages/Integrations.tsx`
- `src/pages/Login.tsx`
- `src/pages/PatientDirectory.tsx`
- `src/pages/PatientPortal.tsx`
- `src/pages/PrecisionDiagnostic.tsx`
- `src/pages/PrecisionScreening.tsx`
- `src/pages/Products.tsx`
- `src/pages/Register.tsx`
- `src/pages/Settings.tsx`
- `src/pages/Submissions.tsx`
- `src/pages/TemplateLibrary.tsx`
- `src/pages/TemplatePreview.tsx`
- `src/pages/Templates.tsx`
- `src/pages/ViewForm.tsx`
- `src/pages/Workspace.tsx`
- `src/types.ts`
- `src/types/patientDirectory.ts`
- `src/utils/isAdminUser.ts`
- `src/utils/patientCsv.test.ts`
- `src/utils/patientCsv.ts`
- `src/utils/patientDirectoryBrowserImport.ts`
- `src/utils/patientProfileMatch.test.ts`
- `src/utils/patientProfileMatch.ts`
- `src/vite-env.d.ts`
- `tsconfig.json`
- `vite.config.ts`
