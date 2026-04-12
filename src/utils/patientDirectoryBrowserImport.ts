/**
 * Optional in-browser patient directory (CSV bulk upload). Stored per-browser via localStorage.
 * Staff directory data: Firestore settings/patientDirectory.payloadJson (admin) or demo JSON fallback.
 */
import type { Firestore } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import type { PatientProfilesPayload } from '../types/patientDirectory';

const STORAGE_KEY = 'workflows-patient-directory-csv-import-v1';

export function loadBrowserImportedDirectory(): PatientProfilesPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PatientProfilesPayload;
    if (!data?.profiles?.length) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveBrowserImportedDirectory(payload: PatientProfilesPayload): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearBrowserImportedDirectory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Loads staff directory: browser import first, then Firestore (admins only), then demo asset.
 * Does not fetch public profiles.json (removed for PHI safety).
 */
export async function fetchPatientDirectoryPayload(options: {
  db: Firestore;
  isStaffAdmin: boolean;
}): Promise<{
  payload: PatientProfilesPayload | null;
  usingDemo: boolean;
}> {
  const imported = loadBrowserImportedDirectory();
  if (imported?.profiles?.length) {
    return { payload: imported, usingDemo: false };
  }
  if (options.isStaffAdmin) {
    try {
      const snap = await getDoc(doc(options.db, 'settings', 'patientDirectory'));
      const raw = snap.data()?.payloadJson;
      if (typeof raw === 'string' && raw.length) {
        const data = JSON.parse(raw) as PatientProfilesPayload;
        if (data?.profiles?.length) {
          return { payload: data, usingDemo: false };
        }
      }
    } catch {
      /* ignore */
    }
  }
  const resDemo = await fetch('/patient-directory/profiles.demo.json', { cache: 'no-store' });
  if (resDemo.ok) {
    const payload = (await resDemo.json()) as PatientProfilesPayload;
    if (payload?.profiles?.length) {
      return { payload, usingDemo: true };
    }
  }
  return { payload: null, usingDemo: true };
}
