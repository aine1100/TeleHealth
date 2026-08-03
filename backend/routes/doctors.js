const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Search doctors
router.get('/search', async (req, res) => {
  try {
    const { specialty, query, minRating, availableNow } = req.query;
    const filter = { role: 'doctor', 'doctorProfile.isVerified': true };

    if (specialty) filter['doctorProfile.specialty'] = specialty;
    if (minRating) filter['doctorProfile.rating'] = { $gte: parseFloat(minRating) };
    if (availableNow === 'true') filter['doctorProfile.isAvailable'] = true;
    if (query) {
      filter.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { 'doctorProfile.specialty': { $regex: query, $options: 'i' } }
      ];
    }

    const doctors = await User.find(filter)
      .select('firstName lastName avatar doctorProfile rating reviewCount')
      .sort({ 'doctorProfile.rating': -1 });

    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get doctor profile
router.get('/:id', async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id)
      .select('-password')
      .populate('reviews');
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;