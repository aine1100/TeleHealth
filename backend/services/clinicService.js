const { User, Appointment, DoctorInvite } = require('../models');

exports.getDoctorDetail = async (doctorId, clinicId) => {
  const doctor = await User.findOne({
    _id: doctorId,
    role: 'doctor',
    ...(clinicId ? { 'doctorProfile.clinicId': clinicId } : {})
  }).select(
    'firstName lastName email phone role doctorProfile avatar createdAt isActive isEmailVerified lastLogin'
  );

  if (!doctor) {
    const error = new Error('Doctor not found in your facility');
    error.statusCode = 404;
    throw error;
  }

  const [appointments, appointmentsCount, completedCount] = await Promise.all([
    Appointment.find({ doctor: doctorId, ...(clinicId ? { clinic: clinicId } : {}) })
      .populate('patient', 'firstName lastName email phone avatar')
      .sort({ scheduledDate: -1 })
      .limit(10),
    Appointment.countDocuments({ doctor: doctorId, ...(clinicId ? { clinic: clinicId } : {}) }),
    Appointment.countDocuments({
      doctor: doctorId,
      status: 'completed',
      ...(clinicId ? { clinic: clinicId } : {})
    })
  ]);

  return {
    doctor,
    stats: {
      consultations: appointmentsCount,
      completed: completedCount,
      upcoming: Math.max(0, appointmentsCount - completedCount)
    },
    recentAppointments: appointments
  };
};

exports.createClinicAppointment = async ({ clinicId, doctorId, patientId, scheduledDate, scheduledTime, type, paymentAmount }) => {
  if (!doctorId || !patientId || !scheduledDate || !scheduledTime || !type) {
    const error = new Error('Missing required appointment fields');
    error.statusCode = 400;
    throw error;
  }

  const doctor = await User.findById(doctorId);
  const patient = await User.findById(patientId);

  if (!doctor || doctor.role !== 'doctor') {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    throw error;
  }

  if (!patient || patient.role !== 'patient') {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const appointment = new Appointment({
    patient: patient._id,
    doctor: doctor._id,
    clinic: clinicId,
    type,
    scheduledDate,
    scheduledTime,
    payment: {
      amount: paymentAmount || 25000,
      totalAmount: paymentAmount || 25000,
      status: 'pending',
      currency: 'UGX'
    },
    createdBy: clinicId
  });

  await appointment.save();
  await appointment.populate('patient doctor', 'firstName lastName phone avatar');

  return appointment;
};

exports.getClinicAppointments = async (clinicId, { from, to, status } = {}) => {
  const filter = { clinic: clinicId };

  if (from || to) {
    filter.scheduledDate = {};
    if (from) filter.scheduledDate.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.scheduledDate.$lte = end;
    }
  }

  if (status && status !== 'all') {
    filter.status = status;
  }

  return Appointment.find(filter)
    .populate('patient doctor', 'firstName lastName phone avatar email doctorProfile')
    .sort({ scheduledDate: 1, scheduledTime: 1 });
};

exports.listClinicDoctors = async (clinicId) => {
  return User.find({ role: 'doctor', 'doctorProfile.clinicId': clinicId })
    .select('firstName lastName email phone doctorProfile avatar createdAt isActive isEmailVerified')
    .sort({ createdAt: -1 });
};

exports.listClinicTeam = async (clinicId) => {
  const [doctors, invites] = await Promise.all([
    exports.listClinicDoctors(clinicId),
    DoctorInvite.find({ clinicId }).sort({ createdAt: -1 })
  ]);

  const now = new Date();
  for (const invite of invites) {
    // Only auto-expire when an expiresAt is set in the past
    if (invite.status === 'pending' && invite.expiresAt && invite.expiresAt < now) {
      invite.status = 'expired';
      await invite.save();
    }
  }

  return { doctors, invites };
};

