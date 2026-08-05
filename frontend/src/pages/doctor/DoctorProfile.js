import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput, TextTextarea } from '../../components/auth/FormFields';
import Dropdown from '../../components/auth/Dropdown';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import { specialtyOptions } from '../../data/clinicDashboard';

const CONSULT_TYPES = [
  { id: 'video', label: 'Video' },
  { id: 'chat', label: 'Chat' },
  { id: 'in_person', label: 'In person' }
];

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  specialty: 'General Practice',
  subSpecialty: '',
  licenseNumber: '',
  experience: '',
  hospital: '',
  consultationFee: '25000',
  bio: '',
  languages: '',
  qualifications: '',
  consultationTypes: ['video']
};

const DoctorProfile = () => {
  const { fetchUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [form, setForm] = useState(emptyForm);

  const applyAccount = (data) => {
    const dp = data.doctorProfile || {};
    setEmail(data.email || '');
    setForm({
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      phone: data.phone || '',
      specialty: dp.specialty || 'General Practice',
      subSpecialty: dp.subSpecialty || '',
      licenseNumber: dp.licenseNumber || '',
      experience: dp.experience != null ? String(dp.experience) : '',
      hospital: dp.hospital || '',
      consultationFee: dp.consultationFee != null ? String(dp.consultationFee) : '25000',
      bio: dp.bio || '',
      languages: (dp.languages || []).join(', '),
      qualifications: (dp.qualifications || []).join(', '),
      consultationTypes: dp.consultationTypes?.length ? dp.consultationTypes : ['video']
    });
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await doctorService.getAccount();
        if (mounted) applyAccount(res.data);
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

  const toggleType = (id) => {
    setForm((prev) => {
      const has = prev.consultationTypes.includes(id);
      const next = has
        ? prev.consultationTypes.filter((t) => t !== id)
        : [...prev.consultationTypes, id];
      return { ...prev, consultationTypes: next };
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.consultationTypes.length) {
      toast.error('Select at least one consultation type');
      return;
    }
    setSaving(true);
    try {
      const res = await doctorService.updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        specialty: form.specialty,
        subSpecialty: form.subSpecialty.trim(),
        licenseNumber: form.licenseNumber.trim(),
        experience: form.experience === '' ? undefined : Number(form.experience),
        hospital: form.hospital.trim(),
        consultationFee: Number(form.consultationFee),
        bio: form.bio.trim(),
        languages: form.languages
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        qualifications: form.qualifications
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        consultationTypes: form.consultationTypes
      });
      applyAccount(res.data);
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
        <p className="mt-1 text-sm text-ink-500">
          Consultation fee, specialty, and details shown to clinics and patients.
        </p>
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
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Practice</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Dropdown
              label="Specialty"
              value={form.specialty}
              onChange={(value) => setForm((prev) => ({ ...prev, specialty: value }))}
              options={specialtyOptions}
              placeholder="Select specialty"
            />
            <TextInput
              label="Sub-specialty"
              name="subSpecialty"
              value={form.subSpecialty}
              onChange={onChange}
              placeholder="Optional"
            />
            <TextInput
              label="License number"
              name="licenseNumber"
              value={form.licenseNumber}
              onChange={onChange}
              placeholder="UMD-xxxxx"
            />
            <TextInput
              label="Years of experience"
              name="experience"
              type="number"
              min="0"
              max="80"
              value={form.experience}
              onChange={onChange}
              placeholder="8"
            />
            <TextInput
              label="Hospital / base facility"
              name="hospital"
              value={form.hospital}
              onChange={onChange}
              placeholder="Optional"
            />
            <TextInput
              label="Consultation fee (UGX)"
              name="consultationFee"
              type="number"
              min="0"
              step="500"
              value={form.consultationFee}
              onChange={onChange}
              required
              hint="Amount charged per consultation"
            />
            <div className="sm:col-span-2">
              <p className="auth-label">Consultation types</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {CONSULT_TYPES.map((item) => {
                  const active = form.consultationTypes.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleType(item.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                          : 'bg-ink-100 text-ink-600 hover:bg-ink-200/70'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <TextInput
              label="Languages spoken"
              name="languages"
              value={form.languages}
              onChange={onChange}
              placeholder="English, Luganda"
              hint="Comma-separated"
            />
            <TextInput
              label="Qualifications"
              name="qualifications"
              value={form.qualifications}
              onChange={onChange}
              placeholder="MBChB, MMed"
              hint="Comma-separated"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Bio</h2>
          <div className="mt-4">
            <TextTextarea
              label="About you"
              name="bio"
              value={form.bio}
              onChange={onChange}
              rows={5}
              placeholder="Short professional bio for patients and clinics…"
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

export default DoctorProfile;
