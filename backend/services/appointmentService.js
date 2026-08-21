const { Appointment, User, MedicineReminder } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { buildAppointmentPayment } = require('../utils/apiErrors');
const { assertSlotAvailable } = require('./doctorAvailabilityService');
const notificationService = require('./notificationService');

const emitWaitingRoomUpdate = (io, appointment) => {
  if (!io || !appointment?.doctor) return;
  const doctorId = appointment.doctor._id?.toString() || appointment.doctor.toString();
  io.to(`doctor-waiting-${doctorId}`).emit('waiting-room-update', {
    appointmentId: appointment._id.toString(),
    patient: appointment.patient,
    position: appointment.waitingRoom?.position,
    patientsAhead: appointment.waitingRoom?.patientsAhead,
    joinedAt: appointment.waitingRoom?.joinedAt
  });
};

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

  const doctor = await User.findById(payload.doctor).select(
    'role doctorProfile.clinicId doctorProfile.consultationFee'
  );
  if (!doctor || doctor.role !== 'doctor') {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    throw error;
  }

  if (!payload.clinic && doctor.doctorProfile?.clinicId) {
    payload.clinic = doctor.doctorProfile.clinicId;
  }

  if (!payload.payment?.amount || !payload.payment?.totalAmount) {
    payload.payment = buildAppointmentPayment(doctor.doctorProfile?.consultationFee, body.payment);
  }

  payload.scheduledTime = await assertSlotAvailable(
    payload.doctor,
    payload.scheduledDate,
    payload.scheduledTime
  );

  if (typeof payload.scheduledDate === 'string') {
    const match = payload.scheduledDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [y, m, d] = match.slice(1).map(Number);
      payload.scheduledDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    }
  }

  payload.status = 'pending';

  const appointment = new Appointment(payload);
  await appointment.save();
  await appointment.populate('patient doctor', 'firstName lastName phone avatar');
  notificationService.notifyAppointmentBooked(appointment).catch((err) => {
    console.error('[Notification] appointment booked', err.message);
  });
  return appointment;
};

exports.getMyAppointments = async (user) => {
  const query = buildAppointmentQueryForUser(user);

  return Appointment.find(query)
    .populate('patient doctor', 'firstName lastName phone avatar doctorProfile.specialty doctorProfile.consultationFee')
    .sort({ scheduledDate: -1 });
};

exports.getAppointmentById = async ({ user, appointmentId }) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName phone avatar')
    .populate('doctor', 'firstName lastName phone avatar doctorProfile.specialty')
    .populate('clinic', 'firstName lastName phone clinicProfile.clinicName organizationProfile.organizationName')
    .lean();

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const clinicId = appointment.clinic?._id?.toString() || appointment.clinic?.toString();
  const doctorId = appointment.doctor?._id?.toString() || appointment.doctor?.toString();
  const patientId = appointment.patient?._id?.toString() || appointment.patient?.toString();

  const isAllowed =
    user.role === 'admin' ||
    (user.role === 'clinic_admin' && clinicId === user._id.toString()) ||
    (user.role === 'doctor' && doctorId === user._id.toString()) ||
    (user.role === 'patient' && patientId === user._id.toString());

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

