const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, authorize, requireApprovedOrganization } = require('../middleware/auth');
const clinicController = require('../controllers/clinicController');

const inviteValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('specialty').optional().trim().notEmpty().withMessage('Specialty cannot be empty')
];

const setupValidation = [
  body('token').notEmpty().withMessage('Invite token is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('specialty').notEmpty().withMessage('Specialty is required'),
  body('licenseNumber').optional().trim()
];

const clinicAdmin = [authenticate, authorize('clinic_admin'), requireApprovedOrganization];

// Public doctor invite flows (no clinic dashboard approval required)
router.get('/doctors/invite/:token', clinicController.getInviteDetails);
router.post('/doctors/setup', setupValidation, clinicController.setupDoctorAccount);

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
router.post('/doctors/invite', ...clinicAdmin, inviteValidation, clinicController.inviteDoctor);

router.get('/doctors', ...clinicAdmin, clinicController.listClinicDoctors);

router.get('/doctors/seats', ...clinicAdmin, clinicController.getSeatUsage);

router.get('/patients', ...clinicAdmin, clinicController.listClinicPatients);

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
router.get('/doctors/:doctorId', ...clinicAdmin, clinicController.getDoctorDetail);

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
router.post('/appointments', ...clinicAdmin, clinicController.createClinicAppointment);

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
router.get('/appointments', ...clinicAdmin, clinicController.getClinicAppointments);

router.get('/overview', ...clinicAdmin, clinicController.getDashboardOverview);

module.exports = router;
