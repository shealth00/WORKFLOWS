/**
 * Sally Health Consent Form – matches the layout and content of the official consent PDF.
 * Shown after sign-in as the primary experience.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';
import { Loader2 } from 'lucide-react';
import { storage, ref, uploadBytes, getDownloadURL, db, collection, addDoc, serverTimestamp } from '../firebase';

const ConsentForm: React.FC = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [collectorName, setCollectorName] = useState('');
  const [patient, setPatient] = useState({
    fullName: '',
    email: user?.email || '',
    genderAtBirth: '',
    dateOfBirth: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    insuranceTraditional: false,
    insuranceAdvantage: false,
    insuranceMedicaid: false,
    insuranceTraditionalId: '',
    insuranceAdvantageId: '',
    insuranceMedicaidId: '',
    insuranceMedicaidProvider: '',
    insuranceTraditionalCardUrlFront: '',
    insuranceTraditionalCardUrlBack: '',
    insuranceAdvantageCardUrlFront: '',
    insuranceAdvantageCardUrlBack: '',
    insuranceMedicaidCardUrlFront: '',
    insuranceMedicaidCardUrlBack: '',
    idCardUrlFront: '',
    idCardUrlBack: '',
    appointment: '',
  });

  const [respiratory, setRespiratory] = useState({
    fever: false,
    cough: false,
    shortnessOfBreath: false,
    congestion: false,
    fatigue: false,
    lossOfTasteSmell: false,
    closeContact: false,
    compromisedImmune: false,
  });

  const [uti, setUti] = useState({
    dysuria: false,
    urgency: false,
    pelvicPain: false,
    catheter: false,
  });

  const [sti, setSti] = useState({
    discharge: false,
    painUrination: false,
    painIntercourse: false,
    bumpsSores: false,
    itching: false,
    lowerAbdominalPain: false,
    newPartner: false,
    unprotected: false,
    pastSTI: false,
    partnerDiagnosed: false,
  });

  const [nailFungus, setNailFungus] = useState({
    discoloration: false,
    brittleness: false,
    distortion: false,
    debris: false,
    athleteFoot: false,
    communalShower: false,
  });

  const [signature, setSignature] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const temp = document.createElement('canvas');
      temp.width = canvas.width;
      temp.height = canvas.height;
      const tempCtx = temp.getContext('2d');
      const ctx = canvas.getContext('2d');
      if (ctx && tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = 160 * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.drawImage(temp, 0, 0, rect.width, 160);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const point =
      'touches' in e
        ? e.touches[0]
        : (e as React.MouseEvent<HTMLCanvasElement>);
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawing.current = true;
    lastPoint.current = getCanvasPoint(e);
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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
    ctx.lineCap = 'round';
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
  };

  type UploadKind =
    | 'insurance-traditional-front'
    | 'insurance-traditional-back'
    | 'insurance-advantage-front'
    | 'insurance-advantage-back'
    | 'insurance-medicaid-front'
    | 'insurance-medicaid-back'
    | 'id-front'
    | 'id-back';

  const handleFileUpload = async (file: File, kind: UploadKind) => {
    if (!user || !file) return;
    setUploading((u) => ({ ...u, [kind]: true }));
    try {
      const path = `consent-uploads/${user.uid}/${kind}-${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPatient((p) => {
        const updates: Partial<typeof p> = {};
        if (kind === 'insurance-traditional-front') updates.insuranceTraditionalCardUrlFront = url;
        else if (kind === 'insurance-traditional-back') updates.insuranceTraditionalCardUrlBack = url;
        else if (kind === 'insurance-advantage-front') updates.insuranceAdvantageCardUrlFront = url;
        else if (kind === 'insurance-advantage-back') updates.insuranceAdvantageCardUrlBack = url;
        else if (kind === 'insurance-medicaid-front') updates.insuranceMedicaidCardUrlFront = url;
        else if (kind === 'insurance-medicaid-back') updates.insuranceMedicaidCardUrlBack = url;
        else if (kind === 'id-front') updates.idCardUrlFront = url;
        else if (kind === 'id-back') updates.idCardUrlBack = url;
        return { ...p, ...updates };
      });
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading((u) => ({ ...u, [kind]: false }));
    }
  };

  const captureSignatureDataUrl = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    try {
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const signatureImageDataUrl = captureSignatureDataUrl();
      const payload = {
        submittedAt: serverTimestamp(),
        submittedByUid: user.uid,
        collectorName: collectorName.trim() || null,
        patient,
        respiratory,
        uti,
        sti,
        nailFungus,
        signature,
        signatureImageDataUrl,
        consentChecked,
        sendToGoogleDrive: true,
      };
      await addDoc(collection(db, 'consentSubmissions'), payload);
      setSubmitted(true);
    } catch (err) {
      console.error('Submit failed', err);
      alert('Failed to submit consent form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <p className="text-black/60 mb-6">Please sign in to access the Sally Health Consent Form.</p>
        <Navbar />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Navbar />
        <div className="bg-white rounded-3xl p-12 shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Consent submitted</h1>
          <p className="text-black/50 mb-6">Your Sally Health consent form has been received. A copy has been sent to Google Drive.</p>
          <Link
            to="/consent-submissions"
            className="inline-block text-orange-600 font-medium hover:underline"
          >
            View all submissions →
          </Link>
        </div>
      </div>
    );
  }

  const checkbox = (state: Record<string, boolean>, setState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>, key: string, label: string) => (
    <label key={key} className="flex items-center gap-3 py-1.5">
      <input
        type="checkbox"
        checked={state[key] || false}
        onChange={(e) => setState((s) => ({ ...s, [key]: e.target.checked }))}
        className="w-4 h-4 text-orange-600 border-black/20 rounded focus:ring-orange-500"
      />
      <span className="text-sm">{label}</span>
    </label>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-20">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header bar */}
          <div className="h-2 bg-orange-600" />
          <div className="px-6 sm:px-10 py-8">
            <div className="flex items-center gap-3 mb-4">
              <img src="/sally-health-badge.png" alt="Sally Health" className="w-14 h-14 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Sally Health Consent Form</h1>
                <p className="text-sm text-slate-500 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <p className="text-slate-600 -mt-2">
              This form is to obtain your consent for chronic care management and ongoing care services at Sally Health.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-10">
              {/* Collector info */}
              <section>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">Collector information</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Collector name</label>
                  <input
                    type="text"
                    value={collectorName}
                    onChange={(e) => setCollectorName(e.target.value)}
                    placeholder="Name of person collecting this form"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">A copy of this form will be sent to Google Drive.</p>
                </div>
              </section>
              {/* Patient info */}
              <section>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">Patient information</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
                    <input
                      type="text"
                      required
                      value={patient.fullName}
                      onChange={(e) => setPatient((p) => ({ ...p, fullName: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
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
                      value={patient.dateOfBirth}
                      onChange={(e) => setPatient((p) => ({ ...p, dateOfBirth: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
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
                      type="text"
                      value={patient.address}
                      onChange={(e) => setPatient((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Street address"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 mb-2"
                    />
                    <div className="grid gap-2 grid-cols-3">
                      <input
                        type="text"
                        value={patient.city}
                        onChange={(e) => setPatient((p) => ({ ...p, city: e.target.value }))}
                        placeholder="City"
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                      />
                      <input
                        type="text"
                        value={patient.state}
                        onChange={(e) => setPatient((p) => ({ ...p, state: e.target.value }))}
                        placeholder="State"
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                      />
                      <input
                        type="text"
                        value={patient.zip}
                        onChange={(e) => setPatient((p) => ({ ...p, zip: e.target.value }))}
                        placeholder="ZIP"
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <input
                      type="text"
                      value={patient.country}
                      onChange={(e) => setPatient((p) => ({ ...p, country: e.target.value }))}
                      className="w-full mt-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  {/* Driver license – front and back */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Driver license / State ID</label>
                    <p className="text-xs text-slate-500 mb-2">Upload both front and back of your driver license or state ID.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Front</label>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!!uploading['id-front']}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'id-front');
                          }}
                          className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50 hover:file:bg-slate-100"
                        />
                        {uploading['id-front'] && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
                        {patient.idCardUrlFront && !uploading['id-front'] && (
                          <div className="mt-2">
                            <img src={patient.idCardUrlFront} alt="ID front" className="h-20 w-auto rounded border border-slate-200 object-cover" />
                            <p className="mt-1 text-xs text-emerald-600">Front uploaded.</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Back</label>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!!uploading['id-back']}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'id-back');
                          }}
                          className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50 hover:file:bg-slate-100"
                        />
                        {uploading['id-back'] && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
                        {patient.idCardUrlBack && !uploading['id-back'] && (
                          <div className="mt-2">
                            <img src={patient.idCardUrlBack} alt="ID back" className="h-20 w-auto rounded border border-slate-200 object-cover" />
                            <p className="mt-1 text-xs text-emerald-600">Back uploaded.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-4">Insurance</label>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={patient.insuranceTraditional}
                            onChange={(e) => setPatient((p) => ({ ...p, insuranceTraditional: e.target.checked }))}
                            className="w-4 h-4 text-orange-600 rounded"
                          />
                          <span className="text-sm">Medicare (traditional)</span>
                        </label>
                        <input
                          type="text"
                          value={patient.insuranceTraditionalId}
                          onChange={(e) => setPatient((p) => ({ ...p, insuranceTraditionalId: e.target.value }))}
                          placeholder="Medicare ID number"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-2"
                        />
                        <label className="block text-xs font-medium text-slate-500 mb-1">Insurance card – front</label>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!!uploading['insurance-traditional-front']}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'insurance-traditional-front');
                          }}
                          className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50 hover:file:bg-slate-100 mb-1"
                        />
                        {uploading['insurance-traditional-front'] && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
                        {patient.insuranceTraditionalCardUrlFront && !uploading['insurance-traditional-front'] && (
                          <div className="mt-2">
                            <img src={patient.insuranceTraditionalCardUrlFront} alt="Insurance front" className="h-16 w-auto rounded border border-slate-200 object-cover" />
                            <p className="mt-1 text-xs text-emerald-600">Front uploaded.</p>
                          </div>
                        )}
                        <label className="block text-xs font-medium text-slate-500 mb-1 mt-2">Insurance card – back</label>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!!uploading['insurance-traditional-back']}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'insurance-traditional-back');
                          }}
                          className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50 hover:file:bg-slate-100"
                        />
                        {uploading['insurance-traditional-back'] && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
                        {patient.insuranceTraditionalCardUrlBack && !uploading['insurance-traditional-back'] && (
                          <div className="mt-2">
                            <img src={patient.insuranceTraditionalCardUrlBack} alt="Insurance back" className="h-16 w-auto rounded border border-slate-200 object-cover" />
                            <p className="mt-1 text-xs text-emerald-600">Back uploaded.</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={patient.insuranceAdvantage}
                            onChange={(e) => setPatient((p) => ({ ...p, insuranceAdvantage: e.target.checked }))}
                            className="w-4 h-4 text-orange-600 rounded"
                          />
                          <span className="text-sm">Medicare (Advantage)</span>
                        </label>
                        <input
                          type="text"
                          value={patient.insuranceAdvantageId}
                          onChange={(e) => setPatient((p) => ({ ...p, insuranceAdvantageId: e.target.value }))}
                          placeholder="Medicare Advantage ID number"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-2"
                        />
                        <label className="block text-xs font-medium text-slate-500 mb-1">Insurance card – front</label>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!!uploading['insurance-advantage-front']}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'insurance-advantage-front');
                          }}
                          className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50 hover:file:bg-slate-100 mb-1"
                        />
                        {uploading['insurance-advantage-front'] && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
                        {patient.insuranceAdvantageCardUrlFront && !uploading['insurance-advantage-front'] && (
                          <div className="mt-2">
                            <img src={patient.insuranceAdvantageCardUrlFront} alt="Insurance front" className="h-16 w-auto rounded border border-slate-200 object-cover" />
                            <p className="mt-1 text-xs text-emerald-600">Front uploaded.</p>
                          </div>
                        )}
                        <label className="block text-xs font-medium text-slate-500 mb-1 mt-2">Insurance card – back</label>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!!uploading['insurance-advantage-back']}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'insurance-advantage-back');
                          }}
                          className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50 hover:file:bg-slate-100"
                        />
                        {uploading['insurance-advantage-back'] && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
                        {patient.insuranceAdvantageCardUrlBack && !uploading['insurance-advantage-back'] && (
                          <div className="mt-2">
                            <img src={patient.insuranceAdvantageCardUrlBack} alt="Insurance back" className="h-16 w-auto rounded border border-slate-200 object-cover" />
                            <p className="mt-1 text-xs text-emerald-600">Back uploaded.</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={patient.insuranceMedicaid}
                            onChange={(e) => setPatient((p) => ({ ...p, insuranceMedicaid: e.target.checked }))}
                            className="w-4 h-4 text-orange-600 rounded"
                          />
                          <span className="text-sm">Medicaid (optional)</span>
                        </label>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Medicaid provider</label>
                            <select
                              value={patient.insuranceMedicaidProvider}
                              onChange={(e) => setPatient((p) => ({ ...p, insuranceMedicaidProvider: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="">Select provider</option>
                              <option value="Aetna">Aetna</option>
                              <option value="BCBS">BCBS (Blue Cross Blue Shield)</option>
                              <option value="Humana">Humana</option>
                              <option value="United">United Healthcare</option>
                              <option value="UnitedCare">United Care Health</option>
                            </select>
                          </div>
                          <input
                            type="text"
                            value={patient.insuranceMedicaidId}
                            onChange={(e) => setPatient((p) => ({ ...p, insuranceMedicaidId: e.target.value }))}
                            placeholder="Medicaid ID number"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Medicaid card – front</label>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={!!uploading['insurance-medicaid-front']}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file, 'insurance-medicaid-front');
                                }}
                                className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50 hover:file:bg-slate-100"
                              />
                              {uploading['insurance-medicaid-front'] && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
                              {patient.insuranceMedicaidCardUrlFront && !uploading['insurance-medicaid-front'] && (
                                <div className="mt-2">
                                  <img src={patient.insuranceMedicaidCardUrlFront} alt="Medicaid front" className="h-16 w-auto rounded border border-slate-200 object-cover" />
                                  <p className="mt-1 text-xs text-emerald-600">Front uploaded.</p>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Medicaid card – back</label>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={!!uploading['insurance-medicaid-back']}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file, 'insurance-medicaid-back');
                                }}
                                className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50 hover:file:bg-slate-100"
                              />
                              {uploading['insurance-medicaid-back'] && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
                              {patient.insuranceMedicaidCardUrlBack && !uploading['insurance-medicaid-back'] && (
                                <div className="mt-2">
                                  <img src={patient.insuranceMedicaidCardUrlBack} alt="Medicaid back" className="h-16 w-auto rounded border border-slate-200 object-cover" />
                                  <p className="mt-1 text-xs text-emerald-600">Back uploaded.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Appointment</label>
                    <input
                      type="datetime-local"
                      value={patient.appointment}
                      onChange={(e) => setPatient((p) => ({ ...p, appointment: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </section>

              {/* Respiratory Panel */}
              <section className="pt-6 border-t border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-1">Symptoms Screening Questionnaire</h2>
                <h3 className="text-base font-medium text-slate-700 mb-2">Respiratory Panel Screening</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Used to identify candidates for Flu, COVID-19, RSV, and other respiratory pathogen testing.
                </p>
                <p className="text-sm font-medium text-slate-700 mb-2">Current symptoms (check all that apply)</p>
                <div className="grid gap-1 sm:grid-cols-2">
                  {checkbox(respiratory, setRespiratory, 'fever', 'Fever (> 100.4°F/38°C) or chills')}
                  {checkbox(respiratory, setRespiratory, 'cough', 'Cough (new or worsening)')}
                  {checkbox(respiratory, setRespiratory, 'shortnessOfBreath', 'Shortness of breath or difficulty breathing')}
                  {checkbox(respiratory, setRespiratory, 'congestion', 'Congestion or runny nose')}
                  {checkbox(respiratory, setRespiratory, 'fatigue', 'Fatigue / muscle or body aches')}
                  {checkbox(respiratory, setRespiratory, 'lossOfTasteSmell', 'New loss of taste or smell')}
                </div>
                <p className="text-sm font-medium text-slate-700 mt-4 mb-2">Risk factors & history</p>
                <div className="space-y-1">
                  {checkbox(respiratory, setRespiratory, 'closeContact', 'Close contact with someone diagnosed with COVID-19, Flu, or RSV in the last 14 days?')}
                  {checkbox(respiratory, setRespiratory, 'compromisedImmune', 'Do you have a compromised immune system?')}
                </div>
                <p className="text-xs text-slate-500 mt-3 italic">
                  Provider note: If patient checks 2+ symptoms or has 1 symptom + exposure, order Respiratory Pathogen Panel (RPP).
                </p>
              </section>

              {/* UTI */}
              <section className="pt-6 border-t border-slate-200">
                <h3 className="text-base font-medium text-slate-700 mb-2">Urinary Tract Infection (UTI) Screening</h3>
                <p className="text-sm text-slate-600 mb-4">Used to identify candidates for Urinalysis and Urine Culture/PCR.</p>
                <p className="text-sm font-medium text-slate-700 mb-2">Current symptoms (check all that apply)</p>
                <div className="space-y-1">
                  {checkbox(uti, setUti, 'dysuria', 'Dysuria (burning or pain when urinating)')}
                  {checkbox(uti, setUti, 'urgency', 'Urinary urgency')}
                  {checkbox(uti, setUti, 'pelvicPain', 'Pelvic pain (women) or rectal pain (men)')}
                </div>
                <p className="text-sm font-medium text-slate-700 mt-3 mb-2">Risk factors</p>
                {checkbox(uti, setUti, 'catheter', 'Use of a urinary catheter?')}
              </section>

              {/* STI */}
              <section className="pt-6 border-t border-slate-200">
                <h3 className="text-base font-medium text-slate-700 mb-2">Sexually Transmitted Infection (STI) Screening</h3>
                <p className="text-sm text-slate-600 mb-4">Used to identify candidates for Chlamydia, Gonorrhea, Trichomonas, Mycoplasma, etc.</p>
                <p className="text-sm font-medium text-slate-700 mb-2">Current symptoms (check all that apply)</p>
                <div className="grid gap-1 sm:grid-cols-2">
                  {checkbox(sti, setSti, 'discharge', 'Unusual discharge from penis, vagina, or anus')}
                  {checkbox(sti, setSti, 'painUrination', 'Pain or burning during urination')}
                  {checkbox(sti, setSti, 'painIntercourse', 'Pain during sexual intercourse')}
                  {checkbox(sti, setSti, 'bumpsSores', 'Bumps, blisters, sores, or warts on or around genitals/mouth')}
                  {checkbox(sti, setSti, 'itching', 'Itching or irritation in the genital area')}
                  {checkbox(sti, setSti, 'lowerAbdominalPain', 'Lower abdominal pain')}
                </div>
                <p className="text-sm font-medium text-slate-700 mt-4 mb-2">Risk factors (lookback 6–12 months)</p>
                <div className="space-y-1">
                  {checkbox(sti, setSti, 'newPartner', 'New sexual partner or multiple partners?')}
                  {checkbox(sti, setSti, 'unprotected', 'Unprotected intercourse (vaginal, anal, or oral)?')}
                  {checkbox(sti, setSti, 'pastSTI', 'Past history of STIs?')}
                  {checkbox(sti, setSti, 'partnerDiagnosed', 'Partner recently diagnosed with an STI?')}
                </div>
                <p className="text-xs text-slate-500 mt-3 italic">
                  Provider note: If patient is symptomatic OR high risk (even if asymptomatic), order Comprehensive STI Panel.
                </p>
              </section>

              {/* Nail fungus */}
              <section className="pt-6 border-t border-slate-200">
                <h3 className="text-base font-medium text-slate-700 mb-2">Nail Fungus (Onychomycosis) Screening</h3>
                <p className="text-sm text-slate-600 mb-4">Used to identify candidates for Fungal Culture or PCR testing.</p>
                <p className="text-sm font-medium text-slate-700 mb-2">Visual assessment (check all that apply)</p>
                <div className="space-y-1">
                  {checkbox(nailFungus, setNailFungus, 'discoloration', 'Discoloration: nails white, yellow, or brown')}
                  {checkbox(nailFungus, setNailFungus, 'brittleness', 'Brittleness: nails crumbly, ragged, or brittle')}
                  {checkbox(nailFungus, setNailFungus, 'distortion', 'Distortion: nails misshapen or lifting from nail bed')}
                  {checkbox(nailFungus, setNailFungus, 'debris', 'Debris under the nail')}
                </div>
                <p className="text-sm font-medium text-slate-700 mt-3 mb-2">History</p>
                <div className="space-y-1">
                  {checkbox(nailFungus, setNailFungus, 'athleteFoot', 'History of Athlete\'s Foot (Tinea Pedis)?')}
                  {checkbox(nailFungus, setNailFungus, 'communalShower', 'Visited a communal shower/pool or nail salon recently?')}
                </div>
                <p className="text-xs text-slate-500 mt-3 italic">
                  Provider note: If patient exhibits thickening + discoloration, order Nail Fungal Pathogen Panel.
                </p>
              </section>

              <p className="text-xs text-slate-500 border-t border-slate-200 pt-6">
                This screening tool is for informational and intake purposes only and does not constitute a medical diagnosis. All testing decisions should be made by a licensed healthcare professional.
              </p>

              {/* Consent to treat */}
              <section className="pt-6 border-t border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Consent To Treat & Test</h2>
                <div className="text-sm text-slate-700 space-y-3">
                  <p>
                    I hereby authorize Sally Health providers & its designated Laboratory Oakcrest Laboratories Services INC, to collect and perform laboratory tests on specimens (e.g., blood, urine, saliva, etc.) obtained from me as ordered by my physician / authorized healthcare provider. I understand that the purpose of this testing is for diagnostic, screening, monitoring, or treatment purposes, and the results will be used by my healthcare provider during my medical care.
                  </p>
                  <p>
                    I understand that all test results and personal health information will be handled in accordance with HIPAA and applicable privacy laws. My results will only be shared with my ordering provider and others as authorized by me or as required by law.
                  </p>
                  <p>
                    I understand that this consent is voluntary. I understand the collection procedure may involve discomfort & bruising. I may ask questions about the procedure before it is performed and may refuse testing or withdraw my consent at any time before the procedure, without affecting my right to future care or treatment.
                  </p>
                  <p>
                    The lab may bill my insurance directly for services rendered. I may be responsible for any deductibles, co-payments, or non-covered services. If I am uninsured or choose not to use insurance, I may be responsible for payment in full.
                  </p>
                  <p>
                    I have read and fully understand the information provided above. I have had the opportunity to ask questions, and all my questions have been answered to my satisfaction. By signing below, I voluntarily consent to the laboratory services described. I acknowledge that I have read and understand the information about chronic care management, laboratory testing and give my consent to receive care at Sally Health.
                  </p>
                </div>
                <div className="mt-8 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Signature (full legal name)</label>
                    <input
                      type="text"
                      required
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="Type your full legal name"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      You can also sign below. Typed name is captured as your legal signature.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Signature surface</label>
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
                      onClick={clearSignatureCanvas}
                      className="mt-2 text-xs text-slate-600 hover:text-slate-900 underline"
                    >
                      Clear signature
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <input type="text" readOnly value={patient.fullName} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input type="email" readOnly value={patient.email} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600" />
                    </div>
                  </div>
                  <label className="flex items-start gap-3 mt-4">
                    <input
                      type="checkbox"
                      required
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-1 w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-slate-700">I have read and agree to the consent above.</span>
                  </label>
                </div>
              </section>

              <div className="pt-8">
                <button
                  type="submit"
                  disabled={submitting || !signature || !consentChecked}
                  className="w-full py-4 bg-orange-600 text-white rounded-xl font-semibold text-lg hover:bg-orange-700 focus:ring-4 focus:ring-orange-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={24} /> : 'Submit consent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConsentForm;
