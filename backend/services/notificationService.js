const { Notification } = require('../models');

const PLATFORM_URL = process.env.PLATFORM_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

let ioRef = null;

exports.setNotificationIo = (io) => {
  ioRef = io;
};

const formatPersonName = (user) => {
  if (!user) return 'Someone';
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Someone';
};

const formatDoctorName = (doctor) => {
  const name = formatPersonName(doctor);
  return name.startsWith('Dr.') ? name : `Dr. ${name}`;
};

const emitToRecipient = (recipientId, notification) => {
  if (!ioRef || !recipientId || !notification) return;
  const id = recipientId._id?.toString?.() || recipientId.toString();
  const payload = {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    actionUrl: notification.actionUrl,
    actionLabel: notification.actionLabel,
    priority: notification.priority,
    isRead: notification.isRead,
    createdAt: notification.createdAt
  };
  ioRef.to(`user-${id}`).emit('notification', payload);
  ioRef.to(`patient-${id}`).emit('notification', payload);
};

exports.createNotification = async ({
  recipientId,
  type,
  title,
  message,
  relatedModel = 'Appointment',
  relatedId,
  actionUrl,
  actionLabel,
  priority = 'normal'
}) => {
  if (!recipientId) return null;

  const notification = await Notification.create({
    recipient: recipientId,
    type,
    title,
    message,
    relatedTo: relatedId ? { model: relatedModel, id: relatedId } : undefined,
    channels: ['in_app'],
    deliveryStatus: [{ channel: 'in_app', status: 'delivered', deliveredAt: new Date() }],
    actionUrl,
    actionLabel,
    priority
  });

  emitToRecipient(recipientId, notification);

  try {
    const pushService = require('./pushService');
    await pushService.sendToUser(recipientId, {
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      tag: `notification-${notification._id}`,
      data: { notificationId: notification._id, type: notification.type }
    });
  } catch {
    /* push optional */
  }

  return notification;
};

exports.notifyAppointmentBooked = async (appointment) => {
  const patientName = formatPersonName(appointment.patient);
  const doctorId = appointment.doctor?._id || appointment.doctor;

  await exports.createNotification({
    recipientId: doctorId,
    type: 'appointment_reminder',
    title: 'New appointment request',
    message: `${patientName} requested a ${appointment.type?.replace(/_/g, ' ') || 'consultation'} on ${appointment.scheduledTime || 'scheduled time'}.`,
    relatedId: appointment._id,
    actionUrl: `${PLATFORM_URL}/doctor/appointments`,
    actionLabel: 'Review request',
    priority: 'high'
  });
};

exports.notifyAppointmentConfirmed = async (appointment) => {
  const doctorName = formatDoctorName(appointment.doctor);
  const patientId = appointment.patient?._id || appointment.patient;

  await exports.createNotification({
    recipientId: patientId,
    type: 'appointment_confirmed',
    title: 'Appointment confirmed',
    message: `${doctorName} approved your visit scheduled for ${appointment.scheduledTime || 'the selected time'}.`,
    relatedId: appointment._id,
    actionUrl: `${PLATFORM_URL}/patient/appointments`,
    actionLabel: 'View appointment',
    priority: 'high'
  });
};

exports.notifyAppointmentCancelled = async (appointment, { cancelledByRole } = {}) => {
  const patientId = appointment.patient?._id || appointment.patient;
  const doctorId = appointment.doctor?._id || appointment.doctor;
  const doctorName = formatDoctorName(appointment.doctor);
  const patientName = formatPersonName(appointment.patient);
  const reason = appointment.cancellationReason ? ` Reason: ${appointment.cancellationReason}` : '';

  if (cancelledByRole === 'patient') {
    await exports.createNotification({
      recipientId: doctorId,
      type: 'appointment_cancelled',
      title: 'Appointment cancelled',
      message: `${patientName} cancelled their visit.${reason}`,
      relatedId: appointment._id,
      actionUrl: `${PLATFORM_URL}/doctor/appointments`,
      actionLabel: 'View calendar'
    });
  } else {
    await exports.createNotification({
      recipientId: patientId,
      type: 'appointment_cancelled',
      title: 'Appointment declined',
      message: `Your visit with ${doctorName} was declined or cancelled.${reason}`,
      relatedId: appointment._id,
      actionUrl: `${PLATFORM_URL}/patient/appointments`,
      actionLabel: 'View appointments',
      priority: 'high'
    });
  }
};

