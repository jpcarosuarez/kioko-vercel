/**
 * Notification Routes
 * Handles email and other notification endpoints
 */

import express from "express";
import { NotificationService } from "../services/notificationService";
import { verifyToken, requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { HttpsError } from "firebase-functions/v2/https";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Email and notification services
 */

/**
 * @swagger
 * /notifications/email:
 *   post:
 *     summary: Send email notification
 *     description: Send an email notification to a single recipient
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailRequest'
 *           example:
 *             to: "user@example.com"
 *             subject: "Welcome to Kiosko Inmobiliario"
 *             body: "Welcome to our platform!"
 *             template: "welcome"
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailResponse'
 *             example:
 *               success: true
 *               message: "Email sent successfully"
 *               messageId: "msg_1703123456789_abc123"
 *       400:
 *         description: Missing required fields or invalid email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/email", verifyToken, requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { to, subject, body, template } = req.body;
    
    if (!to || !subject || (!body && !template)) {
      res.status(400).json({
        error: "Missing required fields",
        required: ["to", "subject", "body or template"]
      });
      return;
    }

    const result = await NotificationService.sendEmailNotification(
      to, subject, body, template, {
        uid: req.user!.uid
      }
    );
    
    res.json(result);
  } catch (error: any) {
    console.error("Error sending email:", error);
    
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({
        error: error.code,
        message: error.message
      });
      return;
    }
    
    res.status(500).json({
      error: "Failed to send email notification",
      message: error.message
    });
  }
});

/**
 * @swagger
 * /notifications/templates:
 *   get:
 *     summary: List available email templates
 *     description: Get a list of all available email templates
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: List of available templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 templates:
 *                   type: array
 *                   items:
 *                     type: string
 *             example:
 *               message: "Available email templates"
 *               templates: ["welcome", "password-reset", "document-approved", "document-rejected", "maintenance-notice"]
 */
router.get("/templates", (req, res) => {
  res.json({
    message: "Available email templates",
    templates: [
      "welcome",
      "password-reset",
      "document-approved",
      "document-rejected",
      "maintenance-notice"
    ]
  });
});

/**
 * @swagger
 * /notifications/bulk-email:
 *   post:
 *     summary: Send bulk email notifications
 *     description: Send email notifications to multiple recipients
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkEmailRequest'
 *           example:
 *             recipients: ["user1@example.com", "user2@example.com"]
 *             subject: "System Maintenance Notice"
 *             body: "We will be performing maintenance tonight."
 *             template: "maintenance-notice"
 *     responses:
 *       200:
 *         description: Bulk email processing completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       recipient:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: ["sent", "failed"]
 *                       result:
 *                         $ref: '#/components/schemas/EmailResponse'
 *                       error:
 *                         type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     sent:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *             example:
 *               message: "Bulk email processing completed"
 *               results:
 *                 - recipient: "user1@example.com"
 *                   status: "sent"
 *                   result:
 *                     success: true
 *                     messageId: "msg_123"
 *               summary:
 *                 total: 2
 *                 sent: 1
 *                 failed: 1
 *       400:
 *         description: Missing required fields or invalid recipients
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/bulk-email", verifyToken, requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { recipients, subject, body, template } = req.body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      res.status(400).json({
        error: "Missing or invalid recipients array"
      });
      return;
    }

    if (!subject || (!body && !template)) {
      res.status(400).json({
        error: "Missing required fields",
        required: ["subject", "body or template"]
      });
      return;
    }

    const results = [];
    for (const recipient of recipients) {
      try {
        const result = await NotificationService.sendEmailNotification(
          recipient, subject, body, template, {
            uid: req.user!.uid
          }
        );
        results.push({ recipient, status: "sent", result });
      } catch (error: any) {
        results.push({ recipient, status: "failed", error: error.message });
      }
    }

    res.json({
      message: "Bulk email processing completed",
      results,
      summary: {
        total: recipients.length,
        sent: results.filter(r => r.status === "sent").length,
        failed: results.filter(r => r.status === "failed").length
      }
    });
  } catch (error: any) {
    console.error("Error sending bulk email:", error);
    
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({
        error: error.code,
        message: error.message
      });
      return;
    }
    
    res.status(500).json({
      error: "Failed to send bulk email notifications",
      message: error.message
    });
  }
});

export { router as notificationRouter };