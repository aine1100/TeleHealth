import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput } from '../../components/auth/FormFields';
import { useAuth } from '../../context/AuthContext';
import { insuranceService } from '../../services/insuranceService';

const InsuranceProfile = () => {
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
    const load = async () => {
      try {
        setLoading(true);
        const res = await insuranceService.getAccount();
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
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await insuranceService.updateProfile(form);
      await fetchUser();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="py-12 text-center text-sm text-ink-500">Loading profile…</p>;
  }

  return (
    <div className="mx-auto max-w-[720px] animate-fade-up">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Company profile</h1>
      <p className="mt-1 text-sm text-ink-500">How patients see your insurance company on Alive Health.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4 rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
        <TextInput
          label="Company name"
          name="organizationName"
          value={form.organizationName}
          onChange={onChange}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Admin first name" name="firstName" value={form.firstName} onChange={onChange} />
          <TextInput label="Admin last name" name="lastName" value={form.lastName} onChange={onChange} />
          <TextInput label="Phone" name="phone" value={form.phone} onChange={onChange} />
          <TextInput label="Email" name="email" value={form.email} onChange={onChange} disabled />
          <TextInput label="City" name="city" value={form.city} onChange={onChange} />
          <TextInput label="District" name="district" value={form.district} onChange={onChange} />
        </div>
        <TextInput label="Address" name="address" value={form.address} onChange={onChange} />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
};

export default InsuranceProfile;
