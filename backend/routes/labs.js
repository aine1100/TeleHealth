const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const labController = require('../controllers/labController');

router.get('/', authenticate, labController.listLabs);

router.get('/me/overview', authenticate, authorize('lab_tech', 'admin'), labController.getOverview);
router.get('/me/account', authenticate, authorize('lab_tech', 'admin'), labController.getAccount);
router.patch('/me/profile', authenticate, authorize('lab_tech', 'admin'), labController.updateProfile);
router.patch('/me/settings', authenticate, authorize('lab_tech', 'admin'), labController.updateSettings);

router.get('/me/orders', authenticate, authorize('lab_tech', 'admin'), labController.listOrders);
router.post('/me/orders/:id/accept', authenticate, authorize('lab_tech', 'admin'), labController.acceptOrder);
router.patch(
  '/me/orders/:id',
  authenticate,
  authorize('lab_tech', 'admin'),
  upload.single('report'),
  labController.updateOrder
);

module.exports = router;
