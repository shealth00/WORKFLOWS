import type {
  PrecisionScreeningResponses,
  PrecisionScreeningResults,
  PrecisionScreeningSuggestedOrder,
  PrecisionScreeningPriority,
  PrecisionScreeningDecision,
} from '../types';

function uniqueOrders(orders: PrecisionScreeningSuggestedOrder[]): PrecisionScreeningSuggestedOrder[] {
  const byKey = new Map<PrecisionScreeningSuggestedOrder['testKey'], PrecisionScreeningSuggestedOrder>();
  for (const o of orders) {
    const existing = byKey.get(o.testKey);
    if (!existing) {
      byKey.set(o.testKey, { ...o, reasons: [...o.reasons] });
      continue;
    }
    byKey.set(o.testKey, {
      ...existing,
      billingCodes: existing.billingCodes ?? o.billingCodes,
      confirmatoryIfNeeded: existing.confirmatoryIfNeeded ?? o.confirmatoryIfNeeded,
      reasons: Array.from(new Set([...(existing.reasons ?? []), ...(o.reasons ?? [])])),
    });
  }
  return Array.from(byKey.values());
}

export function evaluatePrecisionScreening(responses: PrecisionScreeningResponses): PrecisionScreeningResults {
  const reasonsSummary: string[] = [];
  const flags: string[] = [];
  const suggestedOrders: PrecisionScreeningSuggestedOrder[] = [];

  const pgxTriggered =
    responses.medFailure ||
    responses.sideEffects ||
    responses.triedMultipleMedications ||
    responses.polypharmacy;

  const pcrSymptomsAny =
    responses.fever ||
    responses.coughCongestion ||
    responses.stiConcerns ||
    responses.urinarySymptoms ||
    responses.giSymptoms;

  const painMedsAny = responses.controlledMeds || responses.painManagement;

  const mentalHealthAny =
    responses.depressionAnxiety ||
    responses.adhd ||
    responses.mentalTriedMultipleMeds ||
    responses.poorResponse;

  // Suggested orders (exact routing rules)
  if (pgxTriggered) {
    const reasons: string[] = [];
    if (responses.medFailure) reasons.push('Medication(s) did not work');
    if (responses.sideEffects) reasons.push('Side effects from medication(s)');
    if (responses.triedMultipleMedications) reasons.push('Tried multiple medications');
    if (responses.polypharmacy) reasons.push('Taking 5+ medications (polypharmacy)');
    suggestedOrders.push({
      testKey: 'PGX_PANEL',
      displayName: 'Medication Optimization Test (PGx)',
      reasons,
    });
    reasonsSummary.push('Medication optimization eligibility based on medication experience.');
  }

  if (responses.fever || responses.coughCongestion) {
    const reasons: string[] = [];
    if (responses.fever) reasons.push('Fever');
    if (responses.coughCongestion) reasons.push('Cough / congestion');
    suggestedOrders.push({
      testKey: 'RESPIRATORY_PCR_PANEL',
      displayName: 'Respiratory PCR Panel',
      reasons,
    });
    reasonsSummary.push('Respiratory symptoms suggest respiratory PCR testing.');
  }

  if (responses.stiConcerns) {
    suggestedOrders.push({
      testKey: 'STI_PANEL',
      displayName: 'STI Panel',
      reasons: ['STI concerns'],
    });
    reasonsSummary.push('STI concerns suggest STI testing.');
  }

  if (responses.urinarySymptoms) {
    suggestedOrders.push({
      testKey: 'UTI_PANEL',
      displayName: 'UTI Panel',
      reasons: ['Urinary symptoms'],
    });
    reasonsSummary.push('Urinary symptoms suggest UTI testing.');
  }

  if (responses.giSymptoms) {
    suggestedOrders.push({
      testKey: 'GI_PANEL',
      displayName: 'GI Panel',
      reasons: ['GI symptoms'],
    });
    reasonsSummary.push('GI symptoms suggest GI testing.');
  }

  if (painMedsAny) {
    const reasons: string[] = [];
    if (responses.controlledMeds) reasons.push('On controlled medications');
    if (responses.painManagement) reasons.push('Pain management program');
    suggestedOrders.push({
      testKey: 'UDS_80307',
      displayName: 'Urine Drug Screen (UDS)',
      billingCodes: ['80307'],
      confirmatoryIfNeeded: true,
      reasons,
    });
    reasonsSummary.push('Medication monitoring indicates toxicology screening (UDS).');
  }

  if (responses.cancerFamilyHistory) {
    suggestedOrders.push({
      testKey: 'BRCA_PANEL',
      displayName: 'BRCA Panel',
      reasons: ['Cancer in family history'],
    });
    reasonsSummary.push('Cancer family history suggests genetic risk evaluation (BRCA).');
  }

  if (responses.heartDiseaseFamilyHistory) {
    suggestedOrders.push({
      testKey: 'CARDIO_PANEL',
      displayName: 'Cardio Genetics Panel',
      reasons: ['Heart disease in family history'],
    });
    reasonsSummary.push('Heart disease family history suggests cardio genetics evaluation.');
  }

  if (responses.neuroFamilyHistory) {
    suggestedOrders.push({
      testKey: 'NEURO_PANEL',
      displayName: 'Neuro Genetics Panel',
      reasons: ['Neurological disease in family history'],
    });
    reasonsSummary.push('Neurological family history suggests neuro genetics evaluation.');
  }

  // Priority boost
  if (mentalHealthAny && pgxTriggered) {
    flags.push('HIGH_PRIORITY');
    reasonsSummary.push('Mental health + medication challenges flagged as high priority.');
  }

  // Scoring
  let score = 0;
  if (responses.medFailure) score += 3;
  if (responses.sideEffects) score += 3;
  if (responses.polypharmacy) score += 2;
  if (mentalHealthAny) score += 2;
  if (pcrSymptomsAny) score += 5;
  if (painMedsAny) score += 3;

  let decision: PrecisionScreeningDecision = 'NO_TEST';
  if (score >= 5) decision = 'AUTO_ORDER';
  else if (score >= 3) decision = 'PROVIDER_REVIEW';

  let priority: PrecisionScreeningPriority = 'low';
  if (flags.includes('HIGH_PRIORITY')) priority = 'high';
  else if (decision === 'AUTO_ORDER') priority = 'medium';

  return {
    score,
    decision,
    priority,
    flags,
    suggestedOrders: uniqueOrders(suggestedOrders),
    reasonsSummary: Array.from(new Set(reasonsSummary)),
  };
}

