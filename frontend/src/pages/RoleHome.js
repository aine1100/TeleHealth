import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RoleHome = ({ title, blurb }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-ink-100">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Shield className="h-5 w-5" />
            </span>
            <span className="text-sm font-bold text-ink-900">Alive Health UG</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-ink-200 px-3.5 py-2 text-sm font-semibold text-ink-700"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-brand-600">
          {user?.role?.replace('_', ' ')}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-ink-900">{title}</h1>
        <p className="mt-3 max-w-2xl text-ink-500">{blurb}</p>
        <div className="mt-8 rounded-2xl border border-ink-200 bg-white p-6 shadow-auth">
          <p className="text-sm text-ink-700">
            Signed in as <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email})
          </p>
          <p className="mt-2 text-sm text-ink-500">
            Full dashboards for this role are next. Auth and onboarding are ready.
          </p>
        </div>
      </main>
    </div>
  );
};

export default RoleHome;
