"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMatchingDirectoryProfilesServer = findMatchingDirectoryProfilesServer;
function normalizePhone(s) {
    return String(s || "").replace(/\D/g, "");
}
function normalizeName(s) {
    return String(s || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}
function namesMatch(a, b) {
    if (!a || !b)
        return false;
    return normalizeName(a) === normalizeName(b);
}
function findMatchingDirectoryProfilesServer(userEmail, displayName, phoneNumber, profiles, hints) {
    var _a;
    const userEmailNorm = (userEmail === null || userEmail === void 0 ? void 0 : userEmail.trim().toLowerCase()) || "";
    const display = (displayName === null || displayName === void 0 ? void 0 : displayName.trim()) || "";
    const phoneDigits = phoneNumber ? normalizePhone(phoneNumber) : "";
    const consentNames = hints.consentFullNames.filter(Boolean);
    const consentEmails = hints.consentEmails.map((e) => e.trim().toLowerCase()).filter(Boolean);
    const seen = new Set();
    const out = [];
    const push = (p) => {
        if (seen.has(p.id))
            return;
        seen.add(p.id);
        out.push(p);
    };
    for (const p of profiles) {
        const pEmail = (_a = p.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
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
//# sourceMappingURL=patientMatch.js.map