import React from 'react';
import Navbar from '../components/Navbar';
import TemplatePanel from '../components/TemplatePanel';

export default function Templates() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Templates</h1>
          <p className="mt-1 text-slate-500">Choose a template to get started quickly.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <TemplatePanel />
        </div>
      </main>
    </div>
  );
}
