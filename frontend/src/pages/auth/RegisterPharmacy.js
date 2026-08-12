import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import StepProgress, { StepActions } from '../../components/auth/StepProgress';
import { Alert, TextInput } from '../../components/auth/FormFields';
import { useAuth } from '../../context/AuthContext';

const STEPS = ['Your account', 'Pharmacy details', 'Location & docs'];

const RegisterPharmacy = () => {
  const navigate = useNavigate();
  const { registerPharmacy } = useAuth();
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
    licenseNumber: '',
    city: '',
    address: '',
    description: ''
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
      return 'Pharmacy name is required.';
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
        registrationNumber,
        licenseNumber,
        city,
        address,
        description,
        ...account
      } = form;
      await registerPharmacy(
        {
          ...account,
          organizationProfile: {
            organizationName,
            organizationType: 'pharmacy',
            registrationNumber,
            city,
            address,
            contactPerson: `${form.firstName} ${form.lastName}`
          },
          pharmacyProfile: {
            pharmacyName: organizationName,
            licenseNumber: licenseNumber || registrationNumber,
            phone: form.phone,
            address,
            city,
            description,
            offersDelivery: true,
            offersPickup: true,
            isOpen: true
          }
        },
        files
      );
      toast.success('Pharmacy registered. Verify your email to continue.');
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || 'Registration failed';
      setError(msg);
      if (data?.code === 'EMAIL_NOT_VERIFIED') {
        toast.error(msg);
        navigate('/verify-email', { state: { email: data.email || form.email } });
      }
    } finally {
      setLoading(false);
    }
  };

  const titles = [
    {
      title: 'Create pharmacy account',
      subtitle: 'Set up the admin who will manage this pharmacy.'
    },
    {
      title: 'Pharmacy details',
      subtitle: 'Basic information about your pharmacy.'
    },
    {
      title: 'Location & documents',
      subtitle: 'Where patients can pick up or receive deliveries.'
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
            <TextInput label="Email" required type="email" name="email" value={form.email} onChange={onChange} placeholder="pharmacy@example.com" />
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
              label="Pharmacy name"
              required
              name="organizationName"
              value={form.organizationName}
              onChange={onChange}
              placeholder="Alive Care Pharmacy"
            />
            <TextInput
              label="Registration number"
              name="registrationNumber"
              value={form.registrationNumber}
              onChange={onChange}
              placeholder="Business registration ID"
            />
            <TextInput
              label="Pharmacy license number"
              name="licenseNumber"
              value={form.licenseNumber}
              onChange={onChange}
              placeholder="License / permit number"
            />
            <TextInput
              label="Short description"
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="Community pharmacy, delivery available…"
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
                  : 'Optional license or permit files for admin review.'}
              </p>
            </div>
            <StepActions
              onBack={() => { setError(''); setStep(1); }}
              nextType="submit"
              nextLabel="Create pharmacy account"
              loading={loading}
            />
          </>
        ) : null}
      </form>
    </AuthLayout>
  );
};

export default RegisterPharmacy;
