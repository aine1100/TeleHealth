import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Dropdown from '../../components/auth/Dropdown';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'lg', label: 'Luganda' },
  { value: 'sw', label: 'Kiswahili' },
  { value: 'rn', label: 'Runyankore' },
  { value: 'luo', label: 'Luo' },
  { value: 'acholi', label: 'Acholi' }
];

const TOGGLE_ITEMS = [
  { key: 'email', label: 'Email notifications', hint: 'Account and appointment emails' },
  { key: 'sms', label: 'SMS notifications', hint: 'Text alerts for urgent updates' },
  { key: 'push', label: 'Push notifications', hint: 'In-app alerts while signed in' },
  { key: 'appointmentReminders', label: 'Appointment reminders', hint: 'Reminders before your consults' },
  { key: 'labResults', label: 'Lab result alerts', hint: 'When linked lab results are ready' },
  { key: 'medicineReminders', label: 'Medicine reminders', hint: 'Optional prescription follow-ups' }
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

const DoctorSettings = () => {
  const { fetchUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [isAvailable, setIsAvailable] = useState(true);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
    appointmentReminders: true,
    medicineReminders: true,
    labResults: true
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await doctorService.getAccount();
        const data = res.data;
        if (!mounted) return;
        setPreferredLanguage(data.preferredLanguage || 'en');
        setIsAvailable(data.doctorProfile?.isAvailable !== false);
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
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await doctorService.updateSettings({
        preferredLanguage,
        notificationSettings: notifications,
        isAvailable
      });
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

  return (
    <div className="mx-auto max-w-[960px] animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">Language, availability flag, and how Alive Health notifies you.</p>
      </div>

      <form onSubmit={onSave} className="mt-5 space-y-5">
        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Practice status</h2>
          <div className="mt-4">
            <Toggle
              label="Accept new consultations"
              hint="Matches your schedule page. Off means you stay on the team but hide as available."
              checked={isAvailable}
              onChange={setIsAvailable}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Preferred language</h2>
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

export default DoctorSettings;
