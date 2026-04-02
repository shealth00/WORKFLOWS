import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Loader2, Users, ChevronRight, ArrowLeft } from 'lucide-react';
import type { PatientProfile, PatientProfilesPayload } from '../types/patientDirectory';

function ProfileList({
  profiles,
  usingDemo,
}: {
  profiles: PatientProfile[];
  usingDemo: boolean;
}) {
  return (
    <div className="space-y-3">
      {usingDemo && (
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
              to={`/patient-directory/${encodeURIComponent(p.id)}`}
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

export default function PatientDirectory() {
  const { profileId } = useParams<{ profileId: string }>();
  const [payload, setPayload] = useState<PatientProfilesPayload | null>(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resMain = await fetch('/patient-directory/profiles.json', { cache: 'no-store' });
        const resDemo = await fetch('/patient-directory/profiles.demo.json', { cache: 'no-store' });
        let data: PatientProfilesPayload | null = null;
        let demo = false;
        if (resMain.ok) {
          data = (await resMain.json()) as PatientProfilesPayload;
          if (!data.profiles?.length) data = null;
        }
        if (!data && resDemo.ok) {
          data = (await resDemo.json()) as PatientProfilesPayload;
          demo = true;
        }
        if (!cancelled) {
          setPayload(data);
          setUsingDemo(demo);
          setError(data ? null : 'No profile data available.');
        }
      } catch {
        if (!cancelled) setError('Failed to load directory.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const profiles = payload?.profiles ?? [];
  const profile = profileId ? profiles.find((p) => p.id === profileId) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-orange-600" size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-20">
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

        {error && !profileId && (
          <p className="text-slate-600 bg-white border border-slate-200 rounded-xl p-6">{error}</p>
        )}

        {!profileId && profiles.length > 0 && <ProfileList profiles={profiles} usingDemo={usingDemo} />}

        {profileId && (
          <>
            <Link
              to="/patient-directory"
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
      </main>
    </div>
  );
}
