import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PatientDirectoryPanel from '../components/PatientDirectoryPanel';
import { useAuth } from '../AuthContext';
import { isAdminUser } from '../utils/isAdminUser';
import { Loader2 } from 'lucide-react';

export default function PatientDirectory() {
  const { profileId } = useParams<{ profileId: string }>();
  const { user, profile, loading } = useAuth();

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

  if (!isAdminUser(user?.email ?? null, profile)) {
    return <Navigate to="/workspace" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-20">
        <PatientDirectoryPanel
          profileId={profileId}
          listPath="/patient-directory"
          profilePath={(id) => `/patient-directory/${encodeURIComponent(id)}`}
        />
      </main>
    </div>
  );
}
