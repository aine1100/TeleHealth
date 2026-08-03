import React, { useState } from 'react';
import StatCard from '../../components/clinic/StatCard';
import TimeRangeFilter from '../../components/clinic/TimeRangeFilter';
import EngagementChart from '../../components/clinic/EngagementChart';
import ProductivityCard from '../../components/clinic/ProductivityCard';
import DistributionCard from '../../components/clinic/DistributionCard';
import RightPanel from '../../components/clinic/RightPanel';
import {
  consultDistribution,
  engagementData,
  overviewStats,
  productivityBars,
  recentAppointments,
  recentInvites,
  timeRanges
} from '../../data/clinicDashboard';

const ClinicOverview = () => {
  const [range, setRange] = useState('30d');

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

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {overviewStats.map((stat) => (
              <StatCard key={stat.id} {...stat} />
            ))}
          </div>

          <EngagementChart data={engagementData} />

          <div className="grid gap-5 lg:grid-cols-2">
            <ProductivityCard bars={productivityBars} />
            <DistributionCard data={consultDistribution} />
          </div>
        </div>

        <RightPanel appointments={recentAppointments} invites={recentInvites} />
      </div>
    </div>
  );
};

export default ClinicOverview;
