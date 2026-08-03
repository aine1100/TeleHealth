import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, FlaskConical, ShieldPlus, UserRound } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';

const roles = [
  {
    to: '/register/patient',
    title: 'Patient',
    description: 'Book care, manage appointments, and track your health.',
    icon: UserRound
  },
  {
    to: '/register/clinic',
    title: 'Clinic / Hospital',
    description: 'Onboard your facility and invite doctors to your team.',
    icon: Building2
  },
  {
    to: '/register/lab',
    title: 'Laboratory',
    description: 'Connect your lab and share results with care teams.',
    icon: FlaskConical
  },
  {
    to: '/register/insurance',
    title: 'Insurance',
    description: 'Partner with Alive Health for coverage workflows.',
    icon: ShieldPlus
  }
];

const RegisterSelect = () => {
  return (
    <AuthLayout
      title="Sign up"
      subtitle="Choose how you want to join Alive Health UG."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600">
            Log in
          </Link>
        </>
      }
    >
      <div className="space-y-3">
        {roles.map(({ to, title, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-start gap-3 rounded-xl border border-ink-200 bg-white p-4 transition hover:border-brand-300 hover:bg-brand-50/40"
          >
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white">
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink-900">{title}</span>
              <span className="mt-1 block text-sm leading-5 text-ink-500">{description}</span>
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-6 rounded-lg bg-ink-100 px-3.5 py-3 text-xs leading-5 text-ink-500">
        Doctors join by invitation only. Ask your clinic or hospital admin to send you an invite.
      </p>
    </AuthLayout>
  );
};

export default RegisterSelect;
