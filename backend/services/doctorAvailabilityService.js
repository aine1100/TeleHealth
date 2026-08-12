const { Appointment, User } = require('../models');

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const SLOT_DURATION = 30;
const BLOCKING_STATUSES = ['pending', 'confirmed', 'in_waiting_room', 'in_progress'];

const parseTimeToMinutes = (time) => {
  if (!time || typeof time !== 'string') return 9 * 60;
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours)) return 9 * 60;
  return hours * 60 + (Number.isNaN(minutes) ? 0 : minutes);
};

const formatMinutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const toDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfLocalDay = (value) => {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (date, count) => {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
};

const buildSlotsForDay = (startMin, endMin, bookedMinutes) => {
  const slots = [];
  for (let slot = startMin; slot + SLOT_DURATION <= endMin; slot += SLOT_DURATION) {
    if (!bookedMinutes.has(slot)) {
      slots.push(formatMinutesToTime(slot));
    }
  }
  return slots;
};

const getDoctorSchedule = (doctor) => ({
  availableDays: doctor.doctorProfile?.availableDays?.length
    ? doctor.doctorProfile.availableDays
    : ['mon', 'tue', 'wed', 'thu', 'fri'],
  availableHours: {
    start: doctor.doctorProfile?.availableHours?.start || '09:00',
    end: doctor.doctorProfile?.availableHours?.end || '17:00'
  }
});

exports.getDoctorAvailability = async (doctorId, { fromDate, days = 14 } = {}) => {
  const doctor = await User.findById(doctorId).select(
    'role doctorProfile.availableDays doctorProfile.availableHours doctorProfile.isAvailable'
  );

  if (!doctor || doctor.role !== 'doctor') {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    throw error;
  }

  const schedule = getDoctorSchedule(doctor);
  const startMin = parseTimeToMinutes(schedule.availableHours.start);
  const endMin = parseTimeToMinutes(schedule.availableHours.end);
  const rangeStart = startOfLocalDay(fromDate || new Date());
  const rangeEnd = addDays(rangeStart, Math.max(Number(days) || 14, 1) - 1);
  rangeEnd.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    doctor: doctorId,
    scheduledDate: { $gte: rangeStart, $lte: rangeEnd },
    status: { $in: BLOCKING_STATUSES }
  }).select('scheduledDate scheduledTime');

  const bookedByDate = new Map();
  appointments.forEach((appt) => {
    const key = toDateKey(appt.scheduledDate);
    if (!key) return;
    if (!bookedByDate.has(key)) bookedByDate.set(key, new Set());
    bookedByDate.get(key).add(parseTimeToMinutes(appt.scheduledTime));
  });

  const dayCount = Math.max(Number(days) || 14, 1);
  const availabilityDays = [];

  for (let offset = 0; offset < dayCount; offset += 1) {
    const day = addDays(rangeStart, offset);
    const dayKey = DAY_KEYS[day.getDay()];
    if (!schedule.availableDays.includes(dayKey)) continue;

    const date = toDateKey(day);
    const slots = buildSlotsForDay(startMin, endMin, bookedByDate.get(date) || new Set());
    if (slots.length) {
      availabilityDays.push({ date, slots });
    }
  }

  return {
    doctorId,
    slotDurationMinutes: SLOT_DURATION,
    schedule,
    days: availabilityDays
  };
};

exports.assertSlotAvailable = async (doctorId, scheduledDate, scheduledTime) => {
  const dateKey = toDateKey(scheduledDate);
  if (!dateKey) {
    const error = new Error('Invalid appointment date');
    error.statusCode = 400;
    throw error;
  }

  const normalizedTime = formatMinutesToTime(parseTimeToMinutes(scheduledTime));
  const availability = await exports.getDoctorAvailability(doctorId, {
    fromDate: dateKey,
    days: 1
  });

  const day = availability.days.find((entry) => entry.date === dateKey);
  if (!day || !day.slots.includes(normalizedTime)) {
    const error = new Error('Selected time is no longer available. Pick another slot.');
    error.statusCode = 409;
    throw error;
  }

  return normalizedTime;
};

module.exports.SLOT_DURATION = SLOT_DURATION;
