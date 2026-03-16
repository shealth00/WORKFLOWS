# Firebase Auth — Google Sign-In Setup

If **Sign in with Google** fails, doesn’t redirect, or the popup closes, use this checklist.

**Important:** Your app’s config is in `firebase-applet-config.json`. It currently points to project **gen-lang-client-0087483500**. You must enable Google and add authorized domains in **that same project**. If you configured a different project (e.g. **gen-lang-client-0777929601**), either do the steps below in **0087483500** or replace the config with the web app credentials from **0777929601** (Project Settings → Your apps → Web app).

## 1. Enable Google sign-in

1. Open [Firebase Console](https://console.firebase.google.com) → the project your app uses (**gen-lang-client-0087483500** per current config).
2. Go to **Build** → **Authentication** → **Sign-in method**.
3. Click **Google** → turn **Enable** on → set Project support email → **Save**.

## 2. Add authorized domains

Google Sign-In only works on domains you list.

1. In the same project go to **Authentication** → **Settings** (or **Settings** tab) → **Authorized domains**.
2. Add every URL where the app runs (host only, no `https://`), for example:
   - `localhost` (already there for local dev)
   - `gen-lang-client-0087483500.web.app` (if your config uses 0087483500)
   - `gen-lang-client-0777929601.web.app` (if you host there)
   - `forms.sally.health` (your custom domain)

If the app is opened from a URL that is **not** in this list, you’ll get `auth/unauthorized-domain` and sign-in will fail.

## 3. Popup vs redirect

- **Popup** can be blocked by the browser or fail in some environments (e.g. embedded or strict privacy).
- The app now **falls back to redirect**: if the popup fails, it uses **Sign in with redirect**. The user goes to Google and is sent back to your site, then signed in automatically.

No extra code is required; just ensure the **return URL** is one of your authorized domains above.

## 4. Check the config

Your app uses `firebase-applet-config.json`. Ensure:

- **projectId** matches the Firebase project where you enabled Google and set authorized domains.
- **authDomain** is `{projectId}.firebaseapp.com`.

After changing authorized domains, wait a minute and try sign-in again.
