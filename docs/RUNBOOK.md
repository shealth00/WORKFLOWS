# Daily Runbook

Cursor
- Open this workspace in Cursor.
- Composer/Agent must follow `.cursor/rules/`.
- After edits: from repo root run `npm run verify` when you touch app code.

Codex on your Mac
- `cd` to the same path (quote it because of spaces).
- `git pull`.
- Provide Codex: `AGENTS.md`, `docs/CODEX.md`, and `docs/CURSOR_AND_CODEX.md` plus your task and whether it's `grantpilot-ai/` vs `applypilot-ai/`.

Handoff
- Commit after Cursor.
- Pull before Codex (or use separate branches if both run close together).
- Run `npm run verify` again after Codex before you push.

GitHub deploy secrets (Firebase)
- Required secret: `FIREBASE_SERVICE_ACCOUNT` (JSON key used by `FirebaseExtended/action-hosting-deploy@v0`).
- `secrets.GITHUB_TOKEN` is used as `repoToken` by the action (no interactive `firebase login` or `FIREBASE_TOKEN` needed).
- If missing, deploy workflow fails fast with a clear secret error.
