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

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/builder/:id" element={<ProtectedRoute><Builder /></ProtectedRoute>} />
          <Route path="/view/:id" element={<ViewForm />} />
          <Route path="/submissions/:id" element={<ProtectedRoute><Submissions /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

