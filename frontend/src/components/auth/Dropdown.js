import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Field } from './FormFields';

const Dropdown = ({
  label,
  required,
  hint,
  error,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={`auth-input flex items-center justify-between text-left ${
            open ? 'border-brand-500 ring-4 ring-brand-500/10' : ''
          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <span className={selected ? 'text-ink-900' : 'text-ink-400'}>
            {selected?.label || placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-ink-400 transition ${open ? 'rotate-180 text-brand-500' : ''}`}
          />
        </button>

        {open ? (
          <ul
            role="listbox"
            className="absolute z-30 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-ink-200 bg-white py-1.5 shadow-auth animate-fade-up"
          >
            {options.map((option) => {
              const isActive = option.value === value;
              return (
                <li key={option.value} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition ${
                      isActive
                        ? 'bg-brand-50 font-semibold text-brand-700'
                        : 'text-ink-700 hover:bg-ink-100'
                    }`}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <span>
                      <span className="block">{option.label}</span>
                      {option.description ? (
                        <span className="mt-0.5 block text-xs font-normal text-ink-500">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    {isActive ? <Check className="h-4 w-4 shrink-0 text-brand-500" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </Field>
  );
};

export default Dropdown;
