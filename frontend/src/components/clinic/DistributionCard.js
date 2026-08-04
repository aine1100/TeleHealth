import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

const palette = ['#0b74ff', '#22c55e', '#f59e0b'];

const DistributionCard = ({ data = [] }) => {
  const normalizedData = (data || []).map((entry, index) => ({
    name: entry.name || entry.label || `Item ${index + 1}`,
    value: Number(entry.value) || 0,
    color: entry.color || palette[index % palette.length]
  }));
  const hasData = normalizedData.some((item) => item.value > 0);
  const total = normalizedData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink-900">Consultations by type</h3>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-bold text-ink-900">{total}</p>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
              Live data
            </span>
          </div>
        </div>
      </div>

      {hasData ? (
        <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
          <div className="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={normalizedData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={3}
                  stroke="none"
                >
                  {normalizedData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full space-y-3">
            {normalizedData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-ink-500">{item.name}</span>
                </div>
                <span className="font-semibold text-ink-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-ink-200 bg-ink-50 text-sm text-ink-500">
          No data available
        </div>
      )}
    </div>
  );
};

export default DistributionCard;
