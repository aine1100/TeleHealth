import React, { useState } from 'react';
import { Cpu, HeartPulse, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextTextarea } from '../../components/auth/FormFields';

const PatientScreening = () => {
  const [symptoms, setSymptoms] = useState('');
  const [summary, setSummary] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    if (symptoms.trim().length < 8) {
      toast.error('Describe your symptoms first');
      return;
    }
    setSummary(
      'Share this note with your doctor at booking. This is a pre-visit summary, not a diagnosis. If symptoms are severe, seek emergency care.'
    );
    toast.success('Summary ready');
  };

  return (
    <div className="mx-auto max-w-[960px] animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">AI screening</h1>
        <p className="mt-1 text-sm text-ink-500">Organize symptoms before your consultation. This does not replace a clinician.</p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {[
          { icon: Cpu, title: 'Symptom check', text: 'Write what you feel so your doctor has context.' },
          { icon: ShieldCheck, title: 'Private', text: 'Your note stays on your account until you share it.' },
          { icon: HeartPulse, title: 'Next step', text: 'Use the summary when you book a visit.' }
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <item.icon size={18} />
            </span>
            <p className="mt-3 text-sm font-bold text-ink-900">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-ink-500">{item.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-5 rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
        <TextTextarea
          label="Symptoms"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          rows={6}
          placeholder="e.g. Headache for 2 days, mild fever, no cough…"
        />
        <button
          type="submit"
          className="mt-4 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-600"
        >
          Generate summary
        </button>
        {summary ? (
          <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-ink-700">
            {summary}
          </div>
        ) : null}
      </form>
    </div>
  );
};

export default PatientScreening;
