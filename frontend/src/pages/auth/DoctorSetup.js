import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import { Alert, TextInput, SubmitButton } from '../../components/auth/FormFields';
import { useAuth } from '../../context/AuthContext';

const DoctorSetup = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { getDoctorInvite, setupDoctor } = useAuth();

  const [loadingInvite, setLoadingInvite] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    specialty: '',
    licenseNumber: ''
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!token) {
        if (active) {
          setError('Missing invite token. Use the link from your email.');
          setLoadingInvite(false);
        }
        return;
      }
      try {
        const res = await getDoctorInvite(token);
        if (!active) return;
        setInvite(res.data);
        setForm((prev) => ({
          ...prev,
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          specialty: res.data.specialty || ''
        }));
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Invalid or expired invite');
      } finally {
        if (active) setLoadingInvite(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [token, getDoctorInvite]);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await setupDoctor({ token, ...form });
      toast.success('Doctor account ready');
      navigate('/doctor/home', { replace: true });
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to complete setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set up doctor account"
      subtitle={
        invite
          ? `${invite.clinic?.name || 'Your clinic'} invited you to join Alive Health UG.`
          : 'Complete your profile to join your clinic’s care team.'
      }
      footer={
        <>
          Already set up?{' '}
          <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600">
            Log in
          </Link>
        </>
      }
    >
      {loadingInvite ? (
        <p className="text-sm text-ink-500">Checking your invite…</p>
      ) : (
        <>
          <Alert>{error}</Alert>
          {invite ? (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="rounded-lg border border-brand-100 bg-brand-50 px-3.5 py-3 text-sm text-brand-800">
                Invited email: <strong>{invite.email}</strong>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="First name" required name="firstName" value={form.firstName} onChange={onChange} placeholder="First name" />
                <TextInput label="Last name" required name="lastName" value={form.lastName} onChange={onChange} placeholder="Last name" />
              </div>
              <TextInput label="Phone" required name="phone" value={form.phone} onChange={onChange} placeholder="+256700000000" />
              <TextInput label="Specialty" required name="specialty" value={form.specialty} onChange={onChange} placeholder="General Practice" />
              <TextInput label="License number" name="licenseNumber" value={form.licenseNumber} onChange={onChange} placeholder="UMD-12345" />
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
              <SubmitButton loading={loading}>Activate account</SubmitButton>
            </form>
          ) : null}
        </>
      )}
    </AuthLayout>
  );
};

export default DoctorSetup;
