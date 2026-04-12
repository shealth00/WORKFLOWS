/**
 * Server-side copy of patient directory matching (see src/utils/patientProfileMatch.ts).
 */
export interface PatientProfileLite {
  id: string;
  name: string;
  dob?: string;
  mrn?: string;
  phone?: string;
  address?: string;
  recentVisit?: string;
  email?: string;
}

function normalizePhone(s: string) {
  return String(s || "").replace(/\D/g, "");
}

function normalizeName(s: string) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function namesMatch(a: string, b: string) {
  if (!a || !b) return false;
  return normalizeName(a) === normalizeName(b);
}

export function findMatchingDirectoryProfilesServer(
  userEmail: string | undefined,
  displayName: string | undefined,
  phoneNumber: string | undefined,
  profiles: PatientProfileLite[],
  hints: { consentFullNames: string[]; consentEmails: string[] }
): PatientProfileLite[] {
  const userEmailNorm = userEmail?.trim().toLowerCase() || "";
  const display = displayName?.trim() || "";
  const phoneDigits = phoneNumber ? normalizePhone(phoneNumber) : "";

  const consentNames = hints.consentFullNames.filter(Boolean);
  const consentEmails = hints.consentEmails.map((e) => e.trim().toLowerCase()).filter(Boolean);

  const seen = new Set<string>();
  const out: PatientProfileLite[] = [];

  const push = (p: PatientProfileLite) => {
    if (seen.has(p.id)) return;
    seen.add(p.id);
    out.push(p);
  };

  for (const p of profiles) {
    const pEmail = p.email?.trim().toLowerCase();
    if (pEmail && userEmailNorm && pEmail === userEmailNorm) {
      push(p);
      continue;
    }
    if (pEmail && consentEmails.includes(pEmail)) {
      push(p);
      continue;
    }
    if (display && namesMatch(display, p.name)) {
      push(p);
      continue;
    }
    for (const n of consentNames) {
      if (namesMatch(n, p.name)) {
        push(p);
        break;
      }
    }
    if (!seen.has(p.id) && phoneDigits && normalizePhone(p.phone || "") && normalizePhone(p.phone || "") === phoneDigits) {
      push(p);
    }
  }

  return out;
}
