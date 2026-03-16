# Android App (Capacitor)

The same FormFlow web app runs as an Android app via [Capacitor](https://capacitorjs.com). Firebase Auth (Google + Email/Password) and Firestore work in the in-app WebView.

## Prerequisites

- **Node.js** 18+
- **Android Studio** (with Android SDK)
- **Java 17** (Android Studio usually bundles this)
- A physical device or emulator

## Build and run

**One-time:** Install dependencies and add Android (already done if you have an `android/` folder):

```bash
npm install
npm run build:android
npx cap add android
```

**Every time you change the web app:**

```bash
npm run cap:sync
npx cap run android
```

Or in two steps:

```bash
npm run build:android
npx cap sync android
npx cap open android
```

Then in **Android Studio**: Run the app (▶) on a device or emulator.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build:android` | Builds the web app with `base: './'` for Capacitor |
| `npm run cap:sync` | Builds for Android and syncs `dist/` into the Android project |
| `npm run cap:open:android` | Opens the Android project in Android Studio |
| `npm run cap:run:android` | Syncs and runs the app on a connected device/emulator |

## App config

- **App ID:** `com.sallyhealth.workflows`
- **App name:** FormFlow
- **Web assets:** `dist/` (synced into `android/app/src/main/assets/public`)

To change app id or name, edit `capacitor.config.ts` and run `npx cap sync android`.

## Firebase

The app uses the same `firebase-applet-config.json` as the web app. Ensure:

- **Google Sign-In** and **Email/Password** are enabled in Firebase Console.
- For **Google Sign-In** on Android, you may need to add the SHA-1 of your debug/release keystore in Firebase Console → Project settings → Your apps → Android app. Get SHA-1 with:
  ```bash
  cd android && ./gradlew signingReport
  ```

## Building a release APK/AAB

1. Open the project in Android Studio: `npx cap open android`
2. **Build** → **Generate Signed Bundle / APK** → follow the wizard.
3. Or use the command line with your keystore (see Android docs).
