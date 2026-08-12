import React from 'react';
import { createPortal } from 'react-dom';
import { LogOut } from 'lucide-react';

const LogoutConfirmModal = ({ open, onCancel, onConfirm }) => {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close logout confirmation"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-xl animate-fade-up"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <LogOut size={18} />
        </div>
        <h2 id="logout-confirm-title" className="mt-3 text-lg font-bold text-ink-900">
          Log out?
        </h2>
        <p className="mt-1.5 text-sm text-ink-600">
          Are you sure you want to log out of Alive Health?
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Yes, log out
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LogoutConfirmModal;
