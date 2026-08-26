import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Dropdown from '../../components/auth/Dropdown';
import { useAuth } from '../../context/AuthContext';
import { labService } from '../../services/labService';

const LabSettings = () => {
  const { fetchUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [notifications, setNotifications] = useState({ email: true, sms: true, push: true, labResults: true });

  useEffect(() => {
    labService
      .getAccount()
      .then((res) => {
        const data = res?.data;
        setPreferredLanguage(data?.preferredLanguage || 'en');
        setNotifications({
          email: data?.notificationSettings?.email !== false,
          sms: data?.notificationSettings?.sms !== false,
          push: data?.notificationSettings?.push !== false,
          labResults: data?.notificationSettings?.labResults !== false
        });
      })
      .catch(() => toast.error('Unable to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await labService.updateSettings({ preferredLanguage, notificationSettings: notifications });
      await fetchUser();
      toast.success('Settings saved');
    } catch {
      toast.error('Unable to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="py-12 text-center text-sm text-ink-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-[640px] animate-fade-up">
      <h1 className="text-2xl font-bold text-ink-900">Settings</h1>
      <form onSubmit={onSubmit} className="mt-5 space-y-4 rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
        <Dropdown
          label="Language"
          value={preferredLanguage}
          onChange={setPreferredLanguage}
          options={[
            { value: 'en', label: 'English' },
            { value: 'lg', label: 'Luganda' },
            { value: 'sw', label: 'Kiswahili' }
          ]}
        />
        {Object.entries(notifications).map(([key, value]) => (
          <label key={key} className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3 text-sm">
            <span className="capitalize font-semibold text-ink-900">{key.replace(/([A-Z])/g, ' $1')}</span>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => setNotifications((p) => ({ ...p, [key]: e.target.checked }))}
              className="h-4 w-4 rounded border-ink-300 text-brand-500"
            />
          </label>
        ))}
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          <Save size={16} /> {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
};

export default LabSettings;
