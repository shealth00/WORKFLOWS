import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Users, ChevronRight, ArrowLeft, Upload, Download, Trash2 } from 'lucide-react';
import type { PatientProfile, PatientProfilesPayload } from '../types/patientDirectory';
import {
  clearBrowserImportedDirectory,
  loadBrowserImportedDirectory,
  saveBrowserImportedDirectory,
  fetchServerPatientDirectoryPayload,
} from '../utils/patientDirectoryBrowserImport';
import { PATIENT_DIRECTORY_CSV_SAMPLE, patientProfilesFromCsv } from '../utils/patientCsv';

function ProfileList({
  profiles,
  usingDemo,
  usingBrowserCsv,
  profileHref,
}: {
  profiles: PatientProfile[];
  usingDemo: boolean;
  usingBrowserCsv: boolean;
  profileHref: (id: string) => string;
}) {
  return (
    <div className="space-y-3">
      {usingBrowserCsv && (
        <p className="text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          Showing profiles from a <strong>CSV file imported in this browser</strong>. Data is stored only on this device;
          other staff browsers and deployed <code className="bg-white px-1 rounded">profiles.json</code> are unchanged.
          Use <strong>Clear import</strong> above to go back to server data, or run{' '}
          <code className="bg-white px-1 rounded">npm run generate:patient-profiles</code> for build-time publishing.
        </p>
      )}
      {usingDemo && !usingBrowserCsv && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Showing demo data. Run <code className="bg-white px-1 rounded">npm run generate:patient-profiles</code> after
          adding spreadsheets under <code className="bg-white px-1 rounded">patient upload/</code>, then rebuild to publish
          imported profiles.
        </p>
      )}
      <ul className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {profiles.map((p) => (
          <li key={p.id}>
            <Link
              to={profileHref(p.id)}
              className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-semibold shrink-0">
                {p.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{p.name}</p>
                <p className="text-sm text-slate-500 truncate">
                  {p.mrn && `${p.mrn} · `}
                  {p.dob && `DOB ${p.dob}`}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface PatientDirectoryPanelProps {
  /** When set, show single-profile detail instead of list. */
  profileId?: string;
  /** Navigate to directory list (e.g. `/patient-directory` or `/workspace?tab=patients`). */
  listPath: string;
  /** Link target for one profile row / detail route. */
  profilePath: (id: string) => string;
  /** Compact heading for embedding under Workspace */
  compact?: boolean;
}

/**
 * Patient directory list, CSV import, and profile detail — shared by `/patient-directory` and admin Workspace tab.
 */
export default function PatientDirectoryPanel({ profileId, listPath, profilePath, compact }: PatientDirectoryPanelProps) {
  const [payload, setPayload] = useState<PatientProfilesPayload | null>(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const [usingBrowserCsv, setUsingBrowserCsv] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reloadDirectory = () => {
    setLoading(true);
    setError(null);
    setImportMessage(null);
    const imported = loadBrowserImportedDirectory();
    if (imported) {
      setPayload(imported);
      setUsingDemo(false);
      setUsingBrowserCsv(true);
      setError(null);
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const { payload: data, usingDemo: demo } = await fetchServerPatientDirectoryPayload();
        setPayload(data);
        setUsingDemo(demo);
        setUsingBrowserCsv(false);
        setError(data ? null : 'No profile data available.');
      } catch {
        setError('Failed to load directory.');
      } finally {
        setLoading(false);
      }
    })();
  };

  useEffect(() => {
    reloadDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const handleCsvSelected = async (file: File | undefined) => {
    if (!file) return;
    setImportMessage(null);
    try {
      const text = await file.text();
      const data = patientProfilesFromCsv(text, file.name);
      saveBrowserImportedDirectory(data);
      setPayload(data);
      setUsingDemo(false);
      setUsingBrowserCsv(true);
      setError(null);
      setImportMessage(`Imported ${data.profiles.length} row(s) from ${file.name}.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not read CSV.';
      setImportMessage(msg);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDownloadSample = () => {
    const blob = new Blob([PATIENT_DIRECTORY_CSV_SAMPLE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patient-directory-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearBrowserImport = () => {
    clearBrowserImportedDirectory();
    setUsingBrowserCsv(false);
    setImportMessage(null);
    reloadDirectory();
  };

  const profiles = payload?.profiles ?? [];
  const profile = profileId ? profiles.find((p) => p.id === profileId) : null;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-6' : ''}>
      {!compact && (
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Patient directory</h1>
            <p className="text-slate-500 text-sm">
              {payload?.count != null ? `${payload.count} profiles` : 'Imported from patient upload'}
              {payload?.generatedAt && ` · Updated ${new Date(payload.generatedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      )}

      {compact && (
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Patient directory</h2>
            <p className="text-slate-500 text-sm">
              {payload?.count != null ? `${payload.count} profiles` : 'Staff directory'}
              {payload?.generatedAt && ` · Updated ${new Date(payload.generatedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      )}

      {!profileId && (
        <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-orange-600" />
            Bulk upload (CSV)
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            <strong>Standard CSV:</strong> Patient Name (required), DOB, MRN / ID, Phone, Address, Recent Visit / Date, Email.{' '}
            <strong>EMR export:</strong> FirstName + LastName, RecordId, DateOfBirth, Email ID, phones, address lines, Date Of Joining — same as files in <code className="bg-slate-100 px-1 rounded">Patient Directory/</code>.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:text-sm file:font-medium"
              onChange={(e) => void handleCsvSelected(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={handleDownloadSample}
              className="inline-flex items-center gap-2 text-sm font-medium text-orange-700 hover:text-orange-800"
            >
              <Download className="w-4 h-4" />
              Download sample CSV
            </button>
            {usingBrowserCsv && (
              <button
                type="button"
                onClick={handleClearBrowserImport}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Clear import
              </button>
            )}
          </div>
          {importMessage && (
            <p className={`mt-3 text-sm ${importMessage.startsWith('Imported') ? 'text-green-800' : 'text-red-700'}`}>
              {importMessage}
            </p>
          )}
        </div>
      )}

      {error && !profileId && (
        <p className="text-slate-600 bg-white border border-slate-200 rounded-xl p-6">{error}</p>
      )}

      {!profileId && profiles.length > 0 && (
        <ProfileList
          profiles={profiles}
          usingDemo={usingDemo}
          usingBrowserCsv={usingBrowserCsv}
          profileHref={profilePath}
        />
      )}

      {profileId && (
        <>
          <Link
            to={listPath}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 text-sm font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to directory
          </Link>
          {!profile ? (
            <p className="text-slate-600">Profile not found.</p>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-xl font-semibold text-slate-900">{profile.name}</h2>
                <p className="text-sm text-slate-500 mt-1">ID: {profile.id}</p>
              </div>
              <dl className="px-6 py-5 space-y-4 text-sm">
                {profile.email && (
                  <div>
                    <dt className="text-slate-500 font-medium">Email</dt>
                    <dd className="text-slate-900">{profile.email}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-slate-500 font-medium">DOB</dt>
                  <dd className="text-slate-900">{profile.dob || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">MRN / insurance</dt>
                  <dd className="text-slate-900">{profile.mrn || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Phone</dt>
                  <dd className="text-slate-900">{profile.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Address</dt>
                  <dd className="text-slate-900 whitespace-pre-wrap">{profile.address || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Recent visit</dt>
                  <dd className="text-slate-900">{profile.recentVisit || '—'}</dd>
                </div>
              </dl>
            </div>
          )}
        </>
      )}
    </div>
  );
}
