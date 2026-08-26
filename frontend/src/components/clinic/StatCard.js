import React from 'react';
import { CalendarCheck, Stethoscope, Video, Wallet } from 'lucide-react';

const iconMap = {
  CalendarCheck,
  Stethoscope,
  Video,
  Wallet
};

const toneStyles = {
  blue: 'bg-brand-50 text-brand-600',
  orange: 'bg-orange-50 text-orange-500',
  rose: 'bg-rose-50 text-rose-500'
};

const StatCard = ({ title, value, change, positive, detail, detailSecondary, icon, tone = 'blue' }) => {
  const Icon = iconMap[icon] || CalendarCheck;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneStyles[tone]}`}>
          <Icon size={20} />
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}
        >
          {change}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-ink-500">{title}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-ink-900">{value}</p>

      <div className="mt-auto flex gap-4 border-t border-ink-100 pt-3 text-xs text-ink-500">
        <p>{detail}</p>
        <p>{detailSecondary}</p>
      </div>
    </div>
  );
};

export default StatCard;
