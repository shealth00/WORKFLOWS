export interface RespiratoryQuestionnaire {
  fever: boolean;
  cough: boolean;
  shortnessOfBreath: boolean;
  congestion: boolean;
  fatigue: boolean;
  lossOfTasteSmell: boolean;
  closeContact: boolean;
  compromisedImmune: boolean;
}

export interface UtiQuestionnaire {
  dysuria: boolean;
  urgency: boolean;
  pelvicPain: boolean;
  catheter: boolean;
}

export interface StiQuestionnaire {
  discharge: boolean;
  painUrination: boolean;
  painIntercourse: boolean;
  bumpsSores: boolean;
  itching: boolean;
  lowerAbdominalPain: boolean;
  newPartner: boolean;
  unprotected: boolean;
  pastSTI: boolean;
  partnerDiagnosed: boolean;
}

export interface NailFungusQuestionnaire {
  discoloration: boolean;
  brittleness: boolean;
  distortion: boolean;
  debris: boolean;
  athleteFoot: boolean;
  communalShower: boolean;
}

export interface ClinicalQuestionnairesValue {
  respiratory: RespiratoryQuestionnaire;
  uti: UtiQuestionnaire;
  sti: StiQuestionnaire;
  nailFungus: NailFungusQuestionnaire;
}

export type IntakeDocumentUploadKind =
  | "driver-license-front"
  | "driver-license-back"
  | "state-id-front"
  | "state-id-back";

export interface IntakeIdentityDocuments {
  driverLicenseUrlFront: string;
  driverLicenseUrlBack: string;
  stateIdUrlFront: string;
  stateIdUrlBack: string;
}