exports.listClinicPatients = async (clinicId) => {
  const appointments = await Appointment.find({ clinic: clinicId })
    .populate('patient doctor', 'firstName lastName email phone avatar')
    .sort({ scheduledDate: -1 });

  const patientsMap = new Map();
  for (const appointment of appointments) {
    const patient = appointment.patient;
    if (!patient) continue;

    const record = patientsMap.get(patient._id.toString()) || {
      id: patient._id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      doctor: appointment.doctor ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}` : '—',
      visits: 0,
      age: patient.dateOfBirth ? Math.max(0, new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()) : '—',
      gender: patient.gender || '—',
      lastVisit: appointment.scheduledDate ? new Date(appointment.scheduledDate).toLocaleDateString() : '—',
      status: appointment.status === 'completed' ? 'active' : 'new'
    };

    record.visits += 1;
    if (appointment.scheduledDate && new Date(appointment.scheduledDate) > new Date(record.lastVisit)) {
      record.lastVisit = new Date(appointment.scheduledDate).toLocaleDateString();
    }
    patientsMap.set(patient._id.toString(), record);
  }

  return Array.from(patientsMap.values());
};

exports.getDashboardOverview = async (clinicId, { rangeDays = 30 } = {}) => {
  const days = Math.min(90, Math.max(7, Number(rangeDays) || 30));
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const rangeStart = new Date(startOfDay);
  rangeStart.setDate(rangeStart.getDate() - (days - 1));
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  const doctorFilter = { role: 'doctor', 'doctorProfile.clinicId': clinicId };
  const apptFilter = { clinic: clinicId, scheduledDate: { $gte: rangeStart } };

  const [
    appointments,
    doctors,
    recentInvites,
    totalAppointments,
    appointmentsToday,
    completedToday,
    completedInRange,
    uniquePatientsAgg,
    volumeByDayAgg,
    typeMixAgg,
    revenueAgg,
    revenueTodayAgg,
    revenueWeekAgg,
    recentPayments
  ] = await Promise.all([
    Appointment.find({ clinic: clinicId })
      .populate('patient doctor', 'firstName lastName phone avatar')
      .sort({ scheduledDate: -1 })
      .limit(10)
      .lean(),
    User.find(doctorFilter)
      .select('firstName lastName email phone doctorProfile avatar')
      .sort({ createdAt: -1 })
      .limit(12)
      .lean(),
    require('../models').DoctorInvite.find({ clinicId, status: 'pending' }).sort({ createdAt: -1 }).limit(4).lean(),
    Appointment.countDocuments({ clinic: clinicId }),
    Appointment.countDocuments({
      clinic: clinicId,
      scheduledDate: { $gte: startOfDay, $lt: new Date(startOfDay.getTime() + 86400000) }
    }),
    Appointment.countDocuments({
      clinic: clinicId,
      status: 'completed',
      scheduledDate: { $gte: startOfDay, $lt: new Date(startOfDay.getTime() + 86400000) }
    }),
    Appointment.countDocuments({
      clinic: clinicId,
      status: 'completed',
      scheduledDate: { $gte: rangeStart }
    }),
    Appointment.aggregate([
      { $match: { clinic: clinicId } },
      { $group: { _id: '$patient' } },
      { $count: 'count' }
    ]),
    Appointment.aggregate([
      { $match: apptFilter },
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
    Appointment.aggregate([
      { $match: { clinic: clinicId, scheduledDate: { $gte: rangeStart } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    Appointment.aggregate([
      { $match: { clinic: clinicId, 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$payment.totalAmount' }, count: { $sum: 1 } } }
    ]),
    Appointment.aggregate([
      {
        $match: {
          clinic: clinicId,
          'payment.status': 'paid',
          'payment.paidAt': { $gte: startOfDay }
        }
      },
      { $group: { _id: null, total: { $sum: '$payment.totalAmount' }, count: { $sum: 1 } } }
    ]),
    Appointment.aggregate([
      {
        $match: {
          clinic: clinicId,
          'payment.status': 'paid',
          'payment.paidAt': { $gte: startOfWeek }
        }
      },
      { $group: { _id: null, total: { $sum: '$payment.totalAmount' }, count: { $sum: 1 } } }
    ]),
    Appointment.find({ clinic: clinicId, 'payment.status': 'paid' })
      .populate('patient doctor', 'firstName lastName phone')
      .select('type scheduledDate scheduledTime status payment patient doctor')
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
  const engagementData = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(startOfDay);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    engagementData.push({
      label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      date: key,
      value: dayMap[key]?.visits || 0,
      completed: dayMap[key]?.completed || 0,
      revenue: dayMap[key]?.revenue || 0
    });
  }

  const consultDistribution = (typeMixAgg || []).map((row) => ({
    label: row._id === 'video' ? 'Video' : row._id === 'chat' ? 'Chat' : 'In-person',
    value: row.count || 0
  }));

  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const productivityBars = weekdayLabels.map((label) => {
    const value = (volumeByDayAgg || []).reduce((sum, row) => {
      const d = new Date(`${row._id}T12:00:00`);
      const short = d.toLocaleDateString('en-US', { weekday: 'short' });
      return short === label ? sum + (row.visits || 0) : sum;
    }, 0);
    return { label, value };
  });

  const completionRate =
    appointmentsToday > 0 ? Math.round((completedToday / appointmentsToday) * 100) : 0;

  return {
    rangeDays: days,
    appointmentsCount: totalAppointments,
    consultsToday: completedToday,
    appointmentsToday,
    completedInRange,
    doctorCount: doctors.length,
    uniquePatients: uniquePatientsAgg[0]?.count || 0,
    revenueTotal: revenueAgg[0]?.total || 0,
    revenueToday: revenueTodayAgg[0]?.total || 0,
    revenueWeek: revenueWeekAgg[0]?.total || 0,
    paidVisits: revenueAgg[0]?.count || 0,
    pulse: {
      totalToday: appointmentsToday,
      servedToday: completedToday,
      completionRate
    },
    recentInvites: (recentInvites || []).map((invite) => ({
      email: invite.email,
      status: invite.status,
      createdAt: invite.createdAt
    })),
    engagementData,
    consultDistribution,
    productivityBars,
    appointments,
    doctors,
    recentPayments: (recentPayments || []).map((appt) => ({
      _id: appt._id,
      patient: appt.patient,
      doctor: appt.doctor,
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
