import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../components/auth/AuthLayout';
import { Alert, TextInput, SubmitButton } from '../../components/auth/FormFields';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    identifier: location.state?.identifier || '',
    otp: '',
    newPassword: ''
  });

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(form.identifier, form.otp, form.newPassword);
      toast.success('Password updated. Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter the code from your email and choose a new password."
      footer={
        <>
          Back to{' '}
          <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600">
            Log in
          </Link>
        </>
      }
    >
      <Alert>{error}</Alert>
      <form className="space-y-4" onSubmit={onSubmit}>
        <TextInput
          label="Email or phone"
          required
          name="identifier"
          placeholder="Enter your email"
          value={form.identifier}
          onChange={onChange}
        />
        <TextInput
          label="Reset code"
          required
          name="otp"
          placeholder="6-digit OTP"
          value={form.otp}
          onChange={onChange}
          inputMode="numeric"
          maxLength={6}
        />
        <TextInput
          label="New password"
          required
          type="password"
          name="newPassword"
          placeholder="Create a new password"
          value={form.newPassword}
          onChange={onChange}
          hint="Must be at least 6 characters."
          minLength={6}
        />
        <SubmitButton loading={loading}>Update password</SubmitButton>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
