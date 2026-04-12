export type FormFieldType = 'text' | 'number' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface FormDefinition {
  id?: string;
  title: string;
  description?: string;
  ownerId: string;
  fields: FormField[];
  createdAt: any;
  updatedAt: any;
  isPublished: boolean;
}

export interface Submission {
  id?: string;
  formId: string;
  data: Record<string, any>;
  results?: Record<string, any>;
  submittedAt: any;
  submitterId?: string;
}

export type UserRole = 'staff' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: any;
  /** Set only via Firebase Console or trusted scripts — clients cannot change this field (see firestore.rules). */
  role?: UserRole;
}

export type PrecisionScreeningDecision = 'AUTO_ORDER' | 'PROVIDER_REVIEW' | 'NO_TEST';
export type PrecisionScreeningPriority = 'high' | 'medium' | 'low';

export interface PrecisionScreeningPatientInfo {
  name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
}

export interface PrecisionScreeningResponses {
  // Section 1: Medication Experience
  medFailure: boolean;
  sideEffects: boolean;
  triedMultipleMedications: boolean;
  polypharmacy: boolean;

  // Section 2: Mental Health
  depressionAnxiety: boolean;
  adhd: boolean;
  mentalTriedMultipleMeds: boolean;
  poorResponse: boolean;

  // Section 3: Current Symptoms
  fever: boolean;
  coughCongestion: boolean;
  stiConcerns: boolean;
  urinarySymptoms: boolean;
  giSymptoms: boolean;

  // Section 4: Medication Monitoring / toxicology triggers
  controlledMeds: boolean;
  painManagement: boolean;
  /** Concern for medication adherence (same-day UDS pathway per screening spec). */
  medicationAdherenceConcern: boolean;

  // Section 5: Family History
  cancerFamilyHistory: boolean;
  heartDiseaseFamilyHistory: boolean;
  neuroFamilyHistory: boolean;

  // Section 6: Wellness Goals
  weightLoss: boolean;
  nutritionOptimization: boolean;
  vitaminConcerns: boolean;
}

export interface PrecisionScreeningSuggestedOrder {
  testKey:
    | 'PGX_PANEL'
    | 'RESPIRATORY_PCR_PANEL'
    | 'STI_PANEL'
    | 'UTI_PANEL'
    | 'GI_PANEL'
    | 'UDS_80307'
    | 'BRCA_PANEL'
    | 'CARDIO_PANEL'
    | 'NEURO_PANEL';
  displayName: string;
  billingCodes?: string[];
  reasons: string[];
  confirmatoryIfNeeded?: boolean;
}

export interface PrecisionScreeningResults {
  score: number;
  decision: PrecisionScreeningDecision;
  priority: PrecisionScreeningPriority;
  flags: string[];
  suggestedOrders: PrecisionScreeningSuggestedOrder[];
  reasonsSummary: string[];
}

export interface PrecisionScreeningConsent {
  consented: boolean;
  signatureTyped?: string;
  signatureImageDataUrl?: string;
  signedAt?: any;
}

export interface PrecisionScreeningNextStep {
  choice: 'TEST_TODAY' | 'SCHEDULE' | 'UNKNOWN';
}

export interface PrecisionScreeningSubmission {
  id?: string;
  createdAt: any;
  createdByUid: string;
  patient: PrecisionScreeningPatientInfo;
  responses: PrecisionScreeningResponses;
  results: PrecisionScreeningResults;
  consent: PrecisionScreeningConsent;
  nextStep: PrecisionScreeningNextStep;
}
