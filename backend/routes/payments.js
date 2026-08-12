const express = require('express');
const router = express.Router();
const { Appointment } = require('../models');
const { authenticate } = require('../middleware/auth');
const { sendErrorResponse } = require('../utils/apiErrors');
const notificationService = require('../services/notificationService');

const MOCK_PAYMENTS_ENABLED = process.env.MOCK_PAYMENTS !== 'false';
const FLW_CONFIGURED = Boolean(process.env.FLW_PUBLIC_KEY && process.env.FLW_SECRET_KEY);

const getFlutterwave = () => {
  if (!FLW_CONFIGURED) return null;
  // eslint-disable-next-line global-require
  const Flutterwave = require('flutterwave-node-v3');
  return new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
};

const getOwnedAppointment = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  if (appointment.patient.toString() !== userId.toString()) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  return appointment;
};

const markAppointmentPaid = async (appointment, { method, phoneNumber, transactionId, providerRef }) => {
  appointment.payment.status = 'paid';
  appointment.payment.method = method;
  appointment.payment.paidAt = new Date();
  appointment.payment.transactionId = transactionId;
  if (providerRef) appointment.payment.flutterwaveRef = providerRef;

  await appointment.save();
  return appointment;
};

/** Simulated payment for development/demo — no real money is charged. */
router.post('/mock', authenticate, async (req, res) => {
  try {
    if (!MOCK_PAYMENTS_ENABLED) {
      return res.status(403).json({
        success: false,
        message: 'Mock payments are disabled on this server.'
      });
    }

    const { appointmentId, method = 'mtn_momo', phoneNumber } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'Appointment is required' });
    }

    const allowedMethods = ['mtn_momo', 'airtel_money', 'cash'];
    if (!allowedMethods.includes(method)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    const appointment = await getOwnedAppointment(appointmentId, req.user._id);

    if (appointment.payment?.status === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already completed',
        data: appointment
      });
    }

    const transactionId = `MOCK-${Date.now()}-${appointment._id.toString().slice(-6)}`;
    await markAppointmentPaid(appointment, {
      method,
      phoneNumber,
      transactionId,
      providerRef: `mock-${transactionId}`
    });

    await appointment.populate('patient doctor', 'firstName lastName');
    notificationService.notifyPaymentReceived(appointment).catch((err) => {
      console.error('[Notification] payment received', err.message);
    });

    console.info(
      `[MockPayment] appointment=${appointmentId} method=${method} phone=${phoneNumber || '—'} amount=UGX ${appointment.payment.totalAmount} ref=${transactionId}`
    );

    res.json({
      success: true,
      message: 'Mock payment successful',
      mock: true,
      data: appointment
    });
  } catch (error) {
    sendErrorResponse(res, error, {
      logLabel: 'MockPayment',
      userMessage: 'Payment could not be completed. Please try again.'
    });
  }
});

// Initiate Mobile Money payment (Flutterwave — when configured)
router.post('/initiate', authenticate, async (req, res) => {
  try {
    const flw = getFlutterwave();
    if (!flw) {
      return res.status(503).json({
        success: false,
        message: 'Live payments are not configured. Use mock payment for now.',
        mockAvailable: MOCK_PAYMENTS_ENABLED
      });
    }

    const { appointmentId, phoneNumber, network } = req.body;
    const appointment = await getOwnedAppointment(appointmentId, req.user._id);

    const payload = {
      phone_number: phoneNumber,
      network: network.toUpperCase(),
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
    sendErrorResponse(res, error, {
      logLabel: 'Payment',
      userMessage: 'Unable to start payment. Please try again.'
    });
  }
});

// Verify payment (webhook)
router.post('/webhook', async (req, res) => {
  try {
    const { data } = req.body;
    if (data?.status === 'successful') {
      const appointment = await Appointment.findOne({ 'payment.flutterwaveRef': data.id });
      if (appointment) {
        await markAppointmentPaid(appointment, {
          method: appointment.payment.method || 'mtn_momo',
          transactionId: data.tx_ref || data.id,
          providerRef: data.id
        });
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('[Payment webhook]', error);
    res.sendStatus(500);
  }
});

module.exports = router;
