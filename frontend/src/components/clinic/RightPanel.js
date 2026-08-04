import React from 'react';
import { Link } from 'react-router-dom';
import { Copy, Download, Upload } from 'lucide-react';

const RightPanel = ({ pulse = {}, appointments = [], invites = [] }) => {
  const servedToday = Number(pulse?.servedToday || 0);
  const totalToday = Number(pulse?.totalToday || 0);
  const completionRate = Number(pulse?.completionRate || 0);
  const hasPulseData = servedToday > 0 || totalToday > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-ink-900">Facility pulse</h3>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600">
            Live
          </span>
        </div>
        <p className="mt-4 text-sm text-ink-500">Appointment handling progress</p>
        {hasPulseData ? (
          <>
            <p className="mt-1 text-sm font-semibold text-ink-900">
              {servedToday} of {totalToday} served today
            </p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{
                  width: `${Math.min(100, completionRate)}%`,
                  backgroundImage:
                    'repeating-linear-gradient(135deg, rgba(255,255,255,0.25) 0 8px, transparent 8px 16px)'
                }}
              />
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-500">No appointment data yet</p>
        )}
      </div>

      <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
        <h3 className="text-base font-bold text-ink-900">Recent appointments</h3>
        <div className="mt-4 space-y-3">
          {appointments.length > 0 ? (
            appointments.map((item) => {
              const initials = (item.name || 'Patient').split(' ').map((part) => part[0]).join('').slice(0, 2);
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-700">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {item.id ? `${item.id} · ` : ''}{item.name || 'Patient'}
                    </p>
                    <p className="truncate text-xs text-ink-500">
                      {item.type || 'Consultation'} · {item.size || 'Scheduled'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-ink-400">{item.meta || 'pending'}</p>
                    <button type="button" className="mt-1 text-ink-400 hover:text-ink-700">
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-ink-500">No appointments yet</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
        <h3 className="text-base font-bold text-ink-900">Doctor invites</h3>
        <div className="mt-4 space-y-3">
          {invites.length > 0 ? (
            invites.map((invite) => (
              <div key={invite.email} className="rounded-xl bg-ink-100/80 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-ink-900">{invite.email}</p>
                  <button type="button" className="text-ink-400 hover:text-ink-700">
                    <Copy size={14} />
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-ink-500">
                  <span>{invite.sent}</span>
                  <span
                    className={
                      invite.status === 'Accepted' || invite.status === 'accepted'
                        ? 'font-semibold text-emerald-600'
                        : 'font-semibold text-amber-600'
                    }
                  >
                    {invite.status || 'Pending'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-500">No invites yet</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-5">
        <p className="text-sm font-semibold text-ink-900">Invite a doctor</p>
        <p className="mt-1 text-xs leading-5 text-ink-500">
          Send an email invite and let them set up their own account.
        </p>
        <Link
          to="/clinic/doctors"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Upload size={15} />
          Invite doctor
        </Link>
      </div>
    </div>
  );
};

export default RightPanel;
