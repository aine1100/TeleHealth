const express = require('express');
const router = express.Router();
const Flutterwave = require('flutterwave-node-v3');
const { Appointment } = require('../models');
const { authenticate } = require('../middleware/auth');

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// Initiate Mobile Money payment
router.post('/initiate', authenticate, async (req, res) => {
  try {
    const { appointmentId, phoneNumber, network } = req.body;
    const appointment = await Appointment.findById(appointmentId);

    const payload = {
      phone_number: phoneNumber,
      network: network.toUpperCase(), // "MTN" or "AIRTEL"
      amount: appointment.payment.totalAmount,
      currency: 'UGX',
      email: req.user.email,
      tx_ref: `AH-${Date.now()}-${appointmentId}`,
      meta: { appointmentId: appointmentId.toString() }
    };

    const response = await flw.MobileMoney.uganda(payload);

    if (response.status === 'success') {
      appointment.payment.flutterwaveRef = response.data.id;
      await appointment.save();
    }

    res.json({ 
      success: response.status === 'success', 
      data: response,
      redirectUrl: response.meta?.authorization?.redirect 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify payment (webhook)
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    // Verify webhook signature here
    
    const { data } = req.body;
    if (data.status === 'successful') {
      const appointment = await Appointment.findOne({ 'payment.flutterwaveRef': data.id });
      if (appointment) {
        appointment.payment.status = 'paid';
        appointment.payment.paidAt = new Date();
        appointment.status = 'confirmed';
        await appointment.save();
      }
    }
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;