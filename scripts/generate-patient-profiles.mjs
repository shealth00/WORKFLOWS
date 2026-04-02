#!/usr/bin/env node
/**
 * Reads patient upload spreadsheet and writes public/patient-directory/profiles.json
 * for the Patient Directory page (static Hosting asset).
 *
 * Usage: npm run generate:patient-profiles
 * Source: patient upload/Workflow_Cursor_Patient_Profiles.xlsx (or first .xlsx in folder)
 */
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const uploadDir = path.join(root, 'patient upload');
const outDir = path.join(root, 'public', 'patient-directory');
const outFile = path.join(outDir, 'profiles.json');

function slugify(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'patient';
}

function formatCell(v) {
  if (v == null || v === '') return '';
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') {
    // Excel serial date (roughly 2000–2100 range)
    if (v > 20000 && v < 60000) {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(epoch.getTime() + v * 86400000);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  }
  return String(v).trim();
}

function findXlsx() {
  if (!fs.existsSync(uploadDir)) return null;
  const files = fs.readdirSync(uploadDir).filter((f) => f.endsWith('.xlsx'));
  const preferred = files.find((f) => f.toLowerCase().includes('patient'));
  return preferred ? path.join(uploadDir, preferred) : files[0] ? path.join(uploadDir, files[0]) : null;
}

const xlsxPath = findXlsx();
if (!xlsxPath) {
  console.error('No .xlsx found in patient upload/. Add Workflow_Cursor_Patient_Profiles.xlsx or similar.');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const wb = XLSX.readFile(xlsxPath, { cellDates: true, cellNF: false, cellText: false });
const sheetName = wb.SheetNames.includes('Patient Profiles') ? 'Patient Profiles' : wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const profiles = [];
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  const name = String(row['Patient Name'] ?? row['patient name'] ?? '').trim();
  if (!name) continue;
  const base = slugify(name);
  const id = `${base}-${i + 1}`;
  profiles.push({
    id,
    name,
    dob: formatCell(row['DOB']),
    mrn: formatCell(row['MRN / ID'] ?? row['MRN'] ?? ''),
    phone: formatCell(row['Phone'] ?? ''),
    address: formatCell(row['Address'] ?? ''),
    recentVisit: formatCell(row['Recent Visit / Date'] ?? row['Recent Visit'] ?? ''),
  });
}

const payload = {
  source: path.basename(xlsxPath),
  sheet: sheetName,
  generatedAt: new Date().toISOString(),
  count: profiles.length,
  profiles,
};

fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');
console.log(`Wrote ${profiles.length} profiles → ${path.relative(root, outFile)}`);
