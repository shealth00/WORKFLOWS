/**
 * Consent Submissions – view submitted Sally Health consent forms with document previews.
 */
import React, { useState, useEffect } from 'react';
import { db, collection, query, orderBy, onSnapshot, where } from '../firebase';
import { useAuth } from '../AuthContext';
import { isAdminUser } from '../utils/isAdminUser';
import Navbar from '../components/Navbar';
import { Loader2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface ConsentSubmission {
  id: string;
  submittedAt?: { toDate: () => Date };
  submittedByUid: string;
  collectorName?: string | null;
  patient: {
    fullName: string;
    email: string;
    dateOfBirth?: string;
    phone?: string;
    idCardUrlFront?: string;
    idCardUrlBack?: string;
    insuranceTraditionalCardUrlFront?: string;
    insuranceTraditionalCardUrlBack?: string;
    insuranceAdvantageCardUrlFront?: string;
    insuranceAdvantageCardUrlBack?: string;
    insuranceMedicaidCardUrlFront?: string;
    insuranceMedicaidCardUrlBack?: string;
  };
  googleDriveFileId?: string;
  googleDriveError?: string;
}

const ConsentSubmissions: React.FC = () => {
  const { user, profile } = useAuth();
  const [submissions, setSubmissions] = useState<ConsentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const admin = isAdminUser(user.email ?? null, profile);
    const q = admin
      ? query(collection(db, 'consentSubmissions'), orderBy('submittedAt', 'desc'))
      : query(
          collection(db, 'consentSubmissions'),
          where('submittedByUid', '==', user.uid),
          orderBy('submittedAt', 'desc')
        );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ConsentSubmission[];
      setSubmissions(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, profile]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <p className="text-black/60 mb-6">Please sign in to view consent submissions.</p>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-20">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Consent Submissions</h1>
          <p className="mt-2 text-slate-600">Submitted Sally Health consent forms and uploaded documents.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-orange-600" size={40} />
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No submissions yet</h2>
            <p className="text-slate-500">Consent forms will appear here after patients submit.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => {
              const isExpanded = expandedId === sub.id;
              const p = (sub.patient ?? {
                fullName: 'Unknown',
                email: '',
              }) as ConsentSubmission['patient'];
              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">{p.fullName || 'Unknown'}</p>
                        <p className="text-sm text-slate-500">
                          {sub.collectorName && `Collector: ${sub.collectorName} · `}
                          {sub.submittedAt?.toDate
                            ? format(sub.submittedAt.toDate(), 'MMM d, yyyy h:mm a')
                            : '—'}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        {p.idCardUrlFront && <img src={p.idCardUrlFront} alt="" className="h-8 w-10 rounded object-cover border border-slate-200" />}
                        {p.idCardUrlBack && <img src={p.idCardUrlBack} alt="" className="h-8 w-10 rounded object-cover border border-slate-200" />}
                        {p.insuranceMedicaidCardUrlFront && <img src={p.insuranceMedicaidCardUrlFront} alt="" className="h-8 w-10 rounded object-cover border border-slate-200" />}
                        {p.insuranceMedicaidCardUrlBack && <img src={p.insuranceMedicaidCardUrlBack} alt="" className="h-8 w-10 rounded object-cover border border-slate-200" />}
                        {!p.idCardUrlFront && !p.idCardUrlBack && !p.insuranceMedicaidCardUrlFront && !p.insuranceMedicaidCardUrlBack && (
                          <span className="text-xs text-slate-400">No docs</span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase mb-1">Patient</p>
                          <p className="text-slate-800">{p.fullName}</p>
                          <p className="text-sm text-slate-600">{p.email}</p>
                          {p.phone && <p className="text-sm text-slate-600">{p.phone}</p>}
                          {p.dateOfBirth && <p className="text-sm text-slate-600">DOB: {p.dateOfBirth}</p>}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase mb-1">Google Drive</p>
                          {sub.googleDriveFileId ? (
                            <a
                              href={`https://drive.google.com/file/d/${sub.googleDriveFileId}/view`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:underline text-sm"
                            >
                              View in Drive ↗
                            </a>
                          ) : sub.googleDriveError ? (
                            <p className="text-amber-600 text-sm">{sub.googleDriveError}</p>
                          ) : (
                            <p className="text-slate-500 text-sm">Pending sync</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Driver License / State ID</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                          {p.idCardUrlFront && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Front</p>
                              <a href={p.idCardUrlFront} target="_blank" rel="noopener noreferrer">
                                <img src={p.idCardUrlFront} alt="ID front" className="h-24 w-auto rounded border border-slate-200 object-cover hover:opacity-90" />
                              </a>
                            </div>
                          )}
                          {p.idCardUrlBack && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Back</p>
                              <a href={p.idCardUrlBack} target="_blank" rel="noopener noreferrer">
                                <img src={p.idCardUrlBack} alt="ID back" className="h-24 w-auto rounded border border-slate-200 object-cover hover:opacity-90" />
                              </a>
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Medicaid Card</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                          {p.insuranceMedicaidCardUrlFront && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Front</p>
                              <a href={p.insuranceMedicaidCardUrlFront} target="_blank" rel="noopener noreferrer">
                                <img src={p.insuranceMedicaidCardUrlFront} alt="Medicaid front" className="h-24 w-auto rounded border border-slate-200 object-cover hover:opacity-90" />
                              </a>
                            </div>
                          )}
                          {p.insuranceMedicaidCardUrlBack && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Back</p>
                              <a href={p.insuranceMedicaidCardUrlBack} target="_blank" rel="noopener noreferrer">
                                <img src={p.insuranceMedicaidCardUrlBack} alt="Medicaid back" className="h-24 w-auto rounded border border-slate-200 object-cover hover:opacity-90" />
                              </a>
                            </div>
                          )}
                          {!p.insuranceMedicaidCardUrlFront && !p.insuranceMedicaidCardUrlBack && (
                            <p className="text-slate-400 text-sm col-span-2">No Medicaid card uploaded</p>
                          )}
                        </div>
                        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Other Insurance (Medicare)</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {p.insuranceTraditionalCardUrlFront && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Insurance Front</p>
                              <a href={p.insuranceTraditionalCardUrlFront} target="_blank" rel="noopener noreferrer">
                                <img src={p.insuranceTraditionalCardUrlFront} alt="Insurance front" className="h-24 w-auto rounded border border-slate-200 object-cover hover:opacity-90" />
                              </a>
                            </div>
                          )}
                          {p.insuranceTraditionalCardUrlBack && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Insurance Back</p>
                              <a href={p.insuranceTraditionalCardUrlBack} target="_blank" rel="noopener noreferrer">
                                <img src={p.insuranceTraditionalCardUrlBack} alt="Insurance back" className="h-24 w-auto rounded border border-slate-200 object-cover hover:opacity-90" />
                              </a>
                            </div>
                          )}
                          {p.insuranceAdvantageCardUrlFront && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Medicare Adv. Front</p>
                              <a href={p.insuranceAdvantageCardUrlFront} target="_blank" rel="noopener noreferrer">
                                <img src={p.insuranceAdvantageCardUrlFront} alt="Insurance front" className="h-24 w-auto rounded border border-slate-200 object-cover hover:opacity-90" />
                              </a>
                            </div>
                          )}
                          {p.insuranceAdvantageCardUrlBack && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Medicare Adv. Back</p>
                              <a href={p.insuranceAdvantageCardUrlBack} target="_blank" rel="noopener noreferrer">
                                <img src={p.insuranceAdvantageCardUrlBack} alt="Insurance back" className="h-24 w-auto rounded border border-slate-200 object-cover hover:opacity-90" />
                              </a>
                            </div>
                          )}
                        </div>
                        {!p.idCardUrlFront && !p.idCardUrlBack && !p.insuranceTraditionalCardUrlFront && !p.insuranceTraditionalCardUrlBack && !p.insuranceAdvantageCardUrlFront && !p.insuranceAdvantageCardUrlBack && !p.insuranceMedicaidCardUrlFront && !p.insuranceMedicaidCardUrlBack && (
                          <p className="text-slate-500 text-sm">No document uploads</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ConsentSubmissions;
