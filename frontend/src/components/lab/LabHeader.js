import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Settings, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { labService } from '../../services/labService';
import getSocket from '../../utils/socket';

const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const LabHeader = ({ onMenuClick }) => {
  const { user, requestLogout } = useAuth();
  const navigate = useNavigate();
  const [openBell, setOpenBell] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const bellRef = useRef(null);
  const profileRef = useRef(null);
  const labName =
    user?.organizationProfile?.organizationName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    'Laboratory';

  const loadNotifications = useCallback(async () => {
    try {
      const res = await labService.getNotifications({ page: 1, limit: 10 });
      setNotifications(res?.data || []);
    } catch {
      /* quiet */
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 60000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    if (!user?._id) return undefined;
    const socket = getSocket();
    socket.emit('join-user-room', { userId: user._id, role: 'lab_tech' });
    const onNotification = (payload) => {
      setNotifications((prev) => [{ ...payload, isRead: false }, ...prev].slice(0, 20));
      if (payload?.title) toast(payload.message || payload.title, { icon: '🔔' });
    };
    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [user?._id]);

  useEffect(() => {
    const onDown = (e) => {
      if (!bellRef.current?.contains(e.target)) setOpenBell(false);
      if (!profileRef.current?.contains(e.target)) setOpenProfile(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-ink-200/70 bg-white/90 backdrop-blur-md">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-200/80 bg-white text-ink-700 lg:hidden"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0 shrink-0 border-r border-ink-100 pr-4 sm:pr-5">
          <p className="truncate text-[15px] font-bold text-ink-900 sm:text-base">
            <span className="text-brand-600">{labName}</span>
          </p>
          <p className="hidden truncate text-[11px] text-ink-500 sm:block">Orders & results</p>
        </div>
        <div className="flex-1" />
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            onClick={() => {
              setOpenBell((v) => !v);
              loadNotifications();
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink-200/80 bg-white text-ink-600"
          >
            <Bell size={17} />
            {unread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            ) : null}
          </button>
          {openBell ? (
            <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-lg">
              <p className="border-b border-ink-100 px-4 py-3 text-sm font-bold">Notifications</p>
              <div className="max-h-72 overflow-y-auto">
                {notifications.slice(0, 8).map((item) => (
                  <Link
                    key={item._id}
                    to="/lab/orders"
                    onClick={() => {
                      setOpenBell(false);
                      if (!item.isRead) labService.markNotificationRead(item._id).catch(() => {});
                    }}
                    className="block border-b border-ink-100 px-4 py-3 hover:bg-ink-50"
                  >
                    <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {item.message} · {formatRelativeTime(item.createdAt)}
                    </p>
                  </Link>
                ))}
                {!notifications.length ? <p className="px-4 py-8 text-center text-sm text-ink-500">All caught up</p> : null}
              </div>
            </div>
          ) : null}
        </div>
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setOpenProfile((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-2.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
              {(labName?.[0] || 'L').toUpperCase()}
            </span>
            <span className="hidden max-w-[140px] truncate text-xs font-semibold md:block">{labName}</span>
            <ChevronDown size={14} className="text-ink-400" />
          </button>
          {openProfile ? (
            <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-lg">
              <Link to="/lab/profile" onClick={() => setOpenProfile(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-ink-50">
                <Building2 size={16} /> Profile
              </Link>
              <Link to="/lab/settings" onClick={() => setOpenProfile(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-ink-50">
                <Settings size={16} /> Settings
              </Link>
              <button
                type="button"
                onClick={() => requestLogout(() => navigate('/login'))}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default LabHeader;
