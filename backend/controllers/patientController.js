const { validationResult } = require('express-validator');
const patientAccountService = require('../services/patientAccountService');

const getErrorStatus = (error) => error.statusCode || 500;

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return null;
};

exports.getMyAccount = async (req, res) => {
  try {
    const data = await patientAccountService.getMyAccount(req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return validationError;

  try {
    const data = await patientAccountService.updateMyProfile(req.user, req.body);
    res.json({ success: true, message: 'Profile updated', data });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.updateMySettings = async (req, res) => {
  try {
    const data = await patientAccountService.updateMySettings(req.user, req.body);
    res.json({ success: true, message: 'Settings saved', data });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.submitSupport = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return validationError;

  try {
    const data = await patientAccountService.submitSupportRequest(req.user, req.body);
    res.status(201).json({ success: true, message: 'Support request submitted', data });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};
