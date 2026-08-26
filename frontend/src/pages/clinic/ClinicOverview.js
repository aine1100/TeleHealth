import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/clinic/StatCard';
import TimeRangeFilter from '../../components/clinic/TimeRangeFilter';
import EngagementChart from '../../components/clinic/EngagementChart';
import ProductivityCard from '../../components/clinic/ProductivityCard';
import DistributionCard from '../../components/clinic/DistributionCard';
import RightPanel from '../../components/clinic/RightPanel';
import DataTable from '../../components/ui/DataTable';
import { clinicService } from '../../services/clinicService';
import { timeRanges } from '../../data/clinicDashboard';

const money = (value) => `UGX ${Number(value || 0).toLocaleString()}`;

const methodLabel = (method) =>
  String(method || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

const rangeToDays = (range) => {
  if (range === '7d' || range === 'Today') return 7;
  if (range === '1M' || range === '30d') return 30;
  if (range === '6M') return 90;
  if (range === '1Y') return 90;
  return 30;
};

const fallbackStats = [
  { id: 'appointments', title: 'Appointments', value: '0', change: '+0%', positive: true, detail: 'Today', detailSecondary: 'Pending', icon: 'CalendarCheck', tone: 'blue' },
  { id: 'doctors', title: 'Active doctors', value: '0', change: '+0%', positive: true, detail: 'Team', detailSecondary: 'Online', icon: 'Stethoscope', tone: 'orange' },
  { id: 'consults', title: 'Consults today', value: '0', change: '+0%', positive: true, detail: 'Care', detailSecondary: 'Volume', icon: 'Video', tone: 'rose' },
  { id: 'revenue', title: 'Revenue (week)', value: 'UGX 0', change: '+0%', positive: true, detail: 'Paid', detailSecondary: 'Visits', icon: 'Wallet', tone: 'blue' }
];

const ClinicOverview = () => {
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const days = rangeToDays(range);
        const overviewRes = await clinicService.getOverview({ range: days === 7 ? '7d' : days === 90 ? '90d' : '30d', days });
        if (!isMounted) return;

        const overview = overviewRes?.data || overviewRes || {};

        const stats = [
          {
            id: 'appointments',
            title: 'Appointments today',
            value: String(overview?.appointmentsToday || 0),
            change: `${overview?.appointmentsCount || 0} total`,
            positive: true,
            detail: 'Facility',
            detailSecondary: 'Live',
            icon: 'CalendarCheck',
            tone: 'blue'
          },
          {
            id: 'doctors',
            title: 'Active doctors',
            value: String(overview?.doctorCount || 0),
            change: `${overview?.uniquePatients || 0} patients`,
            positive: true,
            detail: 'Clinic team',
            detailSecondary: 'Assigned',
            icon: 'Stethoscope',
            tone: 'orange'
          },
          {
            id: 'consults',
            title: 'Completed today',
            value: String(overview?.consultsToday || 0),
            change: `${overview?.completedInRange || 0} in range`,
            positive: true,
            detail: 'Care volume',
            detailSecondary: 'Done',
            icon: 'Video',
            tone: 'rose'
          },
          {
            id: 'revenue',
            title: 'Revenue (week)',
            value: money(overview?.revenueWeek),
            change: money(overview?.revenueTotal),
            positive: true,
            detail: 'This week',
            detailSecondary: 'All-time paid',
            icon: 'Wallet',
            tone: 'blue'
          }
        ];

        setDashboardData({
          stats,
          appointments: overview?.appointments || [],
          invites: overview?.recentInvites || [],
          pulse: overview?.pulse || { totalToday: 0, servedToday: 0, completionRate: 0 },
          engagementData: overview?.engagementData || [],
          consultDistribution: overview?.consultDistribution || [],
          productivityBars: overview?.productivityBars || [],
          recentPayments: overview?.recentPayments || []
        });
      } catch (err) {
        if (!isMounted) return;
        setError(err?.response?.data?.message || 'Unable to load clinic dashboard data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, [range]);

  const stats = useMemo(() => dashboardData?.stats || fallbackStats, [dashboardData]);

  const paymentColumns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (_v, row) =>
        [row.patient?.firstName, row.patient?.lastName].filter(Boolean).join(' ') || 'Patient'
    },
    {
      key: 'doctor',
      label: 'Doctor',
      render: (_v, row) =>
        [row.doctor?.firstName, row.doctor?.lastName].filter(Boolean).join(' ') || '—'
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
    <div className="mx-auto max-w-[1400px] animate-fade-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Facility overview</h1>
          <p className="mt-1 text-sm text-ink-500">
            Appointments, doctor activity, completion, and paid visit revenue.
          </p>
        </div>
        <TimeRangeFilter ranges={timeRanges.filter((r) => ['7d', '30d', '6M'].includes(r))} value={range} onChange={setRange} />
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.id} {...stat} />
            ))}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-ink-200/70 bg-white p-6 text-sm text-ink-500">
              Loading your clinic dashboard...
            </div>
          ) : (
            <>
              <EngagementChart data={dashboardData?.engagementData || []} />
              <div className="grid gap-5 lg:grid-cols-2">
                <ProductivityCard
                  bars={dashboardData?.productivityBars || []}
                  doctorCount={dashboardData?.stats?.find((s) => s.id === 'doctors')?.value || 0}
                  tasksDone={dashboardData?.pulse?.servedToday || 0}
                  completionPercent={dashboardData?.pulse?.completionRate || 0}
                />
                <DistributionCard data={dashboardData?.consultDistribution || []} />
              </div>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-ink-900">Recent payments</h2>
                  <Link to="/clinic/appointments" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                    View appointments
                  </Link>
                </div>
                <DataTable
                  columns={paymentColumns}
                  rows={dashboardData?.recentPayments || []}
                  loading={loading}
                  emptyText="No paid visits yet."
                />
              </section>
            </>
          )}
        </div>

        <RightPanel
          pulse={dashboardData?.pulse || { totalToday: 0, servedToday: 0, completionRate: 0 }}
          appointments={
            dashboardData?.appointments?.slice(0, 4).map((item) => ({
              id: item._id || item.id,
              name: `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.trim() || 'Patient',
              type: item.type || 'Consultation',
              size: item.scheduledTime || 'Scheduled',
              meta: item.status || 'pending'
            })) || []
          }
          invites={
            dashboardData?.invites?.slice(0, 4).map((item) => ({
              email: item.email || item.invite?.email,
              sent: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Pending',
              status: item.status || 'Pending'
            })) || []
          }
        />
      </div>
    </div>
  );
};

export default ClinicOverview;
