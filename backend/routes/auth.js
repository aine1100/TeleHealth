const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const authController = require('../controllers/authController');
const upload = require('../middleware/upload');

const sharedValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const withForcedRole = (role) => (req, res, next) => {
  req.forcedRole = role;
  req.body.role = role;
  next();
};

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new patient
 *     tags: [Auth]
 */
router.post('/register', sharedValidation, authController.registerUser);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 */
router.post('/login', authController.loginUser);

/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh an access token
 *     tags: [Auth]
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @openapi
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify a newly registered account with an OTP
 *     tags: [Auth]
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send a password reset OTP by email or phone
 *     tags: [Auth]
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset a password using an OTP
 *     tags: [Auth]
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authenticate, authController.getCurrentUser);

router.post(
  '/register/patient',
  sharedValidation,
  withForcedRole('patient'),
  authController.registerUser
);

router.post(
  '/register/clinic',
  sharedValidation,
  upload.array('documents', 5),
  withForcedRole('clinic_admin'),
  authController.registerUser
);

router.post(
  '/register/lab',
  sharedValidation,
  upload.array('documents', 5),
  withForcedRole('lab_tech'),
  authController.registerUser
);

router.post(
  '/register/admin',
  sharedValidation,
  authenticate,
  authorize('admin'),
  withForcedRole('admin'),
  authController.registerUser
);

router.post(
  '/register/insurance',
  sharedValidation,
  upload.array('documents', 5),
  withForcedRole('insurance'),
  authController.registerUser
);

router.get(
  '/organizations/pending',
  authenticate,
  authorize('admin'),
  authController.getPendingOrganizations
);

router.patch(
  '/organizations/:id/review',
  authenticate,
  authorize('admin'),
  authController.reviewOrganization
);

module.exports = router;
