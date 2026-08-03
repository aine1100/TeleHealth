const appointmentService = require('../services/appointmentService');

const getErrorStatus = (error) => error.statusCode || 500;

exports.createAppointment = async (req, res) => {
  try {
    const appointment = await appointmentService.createAppointment({
      user: req.user,
      body: req.body
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await appointmentService.getMyAppointments(req.user);
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
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
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
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
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
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
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const appointment = await appointmentService.updateAppointmentStatus({
      user: req.user,
      appointmentId: req.params.id,
      body: req.body
    });

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.joinWaitingRoom = async (req, res) => {
  try {
    const appointment = await appointmentService.joinWaitingRoom({
      user: req.user,
      appointmentId: req.params.id
    });

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.startVideoCall = async (req, res) => {
  try {
    const result = await appointmentService.startVideoCall({
      user: req.user,
      appointmentId: req.params.id
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.endVideoCall = async (req, res) => {
  try {
    const appointment = await appointmentService.endVideoCall({
      user: req.user,
      appointmentId: req.params.id
    });

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
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
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};
