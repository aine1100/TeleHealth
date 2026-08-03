const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { authenticate } = require('../middleware/auth');

// Get my notifications
router.get('/my-notifications', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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