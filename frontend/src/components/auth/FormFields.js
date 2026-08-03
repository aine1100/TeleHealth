import React from 'react';

export const Field = ({
  label,
  required,
  hint,
  error,
  children
}) => (
  <div>
    {label ? (
      <label className="auth-label">
        {label}
        {required ? <span className="text-brand-500">*</span> : null}
      </label>
    ) : null}
    {children}
    {hint && !error ? <p className="mt-1.5 text-xs text-ink-500">{hint}</p> : null}
    {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
  </div>
);

export const TextInput = ({ label, required, hint, error, className = '', ...props }) => (
  <Field label={label} required={required} hint={hint} error={error}>
    <input className={`auth-input ${className}`} {...props} />
  </Field>
);

export const TextSelect = ({ label, required, hint, error, children, className = '', ...props }) => (
  <Field label={label} required={required} hint={hint} error={error}>
    <select className={`auth-input ${className}`} {...props}>
      {children}
    </select>
  </Field>
);

export const TextTextarea = ({ label, required, hint, error, className = '', ...props }) => (
  <Field label={label} required={required} hint={hint} error={error}>
    <textarea className={`auth-input min-h-[96px] resize-y ${className}`} {...props} />
  </Field>
);

export const SubmitButton = ({ loading, children, ...props }) => (
  <button type="submit" className="auth-btn" disabled={loading} {...props}>
    {loading ? 'Please wait…' : children}
  </button>
);

export const Alert = ({ type = 'error', children }) => {
  if (!children) return null;
  const styles =
    type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-red-200 bg-red-50 text-red-700';

  return (
    <div className={`mb-5 rounded-lg border px-3.5 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
};
