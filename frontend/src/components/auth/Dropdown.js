import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  disabled = false,
  portal = false
}) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const selected = options.find((option) => option.value === value);

  const getMenuStyle = () => {
    if (!buttonRef.current) return null;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = Math.min(224, options.length * 44 + 12);
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const openUp = spaceBelow < menuHeight && rect.top > spaceBelow;

    return {
      position: 'fixed',
      left: rect.left,
      width: Math.max(rect.width, 160),
      top: openUp ? undefined : rect.bottom + 8,
      bottom: openUp ? window.innerHeight - rect.top + 8 : undefined,
      // Above pharmacy inventory modal (z-[110]) and logout confirm (z-[120])
      zIndex: 200
    };
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return undefined;
    }
    if (!portal) return undefined;

    setMenuStyle(getMenuStyle());
    const onReposition = () => setMenuStyle(getMenuStyle());
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, portal, options.length]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      const inRoot = rootRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inRoot && !inMenu) setOpen(false);
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
  }, [open]);

  const menu =
    open && (!portal || menuStyle) ? (
      <ul
        ref={menuRef}
        role="listbox"
        style={portal ? menuStyle : undefined}
        className={`${
          portal ? '' : 'absolute z-30 mt-2 w-full'
        } max-h-56 overflow-auto rounded-xl border border-ink-200 bg-white py-1.5 shadow-auth animate-fade-up`}
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
    ) : null;

  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <div className="relative" ref={rootRef}>
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            if (disabled) return;
            setOpen((prev) => !prev);
          }}
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

        {portal && typeof document !== 'undefined' ? createPortal(menu, document.body) : menu}
      </div>
    </Field>
  );
};

export default Dropdown;
