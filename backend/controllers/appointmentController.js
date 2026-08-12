const appointmentService = require('../services/appointmentService');
const consultChatService = require('../services/consultChatService');
const { sendErrorResponse } = require('../utils/apiErrors');
exports.createAppointment = async (req, res) => {
  try {
    const appointment = await appointmentService.createAppointment({
      user: req.user,
      body: req.body
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    sendErrorResponse(res, error, {
      logLabel: 'Appointment',
      userMessage: 'Unable to book appointment. Please try again.'
    });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await appointmentService.getMyAppointments(req.user);
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Appointment' });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await appointmentService.getAppointmentById({
      user: req.user,
      appointmentId: req.params.id
    });

    res.json({ success: true, data: appointment });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Appointment' });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await appointmentService.updateAppointment({
      user: req.user,
      appointmentId: req.params.id,
      body: req.body
    });

    res.json({ success: true, data: appointment });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Appointment' });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const result = await appointmentService.deleteAppointment({
      user: req.user,
      appointmentId: req.params.id
    });

    res.json({ success: true, data: result });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Appointment' });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const appointment = await appointmentService.updateAppointmentStatus({
      user: req.user,
      appointmentId: req.params.id,
      body: req.body,
      io: req.app.get('io')
    });

    res.json({ success: true, data: appointment });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Appointment' });
  }
};

exports.joinWaitingRoom = async (req, res) => {
  try {
    const appointment = await appointmentService.joinWaitingRoom({
      user: req.user,
      appointmentId: req.params.id,
      io: req.app.get('io')
    });

    res.json({ success: true, data: appointment });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Appointment' });
  }
};

exports.getWaitingRoomStatus = async (req, res) => {
  try {
    const status = await appointmentService.getWaitingRoomStatus({
      user: req.user,
      appointmentId: req.params.id
    });

    res.json({ success: true, data: status });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Appointment' });
  }
};

exports.getDoctorWaitingQueue = async (req, res) => {
  try {
    const queue = await appointmentService.getDoctorWaitingQueue(req.user);
    res.json({ success: true, count: queue.length, data: queue });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Appointment' });
  }
};

exports.startVideoCall = async (req, res) => {
  try {
    const result = await appointmentService.startVideoCall({
      user: req.user,
      appointmentId: req.params.id,
      io: req.app.get('io')
    });

    res.json({ success: true, data: result });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Appointment' });
  }
};

exports.endVideoCall = async (req, res) => {
  try {
    const appointment = await appointmentService.endVideoCall({
      user: req.user,
      appointmentId: req.params.id,
      io: req.app.get('io')
    });

    res.json({ success: true, data: appointment });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Appointment' });
  }
};

exports.getVideoCallSession = async (req, res) => {
  try {
    const session = await appointmentService.getVideoCallSession({
      user: req.user,
      appointmentId: req.params.id
    });

    res.json({ success: true, data: session });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Appointment' });
  }
};

exports.getConsultChat = async (req, res) => {
  try {
    const messages = await consultChatService.getChatMessages({
      user: req.user,
      appointmentId: req.params.id
    });
    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'ConsultChat' });
  }
};

exports.sendConsultChatMessage = async (req, res) => {
  try {
    const message = await consultChatService.sendChatMessage({
      user: req.user,
      appointmentId: req.params.id,
      text: req.body.text
    });

    const io = req.app.get('io');
    io.to(`appointment-${req.params.id}`).emit('consult-chat-message', message);

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'ConsultChat' });
  }
};

exports.uploadConsultChatFile = async (req, res) => {
  try {
    const message = await consultChatService.uploadChatFile({
      user: req.user,
      appointmentId: req.params.id,
      file: req.file
    });

    const io = req.app.get('io');
    io.to(`appointment-${req.params.id}`).emit('consult-chat-message', message);

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    sendErrorResponse(res, error, {
      logLabel: 'ConsultChat',
      userMessage: error.message?.includes('allowed') ? error.message : 'Unable to upload file.'
    });
  }
};