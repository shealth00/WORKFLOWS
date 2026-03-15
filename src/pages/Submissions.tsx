import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, collection, query, orderBy, onSnapshot, doc, getDoc } from '../firebase';
import { useAuth } from '../AuthContext';
import { FormDefinition, Submission } from '../types';
import Navbar from '../components/Navbar';
import { Loader2, ArrowLeft, Download, Table as TableIcon, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';

const Submissions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

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
    };

    fetchForm();

    const q = query(
      collection(db, 'forms', id, 'submissions'),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Submission[];
      setSubmissions(subsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user, navigate]);

  const exportToCSV = () => {
    if (!form || submissions.length === 0) return;
    
    const headers = ['Submitted At', ...form.fields.map(f => f.label)];
    const rows = submissions.map(sub => [
      format(sub.submittedAt?.toDate() || new Date(), 'yyyy-MM-dd HH:mm:ss'),
      ...form.fields.map(f => sub.data[f.id] || '')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${form.title}_submissions.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-black/5 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{form.title}</h1>
              <p className="text-black/50">{submissions.length} submissions total</p>
            </div>
          </div>
          
          <button 
            onClick={exportToCSV}
            disabled={submissions.length === 0}
            className="flex items-center gap-2 bg-white border border-black/10 px-6 py-3 rounded-xl font-medium hover:bg-black/5 transition-all shadow-sm disabled:opacity-50"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>

        {submissions.length > 0 ? (
          <div className="bg-white border border-black/5 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-black/5">
                    <th className="px-6 py-4 text-xs font-bold text-black/40 uppercase tracking-widest">Submitted At</th>
                    {form.fields.map(field => (
                      <th key={field.id} className="px-6 py-4 text-xs font-bold text-black/40 uppercase tracking-widest min-w-[150px]">
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {submissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {format(sub.submittedAt?.toDate() || new Date(), 'MMM d, yyyy HH:mm')}
                      </td>
                      {form.fields.map(field => (
                        <td key={field.id} className="px-6 py-4 text-sm text-black/70">
                          {Array.isArray(sub.data[field.id]) 
                            ? sub.data[field.id].join(', ') 
                            : String(sub.data[field.id] || '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-black/10 rounded-3xl p-20 text-center">
            <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart2 className="text-black/20" size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">No submissions yet</h2>
            <p className="text-black/50 max-w-sm mx-auto">
              Share your form link to start collecting responses.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Submissions;
