import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  Users,
  Video,
  Wallet
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import { doctorService } from '../../services/doctorService';
import { useAuth } from '../../context/AuthContext';
import {
  formatTimeLabel,
  getAppointmentDate,
  getPatientName,
  getTypeStyle,
  statusStyles
} from '../../utils/appointmentCalendar';

const money = (value) => `UGX ${Number(value || 0).toLocaleString()}`;

const methodLabel = (method) =>
  String(method || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

const DoctorOverview = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [visitsByDay, setVisitsByDay] = useState([]);
  const [typeMix, setTypeMix] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await doctorService.getOverview();
        if (!mounted) return;
        setStats(res?.data?.stats || {});
        setVisitsByDay(res?.data?.visitsByDay || []);
        setTypeMix(res?.data?.typeMix || []);
        setUpcoming(res?.data?.upcoming || []);
        setRecentPayments(res?.data?.recentPayments || []);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to load analytics');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = [
    {
      title: "Today's visits",
      value: loading ? '…' : String(stats.todayCount || 0),
      detail: `${stats.upcomingCount || 0} upcoming open`,
      icon: CalendarDays
    },
    {
      title: 'Completed (week)',
      value: loading ? '…' : String(stats.completedWeek || 0),
      detail: `${stats.completedMonth || 0} this month`,
      icon: CheckCircle2
    },
    {
      title: 'Patients',
      value: loading ? '…' : String(stats.uniquePatients || 0),
      detail: 'Unique on your roster',
      icon: Users
    },
    {
      title: 'Revenue (week)',
      value: loading ? '…' : money(stats.revenueWeek),
      detail: `${money(stats.revenueMonth)} this month`,
      icon: Wallet
    }
  ];

  const paymentColumns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (_v, row) =>
        [row.patient?.firstName, row.patient?.lastName].filter(Boolean).join(' ') || 'Patient'
    },
    {
      key: 'type',
      label: 'Visit',
      render: (value) => (
        <span className="capitalize">{String(value || '').replace(/_/g, ' ')}</span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => <span className="font-semibold text-ink-900">{money(value)}</span>
    },
    {
      key: 'method',
      label: 'Method',
      render: (value) => methodLabel(value)
    },
    {
      key: 'paidAt',
      label: 'Paid',
      render: (value) => (value ? new Date(value).toLocaleString() : '—')
    }
  ];

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Welcome, Dr. {user?.firstName || 'Doctor'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {user?.doctorProfile?.specialty || 'Consult volume, earnings, and upcoming visits'}
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{kpi.title}</p>
                <p className="mt-1 text-xl font-bold text-ink-900">{kpi.value}</p>
                <p className="mt-1 text-xs text-ink-500">{kpi.detail}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <kpi.icon size={18} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
          <h2 className="text-sm font-bold text-ink-900">Visits · last 14 days</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitsByDay}>
                <defs>
                  <linearGradient id="docVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B74FF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0B74FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="visits" stroke="#0B74FF" fill="url(#docVisits)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
            <h2 className="text-sm font-bold text-ink-900">Visit types</h2>
            <ul className="mt-3 space-y-2">
              {typeMix.length ? (
                typeMix.map((row) => (
                  <li key={row.type} className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 capitalize text-ink-600">
                      <Video size={14} className="text-brand-500" />
                      {String(row.type || '').replace(/_/g, ' ')}
                    </span>
                    <span className="font-semibold text-ink-900">{row.count}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-ink-500">No visit data yet</li>
              )}
            </ul>
            <p className="mt-4 text-xs text-ink-500">
              Lifetime paid visits: {stats.paidVisits || 0} · Total earnings {money(stats.revenueTotal)}
            </p>
          </div>

          <div className="rounded-2xl border border-ink-200/70 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h2 className="text-sm font-bold text-ink-900">Upcoming</h2>
              <Link to="/doctor/appointments" className="text-xs font-semibold text-brand-600">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-ink-100">
              {upcoming.length ? (
                upcoming.map((appt) => {
                  const date = getAppointmentDate(appt);
                  return (
                    <li key={appt._id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-ink-900">{getPatientName(appt)}</p>
                          <p className="mt-0.5 text-xs text-ink-500">
                            {date ? date.toLocaleDateString() : '—'} · {formatTimeLabel(appt.scheduledTime)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            statusStyles[appt.status] || 'bg-ink-100 text-ink-600'
                          }`}
                        >
                          {String(appt.status || '').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTypeStyle(
                          appt.type
                        )}`}
                      >
                        {appt.type}
                      </span>
                    </li>
                  );
                })
              ) : (
                <li className="px-5 py-8 text-center text-sm text-ink-500">No upcoming visits</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink-900">Recent payments</h2>
          <Link to="/doctor/appointments" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            View appointments
          </Link>
        </div>
        <DataTable
          columns={paymentColumns}
          rows={recentPayments}
          loading={loading}
          emptyText="No paid visits yet."
        />
      </section>
    </div>
  );
};

export default DoctorOverview;
