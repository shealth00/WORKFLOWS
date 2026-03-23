# Test Account

**Login:** test@sallyhealth.org  
**Password:** Pw#12345

> Ensure **Email/Password** sign-in is enabled in [Firebase Console](https://console.firebase.google.com) → Authentication → Sign-in method.

## First-time setup

If the account does not exist yet:

1. Go to **Register** (or `/register`)
2. Enter:
   - **Email:** test@sallyhealth.org
   - **Password:** Pw#12345
   - **Confirm password:** Pw#12345
3. Click **Create account**

After that, you can sign in on the Login page. Use the **"Use test account"** button to auto-fill the credentials.

## Optional: Create via script (requires Firebase Admin credentials)

```bash
cd functions && npm run create-test-user
```

Requires `firebase login` or `GOOGLE_APPLICATION_CREDENTIALS` pointing to a service account key with Auth admin permissions.
