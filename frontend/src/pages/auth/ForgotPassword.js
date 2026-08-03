import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../components/auth/AuthLayout';
import { Alert, TextInput, SubmitButton } from '../../components/auth/FormFields';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(identifier, 'email');
      toast.success('Reset code sent');
      navigate('/reset-password', { state: { identifier } });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we’ll send a reset code."
      footer={
        <>
          Remembered it?{' '}
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
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <SubmitButton loading={loading}>Send reset code</SubmitButton>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
