const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(authenticate, authorize('admin'));

const supportValidation = [
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 160 }),
  body('message').trim().isLength({ min: 10, max: 4000 }).withMessage('Message must be 10–4000 characters'),
  body('category').optional().trim().isLength({ max: 60 })
];

router.get('/overview', adminController.getOverview);
router.get('/organizations', adminController.listOrganizations);
router.get('/organizations/pending', adminController.listPendingOrganizations);
router.get('/organizations/:id', adminController.getOrganization);
router.patch('/organizations/:id/review', adminController.reviewOrganization);
router.get('/clinics', adminController.listClinics);
router.get('/labs', adminController.listLabs);
router.get('/patients', adminController.listPatients);
router.get('/patients/:id', adminController.getPatient);
router.post('/support', supportValidation, adminController.submitSupport);

module.exports = router;
