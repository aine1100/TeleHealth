import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../components/auth/AuthLayout';
import Dropdown from '../../components/auth/Dropdown';
import StepProgress, { StepActions } from '../../components/auth/StepProgress';
import { Alert, TextInput } from '../../components/auth/FormFields';
import { useAuth } from '../../context/AuthContext';

const STEPS = ['Your account', 'Facility details', 'Location & docs'];

const FACILITY_TYPES = [
  {
    value: 'hospital',
    label: 'Hospital',
    description: 'Multi-department inpatient and outpatient care'
  },
  {
    value: 'clinic',
    label: 'Clinic',
    description: 'Outpatient facility or specialty practice'
  },
  {
    value: 'other',
    label: 'Other facility',
    description: 'Health centre or other licensed provider'
  }
];

const RegisterClinic = () => {
  const navigate = useNavigate();
  const { registerClinic } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    organizationName: '',
    organizationType: 'hospital',
    registrationNumber: '',
    city: '',
    district: '',
    address: '',
    website: ''
  });

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) {
        return 'Please complete all account fields.';
      }
      if (form.password.length < 6) {
        return 'Password must be at least 6 characters.';
      }
    }
    if (step === 1) {
      if (!form.organizationName || !form.organizationType) {
        return 'Facility name and type are required.';
      }
    }
    return '';
  };

  const goNext = () => {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }

    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const {
        organizationName,
        organizationType,
        registrationNumber,
        city,
        district,
        address,
        website,
        ...account
      } = form;

      await registerClinic(
        {
          ...account,
          organizationProfile: {
            organizationName,
            organizationType,
            registrationNumber,
            city,
            district,
            address,
            website,
            contactPerson: `${form.firstName} ${form.lastName}`
          },
          clinicProfile: {
            clinicName: organizationName,
            clinicType: organizationType
          }
        },
        files
      );

      toast.success('Clinic registered. Verify your email to continue.');
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const titles = [
    {
      title: 'Create admin account',
      subtitle: 'This person will manage the facility on Alive Health UG.'
    },
    {
      title: 'Facility details',
      subtitle: 'Tell us about your hospital or clinic.'
    },
    {
      title: 'Location & documents',
      subtitle: 'Where you operate, and optional verification files.'
    }
  ];

  return (
    <AuthLayout
      title={titles[step].title}
      subtitle={titles[step].subtitle}
      panelClassName="max-w-[480px]"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600">
            Log in
          </Link>
        </>
      }
    >
      <StepProgress steps={STEPS} currentStep={step} />
      <Alert>{error}</Alert>

      <form className="space-y-4" onSubmit={onSubmit}>
        {step === 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="First name" required name="firstName" value={form.firstName} onChange={onChange} placeholder="First name" />
              <TextInput label="Last name" required name="lastName" value={form.lastName} onChange={onChange} placeholder="Last name" />
            </div>
            <TextInput label="Work email" required type="email" name="email" value={form.email} onChange={onChange} placeholder="admin@hospital.ug" />
            <TextInput label="Phone" required name="phone" value={form.phone} onChange={onChange} placeholder="+256700000000" />
            <TextInput
              label="Password"
              required
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="Create a password"
              hint="Must be at least 6 characters."
              minLength={6}
            />
            <StepActions showBack={false} nextType="submit" nextLabel="Continue" />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <TextInput
              label="Facility name"
              required
              name="organizationName"
              value={form.organizationName}
              onChange={onChange}
              placeholder="Alive Care Hospital"
            />
            <Dropdown
              label="Facility type"
              required
              value={form.organizationType}
              onChange={(value) => setForm((prev) => ({ ...prev, organizationType: value }))}
              options={FACILITY_TYPES}
              placeholder="Select facility type"
            />
            <TextInput
              label="Registration number"
              name="registrationNumber"
              value={form.registrationNumber}
              onChange={onChange}
              placeholder="MOH / URSB number"
            />
            <StepActions onBack={() => { setError(''); setStep(0); }} nextType="submit" nextLabel="Continue" />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="City" name="city" value={form.city} onChange={onChange} placeholder="Kampala" />
              <TextInput label="District" name="district" value={form.district} onChange={onChange} placeholder="Kampala" />
            </div>
            <TextInput label="Address" name="address" value={form.address} onChange={onChange} placeholder="Street / area" />
            <TextInput label="Website" name="website" value={form.website} onChange={onChange} placeholder="https://" />
            <div>
              <label className="auth-label">Verification documents</label>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                className="auth-input file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
              <p className="mt-1.5 text-xs text-ink-500">
                {files.length
                  ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
                  : 'Upload license or registration docs (optional for now).'}
              </p>
            </div>
            <StepActions
              onBack={() => { setError(''); setStep(1); }}
              nextType="submit"
              nextLabel="Create facility account"
              loading={loading}
            />
          </>
        ) : null}
      </form>
    </AuthLayout>
  );
};

export default RegisterClinic;
