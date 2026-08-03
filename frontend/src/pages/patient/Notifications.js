import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, CheckCircle2 } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifications/my-notifications`);
        setNotifications(res.data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[2rem] bg-blue-950 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Notifications</p>
              <h1 className="mt-3 text-3xl font-semibold">Recent updates</h1>
            </div>
            <div className="inline-flex items-center gap-3 rounded-3xl bg-white/10 px-4 py-3 text-sm text-white">
              <Bell className="h-4 w-4" />
              {notifications.filter((n) => !n.isRead).length} unread
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-blue-200 bg-white p-10 text-center text-slate-500">No notifications yet.</div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification._id} className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{notification.message}</p>
                  </div>
                  <div className="rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 inline-flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {notification.isRead ? 'Read' : 'Unread'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
