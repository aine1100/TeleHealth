import React from 'react';
import { Link } from 'react-router-dom';

const DoctorPlaceholder = ({ title, description }) => (
  <div className="mx-auto max-w-3xl animate-fade-up rounded-2xl border border-ink-200/70 bg-white p-8 shadow-card">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Coming next</p>
    <h1 className="mt-3 text-2xl font-bold text-ink-900">{title}</h1>
    <p className="mt-2 text-sm leading-6 text-ink-500">{description}</p>
    <Link
      to="/doctor/home"
      className="mt-6 inline-flex rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
    >
      Back to overview
    </Link>
  </div>
);

export default DoctorPlaceholder;
