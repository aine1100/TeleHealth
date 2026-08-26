import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ListPagination from '../../components/ui/ListPagination';
import { patientService } from '../../services/patientService';
import getSocket from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';

const PAGE_SIZE = 10;

const PatientNotifications = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await patientService.getNotifications({ page, limit: PAGE_SIZE });
      setNotifications(res?.data || []);
      setTotal(res?.total || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user?._id) return undefined;
    const socket = getSocket();
    socket.emit('join-user-room', { userId: user._id, role: 'patient' });
    const onNotification = (payload) => {
      setTotal((prev) => prev + 1);
      if (page !== 1) return;
      setNotifications((prev) => {
        if (payload?._id && prev.some((item) => String(item._id) === String(payload._id))) {
          return prev;
        }
        return [{ ...payload, isRead: false }, ...prev].slice(0, PAGE_SIZE);
      });
    };
    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [user?._id, page]);

  const markRead = async (item) => {
    if (item.isRead) return;
    try {
      await patientService.markNotificationRead(item._id);
      setNotifications((prev) =>
        prev.map((row) => (row._id === item._id ? { ...row, isRead: true } : row))
      );
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-[960px] animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Notifications</h1>
        <p className="mt-1 text-sm text-ink-500">
          Updates when appointments are approved, declined, postponed, or changed.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
            Loading notifications…
          </div>
        ) : notifications.length ? (
          notifications.map((item) => {
            const path = item.actionUrl
              ? item.actionUrl.replace(/^https?:\/\/[^/]+/, '')
              : null;
            return (
              <div
                key={item._id}
                className={`rounded-2xl border bg-white p-5 shadow-card ${
                  item.isRead ? 'border-ink-200/70' : 'border-brand-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink-900">{item.title}</p>
                    <p className="mt-1 text-sm text-ink-600">{item.message}</p>
                    {item.createdAt ? (
                      <p className="mt-2 text-[11px] text-ink-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-3">
                      {path ? (
                        <Link
                          to={path}
                          onClick={() => markRead(item)}
                          className="inline-flex text-xs font-semibold text-brand-600 hover:text-brand-700"
                        >
                          {item.actionLabel || 'View details'} →
                        </Link>
                      ) : null}
                      {!item.isRead ? (
                        <button
                          type="button"
                          onClick={() => markRead(item)}
                          className="text-xs font-semibold text-ink-500 hover:text-ink-700"
                        >
                          Mark as read
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      item.isRead ? 'bg-ink-100 text-ink-500' : 'bg-brand-50 text-brand-700'
                    }`}
                  >
                    {item.isRead ? 'Read' : 'New'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
            No notifications yet. You will see updates here when a doctor accepts, declines, or changes
            your appointments.
          </div>
        )}
        <ListPagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default PatientNotifications;
