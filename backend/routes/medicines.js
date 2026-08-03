const express = require('express');
const router = express.Router();
const { MedicineReminder } = require('../models');
const { authenticate } = require('../middleware/auth');

// Create reminder
router.post('/', authenticate, async (req, res) => {
  try {
    const reminder = new MedicineReminder({
      ...req.body,
      patient: req.user._id
    });
    await reminder.save();
    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get my reminders
router.get('/my-reminders', authenticate, async (req, res) => {
  try {
    const reminders = await MedicineReminder.find({ 
      patient: req.user._id, 
      status: 'active' 
    }).sort({ startDate: -1 });
    res.json({ success: true, data: reminders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Log dose taken/skipped
router.post('/:id/log', authenticate, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const reminder = await MedicineReminder.findById(req.params.id);
    
    reminder.logs.push({
      date: new Date(),
      time: new Date().toTimeString().slice(0, 5),
      status,
      notes
    });
    
    reminder.dosesTaken = reminder.logs.filter(l => l.status === 'taken').length;
    reminder.dosesMissed = reminder.logs.filter(l => l.status === 'missed').length;
    reminder.adherenceRate = Math.round((reminder.dosesTaken / reminder.logs.length) * 100);
    
    await reminder.save();
    res.json({ success: true, data: reminder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;