import { Router } from "express";
import { saveAnnotation, getAnnotations } from "../controllers/annotationController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Annotation
 *   description: Annotation management
 */

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
 *               - fileURL
 *               - doctorName
 *               - data
 *             properties:
 *               sessionId:
 *                 type: string
 *               fileURL:
 *                 type: string
 *               doctorName:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Annotation saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 annotation:
 *                   type: object
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post("/save", saveAnnotation);

/**
 * @swagger
 * /api/annotation/{sessionId}:
 *   get:
 *     summary: Get all annotations by sessionId
 *     tags: [Annotation]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the session to retrieve annotations for
 *     responses:
 *       200:
 *         description: Annotations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 annotations:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: No annotations found
 *       500:
 *         description: Internal server error
 */
router.get("/:sessionId", getAnnotations);

export default router;
