import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import HealthConnect from '../health-connect-client';
import { Activity, Scale, Ruler, RefreshCw, ChevronRight, ShieldCheck, AlertCircle } from 'lucide-react';

const HealthDashboard: React.FC = () => {
  const [steps, setSteps] = useState<any[]>([]);
  const [weight, setWeight] = useState<any[]>([]);
  const [height, setHeight] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('LOADING');
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    const s = await HealthConnect.getStatus();
    setStatus(s.status);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const syncData = async () => {
    setLoading(true);
    try {
      await HealthConnect.requestPermissions();
      const stepsData = await HealthConnect.readSteps();
      const weightData = await HealthConnect.readWeight();
      const heightData = await HealthConnect.readHeight();

      setSteps(stepsData.records);
      setWeight(weightData.records);
      setHeight(heightData.records);
    } catch (error) {
      console.error('Failed to sync health data', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = steps.reduce((acc, curr) => acc + curr.count, 0);
  const latestWeight = weight.length > 0 ? weight[0].weight : null;
  const latestHeight = height.length > 0 ? height[0].height : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Health Connect</h1>
            <p className="text-slate-500">Your vitals synced from Sally Health</p>
          </div>
          <button
            onClick={syncData}
            disabled={loading}
            className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-orange-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            Sync Data
          </button>
        </div>

        {status !== 'SDK_AVAILABLE' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-0.5" size={20} />
            <div>
              <p className="text-amber-900 font-medium">Action Required</p>
              <p className="text-amber-700 text-sm">
                {status === 'SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED'
                  ? 'Please update Health Connect to continue.'
                  : 'Health Connect is not available on this device.'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Steps Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
              <Activity size={24} />
            </div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Weekly Steps</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">{totalSteps.toLocaleString()}</h2>
            <p className="text-slate-400 text-xs mt-2">Last 7 days</p>
          </div>

          {/* Weight Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <Scale size={24} />
            </div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Latest Weight</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">
              {latestWeight ? `${latestWeight.toFixed(1)} kg` : '--'}
            </h2>
            <p className="text-slate-400 text-xs mt-2">From Health Connect</p>
          </div>

          {/* Height Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <Ruler size={24} />
            </div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Height</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">
              {latestHeight ? `${latestHeight.toFixed(2)} m` : '--'}
            </h2>
            <p className="text-slate-400 text-xs mt-2">From profile</p>
          </div>
        </div>

        {/* History / Info */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Privacy & Security</h3>
            <ShieldCheck className="text-emerald-500" size={20} />
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-sm font-medium text-slate-700">Encrypted Data Transfer</span>
              </div>
              <ChevronRight className="text-slate-300" size={18} />
            </div>
            <p className="text-sm text-slate-500 px-2">
              Sally Health uses Health Connect to provide a personalized intake experience. Your data is only stored locally until you choose to share it via a form.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HealthDashboard;
