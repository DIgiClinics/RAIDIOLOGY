import { Router } from 'express';
import { saveAnnotation, getAnnotations } from '../controllers/annotationController';

const router = Router();

/**
 * @swagger
 * /api/annotation/save:
 *   post:
 *     summary: Save an annotation
 *     tags: [Annotation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - annotationData
 *             properties:
 *               sessionId:
 *                 type: string
 *               annotationData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Annotation saved
 *       400:
 *         description: Bad request
 */
router.post('/save', saveAnnotation);

/**
 * @swagger
 * /api/annotation/{sessionId}:
 *   get:
 *     summary: Get annotations by sessionId
 *     tags: [Annotation]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Returns annotations
 *       404:
 *         description: Not found
 */
router.get('/:sessionId', getAnnotations);

export default router;
