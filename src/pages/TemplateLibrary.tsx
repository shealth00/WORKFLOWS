import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, ListChecks } from 'lucide-react';
import Navbar from '../components/Navbar';
import { TEMPLATES } from '../data/templates';
import { getTemplateList, TEMPLATE_TYPE_LABELS, type TemplateType, type MarketplaceTemplate } from '../data/templateLibrary';

const VALID_TYPES: TemplateType[] = [
  'forms', 'card-forms', 'workflows', 'table', 'pdf', 'sign', 'ai-agents', 'app', 'board', 'store'
];

function isValidType(type: string): type is TemplateType {
  return VALID_TYPES.includes(type as TemplateType);
}

export default function TemplateLibrary() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  if (!type || !isValidType(type)) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-500 mb-6">Category not found.</p>
          <button onClick={() => navigate('/templates')} className="text-orange-600 font-medium hover:underline">
            Back to Templates
          </button>
        </main>
      </div>
    );
  }

  const categoryMeta = TEMPLATES.find((t) => t.path === `/templates/${type}`);
  const list = getTemplateList(type);
  const title = TEMPLATE_TYPE_LABELS[type];

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <button
          onClick={() => navigate('/templates')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Templates
        </button>

        <div className="flex items-center gap-4 mb-10">
          {categoryMeta && (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-md"
              style={{ backgroundColor: categoryMeta.color }}
            >
              {categoryMeta.icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="text-slate-500 mt-0.5">Choose a template to get started</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => navigate(`/templates/${type}/${template.id}`)}
              className="group flex flex-col items-stretch p-5 bg-white border border-slate-200 rounded-xl text-left hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors shrink-0">
                  {template.fields ? <FileText className="w-5 h-5" /> : <ListChecks className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                    {template.name}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{template.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {list.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            No templates in this category yet.
          </div>
        )}
      </main>
    </div>
  );
}
