import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import StepProgress, { StepActions } from '../../components/auth/StepProgress';
import { Alert, TextInput } from '../../components/auth/FormFields';
import { useAuth } from '../../context/AuthContext';

const STEPS = ['Your account', 'Lab details', 'Location & docs'];

const RegisterLab = () => {
  const navigate = useNavigate();
  const { registerLab } = useAuth();
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
    registrationNumber: '',
    city: '',
    address: ''
  });

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) {
        return 'Please complete all account fields.';
      }
      if (form.password.length < 6) return 'Password must be at least 6 characters.';
    }
    if (step === 1 && !form.organizationName) {
      return 'Lab name is required.';
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
      const { organizationName, registrationNumber, city, address, ...account } = form;
      await registerLab(
        {
          ...account,
          organizationProfile: {
            organizationName,
            organizationType: 'lab',
            registrationNumber,
            city,
            address,
            contactPerson: `${form.firstName} ${form.lastName}`
          }
        },
        files
      );
      toast.success('Lab registered. Verify your email to continue.');
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const titles = [
    {
      title: 'Create lab account',
      subtitle: 'Set up the admin who will manage this laboratory.'
    },
    {
      title: 'Lab details',
      subtitle: 'Basic information about your laboratory.'
    },
    {
      title: 'Location & documents',
      subtitle: 'Where patients and partners can find you.'
    }
  ];

  return (
    <AuthLayout
      title={titles[step].title}
      subtitle={titles[step].subtitle}
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
            <TextInput label="Email" required type="email" name="email" value={form.email} onChange={onChange} placeholder="lab@example.com" />
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
              label="Lab name"
              required
              name="organizationName"
              value={form.organizationName}
              onChange={onChange}
              placeholder="City Diagnostics"
            />
            <TextInput
              label="Registration number"
              name="registrationNumber"
              value={form.registrationNumber}
              onChange={onChange}
              placeholder="Registration ID"
            />
            <StepActions onBack={() => { setError(''); setStep(0); }} nextType="submit" nextLabel="Continue" />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <TextInput label="City" name="city" value={form.city} onChange={onChange} placeholder="Kampala" />
            <TextInput label="Address" name="address" value={form.address} onChange={onChange} placeholder="Street / area" />
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
                  : 'Optional license or accreditation files.'}
              </p>
            </div>
            <StepActions
              onBack={() => { setError(''); setStep(1); }}
              nextType="submit"
              nextLabel="Create lab account"
              loading={loading}
            />
          </>
        ) : null}
      </form>
    </AuthLayout>
  );
};

export default RegisterLab;
