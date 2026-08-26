const { User, Appointment } = require('../models');
const { sendSupportRequestEmail } = require('../utils/emailService');

const LANGUAGES = ['en', 'lg', 'sw', 'rn', 'luo', 'acholi'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const CONSULT_TYPES = ['video', 'chat', 'in_person'];

const timeOk = (value) => typeof value === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(value);
const normalizeTime = (value) => (typeof value === 'string' ? value.slice(0, 5) : value);

exports.serializeDoctorAccount = (user) => {
  const dp = user.doctorProfile || {};
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    preferredLanguage: user.preferredLanguage || 'en',
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    doctorProfile: {
      specialty: dp.specialty || '',
      subSpecialty: dp.subSpecialty || '',
      licenseNumber: dp.licenseNumber || '',
      qualifications: dp.qualifications || [],
      experience: dp.experience ?? null,
      hospital: dp.hospital || '',
      languages: dp.languages || [],
      bio: dp.bio || '',
      consultationFee: dp.consultationFee ?? 25000,
      rating: dp.rating || 0,
      reviewCount: dp.reviewCount || 0,
      isVerified: Boolean(dp.isVerified),
      isAvailable: dp.isAvailable !== false,
      availableDays: dp.availableDays || [],
      availableHours: {
        start: dp.availableHours?.start || '09:00',
        end: dp.availableHours?.end || '17:00'
      },
      consultationTypes: dp.consultationTypes?.length ? dp.consultationTypes : ['video'],
      clinicId: dp.clinicId || null
    },
    notificationSettings: {
      email: user.notificationSettings?.email !== false,
      sms: user.notificationSettings?.sms !== false,
      push: user.notificationSettings?.push !== false,
      appointmentReminders: user.notificationSettings?.appointmentReminders !== false,
      medicineReminders: user.notificationSettings?.medicineReminders !== false,
      labResults: user.notificationSettings?.labResults !== false
    }
  };
};

exports.getMyAccount = async (doctorUser) => {
  const user = await User.findById(doctorUser._id);
  if (!user || user.role !== 'doctor') {
    const error = new Error('Doctor account not found');
    error.statusCode = 404;
    throw error;
  }
  return exports.serializeDoctorAccount(user);
};

