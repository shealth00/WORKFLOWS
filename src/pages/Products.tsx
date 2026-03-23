import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { TEMPLATES } from '../data/templates';
import { ChevronRight } from 'lucide-react';

/** Features with routes; null href means "coming soon" */
const FEATURES = [
  { name: 'Teams', href: '/settings' },
  { name: 'Prefill forms', href: '/workspace' },
  { name: 'Secure forms', href: '/settings' },
  { name: 'Form notifications', href: null },
  { name: 'Online payments', href: null },
  { name: 'Assign forms', href: null },
  { name: 'HIPAA forms', href: '/consent' },
  { name: 'Widgets', href: null },
];

export default function Products() {
  const navigate = useNavigate();
  const [showComingSoon, setShowComingSoon] = useState(false);

  const productTiles = TEMPLATES.map((t) => ({
    ...t,
    label: t.name.replace(' Templates', ''),
  }));

  const aiProduct = TEMPLATES.find((t) => t.id === 'ai-agents');

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="mt-1 text-slate-500">Build forms, workflows, documents, and more.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr,280px] gap-10">
          {/* PRODUCTS */}
          <div className="space-y-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {productTiles.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => navigate(product.path)}
                  className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all text-left"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 shadow-sm"
                    style={{ backgroundColor: product.color }}
                  >
                    {product.icon}
                  </div>
                  <span className="font-medium text-slate-800 text-sm">{product.label}</span>
                </button>
              ))}
            </div>

            {/* AI Agents highlight */}
            {aiProduct && (
              <button
                type="button"
                onClick={() => navigate(aiProduct.path)}
                className="w-full flex items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:from-violet-700 hover:to-purple-800 transition-all shadow-lg text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                    {aiProduct.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI Agent Templates</h3>
                    <p className="text-white/80 text-sm mt-0.5">Automate with AI assistants</p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium flex items-center gap-1">
                  Discover now
                  <ChevronRight className="w-4 h-4" />
                </span>
              </button>
            )}
          </div>

          {/* FEATURES */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Features</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
              {FEATURES.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() =>
                    f.href ? navigate(f.href) : setShowComingSoon(true)
                  }
                  className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition-colors text-sm font-medium w-full text-left"
                >
                  {f.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => navigate('/templates')}
                className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors text-sm font-medium w-full text-left"
              >
                See more features
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Coming soon toast */}
      {showComingSoon && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-slate-800 text-white rounded-xl shadow-lg text-sm font-medium flex items-center gap-2"
          role="alert"
        >
          Coming soon. Contact support@sallyhealth.org to request early access.
          <button
            type="button"
            onClick={() => setShowComingSoon(false)}
            className="ml-3 text-orange-400 hover:text-orange-300 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
