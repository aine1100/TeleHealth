const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const clinicController = require('../controllers/clinicController');

const inviteValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('specialty').optional().trim().notEmpty().withMessage('Specialty cannot be empty')
];

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
router.post('/doctors/invite', authenticate, authorize('clinic_admin'), inviteValidation, clinicController.inviteDoctor);

router.get('/doctors', authenticate, authorize('clinic_admin'), clinicController.listClinicDoctors);

router.get('/doctors/seats', authenticate, authorize('clinic_admin'), clinicController.getSeatUsage);

router.get('/patients', authenticate, authorize('clinic_admin'), clinicController.listClinicPatients);

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

router.get('/overview', authenticate, authorize('clinic_admin'), clinicController.getDashboardOverview);

module.exports = router;
