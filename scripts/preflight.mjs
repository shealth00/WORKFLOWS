#!/usr/bin/env node
/**
 * Quick repo facts for Cursor / Codex before edits.
 * Does not run full typecheck (use npm run typecheck).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const mustExist = [
  "package.json",
  "tsconfig.json",
  "vite.config.ts",
  "src/App.tsx",
  "src/firebase.ts",
  "firestore.rules",
  "firebase.json",
  "functions/package.json",
  "functions/tsconfig.json",
];

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

console.log("WORKFLOWS preflight");
console.log("  node:", process.version);
console.log("  root:", root);
console.log("  npm scripts:", Object.keys(pkg.scripts || {}).sort().join(", "));
console.log("");

let bad = 0;
for (const rel of mustExist) {
  const p = join(root, rel);
  const ok = existsSync(p);
  console.log(ok ? "  ok" : "  MISSING", rel);
  if (!ok) bad++;
}

if (bad) {
  console.error("\npreflight: missing paths — fix checkout or paths before editing.");
  process.exit(1);
}
console.log("\npreflight: paths ok. Next: npm run typecheck && npm run test && npm run build");
