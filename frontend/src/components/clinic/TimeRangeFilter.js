import React from 'react';

const TimeRangeFilter = ({ ranges, value, onChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-ink-100 p-1">
      {ranges.map((range) => {
        const active = range === value;
        return (
          <button
            key={range}
            type="button"
            onClick={() => onChange(range)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
              active
                ? 'bg-white text-ink-900 shadow-sm'
                : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
};

export default TimeRangeFilter;
