import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ClipboardList, FlaskConical } from 'lucide-react';
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
import { labService } from '../../services/labService';

const LabOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [volumeByDay, setVolumeByDay] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await labService.getOverview();
        if (!mounted) return;
        setStats(res?.data?.stats || {});
        setVolumeByDay(res?.data?.volumeByDay || []);
        setRecentOrders(res?.data?.recentOrders || []);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to load overview');
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
    { title: 'Open pool', value: stats.openPool || 0, detail: 'Unassigned orders', icon: ClipboardList, to: '/lab/orders?status=pool' },
    { title: 'In progress', value: stats.myOpen || 0, detail: 'Assigned to you', icon: FlaskConical, to: '/lab/orders' },
    { title: 'Done today', value: stats.completedToday || 0, detail: `${stats.completedWeek || 0} this week`, icon: CheckCircle2, to: '/lab/orders?status=completed' },
    { title: 'Urgent', value: stats.urgentOpen || 0, detail: 'Needs attention', icon: AlertTriangle, to: '/lab/orders' }
  ];

  const columns = [
    {
      key: 'testName',
      label: 'Test',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-ink-900">{value}</p>
          <p className="text-xs text-ink-500">{row.testCode || '—'}</p>
        </div>
      )
    },
    {
      key: 'patient',
      label: 'Patient',
      render: (_v, row) => [row.patient?.firstName, row.patient?.lastName].filter(Boolean).join(' ') || '—'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-ink-700">
          {String(value || '').replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => (value === 'urgent' ? 'Urgent' : 'Routine')
    }
  ];

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Lab overview</h1>
        <p className="mt-1 text-sm text-ink-500">Accept orders, process samples, and publish results.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.title} to={kpi.to} className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card hover:border-brand-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{kpi.title}</p>
                <p className="mt-1 text-xl font-bold text-ink-900">{loading ? '…' : kpi.value}</p>
                <p className="mt-1 text-xs text-ink-500">{kpi.detail}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <kpi.icon size={18} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
          <h2 className="text-sm font-bold text-ink-900">Order volume · 14 days</h2>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeByDay}>
                <defs>
                  <linearGradient id="labVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B74FF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0B74FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="orders" stroke="#0B74FF" fill="url(#labVol)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-900">Recent orders</h2>
            <Link to="/lab/orders" className="text-xs font-semibold text-brand-600">
              View all
            </Link>
          </div>
          <DataTable columns={columns} rows={recentOrders} loading={loading} emptyText="No lab orders yet." />
        </div>
      </div>
    </div>
  );
};

export default LabOverview;
