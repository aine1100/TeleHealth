import React, { useState } from 'react';
import { LifeBuoy, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput, TextTextarea } from '../../components/auth/FormFields';
import Dropdown from '../../components/auth/Dropdown';
import { useAuth } from '../../context/AuthContext';
import { pharmacyService } from '../../services/pharmacyService';

const CATEGORIES = [
  { value: 'general', label: 'General question' },
  { value: 'inventory', label: 'Inventory & catalog' },
  { value: 'orders', label: 'Prescription orders' },
  { value: 'billing', label: 'Fees & payouts' },
  { value: 'technical', label: 'Technical issue' },
  { value: 'account', label: 'Account access' }
];

const FAQ = [
  {
    q: 'How do I add medicines with photos?',
    a: 'Open Inventory → Add medicine, fill in the details, then use Choose file to upload a product image.'
  },
  {
    q: 'How do patients send prescriptions?',
    a: 'Patients and doctors pick your pharmacy from the directory and choose delivery or pickup. New orders appear under Prescription orders.'
  },
  {
    q: 'Where do I set delivery fees?',
    a: 'Use Pharmacy profile to update delivery, pickup, fees, opening hours, and store contact details.'
  }
];

const PharmacySupport = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', category: 'general' });

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || form.message.trim().length < 10) {
      toast.error('Add a subject and a short message');
      return;
    }
    setSubmitting(true);
    try {
      await pharmacyService.submitSupport({
        subject: form.subject.trim(),
        message: form.message.trim(),
        category: form.category
      });
      toast.success('Request submitted');
      setForm({ subject: '', message: '', category: 'general' });
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
        <p className="mt-1 text-sm text-ink-500">Help for pharmacies on Alive Health UG.</p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 text-brand-600">
              <LifeBuoy size={18} />
              <h2 className="text-sm font-bold text-ink-900">Quick help</h2>
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
              <p className="text-sm font-semibold">Direct email</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-ink-600">
              Prefer email? Write to{' '}
              <a href="mailto:support@alivehealth.ug" className="font-semibold text-brand-600 hover:text-brand-700">
                support@alivehealth.ug
              </a>
              .
            </p>
          </section>
        </div>

        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-brand-600" />
            <h2 className="text-sm font-bold text-ink-900">Contact support</h2>
          </div>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div className="rounded-xl border border-ink-100 bg-ink-50/50 px-3.5 py-3 text-xs text-ink-600">
              <span className="font-semibold text-ink-800">From</span>
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
              placeholder="Describe what you need help with…"
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

export default PharmacySupport;
