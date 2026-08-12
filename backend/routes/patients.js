const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const patientController = require('../controllers/patientController');

const patientOnly = [authenticate, authorize('patient')];

const supportValidation = [
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 160 }),
  body('message').trim().isLength({ min: 10, max: 4000 }).withMessage('Message must be 10–4000 characters'),
  body('category').optional().trim().isLength({ max: 60 })
];

const profileValidation = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty')
];

router.get('/me', ...patientOnly, patientController.getMyAccount);
router.patch('/me/profile', ...patientOnly, profileValidation, patientController.updateMyProfile);
router.patch('/me/settings', ...patientOnly, patientController.updateMySettings);
router.post('/me/support', ...patientOnly, supportValidation, patientController.submitSupport);

module.exports = router;
