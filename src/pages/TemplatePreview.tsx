import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, FileText, ListChecks } from 'lucide-react';
import Navbar from '../components/Navbar';
import { db, collection, addDoc, serverTimestamp } from '../firebase';
import { useAuth } from '../AuthContext';
import { TEMPLATES } from '../data/templates';
import { getTemplate, TEMPLATE_TYPE_LABELS, type TemplateType } from '../data/templateLibrary';

const VALID_TYPES: TemplateType[] = [
  'forms', 'card-forms', 'workflows', 'table', 'pdf', 'sign', 'ai-agents', 'app', 'board', 'store'
];

function isValidType(type: string): type is TemplateType {
  return VALID_TYPES.includes(type as TemplateType);
}

export default function TemplatePreview() {
  const { type, templateId } = useParams<{ type: string; templateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  if (!type || !templateId || !isValidType(type)) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-500 mb-6">Template not found.</p>
          <button onClick={() => navigate('/templates')} className="text-orange-600 font-medium hover:underline">
            Back to Templates
          </button>
        </main>
      </div>
    );
  }

  const template = getTemplate(type, templateId);
  const categoryMeta = TEMPLATES.find((t) => t.path === `/templates/${type}`);

  if (!template) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-500 mb-6">Template not found.</p>
          <button onClick={() => navigate(`/templates/${type}`)} className="text-orange-600 font-medium hover:underline">
            Back to {TEMPLATE_TYPE_LABELS[type]}
          </button>
        </main>
      </div>
    );
  }

  const handleUseTemplate = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const uid = () => Math.random().toString(36).slice(2, 11);
      const fields = template.fields?.length
        ? template.fields.map((f) => ({ ...f, id: uid() }))
        : [];
      const newForm = {
        title: template.name,
        description: template.description || '',
        ownerId: user.uid,
        fields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPublished: false,
      };
      const docRef = await addDoc(collection(db, 'forms'), newForm);
      navigate(`/builder/${docRef.id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to create from template.');
    } finally {
      setCreating(false);
    }
  };

  const title = TEMPLATE_TYPE_LABELS[type];

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <button
          onClick={() => navigate(`/templates/${type}`)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {title}
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 sm:p-8">
            {categoryMeta && (
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                  style={{ backgroundColor: categoryMeta.color }}
                >
                  {categoryMeta.icon}
                </div>
                <span className="text-sm font-medium text-slate-500">{title}</span>
              </div>
            )}
            <h1 className="text-2xl font-bold text-slate-900">{template.name}</h1>
            <p className="mt-2 text-slate-600">{template.description}</p>

            {template.fields && template.fields.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Fields</h2>
                <ul className="space-y-2">
                  {template.fields.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 text-slate-700">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{f.label}</span>
                      {f.required && <span className="text-red-500 text-xs">Required</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {template.steps && template.steps.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Steps</h2>
                <ol className="space-y-2">
                  {template.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700">
                      <span className="flex w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-medium items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-sm text-slate-500">
                  Using this template will create a new form. You can add fields and customize it in the builder.
                </p>
              </div>
            )}

            {!template.fields?.length && !template.steps?.length && (
              <p className="mt-6 text-slate-500 text-sm">
                Using this template will create a new item in your workspace. Customize it in the builder.
              </p>
            )}

            <div className="mt-10 pt-8 border-t border-slate-200">
              <button
                type="button"
                onClick={handleUseTemplate}
                disabled={creating}
                className="w-full py-4 bg-orange-600 text-white rounded-xl font-semibold text-lg hover:bg-orange-700 focus:ring-4 focus:ring-orange-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="animate-spin w-6 h-6" /> : 'Use template'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
