import React, { useEffect, useRef, useState } from 'react';
import { Bell, CalendarDays, ChevronDown, LogOut, Menu, Search, Settings, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HeaderMenu = ({ icon: Icon, label, count = 0, items = [], emptyText, actionTo, actionLabel }) => {
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
        title={label}
        onClick={() => setOpen((prev) => !prev)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border bg-white text-ink-600 transition ${
          open
            ? 'border-brand-300 text-brand-600 shadow-sm ring-4 ring-brand-500/10'
            : 'border-ink-200/80 hover:border-ink-300 hover:bg-ink-50 hover:text-ink-900'
        }`}
      >
        <Icon size={17} strokeWidth={1.9} />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold text-white shadow-sm">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[300px] overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.1)] animate-fade-up sm:w-[320px]">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-bold text-ink-900">{label}</p>
            {count > 0 ? (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
                {count} new
              </span>
            ) : null}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {items.length ? (
              items.map((item) => (
                <div key={item.id} className="border-b border-ink-100 px-4 py-3 last:border-0 hover:bg-ink-50">
                  <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{item.meta}</p>
                </div>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-sm text-ink-500">{emptyText}</p>
            )}
          </div>
          {actionTo ? (
            <Link
              to={actionTo}
              onClick={() => setOpen(false)}
              className="block border-t border-ink-100 px-4 py-3 text-center text-sm font-semibold text-brand-600 hover:bg-brand-50/60"
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const ProfileMenu = ({ user, facilityName, onLogout }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const initials = `${user?.firstName?.[0] || 'C'}${user?.lastName?.[0] || 'A'}`.toUpperCase();

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
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2.5 rounded-full border bg-white py-1 pl-1 pr-2.5 transition ${
          open
            ? 'border-brand-300 shadow-sm ring-4 ring-brand-500/10'
            : 'border-ink-200/80 hover:border-ink-300 hover:bg-ink-50'
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-blue-700 text-[11px] font-bold text-white shadow-sm shadow-brand-500/20">
          {initials}
        </span>
        <span className="hidden min-w-0 text-left md:block">
          <span className="block max-w-[130px] truncate text-xs font-semibold leading-tight text-ink-900">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="block max-w-[130px] truncate text-[10px] leading-tight text-ink-500">
            Clinic admin
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`mr-0.5 text-ink-400 transition ${open ? 'rotate-180 text-ink-600' : ''}`}
        />
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.1)] animate-fade-up">
          <div className="border-b border-ink-100 bg-ink-50/50 px-4 py-3.5">
            <p className="text-sm font-bold text-ink-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="mt-0.5 truncate text-xs text-ink-500">{user?.email}</p>
            <p className="mt-1.5 truncate text-[11px] font-semibold text-brand-600">{facilityName}</p>
          </div>
          <div className="p-1.5">
            <Link
              to="/clinic/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              <UserRound size={16} className="text-ink-400" />
              Facility profile
            </Link>
            <Link
              to="/clinic/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              <Settings size={16} className="text-ink-400" />
              Settings
            </Link>
            <div className="my-1 border-t border-ink-100" />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const ClinicHeader = ({ onMenuClick }) => {
  const { user, requestLogout} = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const facilityName =
    user?.organizationProfile?.organizationName ||
    user?.clinicProfile?.clinicName ||
    'Your facility';

  const firstName = user?.firstName || 'there';

  const handleLogout = () => {
    requestLogout(() => navigate('/login'));
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/clinic/doctors?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-ink-200/70 bg-white/90 backdrop-blur-md">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-200/80 bg-white text-ink-700 transition hover:bg-ink-50 lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0 shrink-0 border-r border-ink-100 pr-4 sm:pr-5">
          <p className="truncate text-[15px] font-bold tracking-tight text-ink-900 sm:text-base">
            Hello, <span className="text-brand-600">{firstName}</span>
          </p>
           </div>

        <form onSubmit={onSearchSubmit} className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            strokeWidth={1.9}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors, patients, appointments..."
            className="h-10 w-full max-w-xl rounded-full border border-ink-200/80 bg-ink-50/80 py-2 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
          />
        </form>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <HeaderMenu
            icon={CalendarDays}
            label="Appointments"
            items={[]}
            emptyText="No upcoming appointments"
            actionTo="/clinic/appointments"
            actionLabel="View all appointments"
          />
          <HeaderMenu
            icon={Bell}
            label="Notifications"
            items={[]}
            emptyText="You're all caught up"
          />
          <div className="ml-0.5 h-6 w-px bg-ink-100 sm:ml-1" />
          <ProfileMenu user={user} facilityName={facilityName} onLogout={handleLogout} />
        </div>
      </div>
    </header>
  );
};

export default ClinicHeader;