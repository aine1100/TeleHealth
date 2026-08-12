import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput } from '../../components/auth/FormFields';
import Dropdown from '../../components/auth/Dropdown';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patientService';

const GENDER_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

const BLOOD_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' }
];

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  city: '',
  district: '',
  bloodType: '',
  allergies: '',
  chronicConditions: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelationship: ''
};

const PatientProfile = () => {
  const { fetchUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [form, setForm] = useState(emptyForm);

  const apply = (data) => {
    setEmail(data.email || '');
    setForm({
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      phone: data.phone || '',
      dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth).slice(0, 10) : '',
      gender: data.gender || '',
      address: data.address || '',
      city: data.city || '',
      district: data.district || '',
      bloodType: data.bloodType || '',
      allergies: (data.allergies || []).join(', '),
      chronicConditions: (data.chronicConditions || []).join(', '),
      emergencyName: data.emergencyContact?.name || '',
      emergencyPhone: data.emergencyContact?.phone || '',
      emergencyRelationship: data.emergencyContact?.relationship || ''
    });
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await patientService.getAccount();
        if (mounted) apply(res.data);
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
      const res = await patientService.updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || '',
        address: form.address.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        bloodType: form.bloodType || '',
        allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
        chronicConditions: form.chronicConditions.split(',').map((s) => s.trim()).filter(Boolean),
        emergencyContact: {
          name: form.emergencyName.trim(),
          phone: form.emergencyPhone.trim(),
          relationship: form.emergencyRelationship.trim()
        }
      });
      apply(res.data);
      await fetchUser();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[960px] rounded-2xl border border-ink-200/70 bg-white p-8 text-sm text-ink-500 shadow-card">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px] animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Profile</h1>
        <p className="mt-1 text-sm text-ink-500">Personal and health details used when you book care.</p>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-5">
        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Personal details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextInput label="First name" name="firstName" value={form.firstName} onChange={onChange} required />
            <TextInput label="Last name" name="lastName" value={form.lastName} onChange={onChange} required />
            <div>
              <label className="auth-label">Email</label>
              <input className="auth-input bg-ink-50 text-ink-500" value={email} disabled readOnly />
            </div>
            <TextInput label="Phone" name="phone" value={form.phone} onChange={onChange} required />
            <TextInput label="Date of birth" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={onChange} />
            <Dropdown
              label="Gender"
              value={form.gender}
              onChange={(value) => setForm((prev) => ({ ...prev, gender: value }))}
              options={GENDER_OPTIONS}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Location</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextInput label="Address" name="address" value={form.address} onChange={onChange} />
            </div>
            <TextInput label="City" name="city" value={form.city} onChange={onChange} />
            <TextInput label="District" name="district" value={form.district} onChange={onChange} />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Health</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Dropdown
              label="Blood type"
              value={form.bloodType}
              onChange={(value) => setForm((prev) => ({ ...prev, bloodType: value }))}
              options={BLOOD_OPTIONS}
            />
            <TextInput
              label="Allergies"
              name="allergies"
              value={form.allergies}
              onChange={onChange}
              hint="Comma-separated"
            />
            <div className="sm:col-span-2">
              <TextInput
                label="Chronic conditions"
                name="chronicConditions"
                value={form.chronicConditions}
                onChange={onChange}
                hint="Comma-separated"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Emergency contact</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <TextInput label="Name" name="emergencyName" value={form.emergencyName} onChange={onChange} />
            <TextInput label="Phone" name="emergencyPhone" value={form.emergencyPhone} onChange={onChange} />
            <TextInput
              label="Relationship"
              name="emergencyRelationship"
              value={form.emergencyRelationship}
              onChange={onChange}
            />
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-600 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientProfile;
