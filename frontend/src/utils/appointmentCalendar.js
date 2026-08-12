import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';

export const HOURS_START = 8;
export const HOURS_END = 18;
export const HOUR_HEIGHT = 52;

export const typeStyles = {
  video: {
    label: 'Video',
    chip: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    block: 'bg-emerald-100 border-emerald-200 text-emerald-900'
  },
  chat: {
    label: 'Chat',
    chip: 'bg-amber-100 text-amber-900 border-amber-200',
    block: 'bg-amber-100 border-amber-200 text-amber-950'
  },
  in_person: {
    label: 'In person',
    chip: 'bg-slate-200 text-slate-800 border-slate-300',
    block: 'bg-slate-200 border-slate-300 text-slate-900'
  },
  default: {
    label: 'Visit',
    chip: 'bg-sky-100 text-sky-900 border-sky-200',
    block: 'bg-sky-100 border-sky-200 text-sky-950'
  }
};

export const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-sky-50 text-sky-700',
  in_waiting_room: 'bg-violet-50 text-violet-700',
  in_progress: 'bg-brand-50 text-brand-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700',
  postponed: 'bg-orange-50 text-orange-700',
  no_show: 'bg-ink-100 text-ink-500'
};

export const parseTimeToMinutes = (time) => {
  if (!time || typeof time !== 'string') return HOURS_START * 60;
  const parts = time.trim().split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] || 0);
  if (Number.isNaN(hours)) return HOURS_START * 60;
  return hours * 60 + (Number.isNaN(minutes) ? 0 : minutes);
};

export const formatTimeLabel = (time) => {
  if (!time) return '—';
  const total = parseTimeToMinutes(time);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

export const formatHourLabel = (hour) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${String(h12).padStart(2, '0')} ${period}`;
};

export const getEventLayout = (appointment) => {
  const startMin = parseTimeToMinutes(appointment.scheduledTime);
  const duration = Math.max(Number(appointment.duration) || 30, 15);
  const endMin = startMin + duration;
  const gridStart = HOURS_START * 60;
  const top = ((startMin - gridStart) / 60) * HOUR_HEIGHT;
  const height = (duration / 60) * HOUR_HEIGHT;
  return {
    top: Math.max(top, 0),
    height: Math.max(height, 28),
    startMin,
    endMin,
    endTimeLabel: formatTimeLabel(
      `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
    )
  };
};

/** Calendar date key YYYY-MM-DD — avoids timezone shifting booked days. */
export const toDateKey = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getAppointmentDateKey = (appointment) => {
  const raw = appointment?.scheduledDate;
  if (!raw) return null;

  if (typeof raw === 'string') {
    const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }

  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

export const getAppointmentDate = (appointment) => {
  const key = getAppointmentDateKey(appointment);
  if (!key) return null;
  const [y, m, d] = key.split('-').map(Number);
  return startOfDay(new Date(y, m - 1, d));
};

export const getPatientName = (appointment) => {
  const p = appointment?.patient;
  if (!p) return 'Patient';
  if (typeof p === 'string') return 'Patient';
  return `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Patient';
};

export const getDoctorName = (appointment) => {
  const d = appointment?.doctor;
  if (!d) return 'Doctor';
  if (typeof d === 'string') return 'Doctor';
  return `Dr. ${d.firstName || ''} ${d.lastName || ''}`.trim();
};

export const getTypeStyle = (type) => typeStyles[type] || typeStyles.default;

export const buildMonthGrid = (anchorDate) => {
  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
};

export const buildWeekDays = (anchorDate) => {
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
};

export const getWeekRangeLabel = (anchorDate) => format(anchorDate, 'MMMM yyyy');

export {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfWeek,
  endOfWeek,
  subMonths
};
