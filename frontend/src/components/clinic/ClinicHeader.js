import React, { useEffect, useRef, useState } from 'react';
import { Bell, CalendarDays, Menu, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeaderMenu = ({ icon: Icon, label, count, items, emptyText, actionTo, actionLabel }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
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
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-ink-700 transition hover:border-brand-200 hover:text-brand-600 ${
          open ? 'border-brand-300 ring-4 ring-brand-500/10' : 'border-ink-200'
        }`}
      >
        <Icon size={17} />
        {count > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[300px] overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card animate-fade-up sm:w-[320px]">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-bold text-ink-900">{label}</p>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
              {count} new
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {items.length ? (
              items.map((item) => (
                <div key={item.id} className="border-b border-ink-100 px-4 py-3 last:border-0 hover:bg-ink-100/60">
                  <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{item.meta}</p>
                </div>
              ))
            ) : (
              <p className="px-4 py-6 text-center text-sm text-ink-500">{emptyText}</p>
            )}
          </div>
          {actionTo ? (
            <Link
              to={actionTo}
              onClick={() => setOpen(false)}
              className="block border-t border-ink-100 px-4 py-3 text-center text-sm font-semibold text-brand-600 hover:bg-brand-50"
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const appointmentItems = [
  { id: 'a1', title: 'Amina N. · Video consult', meta: 'Today · 2:30 PM · Dr. Okello' },
  { id: 'a2', title: 'Brian K. · In person', meta: 'Today · 3:00 PM · Dr. Namuli' },
  { id: 'a3', title: 'Sarah M. · Follow-up', meta: 'Today · 4:15 PM · Dr. Kato' }
];

const notificationItems = [
  { id: 'n1', title: 'Doctor invite accepted', meta: 'Dr. Peter joined your facility · 10m ago' },
  { id: 'n2', title: 'New appointment booked', meta: 'Video consult scheduled · 28m ago' },
  { id: 'n3', title: 'Seat usage reminder', meta: '15 of 18 doctor seats used · 1h ago' }
];

const ClinicHeader = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-ink-200/80 bg-[#f7f8fa]/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-ink-200 bg-white p-2.5 text-ink-700 lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div className="relative min-w-0 flex-1 md:mx-auto md:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            placeholder="Search doctors, patients, appointments..."
            className="w-full rounded-xl border-0 bg-ink-100 py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <HeaderMenu
            icon={CalendarDays}
            label="Appointments"
            count={12}
            items={appointmentItems}
            emptyText="No upcoming appointments"
            actionTo="/clinic/appointments"
            actionLabel="View all appointments"
          />
          <HeaderMenu
            icon={Bell}
            label="Notifications"
            count={5}
            items={notificationItems}
            emptyText="You're all caught up"
          />
        </div>
      </div>
    </header>
  );
};

export default ClinicHeader;