exports.updateAppointmentStatus = async ({ user, appointmentId, body, io }) => {
  const { status, reason, postponedTo, referredTo } = body;

  if (!['confirmed', 'cancelled', 'postponed', 'referred'].includes(status)) {
    const error = new Error('Unsupported appointment status');
    error.statusCode = 400;
    throw error;
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const isDoctor = user.role === 'doctor' && appointment.doctor?.toString() === user._id.toString();
  const isPatient = user.role === 'patient' && appointment.patient?.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';
  const isClinic =
    user.role === 'clinic_admin' && appointment.clinic?.toString() === user._id.toString();

  if (status === 'confirmed') {
    if (!isDoctor && !isAdmin && !isClinic) {
      const error = new Error('Only the doctor can approve this appointment');
      error.statusCode = 403;
      throw error;
    }
    if (appointment.status !== 'pending') {
      const error = new Error('Only pending appointments can be approved');
      error.statusCode = 400;
      throw error;
    }
  }

  if (status === 'cancelled') {
    const canCancel =
      isAdmin ||
      isClinic ||
      isDoctor ||
      (isPatient && ['pending', 'confirmed'].includes(appointment.status));
    if (!canCancel) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
  }

  if (['postponed', 'referred'].includes(status) && !isDoctor && !isAdmin && !isClinic) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  appointment.status = status;
  appointment.updatedBy = user._id;

  if (status === 'cancelled') {
    appointment.cancelledBy = user._id;
    appointment.cancellationReason = reason;
    appointment.cancelledAt = new Date();
  }

  if (status === 'postponed') {
    appointment.postponedTo = postponedTo;
    appointment.postponedReason = reason;
    appointment.postponedAt = new Date();
  }

  if (status === 'referred') {
    appointment.referral = { referredTo, reason, status: 'pending' };
  }

  await appointment.save();
  await appointment.populate('patient doctor', 'firstName lastName phone avatar doctorProfile.specialty');

  if (status === 'confirmed') {
    notificationService.notifyAppointmentConfirmed(appointment).catch((err) => {
      console.error('[Notification] appointment confirmed', err.message);
    });
  }

  if (status === 'cancelled') {
    notificationService.notifyAppointmentCancelled(appointment, { cancelledByRole: user.role }).catch((err) => {
      console.error('[Notification] appointment cancelled', err.message);
    });
  }

  return appointment;
};

const computeQueuePosition = async (appointment, joinedAt) => {
  const patientsAhead = await Appointment.countDocuments({
    doctor: appointment.doctor,
    status: 'in_waiting_room',
    'waitingRoom.joinedAt': { $lt: joinedAt },
    _id: { $ne: appointment._id }
  });

  return {
    position: patientsAhead + 1,
    patientsAhead,
    estimatedWaitMinutes: patientsAhead * 10 + 5
  };
};

exports.joinWaitingRoom = async ({ user, appointmentId, io }) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== 'patient' || appointment.patient?.toString() !== user._id.toString()) {
    const error = new Error('Only the patient can join the waiting room');
    error.statusCode = 403;
    throw error;
  }

  if (!['confirmed', 'in_waiting_room'].includes(appointment.status)) {
    const error = new Error('Only confirmed appointments can enter the waiting room');
    error.statusCode = 400;
    throw error;
  }

  if (appointment.type !== 'video') {
    const error = new Error('Waiting room is only available for video consultations');
    error.statusCode = 400;
    throw error;
  }

  const joinedAt = appointment.waitingRoom?.joinedAt || new Date();
  const queue = await computeQueuePosition(appointment, joinedAt);

  appointment.status = 'in_waiting_room';
  appointment.waitingRoom = {
    joinedAt,
    position: queue.position,
    patientsAhead: queue.patientsAhead,
    estimatedWaitMinutes: queue.estimatedWaitMinutes
  };

  await appointment.save();
  await appointment.populate('patient doctor', 'firstName lastName phone avatar doctorProfile.specialty');

  notificationService.notifyWaitingRoomJoined(appointment).catch((err) => {
    console.error('[Notification] waiting room joined', err.message);
  });
  emitWaitingRoomUpdate(io, appointment);

  return appointment;
};

exports.getWaitingRoomStatus = async ({ user, appointmentId }) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('patient doctor', 'firstName lastName avatar doctorProfile.specialty')
    .lean();

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const isPatient = user.role === 'patient' && appointment.patient?._id?.toString() === user._id.toString();
  const isDoctor = user.role === 'doctor' && appointment.doctor?._id?.toString() === user._id.toString();

  if (!isPatient && !isDoctor) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  let queue = appointment.waitingRoom || {};
  if (appointment.status === 'in_waiting_room' && queue.joinedAt) {
    queue = {
      ...queue,
      ...(await computeQueuePosition(appointment, new Date(queue.joinedAt)))
    };
  }

  return {
    appointmentId: appointment._id,
    status: appointment.status,
    type: appointment.type,
    scheduledTime: appointment.scheduledTime,
    waitingRoom: queue,
    patient: isDoctor ? appointment.patient : undefined,
    doctor: appointment.doctor
  };
};

