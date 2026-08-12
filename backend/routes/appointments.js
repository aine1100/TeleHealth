const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const consultUpload = require('../middleware/consultUpload');
const appointmentController = require('../controllers/appointmentController');
/**
 * @openapi
 * /api/appointments:
 *   post:
 *     summary: Create an appointment request
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctor, scheduledDate, scheduledTime, type]
 *             properties:
 *               doctor:
 *                 type: string
 *               patient:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *               scheduledTime:
 *                 type: string
 *               type:
 *                 type: string
 *               symptoms:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment created successfully
 */
router.post('/', authenticate, appointmentController.createAppointment);

/**
 * @openapi
 * /api/appointments/my-appointments:
 *   get:
 *     summary: Get appointments for the current patient or doctor
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointments fetched successfully
 */
router.get('/my-appointments', authenticate, appointmentController.getMyAppointments);

router.get('/waiting-queue', authenticate, appointmentController.getDoctorWaitingQueue);

/**
 * @openapi
 * /api/appointments/{id}/waiting-room:
 *   get:
 *     summary: Get waiting room status for an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/waiting-room', authenticate, appointmentController.getWaitingRoomStatus);

router.get('/:id/chat', authenticate, appointmentController.getConsultChat);
router.post('/:id/chat', authenticate, appointmentController.sendConsultChatMessage);
router.post(
  '/:id/chat/upload',
  authenticate,
  consultUpload.single('file'),
  appointmentController.uploadConsultChatFile
);

/**
 * @openapi
 * /api/appointments/{id}/video/start:
 *   post:
 *     summary: Start a doctor-patient video consultation for an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Video session started successfully
 */
router.post('/:id/video/start', authenticate, appointmentController.startVideoCall);

/**
 * @openapi
 * /api/appointments/{id}/video/session:
 *   get:
 *     summary: Get the current video session details for an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Video session details retrieved successfully
 */
router.get('/:id/video/session', authenticate, appointmentController.getVideoCallSession);

/**
 * @openapi
 * /api/appointments/{id}/video/end:
 *   post:
 *     summary: End a doctor-patient video consultation for an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Video session ended successfully
 */
router.post('/:id/video/end', authenticate, appointmentController.endVideoCall);

/**
 * @openapi
 * /api/appointments/{id}:
 *   get:
 *     summary: View a single appointment by id
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointment fetched successfully
 */
router.get('/:id', authenticate, appointmentController.getAppointmentById);

/**
 * @openapi
 * /api/appointments/{id}:
 *   put:
 *     summary: Update an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 */
router.put('/:id', authenticate, appointmentController.updateAppointment);

/**
 * @openapi
 * /api/appointments/{id}:
 *   delete:
 *     summary: Delete an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
 */
router.delete('/:id', authenticate, appointmentController.deleteAppointment);

/**
 * @openapi
 * /api/appointments/{id}/status:
 *   patch:
 *     summary: Update appointment status, including doctor acceptance or rejection
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, cancelled, postponed, referred]
 *               reason:
 *                 type: string
 *               postponedTo:
 *                 type: string
 *               referredTo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment status updated
 */
router.patch('/:id/status', authenticate, appointmentController.updateAppointmentStatus);

/**
 * @openapi
 * /api/appointments/{id}/join-waiting:
 *   post:
 *     summary: Join the appointment waiting room
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Waiting room joined successfully
 */
router.post('/:id/join-waiting', authenticate, appointmentController.joinWaitingRoom);

module.exports = router;