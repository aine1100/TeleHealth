import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import { Alert, TextInput, SubmitButton } from '../../components/auth/FormFields';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resolveHomePath } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success('Welcome back');
      // Never send unapproved orgs to clinic/lab dashboards
      const home = resolveHomePath(data.user);
      const requested = location.state?.from;
      const allowRequested =
        requested &&
        home !== '/pending-approval' &&
        !String(requested).startsWith('/pending-approval');
      navigate(allowRequested ? requested : home, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      const message = data?.message || 'Unable to log in';
      setError(message);
      if (data?.code === 'EMAIL_NOT_VERIFIED') {
        toast.error(message);
        navigate('/verify-email', {
          replace: false,
          state: { email: data.email || form.email }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back. Sign in to continue your care journey."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-500 hover:text-brand-600">
            Sign up
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
          autoComplete="email"
        />
        <TextInput
          label="Password"
          required
          type="password"
          name="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={onChange}
          autoComplete="current-password"
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-500 hover:text-brand-600">
            Forgot password?
          </Link>
        </div>
        <SubmitButton loading={loading}>Log in</SubmitButton>
      </form>
    </AuthLayout>
  );
};

export default Login;
