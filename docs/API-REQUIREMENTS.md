# API and service requirements

What external APIs and configuration this repo expects. Align [firebase-applet-config.json](../firebase-applet-config.json) and Google Cloud with the **same** Firebase project.

**Current web config project:** `gen-lang-client-0777929601` (see `firebase-applet-config.json`).

---

## Client (Vite / React)

| Need | Used in | Setup |
|------|---------|--------|
| **Firebase Web SDK** | `src/firebase.ts` | Values from `firebase-applet-config.json`. Enable **Authentication**, **Firestore**, **Storage** in that project. |
| **Google Sign-In** | Navbar, `firebase.ts` | Firebase Console → Authentication → Google enabled; **authorized domains** for every host (e.g. `localhost`, `{projectId}.web.app`, custom domain). See [FIREBASE-AUTH-SETUP.md](./FIREBASE-AUTH-SETUP.md). |
| **Email / password** | Login, Register | Authentication → Email/Password enabled. |
| **Gemini (Google GenAI)** | `src/geminiService.ts` | Set **`GEMINI_API_KEY`** in `.env.local`. Vite injects it via `vite.config.ts` as `process.env.GEMINI_API_KEY`. Without it, AI form generation, chat, transcription, and TTS fail or return empty. |
| **Gemini models** | `geminiService.ts` | Code references `gemini-3.1-pro-preview`, `gemini-3-flash-preview`, `gemini-2.5-flash-preview-tts`. Ensure your key / product allows these or change model IDs to match your account. |

---

## Firebase backend

| Need | Where | Setup |
|------|--------|--------|
| **Firestore** | App, rules | Deploy [firestore.rules](../firestore.rules) and [firestore.indexes.json](../firestore.indexes.json). |
| **Storage** | Consent / precision uploads | Bucket from config; deploy Storage rules if you restrict access. |
| **Cloud Functions** | `functions/` | `firebase deploy --only functions`; Node version per `functions/package.json`. |

---

## Google Cloud (same project as Firebase)

| API / parameter | Purpose | Setup |
|-----------------|---------|--------|
| **Google Drive API** | `syncConsentToGoogleDrive` | Enable in [Google Cloud Console](https://console.cloud.google.com) for the Firebase project. Share the target Drive folder with the **default Cloud Functions service account** (Editor). |
| **`DRIVE_FOLDER_ID`** | Drive upload destination | Set at deploy (Firebase params) or `functions/.env.<projectId>`. See [functions/README.md](../functions/README.md). |
| **Outbound HTTPS** | `syncSubmissionToWebhook` | No extra Google API; Functions must reach user webhook URLs. |

---

## Android (Capacitor)

| Need | Where | Setup |
|------|--------|--------|
| **Health Connect** | `HealthConnectPlugin`, Health dashboard | Device with Health Connect; see [ANDROID.md](./ANDROID.md). |
| **Google Sign-In (Android)** | Same Firebase app | Add app SHA-1 in Firebase Console if Google sign-in fails on device. |

---

## CI and tooling

| Secret / env | Purpose |
|--------------|---------|
| **`FIREBASE_TOKEN`** | GitHub Actions deploy to Hosting + Firestore rules (`.github/workflows/firebase-hosting.yml`). |
| **`GOOGLE_APPLICATION_CREDENTIALS`** | Optional: `functions` scripts (e.g. `create-test-user`) with Admin SDK. |

---

## Webhooks (user-configured)

Users can set a URL under **Integrations → Webhooks** (`users/{uid}/integrations/webhook` in Firestore). **Cloud Functions** POST JSON to that URL on new form submissions. Receivers must accept **HTTPS POST** with `Content-Type: application/json`.

---

## Related docs

- [FIREBASE-AUTH-SETUP.md](./FIREBASE-AUTH-SETUP.md) — Google sign-in and authorized domains
- [TEST-ACCOUNT.md](./TEST-ACCOUNT.md) — manual QA login
- [ANDROID.md](./ANDROID.md) — Capacitor / Health Connect
- [functions/README.md](../functions/README.md) — Drive sync setup
