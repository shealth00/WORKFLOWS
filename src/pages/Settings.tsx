import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../AuthContext';
import { db, collection, query, where, limit, getCountFromServer, getDocs } from '../firebase';
import {
  BarChart3,
  User,
  Link2,
  Zap,
  Mail,
  MessageSquare,
  Database,
  FileText,
  ShoppingBag,
  ChevronRight,
  Loader2,
} from 'lucide-react';

const INTEGRATIONS = [
  { id: 'zapier', name: 'Zapier', description: 'Connect to 5,000+ apps', icon: Zap, color: '#ff4a00' },
  { id: 'slack', name: 'Slack', description: 'Send notifications to channels', icon: MessageSquare, color: '#4a154b' },
  { id: 'google-sheets', name: 'Google Sheets', description: 'Sync responses to spreadsheets', icon: Database, color: '#0f9d58' },
  { id: 'email', name: 'Email', description: 'Send form data via email', icon: Mail, color: '#ea4335' },
  { id: 'webhook', name: 'Webhooks', description: 'POST submissions to your API', icon: Link2, color: '#6366f1' },
  { id: 'pdf', name: 'PDF', description: 'Generate PDFs from submissions', icon: FileText, color: '#dc2626' },
];

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formCount, setFormCount] = useState<number | null>(null);
  const [submissionCount, setSubmissionCount] = useState<number | null>(null);
  const [workflowCount, setWorkflowCount] = useState<number | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        const formsQ = query(
          collection(db, 'forms'),
          where('ownerId', '==', user.uid)
        );
        const formsLimitedQ = query(
          collection(db, 'forms'),
          where('ownerId', '==', user.uid),
          limit(50)
        );
        const [formsSnap, formsDocs] = await Promise.all([
          getCountFromServer(formsQ),
          getDocs(formsLimitedQ)
        ]);
        setFormCount(formsSnap.data().count);

        const formIds = formsDocs.docs.map((d) => d.id);
        const [subCounts, precisionCount, diagnosticCount] = await Promise.all([
          Promise.all(
            formIds.map((formId) =>
              getCountFromServer(collection(db, 'forms', formId, 'submissions'))
            )
          ),
          getCountFromServer(
            query(
              collection(db, 'precisionScreenings'),
              where('createdByUid', '==', user.uid)
            )
          ),
          getCountFromServer(
            query(
              collection(db, 'precisionDiagnosticScreenings'),
              where('createdByUid', '==', user.uid)
            )
          )
        ]);
        const total = subCounts.reduce((sum, s) => sum + s.data().count, 0);
        setSubmissionCount(total);
        setWorkflowCount(precisionCount.data().count + diagnosticCount.data().count);
      } catch (e) {
        console.error('Failed to fetch counts', e);
      } finally {
        setLoadingCounts(false);
      }
    };

    fetchCounts();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="mt-1 text-slate-500">Manage your account, workflows, and integrations.</p>
        </div>

        <div className="space-y-6">
          {/* Workflow counts */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Workflow counts</h2>
                <p className="text-sm text-slate-500">Overview of your forms and creations</p>
              </div>
            </div>
            <div className="p-6">
              {loadingCounts ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-2xl font-bold text-slate-900">{formCount ?? 0}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Forms</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-2xl font-bold text-slate-900">{workflowCount ?? 0}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Screenings</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-2xl font-bold text-slate-900">{submissionCount ?? 0}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Submissions</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-2xl font-bold text-slate-900">—</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Products</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Account accessibility */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Account accessibility</h2>
                <p className="text-sm text-slate-500">Profile and sign-in details</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-14 h-14 rounded-full border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="w-7 h-7 text-slate-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-900">{user?.displayName ?? '—'}</p>
                  <p className="text-sm text-slate-500">{user?.email ?? '—'}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Account is managed via Google sign-in. Sign out and sign in with a different account to switch.
              </p>
            </div>
          </section>

          {/* Integrations */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Integrations</h2>
                  <p className="text-sm text-slate-500">Connect forms to external apps</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/integrations')}
                className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {INTEGRATIONS.slice(0, 6).map(({ id, name, description, icon: Icon, color }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigate('/integrations')}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm">{name}</p>
                      <p className="text-xs text-slate-500 truncate">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Products */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Products</h2>
                  <p className="text-sm text-slate-500">Forms, workflows, documents, and more</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/templates/forms')}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
                >
                  <span className="text-2xl">📄</span>
                  <span className="font-medium text-slate-800 text-sm">Form Templates</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/templates/workflows')}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
                >
                  <span className="text-2xl">🔁</span>
                  <span className="font-medium text-slate-800 text-sm">Workflows</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/templates/ai-agents')}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
                >
                  <span className="text-2xl">🤖</span>
                  <span className="font-medium text-slate-800 text-sm">AI Agents</span>
                </button>
              </div>
            </div>
          </section>

          {/* Store builder */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Store builder</h2>
                  <p className="text-sm text-slate-500">Product catalogs and store templates</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/templates/store')}
                className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                Open store builder <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Create product catalogs and store-style forms from templates. Customize in the builder.
              </p>
              <button
                type="button"
                onClick={() => navigate('/templates/store')}
                className="px-4 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
              >
                Browse store templates
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
