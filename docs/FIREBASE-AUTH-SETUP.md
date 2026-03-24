# Firebase Auth — Google Sign-In Setup

If **Sign in with Google** fails, doesn’t redirect, or the popup closes, use this checklist.

**Important:** Your app’s config is in `firebase-applet-config.json`. It must match the Firebase project where you enable sign-in and domains. The repo is configured for project **`gen-lang-client-0777929601`**. Do every step below in **that** project (or change `firebase-applet-config.json` to another project’s web app credentials from Firebase → Project settings → Your apps → Web app).

## 1. Enable sign-in methods

1. Open [Firebase Console](https://console.firebase.google.com) → project **gen-lang-client-0777929601** (or the project in your `firebase-applet-config.json`).
2. Go to **Build** → **Authentication** → **Sign-in method**.
3. **Google:** Click **Google** → turn **Enable** on → set Project support email → **Save**.
4. **Email/Password (for Create account):** Click **Email/Password** → turn **Enable** on → **Save**.

## 2. Add authorized domains

Google Sign-In only works on domains you list.

1. In the same project go to **Authentication** → **Settings** (or **Settings** tab) → **Authorized domains**.
2. Add every URL where the app runs (host only, no `https://`), for example:
   - `localhost` (already there for local dev)
   - `gen-lang-client-0777929601.web.app` and `gen-lang-client-0777929601.firebaseapp.com` (default Hosting / Auth domains for this project)
   - Any custom domain (e.g. `forms.sally.health`)

If the app is opened from a URL that is **not** in this list, you’ll get `auth/unauthorized-domain` and sign-in will fail.

## 3. Popup vs redirect

- **Popup** is the default for **Sign in with Google** (`signInWithPopup`).
- If the browser **blocks the popup** (`auth/popup-blocked`), the app **falls back to redirect** (`signInWithRedirect`). `AuthContext` runs `getRedirectResult` on load to finish sign-in after you return from Google.

Ensure the **return URL** (your app origin) is one of your authorized domains above.

## 4. Check the config

Your app uses `firebase-applet-config.json`. Ensure:

- **projectId** matches the Firebase project where you enabled Google and set authorized domains.
- **authDomain** is `{projectId}.firebaseapp.com`.

After changing authorized domains, wait a minute and try sign-in again.

## See also

- [API-REQUIREMENTS.md](./API-REQUIREMENTS.md) — full list of APIs and env vars
