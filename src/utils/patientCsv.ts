/**
 * Parse patient-directory CSV (browser). Column names match docs/PATIENT-DIRECTORY.md / generate-patient-profiles.mjs.
 */
import type { PatientProfile, PatientProfilesPayload } from '../types/patientDirectory';

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/** Split a single CSV record line into fields (supports "quoted,fields"). */
export function parseCsvRecordLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let i = 0;
  let inQuotes = false;
  while (i < line.length) {
    const c = line[i]!;
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

export function splitCsvLines(text: string): string[] {
  const t = stripBom(text);
  return t.split(/\r?\n/).filter((ln) => ln.trim() !== '');
}

function normalizeHeader(h: string): string {
  return h.trim().replace(/\s+/g, ' ').toLowerCase();
}

function slugify(s: string): string {
  return (
    String(s || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'patient'
  );
}

function formatCell(v: string): string {
  if (v == null || v === '') return '';
  const s = String(v).trim();
  // Excel-exported serial dates as plain numbers (optional)
  const n = Number(s);
  if (!Number.isNaN(n) && s !== '' && /^\d+(\.\d+)?$/.test(s) && n > 20000 && n < 60000) {
    const epoch = Date.UTC(1899, 11, 30);
    const d = new Date(epoch + n * 86400000);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return s;
}

const HEADER_ALIASES: Record<string, keyof ParsedCols> = {
  'patient name': 'name',
  name: 'name',
  dob: 'dob',
  'mrn / id': 'mrn',
  mrn: 'mrn',
  'mrn / insurance': 'mrn',
  phone: 'phone',
  address: 'address',
  'recent visit / date': 'recentVisit',
  'recent visit': 'recentVisit',
  email: 'email',
  'patient email': 'email',
  'e-mail': 'email',
};

interface ParsedCols {
  name: string;
  dob: string;
  mrn: string;
  phone: string;
  address: string;
  recentVisit: string;
  email: string;
}

function headerToColIndex(headerRow: string[]): Map<keyof ParsedCols, number> {
  const map = new Map<keyof ParsedCols, number>();
  headerRow.forEach((raw, idx) => {
    const key = HEADER_ALIASES[normalizeHeader(raw)];
    if (key && !map.has(key)) map.set(key, idx);
  });
  return map;
}

function cell(row: string[], col: Map<keyof ParsedCols, number>, key: keyof ParsedCols): string {
  const i = col.get(key);
  if (i === undefined) return '';
  return row[i] ?? '';
}

export function patientProfilesFromCsv(text: string, filename = 'upload.csv'): PatientProfilesPayload {
  const lines = splitCsvLines(text);
  if (lines.length < 2) {
    throw new Error('CSV needs a header row and at least one data row.');
  }
  const headerCells = parseCsvRecordLine(lines[0]!);
  const col = headerToColIndex(headerCells);
  if (!col.has('name')) {
    throw new Error('Missing required column: Patient Name (or "Name").');
  }

  const profiles: PatientProfile[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = parseCsvRecordLine(lines[r]!);
    const name = cell(cells, col, 'name').trim();
    if (!name) continue;
    const base = slugify(name);
    const id = `${base}-${profiles.length + 1}`;
    const emailRaw = formatCell(cell(cells, col, 'email'));
    const entry: PatientProfile = {
      id,
      name,
      dob: formatCell(cell(cells, col, 'dob')),
      mrn: formatCell(cell(cells, col, 'mrn')),
      phone: formatCell(cell(cells, col, 'phone')),
      address: formatCell(cell(cells, col, 'address')),
      recentVisit: formatCell(cell(cells, col, 'recentVisit')),
    };
    profiles.push(emailRaw ? { ...entry, email: emailRaw } : entry);
  }

  if (profiles.length === 0) {
    throw new Error('No rows with a patient name were found.');
  }

  return {
    source: filename,
    generatedAt: new Date().toISOString(),
    count: profiles.length,
    profiles,
  };
}

export const PATIENT_DIRECTORY_CSV_SAMPLE = `Patient Name,DOB,MRN / ID,Phone,Address,Recent Visit / Date,Email
Jane Doe,1985-03-15,M1234567890,555-0100,"123 Main St, Springfield, ST 01001",2026-01-10,jane@example.com
John Smith,1990-11-22,,555-0101,456 Oak Ave,,john@example.com
`;
