import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock3, Users, Video } from 'lucide-react';
import StatCard from '../../components/clinic/StatCard';
import { doctorService } from '../../services/doctorService';
import { useAuth } from '../../context/AuthContext';
import {
  formatTimeLabel,
  getAppointmentDate,
  getPatientName,
  getTypeStyle,
  isSameDay,
  startOfDay,
  statusStyles
} from '../../utils/appointmentCalendar';

const DoctorOverview = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await doctorService.getMyAppointments();
        if (mounted) setAppointments(res?.data || []);
      } catch {
        if (mounted) setAppointments([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const today = startOfDay(new Date());

  const stats = useMemo(() => {
    const todayItems = appointments.filter((a) => {
      const d = getAppointmentDate(a);
      return d && isSameDay(d, today);
    });
    const upcoming = appointments.filter((a) => {
      const d = getAppointmentDate(a);
      return d && d >= today && !['cancelled', 'completed', 'no_show'].includes(a.status);
    });
    const video = appointments.filter((a) => a.type === 'video').length;
    const uniquePatients = new Set(
      appointments.map((a) => a.patient?._id || a.patient).filter(Boolean)
    ).size;

    return [
      {
        id: 'today',
        title: "Today's visits",
        value: String(todayItems.length),
        change: 'Live',
        positive: true,
        detail: 'Scheduled',
        detailSecondary: 'Today',
        icon: 'CalendarCheck',
        tone: 'blue'
      },
      {
        id: 'upcoming',
        title: 'Upcoming',
        value: String(upcoming.length),
        change: 'Pipeline',
        positive: true,
        detail: 'Open visits',
        detailSecondary: 'Active',
        icon: 'Video',
        tone: 'orange'
      },
      {
        id: 'patients',
        title: 'Patients seen',
        value: String(uniquePatients),
        change: 'Roster',
        positive: true,
        detail: 'Unique',
        detailSecondary: `${video} video`,
        icon: 'Stethoscope',
        tone: 'rose'
      }
    ];
  }, [appointments, today]);

  const upcomingList = useMemo(() => {
    return appointments
      .filter((a) => {
        const d = getAppointmentDate(a);
        return d && d >= today && !['cancelled', 'no_show'].includes(a.status);
      })
      .sort((a, b) => {
        const da = getAppointmentDate(a)?.getTime() || 0;
        const db = getAppointmentDate(b)?.getTime() || 0;
        if (da !== db) return da - db;
        return (a.scheduledTime || '').localeCompare(b.scheduledTime || '');
      })
      .slice(0, 6);
  }, [appointments, today]);

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Welcome, Dr. {user?.firstName || 'Doctor'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {user?.doctorProfile?.specialty || 'Your consultations and patient schedule'}
          </p>
        </div>
        <Link
          to="/doctor/appointments"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-600"
        >
          <CalendarDays size={16} />
          Open schedule
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-ink-200/70 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-sm font-bold text-ink-900">Upcoming appointments</h2>
            <Link to="/doctor/appointments" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-ink-100">
            {loading ? (
              <p className="px-5 py-10 text-center text-sm text-ink-500">Loading schedule…</p>
            ) : upcomingList.length ? (
              upcomingList.map((appt) => {
                const style = getTypeStyle(appt.type);
                const date = getAppointmentDate(appt);
                return (
                  <div key={appt._id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">{getPatientName(appt)}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {date ? date.toLocaleDateString() : '—'} · {formatTimeLabel(appt.scheduledTime)} ·{' '}
                        {style.label}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                        statusStyles[appt.status] || statusStyles.pending
                      }`}
                    >
                      {(appt.status || 'pending').replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="px-5 py-10 text-center text-sm text-ink-500">No upcoming appointments yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Quick links</p>
            <div className="mt-3 space-y-2">
              {[
                { to: '/doctor/appointments', label: 'My appointments', icon: CalendarDays },
                { to: '/doctor/patients', label: 'My patients', icon: Users },
                { to: '/doctor/schedule', label: 'Availability', icon: Clock3 },
                { to: '/doctor/profile', label: 'Profile & fees', icon: Video }
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 rounded-xl border border-ink-100 px-3 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-brand-200 hover:bg-brand-50/40 hover:text-brand-700"
                >
                  <item.icon size={16} className="text-brand-500" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorOverview;
