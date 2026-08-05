const adminService = require('../services/adminService');
const doctorAccountService = require('../services/doctorAccountService');
const { validationResult } = require('express-validator');

const handleError = (res, error) => {
  const status = error.statusCode || 500;
  return res.status(status).json({ success: false, message: error.message });
};

exports.getOverview = async (req, res) => {
  try {
    const data = await adminService.getOverview();
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
};

exports.listOrganizations = async (req, res) => {
  try {
    const result = await adminService.listOrganizations(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error);
  }
};

exports.listPendingOrganizations = async (req, res) => {
  try {
    const result = await adminService.listOrganizations({ ...req.query, status: 'pending' });
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error);
  }
};

exports.listClinics = async (req, res) => {
  try {
    const result = await adminService.listClinics(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error);
  }
};

exports.listLabs = async (req, res) => {
  try {
    const result = await adminService.listLabs(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error);
  }
};

exports.getOrganization = async (req, res) => {
  try {
    const data = await adminService.getOrganizationById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
};

exports.reviewOrganization = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const data = await adminService.reviewOrganization(req.params.id, { status, notes });
    res.json({
      success: true,
      message: `Organization ${status} successfully`,
      data
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.listPatients = async (req, res) => {
  try {
    const result = await adminService.listPatients(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error);
  }
};

exports.getPatient = async (req, res) => {
  try {
    const data = await adminService.getPatientById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
};

exports.submitSupport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const data = await doctorAccountService.submitSupportRequest(req.user, req.body);
    res.status(201).json({ success: true, message: 'Support request submitted', data });
  } catch (error) {
    handleError(res, error);
  }
};
