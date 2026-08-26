import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Dropdown from '../../components/auth/Dropdown';
import { useAuth } from '../../context/AuthContext';
import { insuranceService } from '../../services/insuranceService';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'lg', label: 'Luganda' },
  { value: 'sw', label: 'Kiswahili' },
  { value: 'rn', label: 'Runyankore' }
];

const Toggle = ({ checked, onChange, label, hint }) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border border-ink-100 px-4 py-3">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-ink-900">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink-500">{hint}</p> : null}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
        checked ? 'bg-brand-500' : 'bg-ink-200'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  </div>
);

const InsuranceSettings = () => {
  const { fetchUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await insuranceService.getAccount();
        const data = res?.data;
        if (!mounted || !data) return;
        setPreferredLanguage(data.preferredLanguage || 'en');
        setNotifications({
          email: data.notificationSettings?.email !== false,
          sms: data.notificationSettings?.sms !== false,
          push: data.notificationSettings?.push !== false
        });
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to load settings');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await insuranceService.updateSettings({ preferredLanguage, notificationSettings: notifications });
      await fetchUser();
      toast.success('Settings saved');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="py-12 text-center text-sm text-ink-500">Loading settings…</p>;
  }

  return (
    <div className="mx-auto max-w-[640px] animate-fade-up">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Settings</h1>
      <p className="mt-1 text-sm text-ink-500">Language and notification preferences.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4 rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
        <Dropdown
          label="Preferred language"
          value={preferredLanguage}
          onChange={setPreferredLanguage}
          options={LANGUAGE_OPTIONS}
        />
        <Toggle
          label="Email notifications"
          hint="Member and claim alerts by email"
          checked={notifications.email}
          onChange={(v) => setNotifications((p) => ({ ...p, email: v }))}
        />
        <Toggle
          label="SMS notifications"
          hint="Urgent claim texts"
          checked={notifications.sms}
          onChange={(v) => setNotifications((p) => ({ ...p, sms: v }))}
        />
        <Toggle
          label="Push notifications"
          hint="In-app alerts while signed in"
          checked={notifications.push}
          onChange={(v) => setNotifications((p) => ({ ...p, push: v }))}
        />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
};

export default InsuranceSettings;
