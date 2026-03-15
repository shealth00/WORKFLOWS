import React from 'react';
import Navbar from '../components/Navbar';
import { Link2, Zap, Mail, MessageSquare, Database, FileText } from 'lucide-react';

const INTEGRATIONS = [
  { id: 'zapier', name: 'Zapier', description: 'Connect to 5,000+ apps', icon: Zap, color: '#ff4a00' },
  { id: 'slack', name: 'Slack', description: 'Send notifications to channels', icon: MessageSquare, color: '#4a154b' },
  { id: 'google-sheets', name: 'Google Sheets', description: 'Sync responses to spreadsheets', icon: Database, color: '#0f9d58' },
  { id: 'email', name: 'Email', description: 'Send form data via email', icon: Mail, color: '#ea4335' },
  { id: 'webhook', name: 'Webhooks', description: 'POST submissions to your API', icon: Link2, color: '#6366f1' },
  { id: 'pdf', name: 'PDF', description: 'Generate PDFs from submissions', icon: FileText, color: '#dc2626' },
];

export default function Integrations() {
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
              {INTEGRATIONS.map(({ id, name, description, icon: Icon, color }) => (
                <button
                  key={id}
                  type="button"
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-slate-900">{name}</h2>
                    <p className="text-sm text-slate-500">{description}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-8 text-center text-slate-400 text-sm">
              More integrations coming soon. Contact support to request an integration.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