exports.notifyAppointmentPostponed = async (appointment) => {
  const patientId = appointment.patient?._id || appointment.patient;
  const doctorName = formatDoctorName(appointment.doctor);
  const when = appointment.postponedTo
    ? new Date(appointment.postponedTo).toLocaleString()
    : 'a later time';
  const reason = appointment.postponedReason ? ` Reason: ${appointment.postponedReason}` : '';

  await exports.createNotification({
    recipientId: patientId,
    type: 'appointment_postponed',
    title: 'Appointment postponed',
    message: `${doctorName} postponed your visit to ${when}.${reason}`,
    relatedId: appointment._id,
    actionUrl: `${PLATFORM_URL}/patient/appointments`,
    actionLabel: 'View appointment',
    priority: 'high'
  });
};

exports.notifyAppointmentReferred = async (appointment) => {
  const patientId = appointment.patient?._id || appointment.patient;
  const doctorName = formatDoctorName(appointment.doctor);
  const reason = appointment.referral?.reason ? ` Reason: ${appointment.referral.reason}` : '';

  await exports.createNotification({
    recipientId: patientId,
    type: 'referral_update',
    title: 'Appointment referred',
    message: `${doctorName} referred your visit to another clinician.${reason}`,
    relatedId: appointment._id,
    actionUrl: `${PLATFORM_URL}/patient/appointments`,
    actionLabel: 'View details',
    priority: 'high'
  });
};

exports.notifyPaymentReceived = async (appointment) => {
  const patientName = formatPersonName(appointment.patient);
  const doctorId = appointment.doctor?._id || appointment.doctor;
  const amount = appointment.payment?.totalAmount;

  await exports.createNotification({
    recipientId: doctorId,
    type: 'payment_received',
    title: 'Payment received',
    message: `${patientName} paid UGX ${Number(amount || 0).toLocaleString()} for their upcoming visit.`,
    relatedId: appointment._id,
    actionUrl: `${PLATFORM_URL}/doctor/appointments`,
    actionLabel: 'Review appointment',
    priority: 'normal'
  });

  const patientId = appointment.patient?._id || appointment.patient;
  await exports.createNotification({
    recipientId: patientId,
    type: 'payment_received',
    title: 'Payment successful',
    message: `Your payment of UGX ${Number(amount || 0).toLocaleString()} was received. Awaiting doctor approval.`,
    relatedId: appointment._id,
    actionUrl: `${PLATFORM_URL}/patient/appointments`,
    actionLabel: 'View appointment'
  });
};

exports.notifyWaitingRoomJoined = async (appointment) => {
  const patientName = formatPersonName(appointment.patient);
  const doctorId = appointment.doctor?._id || appointment.doctor;
  const position = appointment.waitingRoom?.position || 1;

  await exports.createNotification({
    recipientId: doctorId,
    type: 'waiting_room_ready',
    title: 'Patient in waiting room',
    message: `${patientName} joined the waiting room (queue position ${position}).`,
    relatedId: appointment._id,
    actionUrl: `${PLATFORM_URL}/doctor/appointments`,
    actionLabel: 'Start consultation',
    priority: 'urgent'
  });
};

exports.notifyConsultationStarted = async (appointment, { startedByRole }) => {
  const patientId = appointment.patient?._id || appointment.patient;
  const doctorId = appointment.doctor?._id || appointment.doctor;
  const doctorName = formatDoctorName(appointment.doctor);
  const patientName = formatPersonName(appointment.patient);

  if (startedByRole === 'doctor') {
    await exports.createNotification({
      recipientId: patientId,
      type: 'consultation_started',
      title: 'Consultation starting',
      message: `${doctorName} is ready to see you. Join the video call now.`,
      relatedId: appointment._id,
      actionUrl: `${PLATFORM_URL}/patient/consult/${appointment._id}`,
      actionLabel: 'Join call',
      priority: 'urgent'
    });
  } else {
    await exports.createNotification({
      recipientId: doctorId,
      type: 'consultation_started',
      title: 'Patient joined call',
      message: `${patientName} joined the video consultation.`,
      relatedId: appointment._id,
      actionUrl: `${PLATFORM_URL}/doctor/consult/${appointment._id}`,
      actionLabel: 'Join call',
      priority: 'high'
    });
  }
};

exports.notifyConsultationEnded = async (appointment) => {
  const patientId = appointment.patient?._id || appointment.patient;
  const doctorName = formatDoctorName(appointment.doctor);

  await exports.createNotification({
    recipientId: patientId,
    type: 'consultation_ended',
    title: 'Consultation completed',
    message: `Your video visit with ${doctorName} has ended. Thank you for using Alive Health.`,
    relatedId: appointment._id,
    actionUrl: `${PLATFORM_URL}/patient/care`,
    actionLabel: 'View care plan'
  });
};

