import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Dropdown from '../../components/auth/Dropdown';
import { useAuth } from '../../context/AuthContext';
import { clinicService } from '../../services/clinicService';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'lg', label: 'Luganda' },
  { value: 'sw', label: 'Kiswahili' },
  { value: 'rn', label: 'Runyankore' },
  { value: 'luo', label: 'Luo' },
  { value: 'acholi', label: 'Acholi' }
];

const TOGGLE_ITEMS = [
  { key: 'email', label: 'Email notifications', hint: 'Appointment updates and facility alerts by email' },
  { key: 'sms', label: 'SMS notifications', hint: 'Text alerts for time-sensitive events' },
  { key: 'push', label: 'Push notifications', hint: 'In-app alerts when you are signed in' },
  { key: 'appointmentReminders', label: 'Appointment reminders', hint: 'Reminders for upcoming visits at your facility' },
  { key: 'labResults', label: 'Lab result alerts', hint: 'Updates when lab workflows send results' },
  { key: 'medicineReminders', label: 'Medicine reminders', hint: 'Optional pharmacy-related reminders' }
];

const planLabel = (plan) =>
  ({
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
    pay_per_visit: 'Pay per visit'
  }[plan] || plan || '—');

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  trial: 'bg-sky-50 text-sky-700',
  active: 'bg-emerald-50 text-emerald-700',
  suspended: 'bg-rose-50 text-rose-700',
  cancelled: 'bg-ink-100 text-ink-500'
};

const Toggle = ({ checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-ink-100 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/30">
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
  </label>
);

const ClinicSettings = () => {
  const { fetchUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
    appointmentReminders: true,
    medicineReminders: true,
    labResults: true
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await clinicService.getProfile();
      const data = res.data;
      setProfile(data);
      setPreferredLanguage(data.preferredLanguage || 'en');
      setNotifications({
        email: data.notificationSettings?.email !== false,
        sms: data.notificationSettings?.sms !== false,
        push: data.notificationSettings?.push !== false,
        appointmentReminders: data.notificationSettings?.appointmentReminders !== false,
        medicineReminders: data.notificationSettings?.medicineReminders !== false,
        labResults: data.notificationSettings?.labResults !== false
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await clinicService.updateSettings({
        preferredLanguage,
        notificationSettings: notifications
      });
      setProfile(res.data);
      await fetchUser();
      toast.success('Settings saved');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[960px] rounded-2xl border border-ink-200/70 bg-white p-8 text-sm text-ink-500 shadow-card">
        Loading settings…
      </div>
    );
  }

  const seats = profile?.seats || {};
  const used = seats.used ?? 0;

  return (
    <div className="mx-auto max-w-[960px] animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">
          Team size, plan status, language, and notification preferences for your facility.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card">
          <p className="text-xs font-medium text-ink-500">Care team</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">{used}</p>
          <p className="mt-1 text-xs text-ink-500">
            {seats.activeDoctors || 0} active · {seats.pendingInvites || 0} pending invites
          </p>
          <Link
            to="/clinic/doctors"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <Users size={14} />
            Manage doctors
          </Link>
        </div>

        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card">
          <p className="text-xs font-medium text-ink-500">Plan</p>
          <p className="mt-1 text-lg font-bold text-ink-900">{planLabel(profile?.plan)}</p>
          <span
            className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
              statusStyles[profile?.planStatus] || statusStyles.trial
            }`}
          >
            {profile?.planStatus || 'trial'}
          </span>
          <p className="mt-2 text-xs text-ink-500">Contact support to change or upgrade your plan.</p>
        </div>

        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card">
          <p className="text-xs font-medium text-ink-500">Organization access</p>
          <span
            className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
              statusStyles[profile?.verificationStatus] || statusStyles.pending
            }`}
          >
            {profile?.verificationStatus || 'pending'}
          </span>
          <p className="mt-2 text-xs text-ink-500">
            {profile?.isActive ? 'Account is active on Alive Health.' : 'Account is currently inactive.'}
          </p>
        </div>
      </div>

      <form onSubmit={onSave} className="mt-5 space-y-5">
        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Preferred language</h2>
          <p className="mt-1 text-xs text-ink-500">Used for system messages where multi-language is supported.</p>
          <div className="mt-4 max-w-sm">
            <Dropdown
              label="Language"
              value={preferredLanguage}
              onChange={setPreferredLanguage}
              options={LANGUAGE_OPTIONS}
              placeholder="Select language"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Notifications</h2>
          <p className="mt-1 text-xs text-ink-500">Choose how Alive Health reaches this facility account.</p>
          <div className="mt-4 space-y-2">
            {TOGGLE_ITEMS.map((item) => (
              <Toggle
                key={item.key}
                label={item.label}
                hint={item.hint}
                checked={Boolean(notifications[item.key])}
                onChange={(value) => setNotifications((prev) => ({ ...prev, [item.key]: value }))}
              />
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-600 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClinicSettings;
