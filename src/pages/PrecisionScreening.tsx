import React, { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../AuthContext';
import { db, collection, addDoc, serverTimestamp } from '../firebase';
import type {
  PrecisionScreeningConsent,
  PrecisionScreeningNextStep,
  PrecisionScreeningPatientInfo,
  PrecisionScreeningResponses,
} from '../types';
import { evaluatePrecisionScreening } from '../logic/precisionScreening';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

type StepId =
  | 'welcome'
  | 'patientInfo'
  | 'medicationExperience'
  | 'mentalHealth'
  | 'currentSymptoms'
  | 'medicationMonitoring'
  | 'familyHistory'
  | 'wellnessGoals'
  | 'results'
  | 'consent'
  | 'nextStep'
  | 'done';

const STORAGE_KEY = 'precisionScreeningDraft.v1';

const DEFAULT_PATIENT: PrecisionScreeningPatientInfo = {
  name: '',
  dob: '',
  gender: '',
  phone: '',
  email: '',
};

const DEFAULT_RESPONSES: PrecisionScreeningResponses = {
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

  cancerFamilyHistory: false,
  heartDiseaseFamilyHistory: false,
  neuroFamilyHistory: false,

  weightLoss: false,
  nutritionOptimization: false,
  vitaminConcerns: false,
};

const DEFAULT_CONSENT: PrecisionScreeningConsent = {
  consented: false,
  signatureTyped: '',
  signatureImageDataUrl: '',
};

const DEFAULT_NEXT_STEP: PrecisionScreeningNextStep = {
  choice: 'UNKNOWN',
};

function isBlank(str: string) {
  return !str || !str.trim();
}

function stepIndex(step: StepId) {
  const steps: StepId[] = [
    'welcome',
    'patientInfo',
    'medicationExperience',
    'mentalHealth',
    'currentSymptoms',
    'medicationMonitoring',
    'familyHistory',
    'wellnessGoals',
    'results',
    'consent',
    'nextStep',
    'done',
  ];
  return steps.indexOf(step);
}

function clampStep(step: StepId): StepId {
  const allowed: StepId[] = [
    'welcome',
    'patientInfo',
    'medicationExperience',
    'mentalHealth',
    'currentSymptoms',
    'medicationMonitoring',
    'familyHistory',
    'wellnessGoals',
    'results',
    'consent',
    'nextStep',
    'done',
  ];
  return allowed.includes(step) ? step : 'welcome';
}

export default function PrecisionScreening() {
  const { user } = useAuth();
  const [step, setStep] = useState<StepId>('welcome');
  const [patient, setPatient] = useState<PrecisionScreeningPatientInfo>(DEFAULT_PATIENT);
  const [responses, setResponses] = useState<PrecisionScreeningResponses>(DEFAULT_RESPONSES);
  const [consent, setConsent] = useState<PrecisionScreeningConsent>(DEFAULT_CONSENT);
  const [nextStep, setNextStep] = useState<PrecisionScreeningNextStep>(DEFAULT_NEXT_STEP);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const results = useMemo(() => evaluatePrecisionScreening(responses), [responses]);

  // Load draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        step?: StepId;
        patient?: Partial<PrecisionScreeningPatientInfo>;
        responses?: Partial<PrecisionScreeningResponses>;
        consent?: Partial<PrecisionScreeningConsent>;
        nextStep?: Partial<PrecisionScreeningNextStep>;
      };
      if (parsed.patient) setPatient((p) => ({ ...p, ...parsed.patient }));
      if (parsed.responses) setResponses((r) => ({ ...r, ...parsed.responses }));
      if (parsed.consent) setConsent((c) => ({ ...c, ...parsed.consent }));
      if (parsed.nextStep) setNextStep((n) => ({ ...n, ...parsed.nextStep }));
      if (parsed.step) setStep(clampStep(parsed.step));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft
  useEffect(() => {
    const payload = {
      step,
      patient,
      responses,
      consent: {
        consented: consent.consented,
        signatureTyped: consent.signatureTyped || '',
        // Avoid storing large image data URLs in localStorage
      },
      nextStep,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [step, patient, responses, consent.consented, consent.signatureTyped, nextStep]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [step]);

  const getCanvasPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const point = 'touches' in e ? e.touches[0] : (e as React.MouseEvent<HTMLCanvasElement>);
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    drawing.current = true;
    lastPoint.current = getCanvasPoint(e);
  };

  const stopDrawing = (
    e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (e) e.preventDefault();
    drawing.current = false;
    lastPoint.current = null;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPoint(e);
    const last = lastPoint.current ?? { x, y };
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPoint.current = { x, y };
  };

  const clearSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setConsent((c) => ({ ...c, signatureImageDataUrl: '' }));
  };

  const captureSignatureDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    try {
      return canvas.toDataURL('image/png');
    } catch {
      return '';
    }
  };

  const canContinuePatientInfo =
    !isBlank(patient.name) &&
    !isBlank(patient.dob) &&
    !isBlank(patient.gender) &&
    !isBlank(patient.phone) &&
    !isBlank(patient.email);

  const canSubmit =
    consent.consented &&
    !isBlank(consent.signatureTyped || '') &&
    (consent.signatureImageDataUrl ? true : true);

  const goBack = () => {
    const idx = stepIndex(step);
    const prev: StepId[] = [
      'welcome',
      'patientInfo',
      'medicationExperience',
      'mentalHealth',
      'currentSymptoms',
      'medicationMonitoring',
      'familyHistory',
      'wellnessGoals',
      'results',
      'consent',
      'nextStep',
      'done',
    ];
    if (idx <= 0) return;
    setStep(prev[idx - 1] ?? 'welcome');
  };

  const goNext = () => {
    if (step === 'patientInfo' && !canContinuePatientInfo) return;
    const idx = stepIndex(step);
    const seq: StepId[] = [
      'welcome',
      'patientInfo',
      'medicationExperience',
      'mentalHealth',
      'currentSymptoms',
      'medicationMonitoring',
      'familyHistory',
      'wellnessGoals',
      'results',
      'consent',
      'nextStep',
      'done',
    ];
    setStep(seq[idx + 1] ?? 'done');
  };

  const toggle = (key: keyof PrecisionScreeningResponses) => {
    setResponses((r) => ({ ...r, [key]: !r[key] }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const signatureImageDataUrl = consent.signatureImageDataUrl || captureSignatureDataUrl();
      const docRef = await addDoc(collection(db, 'precisionScreenings'), {
        createdAt: serverTimestamp(),
        createdByUid: user.uid,
        patient,
        responses,
        results,
        consent: {
          consented: true,
          signatureTyped: consent.signatureTyped || '',
          signatureImageDataUrl,
          signedAt: serverTimestamp(),
        },
        nextStep,
      });
      setSubmittedId(docRef.id);
      setStep('done');
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
      alert('Failed to submit screening. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const SectionCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="h-3 bg-orange-600" />
      <div className="p-8 sm:p-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{title}</h1>
        {subtitle ? <p className="text-black/50 mb-10">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  );

  const CheckboxRow = ({ id, label }: { id: keyof PrecisionScreeningResponses; label: string }) => (
    <label className="flex items-center gap-3 p-4 bg-slate-50 border border-black/5 rounded-2xl cursor-pointer hover:bg-black/5 transition-all">
      <input
        type="checkbox"
        checked={responses[id]}
        onChange={() => toggle(id)}
        className="w-5 h-5 text-orange-600 focus:ring-orange-600 border-black/10"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-24">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-black/40 uppercase tracking-widest">Precision Health Screening</p>
            <p className="text-sm text-black/50">
              Step {Math.max(1, stepIndex(step) + 1)} of 12
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear saved progress and restart?')) {
                localStorage.removeItem(STORAGE_KEY);
                setPatient(DEFAULT_PATIENT);
                setResponses(DEFAULT_RESPONSES);
                setConsent(DEFAULT_CONSENT);
                setNextStep(DEFAULT_NEXT_STEP);
                setStep('welcome');
              }
            }}
            className="text-xs text-slate-600 hover:text-slate-900 underline"
          >
            Restart
          </button>
        </div>

        {step === 'welcome' && (
          <SectionCard
            title="Precision Health Screening"
            subtitle="Takes 2–3 minutes • Personalized results • Covered by insurance (if eligible)"
          >
            <button
              type="button"
              onClick={goNext}
              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Start Screening <ArrowRight size={20} />
            </button>
          </SectionCard>
        )}

        {step === 'patientInfo' && (
          <SectionCard title="Patient Information" subtitle="Tell us a bit about you.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  value={patient.name}
                  onChange={(e) => setPatient((p) => ({ ...p, name: e.target.value }))}
                  className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">DOB</label>
                <input
                  type="date"
                  value={patient.dob}
                  onChange={(e) => setPatient((p) => ({ ...p, dob: e.target.value }))}
                  className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <input
                  value={patient.gender}
                  onChange={(e) => setPatient((p) => ({ ...p, gender: e.target.value }))}
                  className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="e.g., Female, Male, Non-binary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  value={patient.phone}
                  onChange={(e) => setPatient((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={patient.email}
                  onChange={(e) => setPatient((p) => ({ ...p, email: e.target.value }))}
                  className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>
            {!canContinuePatientInfo ? (
              <p className="mt-4 text-sm text-red-600">Please complete all fields to continue.</p>
            ) : null}
            <div className="mt-10 flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 px-6 py-3 border border-black/10 rounded-xl font-medium hover:bg-black/5 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canContinuePatientInfo}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next <ArrowRight size={18} />
              </button>
            </div>
          </SectionCard>
        )}

        {step === 'medicationExperience' && (
          <SectionCard title="Medication Experience" subtitle="Have you had any of the following?">
            <div className="space-y-3">
              <CheckboxRow id="medFailure" label="Medications didn’t work" />
              <CheckboxRow id="sideEffects" label="Side effects" />
              <CheckboxRow id="triedMultipleMedications" label="Tried multiple medications" />
              <CheckboxRow id="polypharmacy" label="Taking 5+ medications" />
            </div>
            <WizardNav goBack={goBack} goNext={goNext} />
          </SectionCard>
        )}

        {step === 'mentalHealth' && (
          <SectionCard title="Mental Health" subtitle="Select anything that applies.">
            <div className="space-y-3">
              <CheckboxRow id="depressionAnxiety" label="Depression / Anxiety" />
              <CheckboxRow id="adhd" label="ADHD" />
              <CheckboxRow id="mentalTriedMultipleMeds" label="Tried multiple medications" />
              <CheckboxRow id="poorResponse" label="Poor response" />
            </div>
            <WizardNav goBack={goBack} goNext={goNext} />
          </SectionCard>
        )}

        {step === 'currentSymptoms' && (
          <SectionCard title="Current Symptoms" subtitle="What are you experiencing right now?">
            <div className="space-y-3">
              <CheckboxRow id="fever" label="Fever" />
              <CheckboxRow id="coughCongestion" label="Cough / congestion" />
              <CheckboxRow id="stiConcerns" label="STI concerns" />
              <CheckboxRow id="urinarySymptoms" label="Urinary symptoms" />
              <CheckboxRow id="giSymptoms" label="GI symptoms" />
            </div>
            <WizardNav goBack={goBack} goNext={goNext} />
          </SectionCard>
        )}

        {step === 'medicationMonitoring' && (
          <SectionCard title="Medication Monitoring" subtitle="Select anything that applies.">
            <div className="space-y-3">
              <CheckboxRow id="controlledMeds" label="On controlled medications" />
              <CheckboxRow id="painManagement" label="Pain management program" />
            </div>
            <WizardNav goBack={goBack} goNext={goNext} />
          </SectionCard>
        )}

        {step === 'familyHistory' && (
          <SectionCard title="Family History" subtitle="Any of the following in family history?">
            <div className="space-y-3">
              <CheckboxRow id="cancerFamilyHistory" label="Cancer" />
              <CheckboxRow id="heartDiseaseFamilyHistory" label="Heart disease" />
              <CheckboxRow id="neuroFamilyHistory" label="Neurological disease" />
            </div>
            <WizardNav goBack={goBack} goNext={goNext} />
          </SectionCard>
        )}

        {step === 'wellnessGoals' && (
          <SectionCard title="Wellness Goals" subtitle="What are you looking to improve?">
            <div className="space-y-3">
              <CheckboxRow id="weightLoss" label="Weight loss" />
              <CheckboxRow id="nutritionOptimization" label="Nutrition optimization" />
              <CheckboxRow id="vitaminConcerns" label="Vitamin concerns" />
            </div>
            <WizardNav goBack={goBack} goNext={goNext} />
          </SectionCard>
        )}

        {step === 'results' && (
          <SectionCard title="Your Personalized Results" subtitle="Based on your responses, you may qualify for:">
            <div className="bg-slate-50 border border-black/5 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm text-black/50">Score</p>
                  <p className="text-3xl font-bold">{results.score}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-black/50">Decision</p>
                  <p className="text-sm font-semibold">{results.decision}</p>
                  <p className="text-xs text-black/40">Priority: {results.priority}</p>
                </div>
              </div>
            </div>

            {results.suggestedOrders.length > 0 ? (
              <div className="space-y-3">
                {results.suggestedOrders.map((o) => (
                  <div key={o.testKey} className="flex items-start gap-3 p-4 bg-white border border-black/5 rounded-2xl">
                    <CheckCircle2 className="text-emerald-600 mt-0.5" size={18} />
                    <div className="min-w-0">
                      <p className="font-semibold">{o.displayName}</p>
                      {o.billingCodes?.length ? (
                        <p className="text-xs text-black/40">Billing codes: {o.billingCodes.join(', ')}</p>
                      ) : null}
                      {o.reasons.length ? (
                        <p className="text-xs text-black/50 mt-1">Reason: {o.reasons.join('; ')}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-black/10 rounded-2xl p-8 text-center text-black/50">
                No suggested tests based on current selections.
              </div>
            )}

            <div className="mt-6 text-sm text-black/50">
              Covered by insurance (if eligible).
            </div>

            <div className="mt-10 flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 px-6 py-3 border border-black/10 rounded-xl font-medium hover:bg-black/5 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button
                type="button"
                onClick={goNext}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
              >
                Proceed with Testing <ArrowRight size={18} />
              </button>
            </div>
          </SectionCard>
        )}

        {step === 'consent' && (
          <SectionCard title="Consent" subtitle="I agree to testing and billing.">
            <label className="flex items-start gap-3 p-4 bg-slate-50 border border-black/5 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={consent.consented}
                onChange={(e) => setConsent((c) => ({ ...c, consented: e.target.checked }))}
                className="mt-1 w-5 h-5 text-orange-600 focus:ring-orange-600 border-black/10"
              />
              <span className="text-sm text-slate-800">
                I consent to appropriate testing and insurance billing (if eligible).
              </span>
            </label>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Signature (type full legal name)</label>
              <input
                value={consent.signatureTyped || ''}
                onChange={(e) => setConsent((c) => ({ ...c, signatureTyped: e.target.value }))}
                className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder="Type your full legal name"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Sign here</label>
              <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full h-40 touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={clearSignatureCanvas}
                  className="text-xs text-slate-600 hover:text-slate-900 underline"
                >
                  Clear signature
                </button>
                <button
                  type="button"
                  onClick={() => setConsent((c) => ({ ...c, signatureImageDataUrl: captureSignatureDataUrl() }))}
                  className="text-xs text-slate-600 hover:text-slate-900 underline"
                >
                  Save signature
                </button>
              </div>
              {consent.signatureImageDataUrl ? (
                <p className="mt-2 text-xs text-emerald-600">Signature captured.</p>
              ) : null}
            </div>

            <div className="mt-10 flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 px-6 py-3 border border-black/10 rounded-xl font-medium hover:bg-black/5 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button
                type="button"
                onClick={goNext}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
              >
                Next <ArrowRight size={18} />
              </button>
            </div>

            {!canSubmit ? (
              <p className="mt-4 text-sm text-red-600">Consent and typed signature are required before submitting.</p>
            ) : null}
          </SectionCard>
        )}

        {step === 'nextStep' && (
          <SectionCard title="Next Step" subtitle="Choose how you'd like to proceed.">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setNextStep({ choice: 'TEST_TODAY' })}
                className={cn(
                  'w-full text-left p-4 rounded-2xl border transition-all',
                  nextStep.choice === 'TEST_TODAY'
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-black/10 bg-white hover:bg-black/5'
                )}
              >
                <p className="font-semibold">Sample collection today</p>
                <p className="text-sm text-black/50">Proceed with same-day collection if available.</p>
              </button>
              <button
                type="button"
                onClick={() => setNextStep({ choice: 'SCHEDULE' })}
                className={cn(
                  'w-full text-left p-4 rounded-2xl border transition-all',
                  nextStep.choice === 'SCHEDULE'
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-black/10 bg-white hover:bg-black/5'
                )}
              >
                <p className="font-semibold">Schedule appointment</p>
                <p className="text-sm text-black/50">Pick a time for collection or a provider visit.</p>
              </button>
            </div>

            <div className="mt-10 flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 px-6 py-3 border border-black/10 rounded-xl font-medium hover:bg-black/5 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !canSubmit}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
                Submit
              </button>
            </div>
          </SectionCard>
        )}

        {step === 'done' && (
          <SectionCard title="Submitted" subtitle="Your screening has been received.">
            <div className="bg-white border border-black/5 rounded-2xl p-6">
              <p className="text-sm text-black/50">Submission ID</p>
              <p className="font-mono text-sm">{submittedId ?? '—'}</p>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPatient(DEFAULT_PATIENT);
                  setResponses(DEFAULT_RESPONSES);
                  setConsent(DEFAULT_CONSENT);
                  setNextStep(DEFAULT_NEXT_STEP);
                  setSubmittedId(null);
                  setStep('welcome');
                }}
                className="flex-1 px-6 py-3 border border-black/10 rounded-xl font-medium hover:bg-black/5 transition-all"
              >
                Start Another
              </button>
              <a
                href="/workspace"
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all text-center"
              >
                Back to Workspace
              </a>
            </div>
          </SectionCard>
        )}
      </main>
    </div>
  );
}

function WizardNav({ goBack, goNext }: { goBack: () => void; goNext: () => void }) {
  return (
    <div className="mt-10 flex gap-3">
      <button
        type="button"
        onClick={goBack}
        className="flex-1 px-6 py-3 border border-black/10 rounded-xl font-medium hover:bg-black/5 transition-all flex items-center justify-center gap-2"
      >
        <ArrowLeft size={18} /> Back
      </button>
      <button
        type="button"
        onClick={goNext}
        className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
      >
        Next <ArrowRight size={18} />
      </button>
    </div>
  );
}

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(' ');
}

