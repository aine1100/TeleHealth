import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { patientService } from '../../services/patientService';

const PatientNotifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await patientService.getNotifications();
        if (mounted) setNotifications(res?.data || []);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to load notifications');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[960px] animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Notifications</h1>
        <p className="mt-1 text-sm text-ink-500">Recent updates about your care.</p>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
            Loading notifications…
          </div>
        ) : notifications.length ? (
          notifications.map((item) => (
            <div key={item._id} className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink-900">{item.title}</p>
                  <p className="mt-1 text-sm text-ink-600">{item.message}</p>
                  {item.actionUrl ? (
                    <Link
                      to={item.actionUrl.replace(/^https?:\/\/[^/]+/, '') || '#'}
                      className="mt-3 inline-flex text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      {item.actionLabel || 'View details'} →
                    </Link>
                  ) : null}
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
          ))
        ) : (
          <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
            No notifications yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientNotifications;
