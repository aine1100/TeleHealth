const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const doctorController = require('../controllers/doctorController');

const doctorOnly = [authenticate, authorize('doctor')];

const supportValidation = [
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 160 }),
  body('message').trim().isLength({ min: 10, max: 4000 }).withMessage('Message must be 10–4000 characters'),
  body('category').optional().trim().isLength({ max: 60 })
];

const profileValidation = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('specialty').optional().trim().notEmpty().withMessage('Specialty cannot be empty'),
  body('consultationFee').optional().isFloat({ min: 0 })
];

/**
 * @openapi
 * /api/doctors/search:
 *   get:
 *     summary: Search doctors by specialty, query, availability, or rating
 *     tags: [Doctors]
 */
router.get('/search', doctorController.searchDoctors);

// Authenticated doctor self-service (before /:id)
router.get('/me', ...doctorOnly, doctorController.getMyAccount);
router.patch('/me/profile', ...doctorOnly, profileValidation, doctorController.updateMyProfile);
router.patch('/me/schedule', ...doctorOnly, doctorController.updateMySchedule);
router.patch('/me/settings', ...doctorOnly, doctorController.updateMySettings);
router.post('/me/support', ...doctorOnly, supportValidation, doctorController.submitSupport);

/**
 * @openapi
 * /api/doctors/{id}/availability:
 *   get:
 *     summary: Get open booking slots for a doctor
 *     tags: [Doctors]
 */
router.get('/:id/availability', doctorController.getDoctorAvailability);

/**
 * @openapi
 * /api/doctors/{id}:
 *   get:
 *     summary: Get a doctor profile by id
 *     tags: [Doctors]
 */
router.get('/:id', doctorController.getDoctorProfile);

module.exports = router;
