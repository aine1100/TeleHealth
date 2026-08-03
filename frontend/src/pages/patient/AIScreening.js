import React from 'react';
import { Cpu, ShieldCheck, HeartPulse } from 'lucide-react';

const AIScreening = () => {
  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[2rem] bg-blue-950 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-300">AI screening</p>
          <h1 className="mt-3 text-3xl font-semibold">Predictive health checks</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-200">Complete an intelligent pre-screening to identify symptoms, risk factors, and next steps.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
            <div className="inline-flex items-center justify-center rounded-3xl bg-blue-50 p-4 text-blue-700">
              <Cpu className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">Smart symptom check</h2>
            <p className="mt-3 text-sm text-slate-600">Use AI to organize your symptoms before your consultation.</p>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
            <div className="inline-flex items-center justify-center rounded-3xl bg-blue-50 p-4 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">Secure guidance</h2>
            <p className="mt-3 text-sm text-slate-600">Your data stays private while the AI suggests care actions.</p>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
            <div className="inline-flex items-center justify-center rounded-3xl bg-blue-50 p-4 text-blue-700">
              <HeartPulse className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">Health insights</h2>
            <p className="mt-3 text-sm text-slate-600">Receive a clear next step summary to share with your doctor.</p>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] bg-white p-8 shadow-sm border border-slate-200 text-center">
          <h2 className="text-2xl font-semibold text-slate-900">Start your AI health screening</h2>
          <p className="mt-3 text-sm text-slate-600">Answer a few questions and get an instant, clinically-informed recommendation.</p>
          <button className="mt-6 rounded-3xl bg-blue-950 px-8 py-4 text-sm font-semibold text-white hover:bg-blue-800 transition">Begin screening</button>
        </div>
      </div>
    </div>
  );
};

export default AIScreening;
