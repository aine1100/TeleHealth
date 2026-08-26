const labService = require('../services/labService');
const { sendErrorResponse } = require('../utils/apiErrors');

exports.listLabs = async (req, res) => {
  try {
    const result = await labService.listLabs(req.query);
    res.json({ success: true, ...result, count: result.data.length });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'Labs' });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const data = await labService.getOverview(req.user);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'LabOverview' });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const result = await labService.listOrders(req.user, req.query);
    res.json({ success: true, ...result, count: result.data.length });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'LabOrders' });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    const data = await labService.acceptOrder(req.user, req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'LabOrders' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    let results = req.body.results;
    if (typeof results === 'string') {
      try {
        results = JSON.parse(results);
      } catch {
        results = undefined;
      }
    }
    const data = await labService.updateOrder(
      req.user,
      req.params.id,
      { status: req.body.status, results },
      req.file
    );
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'LabOrders' });
  }
};

exports.getAccount = async (req, res) => {
  try {
    const data = await labService.getAccount(req.user);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'LabAccount' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const data = await labService.updateProfile(req.user, req.body);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'LabProfile' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const data = await labService.updateSettings(req.user, req.body);
    res.json({ success: true, data });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'LabSettings' });
  }
};
