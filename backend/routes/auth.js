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

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/register', sharedValidation, authController.registerUser);
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns access and refresh tokens
 */
router.post('/login', authController.loginUser);
/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh an access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 */
router.post('/refresh-token', authController.refreshToken);
/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user returned successfully
 */
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/register/patient', sharedValidation, (req, res) => {
  req.body.role = 'patient';
  return authController.registerUser(req, res);
});
router.post('/register/clinic', sharedValidation, upload.array('documents', 5), (req, res) => {
  req.body.role = 'clinic_admin';
  return authController.registerUser(req, res);
});
router.post('/register/lab', sharedValidation, upload.array('documents', 5), (req, res) => {
  req.body.role = 'lab_tech';
  return authController.registerUser(req, res);
});
router.post('/register/admin', sharedValidation, authenticate, authorize('admin'), (req, res) => {
  req.body.role = 'admin';
  return authController.registerUser(req, res);
});
router.post('/register/insurance', sharedValidation, upload.array('documents', 5), (req, res) => {
  req.body.role = 'insurance';
  return authController.registerUser(req, res);
});
router.get('/organizations/pending', authenticate, authorize('admin'), authController.getPendingOrganizations);
router.patch('/organizations/:id/review', authenticate, authorize('admin'), authController.reviewOrganization);
router.post('/login', authController.loginUser);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;