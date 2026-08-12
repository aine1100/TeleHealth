import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Pill, Search, Sparkles, Stethoscope } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import BottomNav from '../../components/BottomNav';
import { useAuth } from '../../context/AuthContext';

const PatientHome = () => {
  const { user, requestLogout} = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    requestLogout(() => navigate('/login'));
  };

  const actions = [
    {
      to: '/patient/doctors',
      title: 'Find a doctor',
      blurb: 'Search specialties and book a consult',
      icon: Search
    },
    {
      to: '/patient/appointments',
      title: 'My appointments',
      blurb: 'Upcoming visits and waiting room',
      icon: Calendar
    },
    {
      to: '/patient/medicines',
      title: 'Medicine reminders',
      blurb: 'Track doses and stay on schedule',
      icon: Pill
    },
    {
      to: '/patient/ai-screening',
      title: 'AI screening',
      blurb: 'Share symptoms before your visit',
      icon: Sparkles
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <BrandLogo to="/patient/home" subtitle="Patient care" nameClassName="text-sm" />
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-ink-200 px-3.5 py-2 text-sm font-semibold text-ink-700"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] bg-blue-950 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-200">Welcome back</p>
          <h1 className="mt-3 text-3xl font-semibold">
            {user?.firstName ? `Hi, ${user.firstName}` : 'Your care hub'}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100/90">
            Book doctors, manage appointments, and keep your health record in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/patient/doctors"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-950"
            >
              <Stethoscope size={16} />
              Book a visit
            </Link>
            <Link
              to="/patient/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
            >
              View profile
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {actions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <action.icon size={18} />
              </span>
              <p className="mt-4 text-base font-semibold text-ink-900">{action.title}</p>
              <p className="mt-1 text-sm text-ink-500">{action.blurb}</p>
            </Link>
          ))}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default PatientHome;
