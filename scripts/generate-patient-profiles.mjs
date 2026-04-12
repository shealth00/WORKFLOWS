#!/usr/bin/env node
/**
 * Builds public/patient-directory/profiles.json for Patient Directory + Patient Portal.
 *
 * Priority:
 * 1. Merge all *.csv in Patient Directory/ (EMR export: FirstName, LastName, RecordId, …)
 * 2. Else: first .xlsx in patient upload/ (sheet "Patient Profiles" or first sheet)
 *
 * Usage: npm run generate:patient-profiles
 */
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const patientDirFolder = path.join(root, 'Patient Directory');
const uploadDir = path.join(root, 'patient upload');
const outDir = path.join(root, 'public', 'patient-directory');
const outFile = path.join(outDir, 'profiles.json');

function slugify(s) {
  return (
    String(s || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'patient'
  );
}

function formatCell(v) {
  if (v == null || v === '') return '';
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') {
    if (v > 20000 && v < 60000) {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(epoch.getTime() + v * 86400000);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  }
  return String(v).trim();
}

function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/** Split a single CSV record line (RFC-like; supports quoted fields). */
function parseCsvRecordLine(line) {
  const out = [];
  let cur = '';
  let i = 0;
  let inQuotes = false;
  while (i < line.length) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cur += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ',') {
      out.push(cur.trim());
      cur = '';
      i += 1;
      continue;
    }
    cur += c;
    i += 1;
  }
  out.push(cur.trim());
  return out;
}

function normalizeHeader(h) {
  return h.trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeEmrDob(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  return s;
}

function headerToObject(headers, cells) {
  const o = {};
  headers.forEach((h, idx) => {
    o[normalizeHeader(h)] = (cells[idx] ?? '').trim();
  });
  return o;
}

function emrGet(o, ...keys) {
  for (const k of keys) {
    const v = o[normalizeHeader(k)];
    if (v !== undefined && v !== '') return v;
  }
  return '';
}

function emrGetDob(o) {
  let v = emrGet(o, 'DateOfBirth(mm/dd/yyyy)', 'Date Of Birth', 'DOB');
  if (!v) {
    for (const key of Object.keys(o)) {
      if (key.includes('dateofbirth') && o[key]) {
        v = o[key];
        break;
      }
    }
  }
  return normalizeEmrDob(v);
}

function emrAddress(o) {
  const parts = [
    emrGet(o, 'Address Line1', 'Address Line 1'),
    emrGet(o, 'Address Line2', 'Address Line 2'),
    emrGet(o, 'City'),
    emrGet(o, 'State'),
    emrGet(o, 'Zip Code', 'Zip'),
  ].filter(Boolean);
  return parts.join(', ');
}

function emrPhone(o) {
  return (
    emrGet(o, 'Home Phone', 'Mobile Phone', 'Work Phone') ||
    emrGet(o, 'Mobile Phone', 'Home Phone') ||
    emrGet(o, 'Work Phone')
  );
}

function isEmrExport(headers) {
  const norm = headers.map(normalizeHeader);
  return norm.includes('firstname') && norm.includes('lastname');
}

function parseEmrCsvFile(filePath) {
  const text = stripBom(fs.readFileSync(filePath, 'utf8'));
  const lines = text.split(/\r?\n/).filter((ln) => ln.trim() !== '');
  if (lines.length < 2) return [];
  const headerCells = parseCsvRecordLine(lines[0]);
  if (!isEmrExport(headerCells)) {
    console.warn(`Skipping ${path.basename(filePath)}: not EMR export (need FirstName + LastName).`);
    return [];
  }
  const stem = path.basename(filePath, path.extname(filePath));
  const idPrefix = slugify(stem);
  const profiles = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = parseCsvRecordLine(lines[r]);
    const row = headerToObject(headerCells, cells);
    const first = emrGet(row, 'FirstName', 'First Name');
    const mid = emrGet(row, 'MiddleName', 'Middle Name');
    const last = emrGet(row, 'LastName', 'Last Name');
    const name = [first, mid, last].filter(Boolean).join(' ').trim();
    if (!name) continue;
    const recordId = emrGet(row, 'RecordId', 'Record ID', 'MRN') || String(profiles.length + 1);
    const id = `${idPrefix}-${slugify(recordId)}`;
    const emailRaw = emrGet(row, 'Email ID', 'Email', 'E-mail');
    const entry = {
      id,
      name,
      dob: emrGetDob(row),
      mrn: recordId,
      phone: emrPhone(row),
      address: emrAddress(row),
      recentVisit: emrGet(row, 'Date Of Joining', 'Recent Visit / Date', 'Recent Visit'),
    };
    const email = emailRaw ? formatCell(emailRaw) : '';
    profiles.push(email ? { ...entry, email } : entry);
  }
  return profiles;
}

function findCsvExports() {
  if (!fs.existsSync(patientDirFolder)) return [];
  return fs
    .readdirSync(patientDirFolder)
    .filter((f) => f.toLowerCase().endsWith('.csv'))
    .map((f) => path.join(patientDirFolder, f))
    .filter((p) => fs.statSync(p).isFile());
}

function findXlsx() {
  if (!fs.existsSync(uploadDir)) return null;
  const files = fs.readdirSync(uploadDir).filter((f) => f.endsWith('.xlsx'));
  const preferred = files.find((f) => f.toLowerCase().includes('patient'));
  return preferred ? path.join(uploadDir, preferred) : files[0] ? path.join(uploadDir, files[0]) : null;
}

fs.mkdirSync(outDir, { recursive: true });

const csvPaths = findCsvExports();
let payload;

if (csvPaths.length > 0) {
  const merged = [];
  for (const p of csvPaths.sort()) {
    merged.push(...parseEmrCsvFile(p));
  }
  if (merged.length === 0) {
    console.error('Found CSV files in Patient Directory/ but no valid EMR rows (FirstName + LastName).');
    process.exit(1);
  }
  payload = {
    source: csvPaths.map((p) => path.basename(p)).join(', '),
    sheet: null,
    generatedAt: new Date().toISOString(),
    count: merged.length,
    profiles: merged,
  };
  console.log(`Merged ${csvPaths.length} CSV file(s) → ${merged.length} profiles → ${path.relative(root, outFile)}`);
} else {
  const xlsxPath = findXlsx();
  if (!xlsxPath) {
    console.error('No CSV in Patient Directory/ and no .xlsx in patient upload/.');
    console.error('Add *.csv exports under Patient Directory/, or add spreadsheet under patient upload/.');
    process.exit(1);
  }

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
    const emailRaw = row['Email'] ?? row['email'] ?? row['Patient Email'] ?? row['E-mail'] ?? '';
    const entry = {
      id,
      name,
      dob: formatCell(row['DOB']),
      mrn: formatCell(row['MRN / ID'] ?? row['MRN'] ?? ''),
      phone: formatCell(row['Phone'] ?? ''),
      address: formatCell(row['Address'] ?? ''),
      recentVisit: formatCell(row['Recent Visit / Date'] ?? row['Recent Visit'] ?? ''),
    };
    const email = formatCell(emailRaw);
    profiles.push(email ? { ...entry, email } : entry);
  }

  payload = {
    source: path.basename(xlsxPath),
    sheet: sheetName,
    generatedAt: new Date().toISOString(),
    count: profiles.length,
    profiles,
  };
  console.log(`Wrote ${profiles.length} profiles from xlsx → ${path.relative(root, outFile)}`);
}

fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');