exports.getDoctorWaitingQueue = async (user) => {
  if (user.role !== 'doctor') {
    const error = new Error('Only doctors can view the waiting queue');
    error.statusCode = 403;
    throw error;
  }

  const waiting = await Appointment.find({
    doctor: user._id,
    status: 'in_waiting_room'
  })
    .populate('patient', 'firstName lastName phone avatar')
    .sort({ 'waitingRoom.joinedAt': 1 })
    .lean();

  return waiting.map((item, index) => ({
    ...item,
    waitingRoom: {
      ...item.waitingRoom,
      position: index + 1,
      patientsAhead: index,
      estimatedWaitMinutes: index * 10 + 5
    }
  }));
};

exports.startVideoCall = async ({ user, appointmentId, io }) => {
  if (user.role !== 'doctor') {
    const error = new Error('Only the doctor can start the video consultation');
    error.statusCode = 403;
    throw error;
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  if (appointment.doctor?.toString() !== user._id.toString()) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  if (!['confirmed', 'in_waiting_room', 'in_progress'].includes(appointment.status)) {
    const error = new Error('This appointment is not ready for a video call');
    error.statusCode = 400;
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

  notificationService.notifyConsultationStarted(appointment, { startedByRole: user.role }).catch((err) => {
    console.error('[Notification] consultation started', err.message);
  });

  const patientId = appointment.patient?._id?.toString() || appointment.patient?.toString();
  if (io && patientId) {
    io.to(`patient-${patientId}`).emit('consultation-ready', {
      appointmentId: appointment._id.toString(),
      roomId: appointment.videoCall.roomId
    });
  }

  return {
    appointment,
    roomId: appointment.videoCall.roomId,
    startedAt: appointment.videoCall.startedAt
  };
};

exports.endVideoCall = async ({ user, appointmentId, io }) => {
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

  notificationService.notifyConsultationEnded(appointment).catch((err) => {
    console.error('[Notification] consultation ended', err.message);
  });

  if (io) {
    io.to(`appointment-${appointment._id}`).emit('consultation-ended', {
      appointmentId: appointment._id.toString()
    });
  }

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

  // Patients must wait in the waiting room until the doctor starts the call
  if (user.role === 'patient' && appointment.status !== 'in_progress') {
    const error = new Error(
      appointment.status === 'completed'
        ? 'This consultation has ended'
        : 'Please wait in the waiting room until your doctor starts the consultation'
    );
    error.statusCode = 400;
    error.code = 'WAITING_ROOM_REQUIRED';
    throw error;
  }

  if (user.role === 'doctor' && !['confirmed', 'in_waiting_room', 'in_progress'].includes(appointment.status)) {
    const error = new Error('This appointment is not ready for a video call');
    error.statusCode = 400;
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

const mapFrequencyToReminder = (frequency = '') => {
  const value = String(frequency).toLowerCase().trim();
  if (value.includes('four') || value.includes('4')) return 'four_times_daily';
  if (value.includes('thrice') || value.includes('three') || value.includes('tds') || value.includes('3')) {
    return 'thrice_daily';
  }
  if (value.includes('twice') || value.includes('bd') || value.includes('2')) return 'twice_daily';
  if (value.includes('week')) return 'weekly';
  if (value.includes('need') || value.includes('prn')) return 'as_needed';
  if (value.includes('once') || value.includes('daily') || value.includes('od') || value.includes('1')) {
    return 'once_daily';
  }
  return 'once_daily';
};

const defaultTimesForFrequency = (frequency) => {
  switch (frequency) {
    case 'twice_daily':
      return ['08:00', '20:00'];
    case 'thrice_daily':
      return ['08:00', '14:00', '20:00'];
    case 'four_times_daily':
      return ['08:00', '12:00', '16:00', '20:00'];
    case 'every_8_hours':
      return ['06:00', '14:00', '22:00'];
    case 'every_12_hours':
      return ['08:00', '20:00'];
    case 'as_needed':
      return [];
    default:
      return ['08:00'];
  }
};

exports.saveConsultationCarePlan = async ({ user, appointmentId, body }) => {
  if (user.role !== 'doctor' && user.role !== 'admin') {
    const error = new Error('Only doctors can write a care plan');
    error.statusCode = 403;
    throw error;
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'doctor' && appointment.doctor?.toString() !== user._id.toString()) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  if (!['in_progress', 'completed', 'confirmed'].includes(appointment.status)) {
    const error = new Error('Care plan can only be added for confirmed or completed visits');
    error.statusCode = 400;
    throw error;
  }

  const {
    diagnosis,
    notes,
    prescription = [],
    labOrders = [],
    createReminders = true,
    markCompleted = false
  } = body;

  if (diagnosis !== undefined) appointment.diagnosis = diagnosis;
  if (notes !== undefined) appointment.notes = notes;

  appointment.prescription = (Array.isArray(prescription) ? prescription : [])
    .filter((item) => item?.medicineName?.trim())
    .map((item) => ({
      medicineName: String(item.medicineName).trim(),
      dosage: item.dosage || '',
      frequency: item.frequency || '',
      duration: item.duration || '',
      instructions: item.instructions || '',
      isChronic: Boolean(item.isChronic)
    }));

  appointment.labOrders = (Array.isArray(labOrders) ? labOrders : [])
    .filter((item) => item?.testName?.trim())
    .map((item) => ({
      testName: String(item.testName).trim(),
      testCode: item.testCode || '',
      instructions: item.instructions || '',
      status: item.status || 'ordered'
    }));

  if (markCompleted || appointment.status === 'in_progress') {
    appointment.status = 'completed';
  }

  appointment.updatedBy = user._id;
  await appointment.save();
  await appointment.populate('patient doctor', 'firstName lastName phone avatar doctorProfile.specialty');

  if (createReminders && appointment.prescription.length) {
    await MedicineReminder.deleteMany({ appointment: appointment._id });

    const reminderDocs = appointment.prescription.map((rx) => {
      const frequency = mapFrequencyToReminder(rx.frequency);
      return {
        patient: appointment.patient._id || appointment.patient,
        doctor: appointment.doctor._id || appointment.doctor,
        appointment: appointment._id,
        medicineName: rx.medicineName,
        dosage: rx.dosage || 'As prescribed',
        frequency,
        times: defaultTimesForFrequency(frequency),
        startDate: new Date(),
        duration: rx.duration || '',
        isChronic: Boolean(rx.isChronic),
        instructions: rx.instructions || '',
        status: 'active'
      };
    });

    await MedicineReminder.insertMany(reminderDocs);
  }

  notificationService.notifyPrescriptionReady(appointment).catch((err) => {
    console.error('[Notification] prescription ready', err.message);
  });

  if (appointment.labOrders.length) {
    notificationService.notifyLabOrdersReady(appointment).catch((err) => {
      console.error('[Notification] lab orders', err.message);
    });
  }

  return appointment;
};

exports.getPatientCareRecords = async (user) => {
  if (user.role !== 'patient') {
    const error = new Error('Only patients can view their care records');
    error.statusCode = 403;
    throw error;
  }

  const appointments = await Appointment.find({
    patient: user._id,
    $or: [
      { 'prescription.0': { $exists: true } },
      { 'labOrders.0': { $exists: true } },
      { diagnosis: { $exists: true, $ne: '' } }
    ]
  })
    .populate('doctor', 'firstName lastName doctorProfile.specialty avatar')
    .sort({ updatedAt: -1 })
    .lean();

  return appointments.map((appt) => ({
    _id: appt._id,
    scheduledDate: appt.scheduledDate,
    scheduledTime: appt.scheduledTime,
    status: appt.status,
    type: appt.type,
    diagnosis: appt.diagnosis || '',
    notes: appt.notes || '',
    prescription: appt.prescription || [],
    labOrders: appt.labOrders || [],
    doctor: appt.doctor,
    updatedAt: appt.updatedAt
  }));
};

