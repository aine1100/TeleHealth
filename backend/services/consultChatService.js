const fs = require('fs');
const path = require('path');
const { Appointment, User } = require('../models');
const { buildStorageKey } = require('./storageService');
const { uploadFileToR2 } = require('./r2Service');

const LOCAL_UPLOAD_ROOT = path.join(__dirname, '../uploads/consult');

const assertParticipant = async (appointmentId, user) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const isDoctor = user.role === 'doctor' && appointment.doctor?.toString() === user._id.toString();
  const isPatient = user.role === 'patient' && appointment.patient?.toString() === user._id.toString();

  if (!isDoctor && !isPatient) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  if (!['in_progress', 'in_waiting_room', 'confirmed'].includes(appointment.status)) {
    const error = new Error('Chat is only available during an active consultation');
    error.statusCode = 400;
    throw error;
  }

  return appointment;
};

const saveFileLocally = async (file, appointmentId) => {
  const folder = path.join(LOCAL_UPLOAD_ROOT, appointmentId.toString());
  fs.mkdirSync(folder, { recursive: true });
  const fileName = `${Date.now()}-${path.basename(buildStorageKey('consult', file.originalname))}`;
  const filePath = path.join(folder, fileName);
  fs.writeFileSync(filePath, file.buffer);
  return `/uploads/consult/${appointmentId}/${fileName}`;
};

const uploadConsultFile = async (file, appointmentId) => {
  const key = buildStorageKey(`consult/${appointmentId}`, file.originalname);
  try {
    return await uploadFileToR2(file, key);
  } catch {
    return saveFileLocally(file, appointmentId);
  }
};

const formatMessage = (message, senderUser) => ({
  _id: message._id,
  senderId: message.sender?.toString(),
  senderRole: message.senderRole,
  senderName: senderUser
    ? [senderUser.firstName, senderUser.lastName].filter(Boolean).join(' ')
    : message.senderRole === 'doctor'
      ? 'Doctor'
      : 'Patient',
  text: message.text || '',
  attachment: message.attachment || null,
  createdAt: message.createdAt
});

exports.getChatMessages = async ({ user, appointmentId }) => {
  const appointment = await assertParticipant(appointmentId, user);
  const messages = appointment.consultChat || [];
  const senderIds = [...new Set(messages.map((m) => m.sender?.toString()).filter(Boolean))];
  const senders = await User.find({ _id: { $in: senderIds } }).select('firstName lastName').lean();
  const senderMap = new Map(senders.map((s) => [s._id.toString(), s]));

  return messages.map((msg) => formatMessage(msg, senderMap.get(msg.sender?.toString())));
};

exports.sendChatMessage = async ({ user, appointmentId, text, attachment }) => {
  const trimmed = (text || '').trim();
  if (!trimmed && !attachment?.url) {
    const error = new Error('Message text or attachment is required');
    error.statusCode = 400;
    throw error;
  }

  const appointment = await assertParticipant(appointmentId, user);
  const message = {
    sender: user._id,
    senderRole: user.role,
    text: trimmed,
    attachment: attachment || undefined,
    createdAt: new Date()
  };

  appointment.consultChat = appointment.consultChat || [];
  appointment.consultChat.push(message);
  await appointment.save();

  const saved = appointment.consultChat[appointment.consultChat.length - 1];
  const sender = await User.findById(user._id).select('firstName lastName').lean();
  return formatMessage(saved, sender);
};

exports.uploadChatFile = async ({ user, appointmentId, file }) => {
  if (!file) {
    const error = new Error('File is required');
    error.statusCode = 400;
    throw error;
  }

  await assertParticipant(appointmentId, user);
  const url = await uploadConsultFile(file, appointmentId);

  return exports.sendChatMessage({
    user,
    appointmentId,
    text: file.originalname ? `Shared ${file.originalname}` : 'Shared a file',
    attachment: {
      url,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    }
  });
};