exports.notifyPrescriptionReady = async (appointment) => {
  const patientId = appointment.patient?._id || appointment.patient;
  const doctorName = formatDoctorName(appointment.doctor);
  const count = appointment.prescription?.length || 0;

  await exports.createNotification({
    recipientId: patientId,
    type: 'prescription_ready',
    title: 'Prescription ready',
    message: `${doctorName} issued ${count} medicine${count === 1 ? '' : 's'} for your visit.`,
    relatedId: appointment._id,
    actionUrl: `${PLATFORM_URL}/patient/care`,
    actionLabel: 'View prescription',
    priority: 'high'
  });
};

exports.notifyLabOrdersReady = async (appointment) => {
  const patientId = appointment.patient?._id || appointment.patient;
  const doctorName = formatDoctorName(appointment.doctor);
  const count = appointment.labOrders?.length || 0;

  await exports.createNotification({
    recipientId: patientId,
    type: 'lab_results_ready',
    title: 'Lab tests ordered',
    message: `${doctorName} ordered ${count} lab test${count === 1 ? '' : 's'} for you.`,
    relatedId: appointment._id,
    actionUrl: `${PLATFORM_URL}/patient/care`,
    actionLabel: 'View lab orders',
    priority: 'high'
  });
};

exports.notifyPharmacyOrderReceived = async (order) => {
  const pharmacyId = order.pharmacy?._id || order.pharmacy;
  const patientName = formatPersonName(order.patient);
  const method = order.fulfillmentMethod === 'delivery' ? 'delivery' : 'onsite pickup';

  await exports.createNotification({
    recipientId: pharmacyId,
    type: 'pharmacy_order_received',
    title: order.orderType === 'catalog' ? 'New catalog order' : 'New prescription order',
    message: `${patientName} paid for a ${order.orderType === 'catalog' ? 'catalog' : 'prescription'} order (${method}).`,
    relatedModel: 'PharmacyOrder',
    relatedId: order._id,
    actionUrl: `${PLATFORM_URL}/pharmacy/orders`,
    actionLabel: 'View orders',
    priority: 'high'
  });
};

exports.notifyPharmacyOrderUpdate = async (order) => {
  const patientId = order.patient?._id || order.patient;
  const pharmacyName =
    order.pharmacy?.pharmacyProfile?.pharmacyName ||
    formatPersonName(order.pharmacy) ||
    'Pharmacy';
  const status = String(order.status || '').replace(/_/g, ' ');

  await exports.createNotification({
    recipientId: patientId,
    type: 'pharmacy_order_update',
    title: 'Pharmacy order update',
    message: `${pharmacyName} marked your order as ${status}.`,
    relatedModel: 'PharmacyOrder',
    relatedId: order._id,
    actionUrl: `${PLATFORM_URL}/patient/orders`,
    actionLabel: 'View order',
    priority: 'normal'
  });
};

exports.notifyMedicineDose = async (reminder, { io, slotTime, leadMinutes = 0 } = {}) => {
  const patientId = reminder.patient?._id || reminder.patient;
  const medicine = reminder.medicineName || 'your medicine';
  const dosage = reminder.dosage ? ` (${reminder.dosage})` : '';
  const when =
    leadMinutes > 0
      ? `in ${leadMinutes} minute${leadMinutes === 1 ? '' : 's'} (${slotTime})`
      : `now (${slotTime})`;

  const notification = await exports.createNotification({
    recipientId: patientId,
    type: 'medicine_reminder',
    title: 'Medicine reminder',
    message: `Time to take ${medicine}${dosage} — dose ${when}.`,
    relatedModel: 'MedicineReminder',
    relatedId: reminder._id,
    actionUrl: `${PLATFORM_URL}/patient/medicines`,
    actionLabel: 'Open reminders',
    priority: 'high'
  });

  const payload = {
    notificationId: notification?._id,
    title: notification.title,
    message: notification.message,
    reminderId: reminder._id,
    medicineName: reminder.medicineName,
    dosage: reminder.dosage,
    time: slotTime,
    actionUrl: '/patient/medicines',
    tag: `medicine-${reminder._id}-${slotTime}`
  };

  if (io && patientId) {
    io.to(`patient-${patientId}`).emit('medicine-reminder', payload);
  }

  try {
    const pushService = require('./pushService');
    await pushService.sendToUser(patientId, {
      title: payload.title,
      message: payload.message,
      actionUrl: payload.actionUrl,
      tag: payload.tag,
      data: payload
    });
  } catch (error) {
    console.error('[MedicineReminders] push failed', error.message || error);
  }

  return notification;
};
