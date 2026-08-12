import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import { Alert, TextInput, SubmitButton } from '../../components/auth/FormFields';
import { useAuth } from '../../context/AuthContext';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendVerificationOtp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: location.state?.email || '',
    otp: ''
  });

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await verifyEmail(form.email, form.otp);
      toast.success(res?.message || 'Email verified. You can log in now.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!form.email) {
      setError('Enter your email first');
      return;
    }
    setError('');
    setResending(true);
    try {
      await resendVerificationOtp(form.email);
      toast.success('New code sent');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify email"
      subtitle="Enter the 6-digit code we sent. It expires in 5 minutes."
      footer={
        <>
          Wrong email?{' '}
          <Link to="/register" className="font-semibold text-brand-500 hover:text-brand-600">
            Sign up again
          </Link>
        </>
      }
    >
      <Alert>{error}</Alert>
      <form className="space-y-4" onSubmit={onSubmit}>
        <TextInput
          label="Email"
          required
          type="email"
          name="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={onChange}
        />
        <TextInput
          label="Verification code"
          required
          name="otp"
          placeholder="6-digit OTP"
          value={form.otp}
          onChange={onChange}
          inputMode="numeric"
          maxLength={6}
        />
        <SubmitButton loading={loading}>Verify account</SubmitButton>
        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="w-full text-center text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-60"
        >
          {resending ? 'Sending…' : 'Resend code'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default VerifyEmail;
