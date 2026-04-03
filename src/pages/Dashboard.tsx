import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { db, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from '../firebase';
import { useAuth } from '../AuthContext';
import { FormDefinition } from '../types';
import Navbar from '../components/Navbar';
import FormCard from '../components/FormCard';
import PatientDirectoryPanel from '../components/PatientDirectoryPanel';
import { Plus, Sparkles, Loader2, FileText, Users } from 'lucide-react';
import { generateFormFromPrompt } from '../geminiService';
import ChatBot from '../components/ChatBot';
import { isAdminUser } from '../utils/isAdminUser';

const WORKSPACE_TAB_KEY = 'tab';
const WORKSPACE_PATIENT_PROFILE_KEY = 'profile';

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const admin = useMemo(() => isAdminUser(user?.email ?? null, profile), [user?.email, profile]);

  const workspaceTab =
    admin && searchParams.get(WORKSPACE_TAB_KEY) === 'patients' ? 'patients' : 'forms';
  const patientProfileId = searchParams.get(WORKSPACE_PATIENT_PROFILE_KEY) ?? undefined;

  const setWorkspaceTab = (tab: 'forms' | 'patients') => {
    if (tab === 'forms') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete(WORKSPACE_TAB_KEY);
        next.delete(WORKSPACE_PATIENT_PROFILE_KEY);
        return next;
      });
    } else {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(WORKSPACE_TAB_KEY, 'patients');
        next.delete(WORKSPACE_PATIENT_PROFILE_KEY);
        return next;
      });
    }
  };
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'forms'),
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FormDefinition[];
      setForms(formsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateNew = async () => {
    if (!user) return;
    const newForm: Partial<FormDefinition> = {
      title: 'Untitled Form',
      description: '',
      ownerId: user.uid,
      fields: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPublished: false
    };
    const docRef = await addDoc(collection(db, 'forms'), newForm);
    window.location.href = `/builder/${docRef.id}`;
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt || !user) return;
    setIsAiGenerating(true);
    try {
      const generated = await generateFormFromPrompt(aiPrompt);
      const newForm: Partial<FormDefinition> = {
        title: generated.title || 'AI Generated Form',
        description: generated.description || '',
        ownerId: user.uid,
        fields: generated.fields || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPublished: false
      };
      const docRef = await addDoc(collection(db, 'forms'), newForm);
      window.location.href = `/builder/${docRef.id}`;
    } catch (error) {
      console.error('AI Generation failed:', error);
      alert('Failed to generate form. Please try again.');
    } finally {
      setIsAiGenerating(false);
      setShowAiModal(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      await deleteDoc(doc(db, 'forms', id));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 shadow-lg">
            F
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Welcome to FormFlow</h1>
          <p className="text-black/60 mb-8">
            The most powerful AI-driven form builder. Create, manage, and analyze forms with ease.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href="/register"
              className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors"
            >
              Create account
            </a>
            <a
              href="/login"
              className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Sign in with email
            </a>
            <a
              href="https://patientportal.sally.health"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-orange-100 text-orange-700 font-semibold rounded-xl hover:bg-orange-200 transition-colors"
            >
              Patient Portal
            </a>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScIkNsHtD9HSG_asDcncc6m-lnDQZmFlqQBwP31r2Lo_6fSKQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-indigo-500 text-indigo-600 font-medium rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Patient intake form
            </a>
          </div>
          <Navbar />
        </div>
      </div>
    );
  }

  const patientListPath = '/workspace?tab=patients';
  const patientProfilePath = (id: string) =>
    `/workspace?${WORKSPACE_TAB_KEY}=patients&${WORKSPACE_PATIENT_PROFILE_KEY}=${encodeURIComponent(id)}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onNewForm={handleCreateNew} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {workspaceTab === 'forms' && (
        <Link
          to="/consent"
          className="block mb-8 p-6 bg-white rounded-2xl shadow-lg border border-slate-200 hover:border-orange-200 hover:shadow-xl transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors">Sally Health Consent Form</h2>
              <p className="text-slate-500 text-sm mt-0.5">Chronic care management &amp; ongoing care services consent</p>
            </div>
            <span className="text-orange-600 font-medium group-hover:translate-x-1 transition-transform">Open →</span>
          </div>
        </Link>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Workspace</h1>
            <p className="text-black/50">
              {admin && workspaceTab === 'patients' ? 'Patient directory (admin)' : 'Your forms and creations'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {admin && (
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setWorkspaceTab('forms')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    workspaceTab === 'forms'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  My forms
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceTab('patients')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    workspaceTab === 'patients'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users size={18} />
                  Patient directory
                </button>
              </div>
            )}
            {workspaceTab === 'forms' && (
            <div className="flex gap-3">
            <button 
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles size={20} />
              AI Generate
            </button>
            <button 
              onClick={handleCreateNew}
              className="flex items-center gap-2 bg-white border border-black/10 px-6 py-3 rounded-xl font-medium hover:bg-black/5 transition-all shadow-sm"
            >
              <Plus size={20} />
              Blank Form
            </button>
            </div>
            )}
          </div>
        </div>

        {admin && workspaceTab === 'patients' && (
          <div className="max-w-3xl mb-12">
            <PatientDirectoryPanel
              profileId={patientProfileId}
              listPath={patientListPath}
              profilePath={patientProfilePath}
              compact
            />
          </div>
        )}

        {workspaceTab === 'forms' && loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-orange-600" size={40} />
          </div>
        ) : workspaceTab === 'forms' && forms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {forms.map(form => (
              <FormCard 
                key={form.id} 
                form={form} 
                onDelete={handleDelete}
                onEdit={(id) => window.location.href = `/builder/${id}`}
                onView={(id) => window.location.href = `/view/${id}`}
                onSubmissions={(id) => window.location.href = `/submissions/${id}`}
              />
            ))}
          </div>
        ) : workspaceTab === 'forms' ? (
          <div className="bg-white border border-dashed border-black/10 rounded-3xl p-20 text-center">
            <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="text-black/20" size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">No forms yet</h2>
            <p className="text-black/50 mb-8 max-w-sm mx-auto">
              Start by creating a new form from scratch or use our AI to generate one for you.
            </p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => setShowAiModal(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all"
              >
                <Sparkles size={20} />
                Try AI Generation
              </button>
            </div>
          </div>
        ) : null}
      </main>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">AI Form Generator</h2>
                  <p className="text-black/50 text-sm">Describe the form you want to create</p>
                </div>
              </div>

              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Create a customer feedback form for a coffee shop with fields for name, rating, and comments."
                className="w-full h-40 p-4 bg-slate-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none mb-6"
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAiModal(false)}
                  className="flex-1 px-6 py-3 border border-black/10 rounded-xl font-medium hover:bg-black/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAiGenerate}
                  disabled={!aiPrompt || isAiGenerating}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Generating...
                    </>
                  ) : (
                    'Generate Form'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ChatBot />
    </div>
  );
};

export default Dashboard;
