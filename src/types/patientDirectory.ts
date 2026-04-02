export interface PatientProfile {
  id: string;
  name: string;
  dob: string;
  mrn: string;
  phone: string;
  address: string;
  recentVisit: string;
  /** Optional; used for Patient Portal matching when present in spreadsheet */
  email?: string;
}

export interface PatientProfilesPayload {
  source?: string;
  sheet?: string;
  generatedAt?: string;
  count?: number;
  profiles: PatientProfile[];
}
