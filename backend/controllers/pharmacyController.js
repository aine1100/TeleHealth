const pharmacyService = require('../services/pharmacyService');
const { sendErrorResponse } = require('../utils/apiErrors');
const { validationResult } = require('express-validator');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    return true;
  }
  return false;
};

exports.listPharmacies = async (req, res) => {
  try {
    const data = await pharmacyService.listPharmacies({
      q: req.query.q,
      city: req.query.city
    });
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Pharmacy' });
  }
};

exports.getPharmacy = async (req, res) => {
  try {
    const data = await pharmacyService.getPharmacyById(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Pharmacy' });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const data = await pharmacyService.getMyPharmacyProfile(req.user);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Pharmacy' });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const data = await pharmacyService.updateMyPharmacyProfile(req.user, req.body);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Pharmacy' });
  }
};

exports.getMyAccount = async (req, res) => {
  try {
    const data = await pharmacyService.getMyAccount(req.user);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Pharmacy' });
  }
};

exports.updateMySettings = async (req, res) => {
  try {
    const data = await pharmacyService.updateMySettings(req.user, req.body);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Pharmacy' });
  }
};

exports.submitSupport = async (req, res) => {
  if (handleValidation(req, res)) return;
  try {
    const data = await pharmacyService.submitSupportRequest(req.user, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Pharmacy' });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const data = await pharmacyService.getOverview(req.user);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Pharmacy' });
  }
};

exports.listMedicines = async (req, res) => {
  try {
    const data = await pharmacyService.listMyMedicines(req.user, {
      q: req.query.q,
      status: req.query.status
    });
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Pharmacy' });
  }
};

exports.createMedicine = async (req, res) => {
  try {
    const data = await pharmacyService.createMedicine({
      user: req.user,
      body: req.body,
      file: req.file
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Pharmacy' });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const data = await pharmacyService.updateMedicine({
      user: req.user,
      medicineId: req.params.id,
      body: req.body,
      file: req.file
    });
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Pharmacy' });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    await pharmacyService.deleteMedicine({
      user: req.user,
      medicineId: req.params.id
    });
    res.json({ success: true, message: 'Medicine deleted' });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Pharmacy' });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const data = await pharmacyService.adjustStock({
      user: req.user,
      medicineId: req.params.id,
      quantity: req.body.quantity,
      mode: req.body.mode || 'set'
    });
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Pharmacy' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const data = await pharmacyService.createPharmacyOrder({
      user: req.user,
      body: req.body
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'PharmacyOrder' });
  }
};

exports.payOrder = async (req, res) => {
  try {
    const data = await pharmacyService.payPharmacyOrder({
      user: req.user,
      orderId: req.params.id,
      body: req.body
    });
    res.json({ success: true, message: 'Payment successful. Order sent to pharmacy.', data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'PharmacyOrderPayment' });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const data = await pharmacyService.listMyOrders(req.user);
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'PharmacyOrder' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const data = await pharmacyService.updateOrderStatus({
      user: req.user,
      orderId: req.params.id,
      body: req.body
    });
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'PharmacyOrder' });
  }
};
