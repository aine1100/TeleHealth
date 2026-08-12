import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock3, RefreshCw } from 'lucide-react';
import {
  HOUR_HEIGHT,
  HOURS_END,
  HOURS_START,
  addDays,
  addMonths,
  buildMonthGrid,
  buildWeekDays,
  format,
  formatHourLabel,
  formatTimeLabel,
  getAppointmentDateKey,
  getEventLayout,
  getTypeStyle,
  getWeekRangeLabel,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  statusStyles,
  subMonths,
  toDateKey
} from '../../utils/appointmentCalendar';

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'video', label: 'Video' },
  { id: 'in_person', label: 'In person' },
  { id: 'chat', label: 'Chat' }
];

const hourSlots = Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, i) => HOURS_START + i);

const AppointmentCalendarView = ({
  appointments,
  loading,
  onRefresh,
  title = 'Appointments',
  subtitle = 'Your consultation calendar.',
  getParticipantName,
  getParticipantSubtitle,
  getParticipantInitials,
  bookLink,
  detailPathPrefix
}) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [monthCursor, setMonthCursor] = useState(() => startOfDay(new Date()));
  const [weekCursor, setWeekCursor] = useState(() => startOfDay(new Date()));
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return appointments;
    return appointments.filter((item) => item.type === typeFilter);
  }, [appointments, typeFilter]);

  const selectedDayAppointments = useMemo(() => {
    const selectedKey = toDateKey(selectedDate);
    return filtered
      .filter((item) => getAppointmentDateKey(item) === selectedKey)
      .sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));
  }, [filtered, selectedDate]);

  const weekDays = useMemo(() => buildWeekDays(weekCursor), [weekCursor]);
  const monthDays = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);

  const appointmentsByDayKey = useMemo(() => {
    const map = new Map();
    filtered.forEach((item) => {
      const key = getAppointmentDateKey(item);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }, [filtered]);

  const openDetail = (appt) => {
    if (!detailPathPrefix || !appt?._id) return;
    navigate(`${detailPathPrefix.replace(/\/$/, '')}/${appt._id}`);
  };

  const goToday = () => {
    const today = startOfDay(new Date());
    setSelectedDate(today);
    setWeekCursor(today);
    setMonthCursor(today);
  };

  const selectDay = (day) => {
    setSelectedDate(day);
    setWeekCursor(day);
    setMonthCursor(day);
  };

  const shiftWeek = (dir) => {
    const next = addDays(weekCursor, dir * 7);
    setWeekCursor(next);
    setSelectedDate(next);
    setMonthCursor(next);
  };

  const renderSidebarCard = (appt) => {
    const layout = getEventLayout(appt);
    const style = getTypeStyle(appt.type);
    const statusClass = statusStyles[appt.status] || statusStyles.pending;

    return (
      <button
        key={appt._id}
        type="button"
        onClick={() => openDetail(appt)}
        className="w-full rounded-2xl border border-ink-100 bg-ink-50/60 px-3 py-2.5 text-left transition hover:border-brand-200 hover:bg-brand-50/40 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-ink-700 shadow-sm">
            {getParticipantInitials(appt)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{getParticipantName(appt)}</p>
            <p className="truncate text-[11px] text-ink-500">
              {getParticipantSubtitle ? getParticipantSubtitle(appt) : style.label}
            </p>
            <span className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold capitalize ${statusClass}`}>
              {(appt.status || 'pending').replace(/_/g, ' ')}
            </span>
          </div>
          <div className="shrink-0 text-right">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-600">
              <Clock3 size={11} />
              {formatTimeLabel(appt.scheduledTime)}
            </p>
            <p className="text-[10px] text-ink-400">– {layout.endTimeLabel}</p>
          </div>
        </div>
        <p className="mt-2 text-[10px] font-medium text-brand-600">Open details →</p>
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-[1500px] animate-fade-up">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
          <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {bookLink ? (
            <Link
              to={bookLink.to}
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-600"
            >
              {bookLink.label}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-ink-200/70 bg-white p-4 shadow-card">
            <p className="text-sm font-bold text-ink-900">Appointment calendar</p>
            <div className="mt-4 flex items-center justify-between">
              <button type="button" onClick={() => setMonthCursor((d) => subMonths(d, 1))} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100">
                <ChevronLeft size={16} />
              </button>
              <p className="text-sm font-semibold text-ink-800">{format(monthCursor, 'MMMM yyyy')}</p>
              <button type="button" onClick={() => setMonthCursor((d) => addMonths(d, 1))} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100">
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-400">
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const key = toDateKey(day);
                const hasAppts = (appointmentsByDayKey.get(key) || []).length > 0;
                const selected = isSameDay(day, selectedDate);
                const inMonth = isSameMonth(day, monthCursor);
                const today = isToday(day);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={`relative flex h-9 items-center justify-center rounded-full text-xs font-semibold transition ${
                      selected
                        ? 'bg-brand-500 text-white shadow-sm'
                        : today
                          ? 'bg-brand-50 text-brand-700'
                          : inMonth
                            ? 'text-ink-700 hover:bg-ink-100'
                            : 'text-ink-300 hover:bg-ink-50'
                    }`}
                  >
                    {format(day, 'd')}
                    {hasAppts && !selected ? (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-brand-500" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-ink-200/70 bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink-900">Appointment list</p>
              <p className="text-[11px] font-medium text-ink-400">{format(selectedDate, 'd MMM')}</p>
            </div>
            <div className="mt-3 space-y-2">
              {loading ? (
                <p className="py-8 text-center text-sm text-ink-500">Loading…</p>
              ) : selectedDayAppointments.length ? (
                selectedDayAppointments.map(renderSidebarCard)
              ) : (
                <p className="py-8 text-center text-sm text-ink-500">No appointments this day.</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setWeekCursor(selectedDate)}
              className="mt-4 w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              See week view
            </button>
          </div>
        </aside>

        <section className="overflow-hidden rounded-3xl border border-ink-200/70 bg-white shadow-card">
          <div className="flex flex-col gap-3 border-b border-ink-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
                {getWeekRangeLabel(weekCursor)}
              </h2>
              <div className="ml-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={goToday}
                  className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                >
                  Today
                </button>
                <button type="button" onClick={() => shiftWeek(-1)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={() => shiftWeek(1)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {TYPE_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setTypeFilter(filter.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    typeFilter === filter.id
                      ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200/70'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <p className="border-b border-ink-50 px-4 py-2 text-xs text-ink-500 sm:px-6">
            Click any appointment to open the full details page.
          </p>

          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-ink-100">
                <div className="px-2 py-3 text-[10px] font-semibold uppercase tracking-wide text-ink-400">GMT+2</div>
                {weekDays.map((day) => {
                  const selected = isSameDay(day, selectedDate);
                  const today = isToday(day);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={`border-l border-ink-100 px-2 py-3 text-center transition hover:bg-ink-50 ${
                        selected ? 'bg-brand-50/50' : ''
                      }`}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">{format(day, 'EEE')}</p>
                      <p
                        className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          selected ? 'bg-brand-500 text-white' : today ? 'bg-brand-50 text-brand-700' : 'text-ink-800'
                        }`}
                      >
                        {format(day, 'd')}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="relative grid grid-cols-[64px_repeat(7,minmax(0,1fr))]">
                <div>
                  {hourSlots.map((hour) => (
                    <div key={hour} style={{ height: HOUR_HEIGHT }} className="border-b border-ink-50 px-2 pt-1 text-[10px] font-semibold text-ink-400">
                      {formatHourLabel(hour)}
                    </div>
                  ))}
                </div>
                {weekDays.map((day) => {
                  const key = toDateKey(day);
                  const dayAppts = appointmentsByDayKey.get(key) || [];
                  return (
                    <div
                      key={key}
                      className={`relative overflow-hidden border-l border-ink-100 ${isSameDay(day, selectedDate) ? 'bg-brand-50/20' : ''}`}
                      style={{ height: hourSlots.length * HOUR_HEIGHT }}
                    >
                      {hourSlots.map((hour) => (
                        <div key={`${key}-${hour}`} style={{ height: HOUR_HEIGHT }} className="border-b border-ink-50" />
                      ))}
                      {dayAppts.map((appt) => {
                        const layout = getEventLayout(appt);
                        if (layout.endMin <= HOURS_START * 60 || layout.startMin >= (HOURS_END + 1) * 60) return null;
                        const style = getTypeStyle(appt.type);
                        const statusClass = statusStyles[appt.status] || statusStyles.pending;
                        return (
                          <button
                            key={`${key}-${appt._id}`}
                            type="button"
                            onClick={() => openDetail(appt)}
                            title="View appointment details"
                            className={`absolute left-1 right-1 overflow-hidden rounded-xl border px-2 py-1.5 text-left shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${style.block}`}
                            style={{ top: layout.top, height: layout.height, minHeight: 36 }}
                          >
                            <p className="truncate text-[11px] font-bold leading-tight">{getParticipantName(appt)}</p>
                            <p className="mt-0.5 truncate text-[10px] font-medium opacity-80">
                              {formatTimeLabel(appt.scheduledTime)} · {style.label}
                            </p>
                            {layout.height > 48 ? (
                              <span className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold capitalize ${statusClass}`}>
                                {(appt.status || 'pending').replace(/_/g, ' ')}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AppointmentCalendarView;
