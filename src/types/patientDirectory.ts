export interface PatientProfile {
  id: string;
  name: string;
  dob: string;
  mrn: string;
  phone: string;
  address: string;
  recentVisit: string;
}

export interface PatientProfilesPayload {
  source?: string;
  sheet?: string;
  generatedAt?: string;
  count?: number;
  profiles: PatientProfile[];
}
