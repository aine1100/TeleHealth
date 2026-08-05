const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(authenticate, authorize('admin'));

/**
 * @openapi
 * /api/admin/overview:
 *   get:
 *     summary: Super admin dashboard overview stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/overview', adminController.getOverview);

/**
 * @openapi
 * /api/admin/organizations:
 *   get:
 *     summary: List registered organizations (clinics, labs, insurance)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/organizations', adminController.listOrganizations);

/**
 * @openapi
 * /api/admin/organizations/pending:
 *   get:
 *     summary: List organizations awaiting verification
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/organizations/pending', adminController.listPendingOrganizations);

/**
 * @openapi
 * /api/admin/organizations/{id}:
 *   get:
 *     summary: Get organization details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/organizations/:id', adminController.getOrganization);

/**
 * @openapi
 * /api/admin/organizations/{id}/review:
 *   patch:
 *     summary: Approve or reject an organization
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/organizations/:id/review', adminController.reviewOrganization);

/**
 * @openapi
 * /api/admin/clinics:
 *   get:
 *     summary: List registered clinics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/clinics', adminController.listClinics);

/**
 * @openapi
 * /api/admin/labs:
 *   get:
 *     summary: List registered laboratories
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/labs', adminController.listLabs);

/**
 * @openapi
 * /api/admin/patients:
 *   get:
 *     summary: List platform patients
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/patients', adminController.listPatients);

/**
 * @openapi
 * /api/admin/patients/{id}:
 *   get:
 *     summary: Get patient details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/patients/:id', adminController.getPatient);

module.exports = router;
