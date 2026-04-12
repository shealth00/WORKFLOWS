# Agent instructions (Cursor, Codex CLI, and similar)

Use this file before multi-file changes so planning, edits, and verification stay aligned with this repo.

## Layout

| Area | Path | Notes |
|------|------|--------|
| Web app | `src/` | React 19 + Vite; routes in `src/App.tsx` |
| Firebase client | `src/firebase.ts` | App, Auth, Firestore, Functions, Storage |
| Cloud Functions | `functions/src/` | Deployed separately; `main` in `functions/package.json` → `lib/` |
| Rules | `firestore.rules`, `firestore.indexes.json` | Deploy with Hosting workflow or CLI |
| Hosting | `dist/` (build output), `firebase.json` | SPA rewrites to `index.html` |
| Docs | `docs/` | Architecture, auth, patient directory, API notes |

## Commands (run from repo root)

| Step | Command |
|------|---------|
| Preflight (paths + scripts) | `npm run preflight` |
| Types | `npm run typecheck` |
| Unit tests | `npm run test` |
| Production bundle | `npm run build` |
| Lint | `npm run lint` |
| Functions compile | `npm run build --prefix functions` |
| Dev server | `npm run dev` (default http://localhost:3000) |
| Preview `dist` | `npm run preview` |

**Order before a PR or deploy:** `preflight` → `typecheck` → `test` → `build` → `npm run build --prefix functions` when Functions changed.

## Cursor IDE + Codex CLI on the same machine

Use **one git clone** and the **same branch** for both tools so files and history stay consistent.

| Tool | Best for | How to align |
|------|-----------|----------------|
| **Cursor** | Interactive edits, refactors across open files, Composer/Agent with repo context | Open the repo folder as the workspace. Mention `@docs/AGENTS.md` in Agent chat when starting a larger task. The rule `.cursor/rules/agents-workflow.mdc` reminds the agent to follow this doc. |
| **Codex CLI** (local) | Terminal-driven edits, scripted refactors, batch changes from the shell | `cd` to this repo root; run `npm run preflight` before and the verification commands after edits. |

**Avoid conflicts**

- Pull or sync (`git pull`) before switching from Codex back to Cursor (or vice versa).
- Prefer **commit or stash** between handoffs so each tool sees a clean tree.
- Do not edit the **same file** in both tools at once without committing or stashing in between.
- Optional: use a short-lived branch for Codex (`codex/<topic>`), merge via PR or fast-forward after review in Cursor.

**Suggested handoff**

1. Finish Codex session → `npm run typecheck && npm run test && npm run build` → commit.
2. In Cursor → `git pull` → continue.

## Codex CLI workflow

1. Open this repository as the working directory (`cd` to repo root).
2. Run `npm run preflight` and fix any missing paths before editing.
3. Make changes; keep one coherent theme per session (avoid mixing unrelated packages).
4. Run the verification row above; do not commit if any step fails.
5. Firebase deploy is manual or CI: `npx firebase deploy --only hosting,firestore:rules,functions` requires a logged-in CLI or valid `FIREBASE_TOKEN`. Functions using secrets need `GEMINI_API_KEY` configured (see `functions/README.md`).

## Security and data

- Do not commit contents of `Patient Directory/` (ignored); treat exports as PHI-adjacent.
- Do not put Gemini API keys in the Vite client for production; use the `geminiProxy` callable and Functions secrets.
- Firestore reads for clinical collections are scoped; test as both admin and non-admin when touching queries.

## Related docs

- `docs/ARCHITECTURE-STATUS.md` — routes, collections, indexes
- `docs/PATIENT-DIRECTORY.md` — directory pipeline and Firestore seeding
- `docs/FIREBASE-AUTH-SETUP.md` — auth configuration

## Do not

- Duplicate this content into another top-level agent file; link here instead.
- Run destructive git history operations on PHI without an explicit compliance request.
