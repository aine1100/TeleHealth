import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Dropdown from '../auth/Dropdown';
import { TextInput } from '../auth/FormFields';
import { specialtyOptions } from '../../data/clinicDashboard';

const InviteDoctorModal = ({ open, onClose, form, onChange, onSpecialtyChange, onSubmit, loading }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-doctor-title"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-ink-200 bg-white p-5 shadow-card animate-fade-up sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="invite-doctor-title" className="text-xl font-bold text-ink-900">
              Invite doctor
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Send an email invite. The setup link does not expire — they can join anytime.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="First name"
              name="firstName"
              value={form.firstName}
              onChange={onChange}
              placeholder="Amina"
            />
            <TextInput
              label="Last name"
              name="lastName"
              value={form.lastName}
              onChange={onChange}
              placeholder="Okello"
            />
          </div>
          <TextInput
            label="Email"
            required
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="doctor@example.com"
          />
          <Dropdown
            label="Specialty"
            value={form.specialty}
            onChange={onSpecialtyChange}
            options={specialtyOptions}
            placeholder="Select specialty"
          />

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="auth-btn-secondary w-full sm:w-auto sm:px-5"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="auth-btn w-full sm:w-auto sm:min-w-[140px] sm:px-5" disabled={loading}>
              {loading ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default InviteDoctorModal;
