/**
 * Patient Portal – patient-facing view showing only this patient's data.
 * Unique to the logged-in user. No admin or staff views.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db, collection, query, where, orderBy, onSnapshot } from '../firebase';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';
import { Loader2, FileText, ClipboardCheck, ChevronRight, UserCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { PatientProfile, PatientProfilesPayload } from '../types/patientDirectory';
import { findMatchingDirectoryProfiles } from '../utils/patientProfileMatch';
import { fetchServerPatientDirectoryPayload, loadBrowserImportedDirectory } from '../utils/patientDirectoryBrowserImport';

interface ConsentSubmission {
  id: string;
  submittedAt?: { toDate: () => Date };
  patient?: { fullName?: string; email?: string };
}

interface PrecisionRecord {
  id: string;
  createdAt?: { toDate: () => Date };
  patient?: { fullName?: string; name?: string };
  results?: { score?: number; decision?: string };
}

const PatientPortal: React.FC = () => {
  const { user } = useAuth();
  const [consentSubmissions, setConsentSubmissions] = useState<ConsentSubmission[]>([]);
  const [precisionScreenings, setPrecisionScreenings] = useState<PrecisionRecord[]>([]);
  const [precisionDiagnostics, setPrecisionDiagnostics] = useState<PrecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [directoryProfiles, setDirectoryProfiles] = useState<PatientProfile[]>([]);
  const [directoryMeta, setDirectoryMeta] = useState<{ generatedAt?: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubs: (() => void)[] = [];

    const qConsent = query(
      collection(db, 'consentSubmissions'),
      where('submittedByUid', '==', user.uid),
      orderBy('submittedAt', 'desc')
    );
    unsubs.push(
      onSnapshot(qConsent, (snap) => {
        setConsentSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ConsentSubmission)));
      })
    );

    const qScreening = query(
      collection(db, 'precisionScreenings'),
      where('createdByUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    unsubs.push(
      onSnapshot(qScreening, (snap) => {
        setPrecisionScreenings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PrecisionRecord)));
      })
    );

    const qDiagnostic = query(
      collection(db, 'precisionDiagnosticScreenings'),
      where('createdByUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    unsubs.push(
      onSnapshot(qDiagnostic, (snap) => {
        setPrecisionDiagnostics(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PrecisionRecord)));
      })
    );

    setLoading(false);
    return () => unsubs.forEach((u) => u());
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const imported = loadBrowserImportedDirectory();
      if (imported?.profiles?.length) {
        if (!cancelled) {
          setDirectoryProfiles(imported.profiles);
          setDirectoryMeta({ generatedAt: imported.generatedAt });
        }
        return;
      }
      const { payload } = await fetchServerPatientDirectoryPayload();
      if (!cancelled && payload?.profiles?.length) {
        setDirectoryProfiles(payload.profiles);
        setDirectoryMeta({ generatedAt: payload.generatedAt });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const matchedDirectoryProfiles = useMemo(() => {
    if (!user || directoryProfiles.length === 0) return [];
    const consentFullNames = consentSubmissions
      .map((s) => s.patient?.fullName?.trim())
      .filter((n): n is string => Boolean(n));
    const consentEmails = consentSubmissions
      .map((s) => s.patient?.email?.trim())
      .filter((e): e is string => Boolean(e));
    return findMatchingDirectoryProfiles(user, directoryProfiles, {
      consentFullNames,
      consentEmails,
    });
  }, [user, directoryProfiles, consentSubmissions]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <p className="text-black/60 mb-6">Please sign in to access your Patient Portal.</p>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-20">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <img src="/sally-health-badge.png" alt="Sally Health" className="w-12 h-12 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Patient Portal</h1>
              <p className="text-slate-600">Welcome, {user.displayName || user.email}</p>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-1">Your health records and forms – view only what belongs to you.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-orange-600" size={40} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/consent"
                className="block p-5 bg-white rounded-2xl border border-slate-200 hover:border-orange-200 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 group-hover:text-orange-600 transition-colors">Consent Form</p>
                    <p className="text-xs text-slate-500">Submit a new consent</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </Link>
              <Link
                to="/precision-diagnostic"
                className="block p-5 bg-white rounded-2xl border border-slate-200 hover:border-orange-200 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <ClipboardCheck className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 group-hover:text-orange-600 transition-colors">Precision Diagnostic</p>
                    <p className="text-xs text-slate-500">Complete a screening</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </Link>
            </div>

            {/* Directory profiles matched to this account */}
            {directoryProfiles.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-orange-600" />
                    Your clinic profile
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Information on file when it matches your account or your submitted consents
                    {directoryMeta?.generatedAt &&
                      ` · Directory updated ${new Date(directoryMeta.generatedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="divide-y divide-slate-100">
                  {matchedDirectoryProfiles.length === 0 ? (
                    <div className="px-6 py-8 text-center text-slate-500 text-sm">
                      <p>No matching directory profile yet.</p>
                      <p className="mt-2 text-slate-400">
                        Matches use your sign-in email, display name, phone (if on your account), or the name/email on
                        consent forms you submitted. Add an Email column to the patient spreadsheet
                        for clearer matching.
                      </p>
                    </div>
                  ) : (
                    matchedDirectoryProfiles.map((p) => (
                      <div key={p.id} className="px-6 py-5 space-y-3">
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {p.email && (
                            <div>
                              <dt className="text-slate-500">Email</dt>
                              <dd className="text-slate-800">{p.email}</dd>
                            </div>
                          )}
                          <div>
                            <dt className="text-slate-500">DOB</dt>
                            <dd className="text-slate-800">{p.dob || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">MRN / insurance</dt>
                            <dd className="text-slate-800">{p.mrn || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Phone</dt>
                            <dd className="text-slate-800">{p.phone || '—'}</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-slate-500">Address</dt>
                            <dd className="text-slate-800">{p.address || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Recent visit</dt>
                            <dd className="text-slate-800">{p.recentVisit || '—'}</dd>
                          </div>
                        </dl>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* My consent forms */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-800">My consent forms</h2>
                <p className="text-sm text-slate-500">Consent forms you have submitted</p>
              </div>
              <div className="divide-y divide-slate-100">
                {consentSubmissions.length === 0 ? (
                  <div className="px-6 py-10 text-center text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>No consent forms yet.</p>
                    <Link to="/consent" className="text-orange-600 font-medium hover:underline mt-1 inline-block">
                      Submit one →
                    </Link>
                  </div>
                ) : (
                  consentSubmissions.map((sub) => (
                    <div key={sub.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                      <p className="font-medium text-slate-800">{sub.patient?.fullName || 'Consent form'}</p>
                      <p className="text-xs text-slate-500">
                        Submitted {sub.submittedAt?.toDate ? format(sub.submittedAt.toDate(), 'MMM d, yyyy') : '—'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* My screenings */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-800">My screenings</h2>
                <p className="text-sm text-slate-500">Precision screenings and diagnostics</p>
              </div>
              <div className="divide-y divide-slate-100">
                {precisionScreenings.length === 0 && precisionDiagnostics.length === 0 ? (
                  <div className="px-6 py-10 text-center text-slate-500">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>No screenings yet.</p>
                    <Link to="/precision-diagnostic" className="text-orange-600 font-medium hover:underline mt-1 inline-block">
                      Complete one →
                    </Link>
                  </div>
                ) : (
                  <>
                    {precisionDiagnostics.map((d) => (
                      <div key={d.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                        <p className="font-medium text-slate-800">Precision Diagnostic</p>
                        <p className="text-xs text-slate-500">
                          {d.createdAt?.toDate ? format(d.createdAt.toDate(), 'MMM d, yyyy') : '—'}
                          {d.results?.decision ? ` · ${d.results.decision}` : ''}
                        </p>
                      </div>
                    ))}
                    {precisionScreenings.map((s) => (
                      <div key={s.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                        <p className="font-medium text-slate-800">Precision Screening</p>
                        <p className="text-xs text-slate-500">
                          {s.createdAt?.toDate ? format(s.createdAt.toDate(), 'MMM d, yyyy') : '—'}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientPortal;
