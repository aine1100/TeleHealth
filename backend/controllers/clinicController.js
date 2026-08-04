const { validationResult } = require('express-validator');
const doctorInviteService = require('../services/doctorInviteService');
const clinicService = require('../services/clinicService');
const { signToken, createRefreshToken, createUserResponse } = require('../utils/authTokens');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return null;
};

const getErrorStatus = (error) => error.statusCode || 500;

exports.inviteDoctor = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return validationError;

  try {
    const { email, firstName, lastName, specialty } = req.body;
    const result = await doctorInviteService.inviteDoctor({
      clinic: req.user,
      email,
      firstName,
      lastName,
      specialty
    });

    res.status(201).json({
      success: true,
      message: 'Doctor invite sent successfully',
      ...result
    });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.resendInvite = async (req, res) => {
  try {
    const result = await doctorInviteService.resendInvite({
      clinic: req.user,
      inviteId: req.params.inviteId
    });

    res.json({
      success: true,
      message: 'Invite resent successfully',
      ...result
    });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.cancelInvite = async (req, res) => {
  try {
    const invite = await doctorInviteService.cancelInvite({
      clinic: req.user,
      inviteId: req.params.inviteId
    });

    res.json({
      success: true,
      message: 'Invite cancelled',
      invite: {
        id: invite._id,
        email: invite.email,
        status: invite.status
      }
    });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.getInviteDetails = async (req, res) => {
  try {
    const invite = await doctorInviteService.getInviteByToken(req.params.token);
    res.json({ success: true, data: invite });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.setupDoctorAccount = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return validationError;

  try {
    const doctor = await doctorInviteService.setupDoctorAccount(req.body);
    const accessToken = signToken(doctor);
    const refreshToken = createRefreshToken();
    doctor.refreshToken = refreshToken;
    await doctor.save();

    res.status(201).json({
      success: true,
      message: 'Doctor account created successfully',
      ...createUserResponse(doctor, accessToken, refreshToken)
    });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.listDoctors = async (req, res) => {
  try {
    const doctors = await doctorInviteService.listClinicDoctors(req.user._id);
    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.listInvites = async (req, res) => {
  try {
    const invites = await doctorInviteService.listClinicInvites(req.user._id, req.query.status);
    res.json({ success: true, count: invites.length, data: invites });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.getSeatUsage = async (req, res) => {
  try {
    const usage = await doctorInviteService.getDoctorSeatUsage(req.user._id);
    const maxDoctors = req.user.clinicProfile?.maxDoctors || 3;
    res.json({
      success: true,
      data: {
        ...usage,
        maxDoctors,
        remaining: Math.max(0, maxDoctors - usage.used)
      }
    });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.listClinicDoctors = async (req, res) => {
  try {
    const doctors = await clinicService.listClinicDoctors(req.user._id);
    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.listClinicPatients = async (req, res) => {
  try {
    const patients = await clinicService.listClinicPatients(req.user._id);
    res.json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.getDoctorDetail = async (req, res) => {
  try {
    const data = await clinicService.getDoctorDetail(req.params.doctorId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.createClinicAppointment = async (req, res) => {
  try {
    const appointment = await clinicService.createClinicAppointment({
      clinicId: req.user._id,
      doctorId: req.body.doctorId,
      patientId: req.body.patientId,
      scheduledDate: req.body.scheduledDate,
      scheduledTime: req.body.scheduledTime,
      type: req.body.type,
      paymentAmount: req.body.paymentAmount
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.getClinicAppointments = async (req, res) => {
  try {
    const appointments = await clinicService.getClinicAppointments(req.user._id);
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.getDashboardOverview = async (req, res) => {
  try {
    const overview = await clinicService.getDashboardOverview(req.user._id);
    res.json({ success: true, data: overview });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};
