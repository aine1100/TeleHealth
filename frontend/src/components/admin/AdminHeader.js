import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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

const ProfileMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const initials = `${user?.firstName?.[0] || 'S'}${user?.lastName?.[0] || 'A'}`.toUpperCase();

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 rounded-xl border bg-white py-1.5 pl-1.5 pr-2.5 transition hover:border-brand-200 ${
          open ? 'border-brand-300 ring-4 ring-brand-500/10' : 'border-ink-200'
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[120px] truncate text-xs font-semibold text-ink-900">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="block text-[10px] text-ink-500">Super admin</span>
        </span>
        <ChevronDown size={14} className={`text-ink-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card animate-fade-up">
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-bold text-ink-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-ink-500">{user?.email}</p>
          </div>
          <div className="p-1.5">
            <Link
              to="/admin/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
            >
              <Settings size={16} />
              Settings
            </Link>
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

const AdminHeader = ({ onMenuClick, pendingCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/admin/organizations?q=${encodeURIComponent(q)}`);
  };

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

        <div className="min-w-0 shrink-0">
          <p className="truncate text-sm font-bold text-ink-900 sm:text-base">
            Hello, {user?.firstName || 'Admin'}
          </p>
          <p className="hidden text-xs text-ink-500 sm:block">Platform control</p>
        </div>

        <form onSubmit={onSearchSubmit} className="relative min-w-0 flex-1 md:mx-4 md:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clinics, patients, organizations..."
            className="w-full rounded-xl border-0 bg-ink-100 py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
          />
        </form>

        <div className="flex shrink-0 items-center gap-2">
          <HeaderMenu
            icon={ShieldCheck}
            label="Pending approvals"
            count={pendingCount}
            items={[]}
            emptyText="No pending organization reviews"
            actionTo="/admin/organizations?status=pending"
            actionLabel="Review organizations"
          />
          <HeaderMenu
            icon={Bell}
            label="Notifications"
            count={0}
            items={[]}
            emptyText="You're all caught up"
          />
          <ProfileMenu user={user} onLogout={handleLogout} />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
