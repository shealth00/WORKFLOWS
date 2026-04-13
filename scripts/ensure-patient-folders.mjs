#!/usr/bin/env node
/**
 * Creates local import/output folders used by patient profile generation (PHI stays gitignored).
 * Run: npm run ensure:patient-folders
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const dirs = [
  ['patient upload', 'Place *.xlsx here when not using Patient Directory/ CSV merge (see docs/PATIENT-DIRECTORY.md).'],
  ['Patient Directory', 'Place facility *.csv exports here for npm run generate:patient-profiles.'],
  [path.join('public', 'patient-directory'), 'Generated profiles.json is written here by generate:patient-profiles.'],
];

for (const [rel, hint] of dirs) {
  const p = path.join(root, rel);
  fs.mkdirSync(p, { recursive: true });
  console.log('ok', rel, '—', hint);
}
