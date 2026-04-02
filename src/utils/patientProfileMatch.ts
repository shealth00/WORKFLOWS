import type { User } from 'firebase/auth';
import type { PatientProfile } from '../types/patientDirectory';

function normalizePhone(s: string) {
  return String(s || '').replace(/\D/g, '');
}

function normalizeName(s: string) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function namesMatch(a: string, b: string) {
  if (!a || !b) return false;
  return normalizeName(a) === normalizeName(b);
}

export interface MatchHints {
  /** Names from consent forms submitted by this user */
  consentFullNames?: string[];
  /** Emails from consent forms */
  consentEmails?: string[];
}

/**
 * Profiles from the directory that likely belong to this Firebase user.
 * Does not expose other patients' rows in the UI.
 */
export function findMatchingDirectoryProfiles(
  user: User,
  profiles: PatientProfile[],
  hints: MatchHints = {}
): PatientProfile[] {
  const userEmail = user.email?.trim().toLowerCase() || '';
  const displayName = user.displayName?.trim() || '';
  const phoneDigits = user.phoneNumber ? normalizePhone(user.phoneNumber) : '';

  const consentNames = hints.consentFullNames?.filter(Boolean) ?? [];
  const consentEmails = hints.consentEmails?.map((e) => e.trim().toLowerCase()).filter(Boolean) ?? [];

  const seen = new Set<string>();
  const out: PatientProfile[] = [];

  const push = (p: PatientProfile) => {
    if (seen.has(p.id)) return;
    seen.add(p.id);
    out.push(p);
  };

  for (const p of profiles) {
    const pEmail = p.email?.trim().toLowerCase();
    if (pEmail && userEmail && pEmail === userEmail) {
      push(p);
      continue;
    }
    if (pEmail && consentEmails.includes(pEmail)) {
      push(p);
      continue;
    }
    if (displayName && namesMatch(displayName, p.name)) {
      push(p);
      continue;
    }
    for (const n of consentNames) {
      if (namesMatch(n, p.name)) {
        push(p);
        break;
      }
    }
    if (!seen.has(p.id) && phoneDigits && normalizePhone(p.phone) && normalizePhone(p.phone) === phoneDigits) {
      push(p);
    }
  }

  return out;
}
