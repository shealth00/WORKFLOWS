import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc, addDoc, collection, serverTimestamp } from '../firebase';
import { FormDefinition } from '../types';
import { Loader2, CheckCircle2, Mic, MicOff, Volume2 } from 'lucide-react';
import { transcribeAudio, generateSpeech } from '../geminiService';

const ViewForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [activeFieldForVoice, setActiveFieldForVoice] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchForm = async () => {
      const docRef = doc(db, 'forms', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setForm({ ...docSnap.data(), id: docSnap.id } as FormDefinition);
      }
      setLoading(false);
    };

    fetchForm();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !form) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'forms', id, 'submissions'), {
        formId: id,
        data: formData,
        submittedAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to submit form.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const startRecording = async (fieldId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          try {
            const transcription = await transcribeAudio(base64Audio);
            handleInputChange(fieldId, transcription);
          } catch (error) {
            console.error('Transcription failed:', error);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setActiveFieldForVoice(fieldId);
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setActiveFieldForVoice(null);
    }
  };

  const speakLabel = async (text: string) => {
    try {
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.play();
      }
    } catch (error) {
      console.error('TTS failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Form not found</h1>
          <p className="text-black/50">The form you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-12 shadow-xl max-w-md w-full text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
          <p className="text-black/50 mb-8">
            Your submission has been received successfully.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all"
          >
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="h-3 bg-orange-600"></div>
          <div className="p-8 sm:p-12">
            <h1 className="text-4xl font-bold mb-4">{form.title}</h1>
            {form.description && <p className="text-black/50 mb-12 text-lg">{form.description}</p>}

            <form onSubmit={handleSubmit} className="space-y-8">
              {form.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-black/80 flex items-center gap-2">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => speakLabel(field.label)}
                        className="p-1.5 text-black/30 hover:text-black/60 transition-colors"
                        title="Listen to label"
                      >
                        <Volume2 size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => activeFieldForVoice === field.id ? stopRecording() : startRecording(field.id)}
                        className={cn(
                          "p-1.5 rounded-lg transition-all",
                          activeFieldForVoice === field.id ? "bg-red-100 text-red-600 animate-pulse" : "text-black/30 hover:text-black/60"
                        )}
                        title="Voice input"
                      >
                        {activeFieldForVoice === field.id ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    </div>
                  </div>

                  {field.type === 'textarea' ? (
                    <textarea 
                      required={field.required}
                      placeholder={field.placeholder}
                      value={formData[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all min-h-[120px]"
                    />
                  ) : ['select', 'radio', 'checkbox'].includes(field.type) ? (
                    <div className="space-y-3">
                      {field.options?.map((opt, i) => (
                        <label key={i} className="flex items-center gap-3 p-4 bg-slate-50 border border-black/5 rounded-2xl cursor-pointer hover:bg-black/5 transition-all">
                          <input 
                            type={field.type === 'checkbox' ? 'checkbox' : 'radio'}
                            name={field.id}
                            required={field.required && field.type !== 'checkbox'}
                            checked={field.type === 'checkbox' ? (formData[field.id] || []).includes(opt) : formData[field.id] === opt}
                            onChange={(e) => {
                              if (field.type === 'checkbox') {
                                const current = formData[field.id] || [];
                                const next = e.target.checked ? [...current, opt] : current.filter((o: string) => o !== opt);
                                handleInputChange(field.id, next);
                              } else {
                                handleInputChange(field.id, opt);
                              }
                            }}
                            className="w-5 h-5 text-orange-600 focus:ring-orange-600 border-black/10"
                          />
                          <span className="text-sm font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input 
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={formData[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    />
                  )}
                </div>
              ))}

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 mt-12"
              >
                {submitting ? <Loader2 className="animate-spin" size={24} /> : 'Submit Response'}
              </button>
            </form>
          </div>
        </div>
        
        <p className="text-center mt-8 text-black/30 text-sm">
          Powered by <span className="font-bold">FormFlow</span>
        </p>
      </div>
    </div>
  );
};

export default ViewForm;

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
