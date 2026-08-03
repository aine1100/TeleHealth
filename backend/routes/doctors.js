const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

/**
 * @openapi
 * /api/doctors/search:
 *   get:
 *     summary: Search doctors by specialty, query, availability, or rating
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *       - in: query
 *         name: availableNow
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Doctors returned successfully
 */
router.get('/search', doctorController.searchDoctors);

/**
 * @openapi
 * /api/doctors/{id}:
 *   get:
 *     summary: Get a doctor profile by id
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor profile returned successfully
 */
router.get('/:id', doctorController.getDoctorProfile);

module.exports = router;