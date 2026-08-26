const insuranceService = require('../services/insuranceService');
const { sendErrorResponse } = require('../utils/apiErrors');

exports.listProviders = async (req, res) => {
  try {
    const result = await insuranceService.listProviders(req.query);
    res.json({ success: true, ...result, count: result.data.length });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'InsuranceProviders' });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const data = await insuranceService.getOverview(req.user);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'InsuranceOverview' });
  }
};

exports.listPlans = async (req, res) => {
  try {
    const data = await insuranceService.listPlans(req.user);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'InsurancePlans' });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const data = await insuranceService.createPlan(req.user, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'InsurancePlans' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const data = await insuranceService.updatePlan(req.user, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'InsurancePlans' });
  }
};

exports.listPolicies = async (req, res) => {
  try {
    const result = await insuranceService.listPolicies(req.user, req.query);
    res.json({ success: true, ...result, count: result.data.length });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'InsurancePolicies' });
  }
};

exports.updatePolicyStatus = async (req, res) => {
  try {
    const data = await insuranceService.updatePolicyStatus(req.user, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'InsurancePolicies' });
  }
};

exports.listClaims = async (req, res) => {
  try {
    const result = await insuranceService.listClaims(req.user, req.query);
    res.json({ success: true, ...result, count: result.data.length });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'InsuranceClaims' });
  }
};

exports.updateClaim = async (req, res) => {
  try {
    const data = await insuranceService.updateClaim(req.user, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'InsuranceClaims' });
  }
};

exports.getMyPolicies = async (req, res) => {
  try {
    const result = await insuranceService.getMyPolicies(req.user, req.query);
    res.json({ success: true, ...result, count: result.data.length });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'PatientInsurance' });
  }
};

exports.getMyClaims = async (req, res) => {
  try {
    const result = await insuranceService.getMyClaims(req.user, req.query);
    res.json({ success: true, ...result, count: result.data.length });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'PatientInsurance' });
  }
};

exports.submitMyPolicy = async (req, res) => {
  try {
    const data = await insuranceService.submitMyPolicy(req.user, req.body, req.file);
    res.status(201).json({ success: true, data, message: 'Policy submitted for verification' });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'PatientInsurance' });
  }
};

exports.cancelMyPolicy = async (req, res) => {
  try {
    const data = await insuranceService.cancelMyPolicy(req.user, req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'PatientInsurance' });
  }
};

exports.quote = async (req, res) => {
  try {
    const data = await insuranceService.quoteForPatient(req.user, req.query);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'InsuranceQuote' });
  }
};

exports.getAccount = async (req, res) => {
  try {
    const data = await insuranceService.getAccount(req.user);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'InsuranceAccount' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const data = await insuranceService.updateProfile(req.user, req.body);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'InsuranceProfile' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const data = await insuranceService.updateSettings(req.user, req.body);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'InsuranceSettings' });
  }
};
