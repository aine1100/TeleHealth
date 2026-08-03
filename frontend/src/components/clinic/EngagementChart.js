import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white shadow-lg">
      {payload[0].payload.value} consults
    </div>
  );
};

const EngagementChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(7);

  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-ink-900">Care volume over time</h3>
          <p className="mt-1 text-sm text-ink-500">
            Monthly consultations completed across your facility.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className="flex items-center gap-2 sm:justify-end">
            <p className="text-3xl font-bold tracking-tight text-ink-900">72.4%</p>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
              +23.4%
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-500">Average utilisation</p>
        </div>
      </div>

      <div className="mt-6 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, left: -18, bottom: 0 }}
            onMouseMove={(state) => {
              if (state?.activeTooltipIndex != null) setActiveIndex(state.activeTooltipIndex);
            }}
          >
            <CartesianGrid vertical={false} stroke="#eef2f7" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis hide />
            <Tooltip cursor={{ fill: 'rgba(11,116,255,0.06)' }} content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              radius={[8, 8, 8, 8]}
              barSize={22}
              background={{ fill: '#eef2f7', radius: 8 }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.label}
                  fill={index === activeIndex ? '#0f172a' : '#475569'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EngagementChart;