exports.updateMyProfile = async (doctorUser, payload = {}) => {
  const user = await User.findById(doctorUser._id);
  if (!user || user.role !== 'doctor') {
    const error = new Error('Doctor account not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user.doctorProfile) user.doctorProfile = {};

  if (payload.firstName !== undefined) {
    const firstName = String(payload.firstName || '').trim();
    if (!firstName) {
      const error = new Error('First name is required');
      error.statusCode = 400;
      throw error;
    }
    user.firstName = firstName;
  }
  if (payload.lastName !== undefined) {
    const lastName = String(payload.lastName || '').trim();
    if (!lastName) {
      const error = new Error('Last name is required');
      error.statusCode = 400;
      throw error;
    }
    user.lastName = lastName;
  }
  if (payload.phone !== undefined) {
    const phone = String(payload.phone || '').trim();
    if (!phone) {
      const error = new Error('Phone is required');
      error.statusCode = 400;
      throw error;
    }
    const taken = await User.findOne({ phone, _id: { $ne: user._id } });
    if (taken) {
      const error = new Error('Phone number is already in use');
      error.statusCode = 400;
      throw error;
    }
    user.phone = phone;
  }

  if (payload.specialty !== undefined) {
    const specialty = String(payload.specialty || '').trim();
    if (!specialty) {
      const error = new Error('Specialty is required');
      error.statusCode = 400;
      throw error;
    }
    user.doctorProfile.specialty = specialty;
  }
  if (payload.subSpecialty !== undefined) {
    user.doctorProfile.subSpecialty = String(payload.subSpecialty || '').trim();
  }
  if (payload.licenseNumber !== undefined) {
    user.doctorProfile.licenseNumber = String(payload.licenseNumber || '').trim();
  }
  if (payload.bio !== undefined) {
    user.doctorProfile.bio = String(payload.bio || '').trim().slice(0, 2000);
  }
  if (payload.hospital !== undefined) {
    user.doctorProfile.hospital = String(payload.hospital || '').trim();
  }
  if (payload.experience !== undefined && payload.experience !== '') {
    const exp = Number(payload.experience);
    if (Number.isNaN(exp) || exp < 0 || exp > 80) {
      const error = new Error('Experience must be a number between 0 and 80');
      error.statusCode = 400;
      throw error;
    }
    user.doctorProfile.experience = exp;
  }
  if (payload.consultationFee !== undefined && payload.consultationFee !== '') {
    const fee = Number(payload.consultationFee);
    if (Number.isNaN(fee) || fee < 0 || fee > 10000000) {
      const error = new Error('Consultation fee must be a valid amount');
      error.statusCode = 400;
      throw error;
    }
    user.doctorProfile.consultationFee = Math.round(fee);
  }
  if (Array.isArray(payload.consultationTypes)) {
    const types = payload.consultationTypes.filter((t) => CONSULT_TYPES.includes(t));
    if (!types.length) {
      const error = new Error('Select at least one consultation type');
      error.statusCode = 400;
      throw error;
    }
    user.doctorProfile.consultationTypes = types;
  }
  if (Array.isArray(payload.languages)) {
    user.doctorProfile.languages = payload.languages
      .map((l) => String(l || '').trim())
      .filter(Boolean)
      .slice(0, 12);
  }
  if (Array.isArray(payload.qualifications)) {
    user.doctorProfile.qualifications = payload.qualifications
      .map((q) => String(q || '').trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  await user.save();
  return exports.serializeDoctorAccount(user);
};

exports.updateMySchedule = async (doctorUser, payload = {}) => {
  const user = await User.findById(doctorUser._id);
  if (!user || user.role !== 'doctor') {
    const error = new Error('Doctor account not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user.doctorProfile) user.doctorProfile = {};

  if (Array.isArray(payload.availableDays)) {
    const days = payload.availableDays.filter((d) => DAYS.includes(d));
    user.doctorProfile.availableDays = days;
  }

  if (payload.availableHours && typeof payload.availableHours === 'object') {
    const start = payload.availableHours.start;
    const end = payload.availableHours.end;
    if (start !== undefined && !timeOk(start)) {
      const error = new Error('Start time must be HH:mm');
      error.statusCode = 400;
      throw error;
    }
    if (end !== undefined && !timeOk(end)) {
      const error = new Error('End time must be HH:mm');
      error.statusCode = 400;
      throw error;
    }
    if (!user.doctorProfile.availableHours) user.doctorProfile.availableHours = {};
    if (start !== undefined) user.doctorProfile.availableHours.start = normalizeTime(start);
    if (end !== undefined) user.doctorProfile.availableHours.end = normalizeTime(end);
  }

  if (typeof payload.isAvailable === 'boolean') {
    user.doctorProfile.isAvailable = payload.isAvailable;
  }

  await user.save();
  return exports.serializeDoctorAccount(user);
};

exports.updateMySettings = async (doctorUser, payload = {}) => {
  const user = await User.findById(doctorUser._id);
  if (!user || user.role !== 'doctor') {
    const error = new Error('Doctor account not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user.notificationSettings) {
    user.notificationSettings = {
      email: true,
      sms: true,
      push: true,
      appointmentReminders: true,
      medicineReminders: true,
      labResults: true
    };
  }

  if (payload.notificationSettings && typeof payload.notificationSettings === 'object') {
    ['email', 'sms', 'push', 'appointmentReminders', 'medicineReminders', 'labResults'].forEach(
      (key) => {
        if (typeof payload.notificationSettings[key] === 'boolean') {
          user.notificationSettings[key] = payload.notificationSettings[key];
        }
      }
    );
  }

  if (payload.preferredLanguage !== undefined) {
    if (!LANGUAGES.includes(payload.preferredLanguage)) {
      const error = new Error('Invalid preferred language');
      error.statusCode = 400;
      throw error;
    }
    user.preferredLanguage = payload.preferredLanguage;
  }

  if (typeof payload.isAvailable === 'boolean') {
    if (!user.doctorProfile) user.doctorProfile = {};
    user.doctorProfile.isAvailable = payload.isAvailable;
  }

  await user.save();
  return exports.serializeDoctorAccount(user);
};

exports.submitSupportRequest = async (user, { subject, message, category }) => {
  const cleanSubject = String(subject || '').trim();
  const cleanMessage = String(message || '').trim();
  const cleanCategory = String(category || 'general').trim() || 'general';

  if (!cleanSubject) {
    const error = new Error('Subject is required');
    error.statusCode = 400;
    throw error;
  }
  if (cleanSubject.length > 160) {
    const error = new Error('Subject is too long');
    error.statusCode = 400;
    throw error;
  }
  if (!cleanMessage || cleanMessage.length < 10) {
    const error = new Error('Please describe your request in at least 10 characters');
    error.statusCode = 400;
    throw error;
  }
  if (cleanMessage.length > 4000) {
    const error = new Error('Message is too long');
    error.statusCode = 400;
    throw error;
  }

  const result = await sendSupportRequestEmail({
    fromUser: {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      facilityName:
        user.organizationProfile?.organizationName ||
        user.clinicProfile?.clinicName ||
        user.pharmacyProfile?.pharmacyName ||
        user.doctorProfile?.hospital ||
        (user.role === 'admin' ? 'Super admin' : '—'),
      role: user.role
    },
    subject: cleanSubject,
    message: cleanMessage,
    category: cleanCategory
  });

  return {
    received: true,
    emailed: Boolean(result?.success),
    reference: result?.reference || null
  };
};

exports.getOverview = async (user) => {
  const doctorId = user._id;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 86400000);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
  const last14 = new Date(startOfDay);
  last14.setDate(last14.getDate() - 13);

  const base = { doctor: doctorId };

  const [
    todayCount,
    upcomingCount,
    completedWeek,
    completedMonth,
    uniquePatientsAgg,
    revenueTodayAgg,
    revenueWeekAgg,
    revenueMonthAgg,
    revenueTotalAgg,
    volumeByDayAgg,
    typeMixAgg,
    statusMixAgg,
    recentAppointments,
    recentPayments
  ] = await Promise.all([
    Appointment.countDocuments({
      ...base,
      scheduledDate: { $gte: startOfDay, $lt: endOfDay },
      status: { $nin: ['cancelled'] }
    }),
    Appointment.countDocuments({
      ...base,
      scheduledDate: { $gte: startOfDay },
      status: { $nin: ['cancelled', 'completed', 'no_show'] }
    }),
    Appointment.countDocuments({
      ...base,
      status: 'completed',
      scheduledDate: { $gte: startOfWeek }
    }),
    Appointment.countDocuments({
      ...base,
      status: 'completed',
      scheduledDate: { $gte: startOfMonth }
    }),
    Appointment.aggregate([
      { $match: base },
      { $group: { _id: '$patient' } },
      { $count: 'count' }
    ]),
    Appointment.aggregate([
      {
        $match: {
          ...base,
          'payment.status': 'paid',
          'payment.paidAt': { $gte: startOfDay }
        }
      },
      { $group: { _id: null, total: { $sum: '$payment.totalAmount' }, count: { $sum: 1 } } }
    ]),
    Appointment.aggregate([
      {
        $match: {
          ...base,
          'payment.status': 'paid',
          'payment.paidAt': { $gte: startOfWeek }
        }
      },
      { $group: { _id: null, total: { $sum: '$payment.totalAmount' }, count: { $sum: 1 } } }
    ]),
    Appointment.aggregate([
      {
        $match: {
          ...base,
          'payment.status': 'paid',
          'payment.paidAt': { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$payment.totalAmount' }, count: { $sum: 1 } } }
    ]),
    Appointment.aggregate([
      { $match: { ...base, 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$payment.totalAmount' }, count: { $sum: 1 } } }
    ]),
    Appointment.aggregate([
      { $match: { ...base, scheduledDate: { $gte: last14 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledDate' } },
          visits: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'paid'] }, { $ifNull: ['$payment.totalAmount', 0] }, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Appointment.aggregate([{ $match: base }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
    Appointment.aggregate([{ $match: base }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Appointment.find({
      ...base,
      scheduledDate: { $gte: startOfDay },
      status: { $nin: ['cancelled', 'no_show'] }
    })
      .populate('patient', 'firstName lastName phone')
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .limit(8)
      .lean(),
    Appointment.find({ ...base, 'payment.status': 'paid' })
      .populate('patient', 'firstName lastName phone')
      .select('type scheduledDate scheduledTime status payment patient')
      .sort({ 'payment.paidAt': -1, updatedAt: -1 })
      .limit(8)
      .lean()
  ]);

  const dayMap = Object.fromEntries(
    (volumeByDayAgg || []).map((row) => [
      row._id,
      { visits: row.visits || 0, completed: row.completed || 0, revenue: row.revenue || 0 }
    ])
  );
  const visitsByDay = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(startOfDay);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    visitsByDay.push({
      date: key,
      label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      visits: dayMap[key]?.visits || 0,
      completed: dayMap[key]?.completed || 0,
      revenue: dayMap[key]?.revenue || 0
    });
  }

  return {
    stats: {
      todayCount,
      upcomingCount,
      completedWeek,
      completedMonth,
      uniquePatients: uniquePatientsAgg[0]?.count || 0,
      revenueToday: revenueTodayAgg[0]?.total || 0,
      revenueWeek: revenueWeekAgg[0]?.total || 0,
      revenueMonth: revenueMonthAgg[0]?.total || 0,
      revenueTotal: revenueTotalAgg[0]?.total || 0,
      paidVisits: revenueTotalAgg[0]?.count || 0
    },
    visitsByDay,
    typeMix: (typeMixAgg || []).map((row) => ({ type: row._id || 'in_person', count: row.count || 0 })),
    statusMix: (statusMixAgg || []).map((row) => ({ status: row._id, count: row.count || 0 })),
    upcoming: recentAppointments,
    recentPayments: (recentPayments || []).map((appt) => ({
      _id: appt._id,
      patient: appt.patient,
      type: appt.type,
      status: appt.status,
      scheduledDate: appt.scheduledDate,
      scheduledTime: appt.scheduledTime,
      amount: appt.payment?.totalAmount || 0,
      method: appt.payment?.method || '',
      transactionId: appt.payment?.transactionId || '',
      paidAt: appt.payment?.paidAt || null
    }))
  };
};
