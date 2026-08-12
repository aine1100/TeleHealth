import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';
import BrandLogo from '../BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { adminNav } from '../../data/adminDashboard';

const iconMap = {
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Users,
  Settings,
  LifeBuoy
};

const AdminSidebar = ({ open, onClose }) => {
  const { user, requestLogout} = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    requestLogout(() => navigate('/login'));
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
        : 'text-ink-700 hover:bg-ink-100'
    }`;

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[260px] shrink-0 flex-col border-r border-ink-200 bg-white px-4 py-5 transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <BrandLogo to="/admin/home" subtitle="Super admin" nameClassName="text-sm" />
          <button type="button" className="rounded-lg p-1.5 text-ink-500 lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="scrollbar-hide flex-1 overflow-y-auto">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            Management
          </p>
          <nav className="space-y-1">
            {adminNav.management.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={linkClass}
                  onClick={onClose}
                  end={item.to === '/admin/home'}
                >
                  <Icon size={17} />
                  <span className="flex-1">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <p className="mb-2 mt-7 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            Configurations
          </p>
          <nav className="space-y-1">
            {adminNav.configurations.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
                  <Icon size={17} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="mt-4 rounded-2xl border border-ink-200 bg-ink-100/70 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
              {(user?.firstName?.[0] || 'S')}
              {(user?.lastName?.[0] || 'A')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">
                {user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
              </p>
              <p className="truncate text-xs text-ink-500">Platform administrator</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg p-2 text-ink-500 transition hover:bg-white hover:text-ink-900"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
