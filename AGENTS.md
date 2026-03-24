# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Sally Health / FormFlow is a React 19 + Vite 6 + TypeScript form-builder SaaS with Firebase backend (Auth, Firestore, Storage) and optional AI features via Google Gemini.

### Running the app

```bash
npm run dev        # Vite dev server on http://localhost:3000
```

The app connects to the **live Firebase project** (`gen-lang-client-0777929601`) for Auth, Firestore, and Storage — no local emulators needed for basic functionality.

### Key commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Tests | `npm run test` |
| Build | `npm run build` |

### Test account

- **Email:** `test@sallyhealth.org`
- **Password:** `Pw#12345`
- On the login page there is a **"Use test account"** button that auto-fills these credentials.
- If the account doesn't exist yet, register it first at `/register`.

### Pre-existing issues

- `npm run lint` reports errors in `functions/lib/` (compiled JS output) and some source files. These are pre-existing and not caused by environment setup.
- `npm run typecheck` reports errors in `functions/src/index.ts` (missing `firebase-functions` types — install functions deps with `cd functions && npm install` if needed) and `ConsentSubmissions.tsx` (pre-existing type issues).

### Firebase Cloud Functions (optional)

The `functions/` directory is a separate npm project. If you need to work on Cloud Functions:

```bash
cd functions && npm install
```

This requires Node 18 (the functions runtime), but is not needed for the main frontend app.

### Environment variables

- `GEMINI_API_KEY` — optional, enables AI form generation and chat features. Set in `.env.local`.
- `APP_URL` — optional, used for self-referential links.

See `.env.example` for reference.
