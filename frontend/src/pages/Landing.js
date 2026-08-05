import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';

const Landing = () => {
  const { user, resolveHomePath, logout } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <img
        src="/warm.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover animate-soft-zoom"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/45 to-brand-700/25" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between">
          <BrandLogo inverted nameClassName="text-lg" />

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to={resolveHomePath(user)}
                  className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-ink-900"
                >
                  Open dashboard
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-white/40 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden text-sm font-semibold text-white/90 sm:inline">
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-900/20"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center py-16">
          <p className="animate-fade-up text-sm font-semibold uppercase tracking-[0.28em] text-brand-200">
            Telehealth for Uganda
          </p>
          <h1 className="animate-fade-up mt-5 max-w-2xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Alive Health UG
          </h1>
          <p className="animate-fade-up-delay mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
            Your health, your choice, your terms — care that connects patients, doctors, clinics, labs, and insurers.
          </p>
          <div className="animate-fade-up-delay mt-8 flex flex-wrap gap-3">
            <Link
              to="/register/patient"
              className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-ink-900"
            >
              I&apos;m a patient
            </Link>
            <Link
              to="/register/clinic"
              className="rounded-lg border border-white/50 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur"
            >
              I&apos;m a clinic
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Landing;
