import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput } from '../../components/auth/FormFields';
import { useAuth } from '../../context/AuthContext';
import { labService } from '../../services/labService';

const LabProfile = () => {
  const { fetchUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    organizationName: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: '',
    district: '',
    address: ''
  });

  useEffect(() => {
    let mounted = true;
    labService
      .getAccount()
      .then((res) => {
        const data = res?.data;
        if (!mounted || !data) return;
        setForm({
          organizationName: data.organizationProfile?.organizationName || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          email: data.email || '',
          city: data.city || '',
          district: data.district || '',
          address: data.address || ''
        });
      })
      .catch((error) => toast.error(error?.response?.data?.message || 'Unable to load profile'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await labService.updateProfile(form);
      await fetchUser();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="py-12 text-center text-sm text-ink-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-[720px] animate-fade-up">
      <h1 className="text-2xl font-bold text-ink-900">Lab profile</h1>
      <form onSubmit={onSubmit} className="mt-5 space-y-4 rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
        <TextInput label="Lab name" name="organizationName" value={form.organizationName} onChange={(e) => setForm((p) => ({ ...p, organizationName: e.target.value }))} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="First name" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
          <TextInput label="Last name" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
          <TextInput label="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          <TextInput label="Email" value={form.email} disabled />
          <TextInput label="City" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
          <TextInput label="District" value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} />
        </div>
        <TextInput label="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          <Save size={16} /> {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
};

export default LabProfile;
