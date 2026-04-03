import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../AuthContext';
import { db, collection, addDoc, serverTimestamp, storage, ref, uploadBytes, getDownloadURL } from '../firebase';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { evaluatePrecisionScreening } from '../logic/precisionScreening';
import type { PrecisionScreeningResponses } from '../types';

type Patient = {
  fullName: string;
  email: string;
  genderAtBirth: string;
  dob: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  insuranceTraditionalCardUrlFront: string;
  insuranceTraditionalCardUrlBack: string;
  insuranceAdvantageCardUrlFront: string;
  insuranceAdvantageCardUrlBack: string;
  idCardUrlFront: string;
  idCardUrlBack: string;
};

const DEFAULT_PATIENT: Patient = {
  fullName: '',
  email: '',
  genderAtBirth: '',
  dob: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  insuranceTraditionalCardUrlFront: '',
  insuranceTraditionalCardUrlBack: '',
  insuranceAdvantageCardUrlFront: '',
  insuranceAdvantageCardUrlBack: '',
  idCardUrlFront: '',
  idCardUrlBack: '',
};

const DEFAULT_RESPONSES: PrecisionScreeningResponses & { adherenceConcern: boolean } = {
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

  adherenceConcern: false,
};

export default function PrecisionDiagnostic() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(DEFAULT_PATIENT);
  const [responses, setResponses] = useState(DEFAULT_RESPONSES);
  const [consented, setConsented] = useState(false);
  const [signatureTyped, setSignatureTyped] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = 160 * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

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

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const toggle = (key: keyof typeof DEFAULT_RESPONSES) => {
    setResponses((r) => ({ ...r, [key]: !r[key] }));
  };

  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const handleFileUpload = async (file: File, kind: string) => {
    if (!user || !file) return;
    setUploading((u) => ({ ...u, [kind]: true }));
    try {
      const path = `precision-diagnostic/${user.uid}/${kind}-${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const fieldMap: Record<string, keyof Patient> = {
        'insurance-traditional-front': 'insuranceTraditionalCardUrlFront',
        'insurance-traditional-back': 'insuranceTraditionalCardUrlBack',
        'insurance-advantage-front': 'insuranceAdvantageCardUrlFront',
        'insurance-advantage-back': 'insuranceAdvantageCardUrlBack',
        'id-front': 'idCardUrlFront',
        'id-back': 'idCardUrlBack',
      };
      const key = fieldMap[kind];
      if (key) setPatient((p) => ({ ...p, [key]: url }));
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload. Please try again.');
    } finally {
      setUploading((u) => ({ ...u, [kind]: false }));
    }
  };

  const canSubmit =
    patient.fullName.trim() &&
    patient.dob.trim() &&
    consented &&
    signatureTyped.trim();

  const buildEvaluationResponses = (): PrecisionScreeningResponses => {
    const { adherenceConcern, ...rest } = responses;
    // Adherence concern should also trigger Toxicology routing in this diagnostic form.
    const toxTriggered = rest.controlledMeds || rest.painManagement || adherenceConcern;
    return {
      ...rest,
      controlledMeds: rest.controlledMeds || adherenceConcern,
      painManagement: rest.painManagement || toxTriggered,
    };
  };

  const results = evaluatePrecisionScreening(buildEvaluationResponses());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const signatureImageDataUrl = canvasRef.current?.toDataURL('image/png') ?? '';
      const docRef = await addDoc(collection(db, 'precisionDiagnosticScreenings'), {
        createdAt: serverTimestamp(),
        createdByUid: user.uid,
        sendToGoogleDrive: true,
        patient,
        responses,
        results,
        consent: {
          consented: true,
          signatureTyped,
          signatureImageDataUrl,
          signedAt: serverTimestamp(),
        },
      });
      setSubmittedId(docRef.id);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="pt-8 border-t border-slate-200">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">{title}</h2>
      {children}
    </section>
  );

  const Check = ({ id, label }: { id: keyof typeof DEFAULT_RESPONSES; label: string }) => (
    <label className="flex items-center gap-3 py-1.5">
      <input
        type="checkbox"
        checked={responses[id]}
        onChange={() => toggle(id)}
        className="w-4 h-4 text-orange-600 border-black/20 rounded focus:ring-orange-500"
      />
      <span className="text-sm">{label}</span>
    </label>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <p className="text-black/60 mb-6">Please sign in to access the Precision Diagnostic Screening Form.</p>
        <Navbar />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
          <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Submitted</h1>
            <p className="text-black/50 mb-6">Your screening has been saved.</p>
            <p className="text-xs text-black/40 font-mono">ID: {submittedId ?? '—'}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-24">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-2 bg-orange-600" />
          <div className="px-6 sm:px-10 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Precision Diagnostic Screening Form</h1>
            <p className="mt-3 text-slate-600">Check all that apply. Results are used to suggest appropriate testing pathways.</p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-8">
              <section>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">Patient information</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
                    <input
                      value={patient.fullName}
                      onChange={(e) => setPatient((p) => ({ ...p, fullName: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={patient.email}
                      onChange={(e) => setPatient((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender at birth</label>
                    <select
                      value={patient.genderAtBirth}
                      onChange={(e) => setPatient((p) => ({ ...p, genderAtBirth: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date of birth</label>
                    <input
                      type="date"
                      value={patient.dob}
                      onChange={(e) => setPatient((p) => ({ ...p, dob: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={patient.phone}
                      onChange={(e) => setPatient((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Residential address</label>
                    <input
                      value={patient.address}
                      onChange={(e) => setPatient((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Street address"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 mb-2"
                    />
                    <div className="grid gap-2 grid-cols-3">
                      <input value={patient.city} onChange={(e) => setPatient((p) => ({ ...p, city: e.target.value }))} placeholder="City" className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500" />
                      <input value={patient.state} onChange={(e) => setPatient((p) => ({ ...p, state: e.target.value }))} placeholder="State" className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500" />
                      <input value={patient.zip} onChange={(e) => setPatient((p) => ({ ...p, zip: e.target.value }))} placeholder="ZIP" className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500" />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">Insurance &amp; documents</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Medicare (traditional)</p>
                    <label className="block text-xs text-slate-500 mb-1">Insurance card – front</label>
                    <input type="file" accept="image/*" disabled={!!uploading['insurance-traditional-front']} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'insurance-traditional-front'); }} className="block w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50" />
                    {patient.insuranceTraditionalCardUrlFront && <p className="mt-1 text-xs text-emerald-600">Front uploaded.</p>}
                    <label className="block text-xs text-slate-500 mb-1 mt-2">Insurance card – back</label>
                    <input type="file" accept="image/*" disabled={!!uploading['insurance-traditional-back']} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'insurance-traditional-back'); }} className="block w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50" />
                    {patient.insuranceTraditionalCardUrlBack && <p className="mt-1 text-xs text-emerald-600">Back uploaded.</p>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Medicare (Advantage)</p>
                    <label className="block text-xs text-slate-500 mb-1">State ID / driver license – front</label>
                    <input type="file" accept="image/*" disabled={!!uploading['id-front']} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'id-front'); }} className="block w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50" />
                    {patient.idCardUrlFront && <p className="mt-1 text-xs text-emerald-600">Front uploaded.</p>}
                    <label className="block text-xs text-slate-500 mb-1 mt-2">State ID / driver license – back</label>
                    <input type="file" accept="image/*" disabled={!!uploading['id-back']} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'id-back'); }} className="block w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50" />
                    {patient.idCardUrlBack && <p className="mt-1 text-xs text-emerald-600">Back uploaded.</p>}
                  </div>
                </div>
              </section>

              <Section title="Section 1: Medication Response (PGx)">
                <div className="grid gap-1 sm:grid-cols-2">
                  <Check id="medFailure" label="Medications not working" />
                  <Check id="sideEffects" label="Side effects from medications" />
                  <Check id="triedMultipleMedications" label="Tried multiple medications for same condition" />
                  <Check id="polypharmacy" label="Currently taking 5+ medications" />
                </div>
              </Section>

              <Section title="Section 2: Mental Health">
                <div className="grid gap-1 sm:grid-cols-2">
                  <Check id="depressionAnxiety" label="Depression / Anxiety" />
                  <Check id="adhd" label="ADHD" />
                  <Check id="mentalTriedMultipleMeds" label="Tried multiple psychiatric medications" />
                  <Check id="poorResponse" label="Poor response or side effects" />
                </div>
              </Section>

              <Section title="Section 3: Infectious Symptoms (PCR)">
                <div className="grid gap-1 sm:grid-cols-2">
                  <Check id="fever" label="Fever" />
                  <Check id="coughCongestion" label="Cough / congestion" />
                  <Check id="stiConcerns" label="STI concerns" />
                  <Check id="urinarySymptoms" label="Urinary symptoms (burning, frequency)" />
                  <Check id="giSymptoms" label="GI symptoms (diarrhea, nausea)" />
                </div>
              </Section>

              <Section title="Section 4: Toxicology">
                <div className="space-y-1">
                  <Check id="controlledMeds" label="On controlled medications" />
                  <Check id="painManagement" label="Pain management program" />
                  <Check id="adherenceConcern" label="Concern for medication adherence" />
                </div>
              </Section>

              <Section title="Section 5: Family History (Genetics)">
                <div className="space-y-1">
                  <Check id="cancerFamilyHistory" label="Cancer in family" />
                  <Check id="heartDiseaseFamilyHistory" label="Heart disease" />
                  <Check id="neuroFamilyHistory" label="Neurological disease" />
                </div>
              </Section>

              <Section title="Section 6: Wellness / Nutrition">
                <div className="space-y-1">
                  <Check id="weightLoss" label="Weight issues" />
                  <Check id="vitaminConcerns" label="Vitamin deficiencies" />
                  <Check id="nutritionOptimization" label="Interested in personalized diet" />
                </div>
              </Section>

              <Section title="Personalized Results (auto-calculated)">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-black/40 uppercase tracking-widest">Score</p>
                      <p className="text-3xl font-bold">{results.score}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-black/40 uppercase tracking-widest">Decision</p>
                      <p className="font-semibold">{results.decision}</p>
                      <p className="text-xs text-black/50">Priority: {results.priority}</p>
                    </div>
                  </div>
                  {results.suggestedOrders.length ? (
                    <div className="mt-4 space-y-2">
                      {results.suggestedOrders.map((o) => (
                        <div key={o.testKey} className="bg-white border border-black/5 rounded-xl p-3">
                          <p className="font-semibold">{o.displayName}</p>
                          {o.billingCodes?.length ? (
                            <p className="text-xs text-black/40">Billing codes: {o.billingCodes.join(', ')}</p>
                          ) : null}
                          {o.reasons.length ? (
                            <p className="text-xs text-black/50 mt-1">Reason: {o.reasons.join('; ')}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-black/50">No suggested tests based on current selections.</p>
                  )}
                </div>
              </Section>

              <Section title="Consent">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consented}
                    onChange={(e) => setConsented(e.target.checked)}
                    className="mt-1 w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    required
                  />
                  <span className="text-sm text-slate-700">
                    I consent to appropriate lab/genetic testing based on my responses.
                  </span>
                </label>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Signature (typed)</label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={signatureTyped}
                    onChange={(e) => setSignatureTyped(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                    placeholder="Type full legal name"
                    required
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Signature pad</label>
                  <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
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
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="mt-2 text-xs text-slate-600 hover:text-slate-900 underline"
                  >
                    Clear signature
                  </button>
                </div>
              </Section>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="w-full py-4 bg-orange-600 text-white rounded-xl font-semibold text-lg hover:bg-orange-700 focus:ring-4 focus:ring-orange-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={22} /> : null}
                  Submit
                </button>
                {!canSubmit ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Full name, date of birth, consent, and typed signature are required.
                  </p>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

