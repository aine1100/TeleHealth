import React, { useEffect, useMemo, useState } from 'react';
import StatCard from '../../components/clinic/StatCard';
import TimeRangeFilter from '../../components/clinic/TimeRangeFilter';
import EngagementChart from '../../components/clinic/EngagementChart';
import ProductivityCard from '../../components/clinic/ProductivityCard';
import DistributionCard from '../../components/clinic/DistributionCard';
import RightPanel from '../../components/clinic/RightPanel';
import { clinicService } from '../../services/clinicService';
import { timeRanges } from '../../data/clinicDashboard';

const fallbackStats = [
  { id: 'appointments', title: 'Appointments', value: '0', change: '+0%', positive: true, detail: 'Today', detailSecondary: 'Pending', icon: 'CalendarCheck', tone: 'blue' },
  { id: 'doctors', title: 'Active doctors', value: '0', change: '+0%', positive: true, detail: 'Team', detailSecondary: 'Online', icon: 'Stethoscope', tone: 'orange' },
  { id: 'consults', title: 'Consults today', value: '0', change: '+0%', positive: true, detail: 'Care', detailSecondary: 'Volume', icon: 'Video', tone: 'rose' }
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
        const [overviewRes, doctorsRes, appointmentsRes, seatsRes] = await Promise.all([
          clinicService.getOverview().catch(() => null),
          clinicService.getDoctors().catch(() => null),
          clinicService.getAppointments().catch(() => null),
          clinicService.getSeatUsage().catch(() => null)
        ]);

        if (!isMounted) return;

        const overview = overviewRes?.data || overviewRes || {};
        const doctors = doctorsRes?.data || [];
        const appointments = appointmentsRes?.data || [];
        const seats = seatsRes?.data || {};

        const stats = [
          {
            id: 'appointments',
            title: 'Appointments',
            value: String(appointments.length || overview?.appointmentsCount || 0),
            change: '+0%',
            positive: true,
            detail: 'Recorded',
            detailSecondary: 'Today',
            icon: 'CalendarCheck',
            tone: 'blue'
          },
          {
            id: 'doctors',
            title: 'Active doctors',
            value: String(doctors.length || seats?.activeDoctors || 0),
            change: '+0%',
            positive: true,
            detail: 'Clinic team',
            detailSecondary: 'Assigned',
            icon: 'Stethoscope',
            tone: 'orange'
          },
          {
            id: 'consults',
            title: 'Consults today',
            value: String(overview?.consultsToday || appointments.filter((item) => item.status === 'confirmed').length || 0),
            change: '+0%',
            positive: true,
            detail: 'Care volume',
            detailSecondary: 'Live',
            icon: 'Video',
            tone: 'rose'
          }
        ];

        setDashboardData({
          stats,
          appointments,
          invites: overview?.recentInvites || [],
          pulse: overview?.pulse || { totalToday: 0, servedToday: 0, completionRate: 0 },
          engagementData: overview?.engagementData || [],
          consultDistribution: overview?.consultDistribution || [],
          productivityBars: overview?.productivityBars || []
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
  }, []);

  const stats = useMemo(() => dashboardData?.stats || fallbackStats, [dashboardData]);

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Facility overview</h1>
          <p className="mt-1 text-sm text-ink-500">
            Track appointments, doctor activity, and care delivery at a glance.
          </p>
        </div>
        <TimeRangeFilter ranges={timeRanges} value={range} onChange={setRange} />
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                  doctorCount={dashboardData?.stats?.[1]?.value || 0}
                  tasksDone={dashboardData?.pulse?.servedToday || 0}
                  completionPercent={dashboardData?.pulse?.completionRate || 0}
                />
                <DistributionCard data={dashboardData?.consultDistribution || []} />
              </div>
            </>
          )}
        </div>

        <RightPanel
          pulse={dashboardData?.pulse || { totalToday: 0, servedToday: 0, completionRate: 0 }}
          appointments={dashboardData?.appointments?.slice(0, 4).map((item) => ({
            id: item._id || item.id,
            name: `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.trim() || 'Patient',
            type: item.type || 'Consultation',
            size: item.scheduledTime || 'Scheduled',
            meta: item.status || 'pending'
          })) || []}
          invites={dashboardData?.invites?.slice(0, 4).map((item) => ({
            email: item.email || item.invite?.email,
            sent: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Pending',
            status: item.status || 'Pending'
          })) || []}
        />
      </div>
    </div>
  );
};

export default ClinicOverview;
