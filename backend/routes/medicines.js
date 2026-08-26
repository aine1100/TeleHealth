const express = require('express');
const router = express.Router();
const { MedicineReminder } = require('../models');
const { authenticate } = require('../middleware/auth');

const getOwnedReminder = async (id, patientId) => {
  const reminder = await MedicineReminder.findOne({ _id: id, patient: patientId });
  if (!reminder) {
    const error = new Error('Reminder not found');
    error.statusCode = 404;
    throw error;
  }
  return reminder;
};

// Create reminder
router.post('/', authenticate, async (req, res) => {
  try {
    const reminder = new MedicineReminder({
      ...req.body,
      patient: req.user._id,
      reminderSettings: {
        enabled: true,
        reminderTime: 0,
        notificationMethods: ['push'],
        soundEnabled: true,
        vibrationEnabled: true,
        ...(req.body.reminderSettings || {})
      }
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
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const filter = {
      patient: req.user._id,
      status: { $in: ['active', 'paused'] }
    };

    const [reminders, total] = await Promise.all([
      MedicineReminder.find(filter).sort({ startDate: -1 }).skip(skip).limit(limit),
      MedicineReminder.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: reminders.length,
      total,
      page,
      limit,
      data: reminders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update reminder status (pause, resume, discontinue)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['active', 'paused', 'completed', 'discontinued'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const reminder = await getOwnedReminder(req.params.id, req.user._id);
    reminder.status = status;
    if (status === 'discontinued') {
      reminder.discontinuedAt = new Date();
      reminder.discontinuedBy = req.user._id;
    }
    await reminder.save();
    res.json({ success: true, data: reminder });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

// Delete reminder
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const reminder = await getOwnedReminder(req.params.id, req.user._id);
    await reminder.deleteOne();
    res.json({ success: true, message: 'Reminder removed' });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

// Log dose taken/skipped/missed
router.post('/:id/log', authenticate, async (req, res) => {
  try {
    const { status, notes, time } = req.body;
    const allowed = ['taken', 'skipped', 'missed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid log status' });
    }

    const reminder = await getOwnedReminder(req.params.id, req.user._id);
    const now = new Date();
    const slotTime =
      (typeof time === 'string' && /^\d{1,2}:\d{2}$/.test(time.trim())
        ? time.trim().padStart(5, '0')
        : null) || now.toTimeString().slice(0, 5);

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);
    const alreadyLogged = (reminder.logs || []).some((log) => {
      if (!log?.date || !['taken', 'skipped', 'missed'].includes(log.status)) return false;
      const logDate = new Date(log.date);
      if (logDate < startOfDay || logDate >= endOfDay) return false;
      return String(log.time) === String(slotTime);
    });

    if (alreadyLogged) {
      return res.status(400).json({
        success: false,
        message: `This dose (${slotTime}) was already logged today`
      });
    }

    reminder.logs.push({
      date: now,
      time: slotTime,
      status,
      notes
    });

    reminder.dosesTaken = reminder.logs.filter((l) => l.status === 'taken').length;
    reminder.dosesMissed = reminder.logs.filter((l) => l.status === 'missed' || l.status === 'skipped').length;
    reminder.totalDoses = reminder.logs.length;
    reminder.adherenceRate =
      reminder.logs.length > 0
        ? Math.round((reminder.dosesTaken / reminder.logs.length) * 100)
        : 100;

    await reminder.save();
    res.json({ success: true, data: reminder });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

module.exports = router;
