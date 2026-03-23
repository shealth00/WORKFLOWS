import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Dashboard from './Dashboard';
import { Loader2 } from 'lucide-react';

/**
 * My Workspace — user's forms and creations. Renders Dashboard (same content).
 */
export default function Workspace() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-orange-600" size={40} />
        <p className="text-slate-500 text-sm">Loading workspace…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return <Dashboard />;
}
