import type { UserProfile } from '../types';

/**
 * Staff admin: `users/{uid}.role === 'admin'` (set in Console) or email listed in VITE_ADMIN_EMAILS (comma-separated, build-time).
 */
export function isAdminUser(email: string | null | undefined, profile: UserProfile | null): boolean {
  if (profile?.role === 'admin') return true;
  const raw = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;
  if (!raw || !email) return false;
  const set = new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  return set.has(email.trim().toLowerCase());
}
