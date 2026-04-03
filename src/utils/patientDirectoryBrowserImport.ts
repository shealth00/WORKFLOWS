/**
 * Optional in-browser patient directory (CSV bulk upload). Stored per-browser via localStorage.
 * For production-wide directory data, use build-time profiles.json or a backend.
 */
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

export async function fetchServerPatientDirectoryPayload(): Promise<{
  payload: PatientProfilesPayload | null;
  usingDemo: boolean;
}> {
  const resMain = await fetch('/patient-directory/profiles.json', { cache: 'no-store' });
  const resDemo = await fetch('/patient-directory/profiles.demo.json', { cache: 'no-store' });
  let payload: PatientProfilesPayload | null = null;
  let usingDemo = false;
  if (resMain.ok) {
    const data = (await resMain.json()) as PatientProfilesPayload;
    if (data.profiles?.length) payload = data;
  }
  if (!payload && resDemo.ok) {
    payload = (await resDemo.json()) as PatientProfilesPayload;
    usingDemo = Boolean(payload?.profiles?.length);
  }
  return { payload: payload?.profiles?.length ? payload : null, usingDemo };
}
