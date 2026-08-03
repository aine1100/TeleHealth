import React from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const ProductivityCard = ({ bars }) => {
  const activeIndex = 3;

  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink-900">Team productivity</h3>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500">
            <p>
              Doctors: <span className="font-semibold text-ink-900">18</span>
            </p>
            <p>
              Tasks done: <span className="font-semibold text-ink-900">1,201</span>
            </p>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
              -3.4%
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <p className="text-3xl font-bold text-ink-900">82%</p>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
              +8.1%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{
                borderRadius: 8,
                border: 'none',
                background: '#0f172a',
                color: '#fff',
                fontSize: 12
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={14}>
              {bars.map((entry, index) => (
                <Cell
                  key={entry.label}
                  fill={index === activeIndex ? '#0b74ff' : '#e2e8f0'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProductivityCard;
