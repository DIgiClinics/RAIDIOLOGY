import { Router } from 'express';
import { startSession, updateSession, endSession ,getFileURLsBySessionId} from '../controllers/sessionController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Session
 *   description: Patient session management
 */

/**
 * @swagger
 * /api/session/start:
 *   post:
 *     summary: Start a new patient session
 *     tags: [Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mrn
 *               - patientName
 *               - consultingDoctor
 *               - symptoms
 *               - admissionDate
 *             properties:
 *               mrn:
 *                 type: string
 *               patientName:
 *                 type: string
 *               age:
 *                 type: number
 *               gender:
 *                 type: string
 *               consultingDoctor:
 *                 type: string
 *               symptoms:
 *                 type: string
 *               admissionDate:
 *                 type: string
 *                 format: date-time
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fileName:
 *                       type: string
 *                     fileType:
 *                       type: array
 *                       items:
 *                         type: string
 *                     fileURL:
 *                       type: string
 *                     remarks:
 *                       type: string
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *       400:
 *         description: Missing required fields
 */
router.post('/start', startSession);

/**
 * @swagger
 * /api/session/update:
 *   post:
 *     summary: Update session's last activity and duration
 *     tags: [Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session updated
 *       400:
 *         description: Missing parameters
 *       404:
 *         description: Session not found
 */
router.post('/update', updateSession);

/**
 * @swagger
 * /api/session/end:
 *   post:
 *     summary: End a session
 *     tags: [Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session ended
 *       400:
 *         description: sessionId required
 *       404:
 *         description: Session not found
 */
router.post('/end', endSession);


/**
 * @swagger
 * /api/session/files/{sessionId}:
 *   get:
 *     summary: Get all file URLs for a session
 *     tags: [Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The session ID
 *     responses:
 *       200:
 *         description: List of file URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileURLs:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: sessionId is required
 *       404:
 *         description: Session not found
 */
router.get('/files/:sessionId', getFileURLsBySessionId);

export default router;
