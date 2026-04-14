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
- Preferred: set repo secret `GCP_SA_KEY` (JSON key for a deploy service account) used by `google-github-actions/auth@v2`.
- Required: `GCP_SA_KEY` must be present; the deploy workflow now fails fast when missing.
- Minimum IAM roles for the deploy service account:
  - `roles/firebase.admin`
  - `roles/cloudfunctions.developer`
  - `roles/firebasehosting.admin`
  - `roles/datastore.indexAdmin`
  - `roles/serviceusage.serviceUsageConsumer`
