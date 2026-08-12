const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const pharmacyUpload = require('../middleware/pharmacyUpload');
const pharmacyController = require('../controllers/pharmacyController');

const pharmacyStaff = [authenticate, authorize('pharmacist', 'admin')];

const supportValidation = [
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 160 }),
  body('message').trim().isLength({ min: 10, max: 4000 }).withMessage('Message must be 10–4000 characters'),
  body('category').optional().trim().isLength({ max: 60 })
];

router.get('/', authenticate, pharmacyController.listPharmacies);
router.get('/orders/mine', authenticate, pharmacyController.listOrders);
router.post('/orders', authenticate, pharmacyController.createOrder);
router.post('/orders/:id/pay', authenticate, pharmacyController.payOrder);

router.get('/me', ...pharmacyStaff, pharmacyController.getMyProfile);
router.get('/me/account', ...pharmacyStaff, pharmacyController.getMyAccount);
router.patch('/me', ...pharmacyStaff, pharmacyController.updateMyProfile);
router.patch('/me/settings', ...pharmacyStaff, pharmacyController.updateMySettings);
router.post('/me/support', ...pharmacyStaff, supportValidation, pharmacyController.submitSupport);
router.get('/me/overview', ...pharmacyStaff, pharmacyController.getOverview);
router.get('/me/medicines', ...pharmacyStaff, pharmacyController.listMedicines);
router.post(
  '/me/medicines',
  ...pharmacyStaff,
  pharmacyUpload.single('image'),
  pharmacyController.createMedicine
);
router.put(
  '/me/medicines/:id',
  ...pharmacyStaff,
  pharmacyUpload.single('image'),
  pharmacyController.updateMedicine
);
router.delete('/me/medicines/:id', ...pharmacyStaff, pharmacyController.deleteMedicine);
router.patch('/me/medicines/:id/stock', ...pharmacyStaff, pharmacyController.adjustStock);
router.patch('/me/orders/:id/status', ...pharmacyStaff, pharmacyController.updateOrderStatus);

router.get('/:id', authenticate, pharmacyController.getPharmacy);

module.exports = router;
