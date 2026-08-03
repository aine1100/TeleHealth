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

const setupValidation = [
  body('token').notEmpty().withMessage('Invite token is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('specialty').notEmpty().withMessage('Specialty is required'),
  body('licenseNumber').optional().trim()
];

/**
 * @openapi
 * /api/clinic/doctors/invite:
 *   post:
 *     summary: Invite a doctor by email
 *     tags: [Clinic]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/doctors/invite',
  authenticate,
  authorize('clinic_admin'),
  inviteValidation,
  clinicController.inviteDoctor
);

/**
 * @openapi
 * /api/clinic/doctors/invites:
 *   get:
 *     summary: List doctor invites for the clinic
 *     tags: [Clinic]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/doctors/invites',
  authenticate,
  authorize('clinic_admin'),
  clinicController.listInvites
);

router.post(
  '/doctors/invites/:inviteId/resend',
  authenticate,
  authorize('clinic_admin'),
  clinicController.resendInvite
);

router.delete(
  '/doctors/invites/:inviteId',
  authenticate,
  authorize('clinic_admin'),
  clinicController.cancelInvite
);

/**
 * @openapi
 * /api/clinic/doctors:
 *   get:
 *     summary: List doctors belonging to the clinic
 *     tags: [Clinic]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/doctors',
  authenticate,
  authorize('clinic_admin'),
  clinicController.listDoctors
);

router.get(
  '/doctors/seats',
  authenticate,
  authorize('clinic_admin'),
  clinicController.getSeatUsage
);

/**
 * @openapi
 * /api/clinic/doctors/invite/{token}:
 *   get:
 *     summary: Get invite details for doctor account setup
 *     tags: [Clinic]
 */
router.get('/doctors/invite/:token', clinicController.getInviteDetails);

/**
 * @openapi
 * /api/clinic/doctors/setup:
 *   post:
 *     summary: Complete doctor account setup from an invite
 *     tags: [Clinic]
 */
router.post('/doctors/setup', setupValidation, clinicController.setupDoctorAccount);

module.exports = router;
