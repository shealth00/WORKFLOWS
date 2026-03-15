import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Dashboard from './Dashboard';

/**
 * My Workspace — user's forms and creations. Renders Dashboard (same content).
 */
export default function Workspace() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <Dashboard />;
}
