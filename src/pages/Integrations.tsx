import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../AuthContext';
import { db, doc, getDoc, setDoc, serverTimestamp } from '../firebase';
import { Link2, Zap, Mail, MessageSquare, Database, FileText, X, Check, Loader2 } from 'lucide-react';

const INTEGRATIONS = [
  { id: 'webhook', name: 'Webhooks', description: 'POST submissions to your API', icon: Link2, color: '#6366f1', implemented: true },
  { id: 'zapier', name: 'Zapier', description: 'Connect to 5,000+ apps', icon: Zap, color: '#ff4a00', implemented: false },
  { id: 'slack', name: 'Slack', description: 'Send notifications to channels', icon: MessageSquare, color: '#4a154b', implemented: false },
  { id: 'google-sheets', name: 'Google Sheets', description: 'Sync responses to spreadsheets', icon: Database, color: '#0f9d58', implemented: false },
  { id: 'email', name: 'Email', description: 'Send form data via email', icon: Mail, color: '#ea4335', implemented: false },
  { id: 'pdf', name: 'PDF', description: 'Generate PDFs from submissions', icon: FileText, color: '#dc2626', implemented: false },
];

export default function Integrations() {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'integrations', 'webhook'));
        if (snap.exists() && snap.data()?.url) {
          setWebhookUrl(snap.data().url);
        }
      } catch (e) {
        console.error(e);
      } finally {}
    };
    load();
  }, [user]);

  const handleSaveWebhook = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid, 'integrations', 'webhook'), {
        url: webhookUrl.trim(),
        updatedAt: serverTimestamp(),
      });
      setShowModal(null);
    } catch (e) {
      console.error(e);
      alert('Failed to save webhook URL.');
    } finally {
      setSaving(false);
    }
  };

  const handleIntegrationClick = (id: string, implemented: boolean) => {
    if (implemented && id === 'webhook') {
      setShowModal('webhook');
    } else {
      setShowModal('coming-soon');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Integrations</h1>
          <p className="mt-1 text-slate-500">Connect your forms and workflows to your favorite apps.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {INTEGRATIONS.map(({ id, name, description, icon: Icon, color, implemented }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleIntegrationClick(id, implemented)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-slate-900">{name}</h2>
                      {implemented && id === 'webhook' && webhookUrl.trim() && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{description}</p>
                  </div>
                  <span className="text-slate-400 group-hover:text-slate-600 text-sm">
                    {implemented ? 'Configure' : 'Coming soon'}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-8 text-center text-slate-400 text-sm">
              Contact support@sallyhealth.org to request additional integrations.
            </p>
          </div>
        </div>
      </main>

      {/* Webhook configuration modal */}
      {showModal === 'webhook' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Webhooks</h3>
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              When a form is submitted, we POST the submission data to your URL. Your endpoint will receive a JSON
              payload with formId, submissionId, formTitle, data, results, and submittedAt.
            </p>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-api.com/webhook"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWebhook}
                disabled={saving}
                className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={18} />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coming soon modal */}
      {showModal === 'coming-soon' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-slate-700 font-medium mb-2">Coming soon</p>
            <p className="text-sm text-slate-500 mb-4">
              This integration is on our roadmap. Contact support@sallyhealth.org to request early access.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(null)}
              className="w-full py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700"
            >
                Got it
              </button>
          </div>
        </div>
      )}
    </div>
  );
}
