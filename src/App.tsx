/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Builder = lazy(() => import('./pages/Builder'));
const ViewForm = lazy(() => import('./pages/ViewForm'));
const Submissions = lazy(() => import('./pages/Submissions'));
const ConsentForm = lazy(() => import('./pages/ConsentForm'));
const Templates = lazy(() => import('./pages/Templates'));
const TemplateLibrary = lazy(() => import('./pages/TemplateLibrary'));
const TemplatePreview = lazy(() => import('./pages/TemplatePreview'));
const Workspace = lazy(() => import('./pages/Workspace'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Products = lazy(() => import('./pages/Products'));
const PrecisionScreening = lazy(() => import('./pages/PrecisionScreening'));
const PrecisionDiagnostic = lazy(() => import('./pages/PrecisionDiagnostic'));
const Settings = lazy(() => import('./pages/Settings'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const HealthDashboard = lazy(() => import('./pages/HealthDashboard'));

const PageFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
    <img
      src="/sally-health-badge.png"
      alt="Sally Health"
      className="w-16 h-16 object-contain animate-pulse"
      onError={(e) => e.currentTarget.style.display = 'none'}
    />
    <Loader2 className="animate-spin text-orange-600" size={40} />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <PageFallback />;
  
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
};

/** After sign-in, send users to the Sally Health Consent Form (PDF-like experience). */
function DashboardOrConsent() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/consent" replace />;
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageFallback />}>
          <Routes>
          <Route path="/" element={<DashboardOrConsent />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/workspace" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
          <Route path="/dashboard" element={<Navigate to="/workspace" replace />} />
          <Route path="/consent" element={<ProtectedRoute><ConsentForm /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/precision-screening" element={<ProtectedRoute><PrecisionScreening /></ProtectedRoute>} />
          <Route path="/precision-diagnostic" element={<ProtectedRoute><PrecisionDiagnostic /></ProtectedRoute>} />
          <Route path="/health" element={<ProtectedRoute><HealthDashboard /></ProtectedRoute>} />
          <Route path="/templates/:type" element={<ProtectedRoute><TemplateLibrary /></ProtectedRoute>} />
          <Route path="/templates/:type/:templateId" element={<ProtectedRoute><TemplatePreview /></ProtectedRoute>} />
          <Route path="/builder/:id" element={<ProtectedRoute><Builder /></ProtectedRoute>} />
          <Route path="/view/:id" element={<ViewForm />} />
          <Route path="/submissions/:id" element={<ProtectedRoute><Submissions /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
