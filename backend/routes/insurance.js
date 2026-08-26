const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const insuranceController = require('../controllers/insuranceController');

// Public to authenticated users — list approved insurers
router.get('/providers', authenticate, insuranceController.listProviders);

// Patient insurance wallet
router.get('/my-policies', authenticate, authorize('patient'), insuranceController.getMyPolicies);
router.get('/my-claims', authenticate, authorize('patient'), insuranceController.getMyClaims);
router.post(
  '/my-policies',
  authenticate,
  authorize('patient'),
  upload.single('document'),
  insuranceController.submitMyPolicy
);
router.delete('/my-policies/:id', authenticate, authorize('patient'), insuranceController.cancelMyPolicy);
router.get('/quote', authenticate, authorize('patient'), insuranceController.quote);

// Insurance partner portal
router.get('/me/overview', authenticate, authorize('insurance', 'admin'), insuranceController.getOverview);
router.get('/me/account', authenticate, authorize('insurance', 'admin'), insuranceController.getAccount);
router.patch('/me/profile', authenticate, authorize('insurance', 'admin'), insuranceController.updateProfile);
router.patch('/me/settings', authenticate, authorize('insurance', 'admin'), insuranceController.updateSettings);

router.get('/me/plans', authenticate, authorize('insurance', 'admin'), insuranceController.listPlans);
router.post('/me/plans', authenticate, authorize('insurance', 'admin'), insuranceController.createPlan);
router.patch('/me/plans/:id', authenticate, authorize('insurance', 'admin'), insuranceController.updatePlan);

router.get('/me/policies', authenticate, authorize('insurance', 'admin'), insuranceController.listPolicies);
router.patch(
  '/me/policies/:id/status',
  authenticate,
  authorize('insurance', 'admin'),
  insuranceController.updatePolicyStatus
);

router.get('/me/claims', authenticate, authorize('insurance', 'admin'), insuranceController.listClaims);
router.patch('/me/claims/:id', authenticate, authorize('insurance', 'admin'), insuranceController.updateClaim);

module.exports = router;
