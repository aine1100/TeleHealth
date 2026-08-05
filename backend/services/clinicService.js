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

exports.getDashboardOverview = async (clinicId) => {
  const [appointments, doctors, recentInvites] = await Promise.all([
    Appointment.find({ clinic: clinicId })
      .populate('patient doctor', 'firstName lastName phone avatar')
      .sort({ scheduledDate: -1 })
      .limit(8),
    User.find({ role: 'doctor', 'doctorProfile.clinicId': clinicId })
      .select('firstName lastName email phone doctorProfile avatar')
      .sort({ createdAt: -1 })
      .limit(8),
    require('../models').DoctorInvite.find({ clinicId, status: 'pending' }).sort({ createdAt: -1 }).limit(4)
  ]);

  const today = new Date();
  const todayAppointments = appointments.filter((item) => {
    const scheduled = new Date(item.scheduledDate);
    return scheduled.toDateString() === today.toDateString();
  });

  const servedToday = todayAppointments.filter((item) => ['confirmed', 'completed', 'in_progress'].includes(item.status)).length;
  const totalToday = todayAppointments.length;
  const completionRate = totalToday > 0 ? Math.round((servedToday / totalToday) * 100) : 0;

  const engagementData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(today.getDate() - (5 - index));
    const dayValue = appointments.filter((item) => new Date(item.scheduledDate).toDateString() === date.toDateString()).length;
    return { label: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }), value: dayValue };
  }).filter((item) => item.value > 0 || appointments.length === 0 || item.label);

  const consultDistribution = Object.entries(
    appointments.reduce((acc, item) => {
      const key = item.type || 'in_person';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([key, value]) => ({
    label: key === 'video' ? 'Video' : key === 'chat' ? 'Chat' : 'In-person',
    value
  }));

  const productivityBars = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((label) => {
    const value = appointments.filter((item) => new Date(item.scheduledDate).toLocaleDateString('en-US', { weekday: 'short' }) === label).length;
    return { label, value };
  });

  return {
    appointmentsCount: appointments.length,
    consultsToday: servedToday,
    doctorCount: doctors.length,
    pulse: {
      totalToday,
      servedToday,
      completionRate
    },
    recentInvites: recentInvites.map((invite) => ({
      email: invite.email,
      status: invite.status,
      createdAt: invite.createdAt
    })),
    engagementData,
    consultDistribution,
    productivityBars,
    appointments,
    doctors
  };
};
