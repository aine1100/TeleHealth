import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput, TextTextarea } from '../../components/auth/FormFields';

const InsuranceSupport = () => {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    setSending(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      toast.success('Support request sent. Our team will reply by email.');
      setForm({ subject: '', message: '' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-[640px] animate-fade-up">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Support</h1>
      <p className="mt-1 text-sm text-ink-500">Need help with claims, members, or integrations?</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4 rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
        <TextInput
          label="Subject"
          name="subject"
          value={form.subject}
          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          required
        />
        <TextTextarea
          label="Message"
          name="message"
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          rows={5}
          required
        />
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          <Send size={16} />
          {sending ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </div>
  );
};

export default InsuranceSupport;
