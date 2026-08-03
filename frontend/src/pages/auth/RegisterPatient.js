import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../components/auth/AuthLayout';
import { Alert, TextInput, SubmitButton } from '../../components/auth/FormFields';
import { useAuth } from '../../context/AuthContext';

const RegisterPatient = () => {
  const navigate = useNavigate();
  const { registerPatient } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerPatient(form);
      toast.success('Account created. Check your email for the OTP.');
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign up"
      subtitle="Create a patient account to start using Alive Health UG."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600">
            Log in
          </Link>
        </>
      }
    >
      <Alert>{error}</Alert>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="First name"
            required
            name="firstName"
            placeholder="Enter your first name"
            value={form.firstName}
            onChange={onChange}
          />
          <TextInput
            label="Last name"
            required
            name="lastName"
            placeholder="Enter your last name"
            value={form.lastName}
            onChange={onChange}
          />
        </div>
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
          label="Phone"
          required
          name="phone"
          placeholder="+256700000000"
          value={form.phone}
          onChange={onChange}
        />
        <TextInput
          label="Password"
          required
          type="password"
          name="password"
          placeholder="Create a password"
          value={form.password}
          onChange={onChange}
          hint="Must be at least 6 characters."
          minLength={6}
        />
        <SubmitButton loading={loading}>Get started</SubmitButton>
      </form>
    </AuthLayout>
  );
};

export default RegisterPatient;
