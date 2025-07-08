import { Router } from 'express';
import {
  startSession,
  updateSession,
  endSession,
  getFileURLsBySessionId,
  getSessionMetadata
} from '../controllers/sessionController';

const router = Router();

/**
 * @swagger
 * /api/session/start:
 *   post:
 *     summary: Start a new session and convert DICOM to NIfTI via Flask
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
 *               - age
 *               - gender
 *               - consultingDoctor
 *               - symptoms
 *               - admissionDate
 *               - files
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
 *       200:
 *         description: Session started and NIfTI file created
 *       500:
 *         description: Internal server error
 */
router.post('/start', startSession);

/**
 * @swagger
 * /api/session/update:
 *   post:
 *     summary: Update session activity and duration
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
 *         description: Missing sessionId
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
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
 *         description: Missing sessionId
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.post('/end', endSession);

/**
 * @swagger
 * /api/session/files/{sessionId}:
 *   get:
 *     summary: Get all file URLs for a specific session
 *     tags: [Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the session
 *     responses:
 *       200:
 *         description: File URLs returned
 *       400:
 *         description: Missing sessionId
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.get('/files/:sessionId', getFileURLsBySessionId);

/**
 * @swagger
 * /api/session/metadata/{sessionId}:
 *   get:
 *     summary: Get session metadata excluding files, include NIfTI file names
 *     tags: [Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session metadata returned
 *       400:
 *         description: Missing sessionId
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.get('/metadata/:sessionId', getSessionMetadata);


export default router;
