import { describe, it, expect } from 'vitest';
import { evaluatePrecisionScreening } from './precisionScreening';
import type { PrecisionScreeningResponses } from '../types';

function emptyResponses(): PrecisionScreeningResponses {
  return {
    medFailure: false,
    sideEffects: false,
    triedMultipleMedications: false,
    polypharmacy: false,
    depressionAnxiety: false,
    adhd: false,
    mentalTriedMultipleMeds: false,
    poorResponse: false,
    fever: false,
    coughCongestion: false,
    stiConcerns: false,
    urinarySymptoms: false,
    giSymptoms: false,
    controlledMeds: false,
    painManagement: false,
    medicationAdherenceConcern: false,
    cancerFamilyHistory: false,
    heartDiseaseFamilyHistory: false,
    neuroFamilyHistory: false,
    weightLoss: false,
    nutritionOptimization: false,
    vitaminConcerns: false,
  };
}

describe('evaluatePrecisionScreening', () => {
  it('returns NO_TEST and score 0 for empty responses', () => {
    const r = evaluatePrecisionScreening(emptyResponses());
    expect(r.decision).toBe('NO_TEST');
    expect(r.score).toBe(0);
    expect(r.suggestedOrders).toHaveLength(0);
    expect(r.flags).toHaveLength(0);
  });

  it('suggests PGX_PANEL when medication experience triggers', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      medFailure: true,
    });
    expect(r.suggestedOrders).toContainEqual(
      expect.objectContaining({
        testKey: 'PGX_PANEL',
        displayName: 'Medication Optimization Test (PGx)',
        reasons: ['Medication(s) did not work'],
      })
    );
    expect(r.reasonsSummary).toContain('Medication optimization eligibility based on medication experience.');
  });

  it('suggests PGX_PANEL with all medication reasons when multiple triggers', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      medFailure: true,
      sideEffects: true,
      triedMultipleMedications: true,
      polypharmacy: true,
    });
    const pgx = r.suggestedOrders.find((o) => o.testKey === 'PGX_PANEL');
    expect(pgx).toBeDefined();
    expect(pgx!.reasons).toEqual([
      'Medication(s) did not work',
      'Side effects from medication(s)',
      'Tried multiple medications',
      'Taking 5+ medications (polypharmacy)',
    ]);
  });

  it('suggests RESPIRATORY_PCR_PANEL for fever or cough', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      fever: true,
      coughCongestion: true,
    });
    expect(r.suggestedOrders).toContainEqual(
      expect.objectContaining({
        testKey: 'RESPIRATORY_PCR_PANEL',
        displayName: 'Respiratory PCR Panel',
        reasons: ['Fever', 'Cough / congestion'],
      })
    );
    expect(r.reasonsSummary).toContain('Respiratory symptoms suggest respiratory PCR testing.');
  });

  it('suggests STI_PANEL for STI concerns', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      stiConcerns: true,
    });
    expect(r.suggestedOrders).toContainEqual(
      expect.objectContaining({
        testKey: 'STI_PANEL',
        displayName: 'STI Panel',
        reasons: ['STI concerns'],
      })
    );
  });

  it('suggests UTI_PANEL for urinary symptoms', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      urinarySymptoms: true,
    });
    expect(r.suggestedOrders).toContainEqual(
      expect.objectContaining({
        testKey: 'UTI_PANEL',
        displayName: 'UTI Panel',
        reasons: ['Urinary symptoms'],
      })
    );
  });

  it('suggests GI_PANEL for GI symptoms', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      giSymptoms: true,
    });
    expect(r.suggestedOrders).toContainEqual(
      expect.objectContaining({
        testKey: 'GI_PANEL',
        displayName: 'GI Panel',
        reasons: ['GI symptoms'],
      })
    );
  });

  it('suggests UDS_80307 with billingCodes for pain meds', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      controlledMeds: true,
      painManagement: true,
    });
    expect(r.suggestedOrders).toContainEqual(
      expect.objectContaining({
        testKey: 'UDS_80307',
        displayName: 'Urine Drug Screen (UDS)',
        billingCodes: ['80307'],
        confirmatoryIfNeeded: true,
        reasons: ['On controlled medications', 'Pain management program'],
      })
    );
  });

  it('suggests UDS when only medication adherence concern is checked (not pain management)', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      medicationAdherenceConcern: true,
    });
    expect(r.suggestedOrders).toContainEqual(
      expect.objectContaining({
        testKey: 'UDS_80307',
        reasons: ['Concern for medication adherence'],
      })
    );
  });

  it('suggests BRCA_PANEL for cancer family history', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      cancerFamilyHistory: true,
    });
    expect(r.suggestedOrders).toContainEqual(
      expect.objectContaining({
        testKey: 'BRCA_PANEL',
        displayName: 'BRCA Panel',
        reasons: ['Cancer in family history'],
      })
    );
  });

  it('suggests CARDIO_PANEL for heart disease family history', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      heartDiseaseFamilyHistory: true,
    });
    expect(r.suggestedOrders).toContainEqual(
      expect.objectContaining({
        testKey: 'CARDIO_PANEL',
        displayName: 'Cardio Genetics Panel',
        reasons: ['Heart disease in family history'],
      })
    );
  });

  it('suggests NEURO_PANEL for neuro family history', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      neuroFamilyHistory: true,
    });
    expect(r.suggestedOrders).toContainEqual(
      expect.objectContaining({
        testKey: 'NEURO_PANEL',
        displayName: 'Neuro Genetics Panel',
        reasons: ['Neurological disease in family history'],
      })
    );
  });

  it('sets decision AUTO_ORDER when score >= 5', () => {
    // fever + cough = 5 points from pcrSymptomsAny; medFailure = 3
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      fever: true,
      coughCongestion: true,
      medFailure: true,
    });
    expect(r.score).toBeGreaterThanOrEqual(5);
    expect(r.decision).toBe('AUTO_ORDER');
  });

  it('sets decision PROVIDER_REVIEW when score 3-4', () => {
    // medFailure = 3
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      medFailure: true,
    });
    expect(r.score).toBe(3);
    expect(r.decision).toBe('PROVIDER_REVIEW');
  });

  it('sets decision NO_TEST when score < 3', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      cancerFamilyHistory: true, // no score contribution
    });
    expect(r.score).toBe(0);
    expect(r.decision).toBe('NO_TEST');
  });

  it('sets HIGH_PRIORITY flag when mental health + PGx triggered', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      medFailure: true,
      depressionAnxiety: true,
    });
    expect(r.flags).toContain('HIGH_PRIORITY');
    expect(r.priority).toBe('high');
  });

  it('sets priority medium for AUTO_ORDER without HIGH_PRIORITY', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      fever: true,
      coughCongestion: true,
    });
    expect(r.decision).toBe('AUTO_ORDER');
    expect(r.flags).not.toContain('HIGH_PRIORITY');
    expect(r.priority).toBe('medium');
  });

  it('deduplicates suggested orders by testKey', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      fever: true,
      coughCongestion: true,
    });
    const respiratory = r.suggestedOrders.filter((o) => o.testKey === 'RESPIRATORY_PCR_PANEL');
    expect(respiratory).toHaveLength(1);
    expect(respiratory[0].reasons).toContain('Fever');
    expect(respiratory[0].reasons).toContain('Cough / congestion');
  });

  it('returns multiple suggested orders for multiple symptom categories', () => {
    const r = evaluatePrecisionScreening({
      ...emptyResponses(),
      medFailure: true,
      fever: true,
      stiConcerns: true,
      urinarySymptoms: true,
    });
    const keys = r.suggestedOrders.map((o) => o.testKey);
    expect(keys).toContain('PGX_PANEL');
    expect(keys).toContain('RESPIRATORY_PCR_PANEL');
    expect(keys).toContain('STI_PANEL');
    expect(keys).toContain('UTI_PANEL');
    expect(r.suggestedOrders.length).toBeGreaterThanOrEqual(4);
  });
});
