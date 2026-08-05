import React, { useEffect, useState } from 'react';
import { FileText, ExternalLink, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput } from '../../components/auth/FormFields';
import Dropdown from '../../components/auth/Dropdown';
import { useAuth } from '../../context/AuthContext';
import { clinicService } from '../../services/clinicService';

const FACILITY_TYPES = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'lab', label: 'Lab' },
  { value: 'other', label: 'Other facility' }
];

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700'
};

const planLabel = (plan) =>
  ({
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
    pay_per_visit: 'Pay per visit'
  }[plan] || plan || '—');

const emptyForm = {
  organizationName: '',
  organizationType: 'clinic',
  registrationNumber: '',
  contactPerson: '',
  website: '',
  address: '',
  city: '',
  district: '',
  firstName: '',
  lastName: '',
  phone: ''
};

const ClinicFacilityProfile = () => {
  const { fetchUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      const res = await clinicService.getProfile();
      const data = res.data;
      setProfile(data);
      setForm({
        organizationName: data.organizationName || '',
        organizationType: data.organizationType || 'clinic',
        registrationNumber: data.registrationNumber || '',
        contactPerson: data.contactPerson || '',
        website: data.website || '',
        address: data.address || '',
        city: data.city || '',
        district: data.district || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || ''
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.organizationName.trim()) {
      toast.error('Facility name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await clinicService.updateProfile({
        organizationName: form.organizationName.trim(),
        organizationType: form.organizationType,
        registrationNumber: form.registrationNumber.trim(),
        contactPerson: form.contactPerson.trim(),
        website: form.website.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim()
      });
      setProfile(res.data);
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
        Loading facility profile…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px] animate-fade-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Facility profile</h1>
          <p className="mt-1 text-sm text-ink-500">
            Registration details, location, and admin contact for your facility.
          </p>
        </div>
        {profile ? (
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                statusStyles[profile.verificationStatus] || statusStyles.pending
              }`}
            >
              {profile.verificationStatus}
            </span>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold capitalize text-sky-700">
              {planLabel(profile.plan)} · {profile.planStatus}
            </span>
          </div>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-5">
        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Facility details</h2>
          <p className="mt-1 text-xs text-ink-500">Shown across Alive Health when patients find your doctors.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextInput
                label="Facility name"
                name="organizationName"
                value={form.organizationName}
                onChange={onChange}
                required
                placeholder="Alive Care Hospital"
              />
            </div>
            <Dropdown
              label="Facility type"
              value={form.organizationType}
              onChange={(value) => setForm((prev) => ({ ...prev, organizationType: value }))}
              options={FACILITY_TYPES}
              placeholder="Select type"
            />
            <TextInput
              label="Registration number"
              name="registrationNumber"
              value={form.registrationNumber}
              onChange={onChange}
              placeholder="MOH-XXXXX"
            />
            <TextInput
              label="Contact person"
              name="contactPerson"
              value={form.contactPerson}
              onChange={onChange}
              placeholder="Facility lead"
            />
            <TextInput
              label="Website"
              name="website"
              value={form.website}
              onChange={onChange}
              placeholder="https://"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Location</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextInput
                label="Address"
                name="address"
                value={form.address}
                onChange={onChange}
                placeholder="Street, neighbourhood"
              />
            </div>
            <TextInput label="City" name="city" value={form.city} onChange={onChange} placeholder="Kampala" />
            <TextInput
              label="District"
              name="district"
              value={form.district}
              onChange={onChange}
              placeholder="Kampala"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Admin contact</h2>
          <p className="mt-1 text-xs text-ink-500">
            Account email cannot be changed here. Contact support if you need a new login email.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextInput
              label="First name"
              name="firstName"
              value={form.firstName}
              onChange={onChange}
              required
            />
            <TextInput
              label="Last name"
              name="lastName"
              value={form.lastName}
              onChange={onChange}
              required
            />
            <div>
              <label className="auth-label">Email</label>
              <input className="auth-input bg-ink-50 text-ink-500" value={profile?.email || ''} disabled readOnly />
            </div>
            <TextInput label="Phone" name="phone" value={form.phone} onChange={onChange} required />
          </div>
        </section>

        {profile?.verificationDocuments?.length ? (
          <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-sm font-bold text-ink-900">Verification documents</h2>
            <p className="mt-1 text-xs text-ink-500">Uploaded at registration. Contact support to replace documents.</p>
            <ul className="mt-4 space-y-2">
              {profile.verificationDocuments.map((doc, index) => (
                <li
                  key={`${doc.fileName}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 bg-ink-50/50 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText size={16} className="shrink-0 text-ink-400" />
                    <span className="truncate text-sm font-medium text-ink-800">{doc.fileName || 'Document'}</span>
                  </div>
                  {doc.fileUrl ? (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      View
                      <ExternalLink size={12} />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {profile?.verificationNotes ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Admin notes</p>
            <p className="mt-1">{profile.verificationNotes}</p>
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-600 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClinicFacilityProfile;
