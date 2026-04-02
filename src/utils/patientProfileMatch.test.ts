import { describe, it, expect } from 'vitest';
import { findMatchingDirectoryProfiles } from './patientProfileMatch';
import type { PatientProfile } from '../types/patientDirectory';
import type { User } from 'firebase/auth';

function mockUser(overrides: Partial<User> & Pick<User, 'email'>): User {
  return {
    uid: 'u1',
    emailVerified: true,
    isAnonymous: false,
    metadata: {} as User['metadata'],
    providerData: [],
    refreshToken: '',
    tenantId: null,
    providerId: '',
    photoURL: null,
    phoneNumber: null,
    displayName: null,
    ...overrides,
  } as User;
}

const sample: PatientProfile[] = [
  {
    id: 'a-1',
    name: 'Jane Q Public',
    email: 'jane@example.com',
    dob: '1990-01-01',
    mrn: 'M1',
    phone: '5551234567',
    address: '1 Main',
    recentVisit: '2025-01-01',
  },
  {
    id: 'b-1',
    name: 'Other Person',
    dob: '1980-01-01',
    mrn: 'M2',
    phone: '',
    address: '',
    recentVisit: '',
  },
];

describe('findMatchingDirectoryProfiles', () => {
  it('matches by email', () => {
    const u = mockUser({ email: 'jane@example.com' });
    const m = findMatchingDirectoryProfiles(u, sample);
    expect(m).toHaveLength(1);
    expect(m[0].id).toBe('a-1');
  });

  it('matches by display name', () => {
    const u = mockUser({ email: 'x@y.com', displayName: 'Jane Q Public' });
    const m = findMatchingDirectoryProfiles(u, sample);
    expect(m.some((p) => p.id === 'a-1')).toBe(true);
  });

  it('matches by consent name hint', () => {
    const u = mockUser({ email: 'unknown@test.com', displayName: 'Nope' });
    const m = findMatchingDirectoryProfiles(u, sample, {
      consentFullNames: ['Jane Q Public'],
    });
    expect(m).toHaveLength(1);
  });

  it('does not return unrelated profiles', () => {
    const u = mockUser({ email: 'nobody@here.com', displayName: 'Nobody' });
    const m = findMatchingDirectoryProfiles(u, sample);
    expect(m).toHaveLength(0);
  });
});
