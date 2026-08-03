const express = require('express');
const router = express.Router();
const { Appointment } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// Create appointment
router.post('/', authenticate, async (req, res) => {
  try {
    const appointment = new Appointment({
      ...req.body,
      patient: req.user.role === 'patient' ? req.user._id : req.body.patient,
      createdBy: req.user._id
    });
    await appointment.save();
    await appointment.populate('patient doctor', 'firstName lastName phone');
    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get my appointments
router.get('/my-appointments', authenticate, async (req, res) => {
  try {
    const query = req.user.role === 'patient' 
      ? { patient: req.user._id } 
      : { doctor: req.user._id };
    
    const appointments = await Appointment.find(query)
      .populate('patient doctor', 'firstName lastName phone avatar')
      .sort({ scheduledDate: -1 });
    
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update appointment status (cancel, postpone, refer)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, reason, postponedTo, referredTo } = req.body;
    const update = { status, updatedBy: req.user._id };
    
    if (status === 'cancelled') {
      update.cancelledBy = req.user._id;
      update.cancellationReason = reason;
      update.cancelledAt = new Date();
    }
    if (status === 'postponed') {
      update.postponedTo = postponedTo;
      update.postponedReason = reason;
      update.postponedAt = new Date();
    }
    if (status === 'referred') {
      update.referral = { referredTo, reason, status: 'pending' };
    }

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Join waiting room
router.post('/:id/join-waiting', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    appointment.status = 'in_waiting_room';
    appointment.waitingRoom = {
      joinedAt: new Date(),
      position: await Appointment.countDocuments({ 
        doctor: appointment.doctor, 
        status: 'in_waiting_room',
        'waitingRoom.joinedAt': { $lt: appointment.waitingRoom?.joinedAt || new Date() }
      }) + 1,
      estimatedWaitMinutes: 15,
      patientsAhead: 2
    };
    await appointment.save();
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;