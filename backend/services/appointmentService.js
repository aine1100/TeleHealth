const { Appointment } = require('../models');
const { v4: uuidv4 } = require('uuid');

const buildAppointmentQueryForUser = (user) => {
  if (user.role === 'clinic_admin') {
    return { clinic: user._id };
  }

  if (user.role === 'doctor') {
    return { doctor: user._id };
  }

  return { patient: user._id };
};

exports.createAppointment = async ({ user, body }) => {
  const payload = {
    ...body,
    patient: user.role === 'patient' ? user._id : body.patient,
    createdBy: user._id
  };

  if (!payload.doctor || !payload.scheduledDate || !payload.scheduledTime || !payload.type) {
    const error = new Error('Doctor, schedule, and appointment type are required');
    error.statusCode = 400;
    throw error;
  }

  const appointment = new Appointment(payload);
  await appointment.save();
  await appointment.populate('patient doctor', 'firstName lastName phone avatar');
  return appointment;
};

exports.getMyAppointments = async (user) => {
  const query = buildAppointmentQueryForUser(user);

  return Appointment.find(query)
    .populate('patient doctor', 'firstName lastName phone avatar')
    .sort({ scheduledDate: -1 });
};

exports.getAppointmentById = async ({ user, appointmentId }) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('patient doctor clinic', 'firstName lastName phone avatar clinicName organizationName')
    .lean();

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const isAllowed =
    user.role === 'admin' ||
    user.role === 'clinic_admin' && appointment.clinic?._id?.toString() === user._id.toString() ||
    user.role === 'doctor' && appointment.doctor?._id?.toString() === user._id.toString() ||
    user.role === 'patient' && appointment.patient?._id?.toString() === user._id.toString();

  if (!isAllowed) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  return appointment;
};

exports.updateAppointment = async ({ user, appointmentId, body }) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const isAllowed =
    user.role === 'admin' ||
    user.role === 'clinic_admin' && appointment.clinic?.toString() === user._id.toString() ||
    user.role === 'doctor' && appointment.doctor?.toString() === user._id.toString() ||
    user.role === 'patient' && appointment.patient?.toString() === user._id.toString();

  if (!isAllowed) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  const updatableFields = [
    'type',
    'scheduledDate',
    'scheduledTime',
    'duration',
    'symptoms',
    'notes',
    'timezone',
    'payment'
  ];

  updatableFields.forEach((field) => {
    if (body[field] !== undefined) {
      appointment[field] = body[field];
    }
  });

  appointment.updatedBy = user._id;
  await appointment.save();
  await appointment.populate('patient doctor clinic', 'firstName lastName phone avatar clinicName organizationName');
  return appointment;
};

exports.deleteAppointment = async ({ user, appointmentId }) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const isAllowed =
    user.role === 'admin' ||
    user.role === 'clinic_admin' && appointment.clinic?.toString() === user._id.toString() ||
    user.role === 'doctor' && appointment.doctor?.toString() === user._id.toString() ||
    user.role === 'patient' && appointment.patient?.toString() === user._id.toString();

  if (!isAllowed) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  await appointment.deleteOne();
  return { deleted: true, appointmentId };
};

exports.updateAppointmentStatus = async ({ user, appointmentId, body }) => {
  const { status, reason, postponedTo, referredTo } = body;
  const update = { status, updatedBy: user._id };

  if (!['confirmed', 'cancelled', 'postponed', 'referred'].includes(status)) {
    const error = new Error('Unsupported appointment status');
    error.statusCode = 400;
    throw error;
  }

  if (status === 'cancelled') {
    update.cancelledBy = user._id;
    update.cancellationReason = reason;
    update.cancelledAt = new Date();
  }

  if (status === 'postponed') {
    update.postponedTo = postponedTo;
    update.postponedReason = reason;
    update.postponedAt = new Date();
  }

  if (status === 'referred') {
    update.referral = { referredTo, reason, status: 'pending' };
  }

  const appointment = await Appointment.findByIdAndUpdate(appointmentId, update, { new: true });
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  return appointment;
};

exports.joinWaitingRoom = async ({ user, appointmentId }) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  appointment.status = 'in_waiting_room';
  appointment.waitingRoom = {
    joinedAt: new Date(),
    position: await Appointment.countDocuments({
      doctor: appointment.doctor,
      status: 'in_waiting_room',
      'waitingRoom.joinedAt': { $lt: appointment.waitingRoom?.joinedAt || new Date() }
    }) + 1,
    estimatedWaitMinutes: 15,
    patientsAhead: 2
  };

  await appointment.save();
  return appointment;
};

exports.startVideoCall = async ({ user, appointmentId }) => {
  if (!['doctor', 'patient'].includes(user.role)) {
    const error = new Error('Only doctors and patients can join a video call');
    error.statusCode = 403;
    throw error;
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const isParticipant =
    (user.role === 'doctor' && appointment.doctor?.toString() === user._id.toString()) ||
    (user.role === 'patient' && appointment.patient?.toString() === user._id.toString());

  if (!isParticipant) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  appointment.status = 'in_progress';
  appointment.videoCall = {
    ...appointment.videoCall,
    roomId: appointment.videoCall?.roomId || `appointment-${appointment._id.toString()}-${uuidv4()}`,
    startedAt: appointment.videoCall?.startedAt || new Date(),
    endedAt: null
  };

  await appointment.save();
  await appointment.populate('patient doctor', 'firstName lastName phone avatar');

  return {
    appointment,
    roomId: appointment.videoCall.roomId,
    startedAt: appointment.videoCall.startedAt
  };
};

exports.endVideoCall = async ({ user, appointmentId }) => {
  if (!['doctor', 'patient'].includes(user.role)) {
    const error = new Error('Only doctors and patients can end a video call');
    error.statusCode = 403;
    throw error;
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const isParticipant =
    (user.role === 'doctor' && appointment.doctor?.toString() === user._id.toString()) ||
    (user.role === 'patient' && appointment.patient?.toString() === user._id.toString());

  if (!isParticipant) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  if (appointment.videoCall?.startedAt) {
    const durationSeconds = Math.round((Date.now() - new Date(appointment.videoCall.startedAt).getTime()) / 1000);
    appointment.videoCall.duration = durationSeconds;
  }

  appointment.videoCall.endedAt = new Date();
  appointment.status = 'completed';
  await appointment.save();
  await appointment.populate('patient doctor', 'firstName lastName phone avatar');

  return appointment;
};

exports.getVideoCallSession = async ({ user, appointmentId }) => {
  if (!['doctor', 'patient'].includes(user.role)) {
    const error = new Error('Only doctors and patients can access a video session');
    error.statusCode = 403;
    throw error;
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const isParticipant =
    (user.role === 'doctor' && appointment.doctor?.toString() === user._id.toString()) ||
    (user.role === 'patient' && appointment.patient?.toString() === user._id.toString());

  if (!isParticipant) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  return {
    appointmentId: appointment._id,
    roomId: appointment.videoCall?.roomId || null,
    startedAt: appointment.videoCall?.startedAt || null,
    endedAt: appointment.videoCall?.endedAt || null,
    status: appointment.status
  };
};
