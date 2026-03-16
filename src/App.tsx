/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import ViewForm from './pages/ViewForm';
import Submissions from './pages/Submissions';
import ConsentForm from './pages/ConsentForm';
import Templates from './pages/Templates';
import TemplateLibrary from './pages/TemplateLibrary';
import TemplatePreview from './pages/TemplatePreview';
import Workspace from './pages/Workspace';
import Integrations from './pages/Integrations';
import Products from './pages/Products';
import Register from './pages/Register';
import Login from './pages/Login';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-orange-600" size={40} />
    </div>
  );
  
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
          <Route path="/templates/:type" element={<ProtectedRoute><TemplateLibrary /></ProtectedRoute>} />
          <Route path="/templates/:type/:templateId" element={<ProtectedRoute><TemplatePreview /></ProtectedRoute>} />
          <Route path="/builder/:id" element={<ProtectedRoute><Builder /></ProtectedRoute>} />
          <Route path="/view/:id" element={<ViewForm />} />
          <Route path="/submissions/:id" element={<ProtectedRoute><Submissions /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

