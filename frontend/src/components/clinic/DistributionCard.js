import React, { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

const DistributionCard = ({ data }) => {
  const [open, setOpen] = useState(false);
  const [department, setDepartment] = useState('All departments');
  const departments = ['All departments', 'General Practice', 'Pediatrics', 'Cardiology'];

  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink-900">Consultations by type</h3>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-bold text-ink-900">12,200</p>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
              +11.2%
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-xl border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700"
          >
            {department}
            <ChevronDown size={14} />
          </button>
          {open ? (
            <div className="absolute right-0 z-10 mt-2 w-44 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-card">
              {departments.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs text-ink-700 hover:bg-ink-100"
                  onClick={() => {
                    setDepartment(item);
                    setOpen(false);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
        <div className="h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={70}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full space-y-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                <span className="text-ink-500">{item.name}</span>
              </div>
              <span className="font-semibold text-ink-900">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DistributionCard;
