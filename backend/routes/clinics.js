const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const clinicController = require('../controllers/clinicController');

/**
 * @openapi
 * /api/clinics/doctors:
 *   get:
 *     summary: List doctors belonging to the authenticated clinic
 *     tags: [Clinics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctors fetched successfully
 */
router.get('/doctors', authenticate, authorize('clinic_admin'), clinicController.listDoctors);

/**
 * @openapi
 * /api/clinics/doctors/{doctorId}:
 *   get:
 *     summary: Get a clinic doctor detail with recent appointments
 *     tags: [Clinics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor details fetched successfully
 */
router.get('/doctors/:doctorId', authenticate, authorize('clinic_admin'), clinicController.getDoctorDetail);

/**
 * @openapi
 * /api/clinics/appointments:
 *   post:
 *     summary: Create an appointment for a clinic patient and doctor
 *     tags: [Clinics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorId, patientId, scheduledDate, scheduledTime, type]
 *             properties:
 *               doctorId:
 *                 type: string
 *               patientId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *               scheduledTime:
 *                 type: string
 *               type:
 *                 type: string
 *               paymentAmount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Appointment created successfully
 */
router.post('/appointments', authenticate, authorize('clinic_admin'), clinicController.createClinicAppointment);

/**
 * @openapi
 * /api/clinics/appointments:
 *   get:
 *     summary: List appointments created by the authenticated clinic
 *     tags: [Clinics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointments fetched successfully
 */
router.get('/appointments', authenticate, authorize('clinic_admin'), clinicController.getClinicAppointments);

module.exports = router;
