import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc, updateDoc, serverTimestamp } from '../firebase';
import { useAuth } from '../AuthContext';
import { FormDefinition, FormField, FormFieldType } from '../types';
import Navbar from '../components/Navbar';
import { 
  Plus, Save, Trash2, Settings, ChevronUp, ChevronDown, 
  Type, Hash, Mail, AlignLeft, List, Radio, CheckSquare, Calendar,
  Eye, ArrowLeft, Loader2, Sparkles
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FIELD_TYPES: { type: FormFieldType; label: string; icon: any }[] = [
  { type: 'text', label: 'Short Text', icon: Type },
  { type: 'textarea', label: 'Long Text', icon: AlignLeft },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'select', label: 'Dropdown', icon: List },
  { type: 'radio', label: 'Single Choice', icon: Radio },
  { type: 'checkbox', label: 'Multiple Choice', icon: CheckSquare },
  { type: 'date', label: 'Date', icon: Calendar },
];

const Builder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;

    const fetchForm = async () => {
      const docRef = doc(db, 'forms', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as FormDefinition;
        if (data.ownerId !== user.uid) {
          navigate('/');
          return;
        }
        setForm({ ...data, id: docSnap.id });
      } else {
        navigate('/');
      }
      setLoading(false);
    };

    fetchForm();
  }, [id, user, navigate]);

  const handleSave = async () => {
    if (!id || !form) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'forms', id), {
        ...form,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save form.');
    } finally {
      setSaving(false);
    }
  };

  const addField = (type: FormFieldType) => {
    if (!form) return;
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
      placeholder: '',
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : undefined
    };
    setForm({
      ...form,
      fields: [...form.fields, newField]
    });
    setActiveFieldId(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    if (!form) return;
    setForm({
      ...form,
      fields: form.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    });
  };

  const removeField = (fieldId: string) => {
    if (!form) return;
    setForm({
      ...form,
      fields: form.fields.filter(f => f.id !== fieldId)
    });
    if (activeFieldId === fieldId) setActiveFieldId(null);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (!form) return;
    const newFields = [...form.fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setForm({ ...form, fields: newFields });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-black/5 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-black/5 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="h-6 w-px bg-black/10"></div>
          <input 
            type="text" 
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="text-lg font-bold bg-transparent border-none focus:ring-0 p-0 outline-none w-64"
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/view/${id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-all"
          >
            <Eye size={18} />
            Preview
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Form
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Field Types */}
        <aside className="w-72 bg-white border-r border-black/5 overflow-y-auto p-6 hidden lg:block">
          <h3 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-6">Add Elements</h3>
          <div className="grid grid-cols-1 gap-3">
            {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
              <button 
                key={type}
                onClick={() => addField(type)}
                className="flex items-center gap-3 p-3 bg-slate-50 border border-black/5 rounded-xl hover:border-orange-200 hover:bg-orange-50 transition-all group text-left"
              >
                <div className="p-2 bg-white rounded-lg border border-black/5 group-hover:text-orange-600 transition-colors">
                  <Icon size={18} />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden mb-8">
              <div className="h-2 bg-orange-600"></div>
              <div className="p-8">
                <input 
                  type="text" 
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Form Title"
                  className="text-3xl font-bold w-full border-none focus:ring-0 p-0 mb-2 outline-none"
                />
                <textarea 
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Form description..."
                  className="text-black/50 w-full border-none focus:ring-0 p-0 outline-none resize-none min-h-[40px]"
                />
              </div>
            </div>

            <div className="space-y-4">
              {form.fields.map((field, index) => (
                <div 
                  key={field.id}
                  onClick={() => setActiveFieldId(field.id)}
                  className={cn(
                    "bg-white rounded-2xl border transition-all cursor-pointer group relative",
                    activeFieldId === field.id ? "border-orange-600 shadow-md ring-1 ring-orange-600" : "border-black/5 hover:border-black/10"
                  )}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <label className="text-sm font-bold text-black/80 flex items-center gap-2">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); moveField(index, 'up'); }} className="p-1 hover:bg-black/5 rounded text-black/40"><ChevronUp size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveField(index, 'down'); }} className="p-1 hover:bg-black/5 rounded text-black/40"><ChevronDown size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }} className="p-1 hover:bg-red-50 rounded text-red-400"><Trash2 size={16} /></button>
                      </div>
                    </div>

                    {field.type === 'textarea' ? (
                      <div className="w-full h-24 bg-slate-50 border border-black/5 rounded-lg"></div>
                    ) : ['select', 'radio', 'checkbox'].includes(field.type) ? (
                      <div className="space-y-2">
                        {field.options?.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-black/60">
                            <div className={cn(
                              "w-4 h-4 border border-black/20",
                              field.type === 'radio' ? "rounded-full" : "rounded"
                            )}></div>
                            {opt}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-10 bg-slate-50 border border-black/5 rounded-lg"></div>
                    )}
                  </div>

                  {activeFieldId === field.id && (
                    <div className="border-t border-black/5 p-4 bg-slate-50 rounded-b-2xl animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-black/40 uppercase mb-1 block">Label</label>
                          <input 
                            type="text" 
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className="w-full p-2 bg-white border border-black/10 rounded-lg text-sm outline-none focus:ring-1 focus:ring-orange-600"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-black/40 uppercase mb-1 block">Placeholder</label>
                          <input 
                            type="text" 
                            value={field.placeholder}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            className="w-full p-2 bg-white border border-black/10 rounded-lg text-sm outline-none focus:ring-1 focus:ring-orange-600"
                          />
                        </div>
                      </div>
                      
                      {field.options && (
                        <div className="mt-4">
                          <label className="text-xs font-bold text-black/40 uppercase mb-1 block">Options (comma separated)</label>
                          <input 
                            type="text" 
                            value={field.options.join(', ')}
                            onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                            className="w-full p-2 bg-white border border-black/10 rounded-lg text-sm outline-none focus:ring-1 focus:ring-orange-600"
                          />
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id={`req-${field.id}`}
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="rounded text-orange-600 focus:ring-orange-600"
                        />
                        <label htmlFor={`req-${field.id}`} className="text-sm font-medium">Required field</label>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button 
              onClick={() => addField('text')}
              className="w-full mt-8 py-4 border-2 border-dashed border-black/10 rounded-2xl text-black/40 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={20} />
              Add New Field
            </button>
          </div>
        </main>

        {/* Right Sidebar: Settings/AI */}
        <aside className="w-80 bg-white border-l border-black/5 overflow-y-auto p-6 hidden xl:block">
          <div className="mb-8">
            <h3 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4">AI Assistant</h3>
            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2">
                <Sparkles size={16} />
                AI Suggestions
              </div>
              <p className="text-xs text-indigo-900/60 mb-4">
                I can help you improve your form fields or suggest new ones.
              </p>
              <button className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
                Analyze Form
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4">Form Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Published</span>
                <button 
                  onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    form.isPublished ? "bg-green-500" : "bg-black/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    form.isPublished ? "left-7" : "left-1"
                  )}></div>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <ChatBot />
    </div>
  );
};

export default Builder;
import ChatBot from '../components/ChatBot';
