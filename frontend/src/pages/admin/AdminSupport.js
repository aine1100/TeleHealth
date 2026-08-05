import React, { useState } from 'react';
import { LifeBuoy, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput, TextTextarea } from '../../components/auth/FormFields';
import Dropdown from '../../components/auth/Dropdown';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';

const CATEGORIES = [
  { value: 'operations', label: 'Operations' },
  { value: 'security', label: 'Security' },
  { value: 'engineering', label: 'Engineering / bugs' },
  { value: 'partners', label: 'Partner escalations' },
  { value: 'general', label: 'General' }
];

const FAQ = [
  {
    q: 'Where do support messages go?',
    a: 'Messages from admin, clinics, and doctors are emailed to the platform support inbox (SUPPORT_EMAIL).'
  },
  {
    q: 'How do I approve a clinic?',
    a: 'Open Approvals or Clinics, open the organization, then Approve or Reject with optional notes.'
  },
  {
    q: 'Why is a facility pending?',
    a: 'New organizations start pending until a super admin reviews registration details and documents.'
  }
];

const AdminSupport = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', category: 'operations' });

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || form.message.trim().length < 10) {
      toast.error('Add a subject and a short message');
      return;
    }
    setSubmitting(true);
    try {
      await adminService.submitSupport({
        subject: form.subject.trim(),
        message: form.message.trim(),
        category: form.category
      });
      toast.success('Request submitted');
      setForm({ subject: '', message: '', category: 'operations' });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[960px] animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Support</h1>
        <p className="mt-1 text-sm text-ink-500">
          Super admin help, escalations, and platform operations contact.
        </p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 text-brand-600">
              <LifeBuoy size={18} />
              <h2 className="text-sm font-bold text-ink-900">Platform notes</h2>
            </div>
            <ul className="mt-4 space-y-3">
              {FAQ.map((item) => (
                <li key={item.q} className="rounded-xl border border-ink-100 bg-ink-50/40 px-3.5 py-3">
                  <p className="text-sm font-semibold text-ink-900">{item.q}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-500">{item.a}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
            <div className="flex items-center gap-2 text-brand-700">
              <Mail size={16} />
              <p className="text-sm font-semibold">Support inbox</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-ink-600">
              Configure <span className="font-semibold">SUPPORT_EMAIL</span> on the server to receive portal
              support tickets. Without SMTP, messages are logged in the backend console.
            </p>
          </section>
        </div>

        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-brand-600" />
            <h2 className="text-sm font-bold text-ink-900">Send internal request</h2>
          </div>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div className="rounded-xl border border-ink-100 bg-ink-50/50 px-3.5 py-3 text-xs text-ink-600">
              <span className="font-semibold text-ink-800">Admin</span>
              <br />
              {user?.firstName} {user?.lastName} · {user?.email}
            </div>
            <Dropdown
              label="Category"
              value={form.category}
              onChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
              options={CATEGORIES}
              placeholder="Select category"
            />
            <TextInput
              label="Subject"
              name="subject"
              value={form.subject}
              onChange={onChange}
              required
              placeholder="Brief summary"
            />
            <TextTextarea
              label="Message"
              name="message"
              value={form.message}
              onChange={onChange}
              required
              rows={6}
              placeholder="Describe the escalation or note…"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-600 disabled:opacity-60 sm:w-auto sm:min-w-[160px]"
            >
              {submitting ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AdminSupport;
