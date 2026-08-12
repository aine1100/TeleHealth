const doctorService = require('../services/doctorService');
const doctorAccountService = require('../services/doctorAccountService');
const { validationResult } = require('express-validator');

const getErrorStatus = (error) => error.statusCode || 500;

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return null;
};

exports.searchDoctors = async (req, res) => {
  try {
    const doctors = await doctorService.searchDoctors(req.query);
    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.getDoctorProfile = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorProfile(req.params.id);
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.getDoctorAvailability = async (req, res) => {
  try {
    const data = await doctorService.getDoctorAvailability(req.params.id, {
      fromDate: req.query.from,
      days: req.query.days
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.getMyAccount = async (req, res) => {
  try {
    const data = await doctorAccountService.getMyAccount(req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return validationError;

  try {
    const data = await doctorAccountService.updateMyProfile(req.user, req.body);
    res.json({ success: true, message: 'Profile updated', data });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.updateMySchedule = async (req, res) => {
  try {
    const data = await doctorAccountService.updateMySchedule(req.user, req.body);
    res.json({ success: true, message: 'Schedule updated', data });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.updateMySettings = async (req, res) => {
  try {
    const data = await doctorAccountService.updateMySettings(req.user, req.body);
    res.json({ success: true, message: 'Settings saved', data });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.submitSupport = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return validationError;

  try {
    const data = await doctorAccountService.submitSupportRequest(req.user, req.body);
    res.status(201).json({ success: true, message: 'Support request submitted', data });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};
