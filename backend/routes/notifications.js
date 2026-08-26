const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { authenticate } = require('../middleware/auth');
const pushService = require('../services/pushService');
const { sendErrorResponse } = require('../utils/apiErrors');

// Get my notifications
router.get('/my-notifications', authenticate, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const filter = { recipient: req.user._id };

    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: notifications.length,
      total,
      page,
      limit,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public VAPID key for browser push subscription
router.get('/push/vapid-public-key', authenticate, (req, res) => {
  const key = pushService.getVapidPublicKey();
  if (!key) {
    return res.status(503).json({
      success: false,
      message: 'Web push is not configured on the server'
    });
  }
  res.json({ success: true, data: { publicKey: key } });
});

// Save browser / phone push subscription
router.post('/push/subscribe', authenticate, async (req, res) => {
  try {
    const subscriptions = await pushService.saveSubscription(
      req.user._id,
      req.body?.subscription || req.body,
      req.headers['user-agent'] || ''
    );
    res.json({ success: true, data: { count: subscriptions.length } });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'PushSubscribe' });
  }
});

router.post('/push/unsubscribe', authenticate, async (req, res) => {
  try {
    const endpoint = req.body?.endpoint;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'endpoint is required' });
    }
    const subscriptions = await pushService.removeSubscription(req.user._id, endpoint);
    res.json({ success: true, data: { count: subscriptions.length } });
  } catch (error) {
    sendErrorResponse(res, error, { logLabel: 'PushUnsubscribe' });
  }
});

// Mark as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      isRead: true,
      readAt: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
