/**
 * Create test user: test@sallyhealth.org / Pw#12345
 * Run from project root: cd functions && node scripts/create-test-user.js
 * Or: node functions/scripts/create-test-user.js (from project root, with cwd or path)
 *
 * Requires Firebase Auth Email/Password sign-in to be enabled in Firebase Console.
 * Uses Application Default Credentials (firebase login or GOOGLE_APPLICATION_CREDENTIALS).
 */
const admin = require('firebase-admin');
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0777929601';

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const auth = admin.auth();

async function createTestUser() {
  const email = 'test@sallyhealth.org';
  const password = 'Pw#12345';
  const displayName = 'Test User';
  try {
    const user = await auth.getUserByEmail(email);
    console.log('Test user already exists:', user.uid);
    await auth.updateUser(user.uid, { password, displayName });
    console.log('Password updated.');
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      await auth.createUser({ email, password, displayName, emailVerified: true });
      console.log('Created test user.');
    } else {
      throw e;
    }
  }
  console.log('\nLogin: test@sallyhealth.org\nPassword: Pw#12345\n');
}

createTestUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
