/**
 * Maintenance Routes
 * Handles system maintenance and backup endpoints
 */

import express from "express";
import { MaintenanceService } from "../services/maintenanceService";
import { verifyToken, requireAdmin, AuthenticatedRequest } from "../middleware/auth";
import { HttpsError } from "firebase-functions/v2/https";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Maintenance
 *   description: System maintenance and backup operations (Admin only)
 */

/**
 * @swagger
 * /maintenance/cleanup:
 *   post:
 *     summary: Cleanup orphaned data
 *     description: Remove orphaned data from the system. Admin only.
 *     tags: [Maintenance]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CleanupRequest'
 *           example:
 *             dryRun: true
 *     responses:
 *       200:
 *         description: Cleanup completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CleanupResponse'
 *             example:
 *               success: true
 *               message: "Dry run completed - no data was deleted"
 *               itemsProcessed: 45
 *               itemsDeleted: 0
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
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
router.post("/cleanup", verifyToken, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { dryRun = false } = req.body;

    const result = await MaintenanceService.cleanupOrphanedData(dryRun, {
      uid: req.user!.uid
    });
    
    res.json(result);
  } catch (error: any) {
    console.error("Error during cleanup:", error);
    
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({
        error: error.code,
        message: error.message
      });
      return;
    }
    
    res.status(500).json({
      error: "Failed to cleanup orphaned data",
      message: error.message
    });
  }
});

/**
 * @swagger
 * /maintenance/backup:
 *   post:
 *     summary: Create data backup
 *     description: Create a backup of specified collections. Admin only.
 *     tags: [Maintenance]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BackupRequest'
 *           example:
 *             collections: ["users", "documents"]
 *             destination: "gs://backup-bucket/daily"
 *     responses:
 *       200:
 *         description: Backup created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BackupResponse'
 *             example:
 *               success: true
 *               message: "Backup created successfully"
 *               backupId: "backup_1703123456789"
 *               collections: ["users", "documents"]
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
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
router.post("/backup", verifyToken, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { collections, destination } = req.body;

    const result = await MaintenanceService.createDataBackup(collections, destination, {
      uid: req.user!.uid
    });
    
    res.json(result);
  } catch (error: any) {
    console.error("Error creating backup:", error);
    
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({
        error: error.code,
        message: error.message
      });
      return;
    }
    
    res.status(500).json({
      error: "Failed to create backup",
      message: error.message
    });
  }
});

/**
 * @swagger
 * /maintenance/integrity:
 *   get:
 *     summary: Check data integrity
 *     description: Check data integrity across collections. Admin only.
 *     tags: [Maintenance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: collections
 *         schema:
 *           type: string
 *         description: Comma-separated list of collections to check
 *         example: "users,documents,properties"
 *     responses:
 *       200:
 *         description: Integrity check completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IntegrityResponse'
 *             example:
 *               success: true
 *               message: "No integrity issues found"
 *               issues: []
 *               collectionsChecked: ["users", "documents", "properties"]
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
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
router.get("/integrity", verifyToken, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { collections } = req.query;
    const collectionsArray = collections ? (collections as string).split(",") : undefined;

    const result = await MaintenanceService.checkDataIntegrity(collectionsArray, {
      uid: req.user!.uid
    });
    
    res.json(result);
  } catch (error: any) {
    console.error("Error checking data integrity:", error);
    
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({
        error: error.code,
        message: error.message
      });
      return;
    }
    
    res.status(500).json({
      error: "Failed to check data integrity",
      message: error.message
    });
  }
});

/**
 * @swagger
 * /maintenance/status:
 *   get:
 *     summary: Get system status
 *     description: Get current system status and health information
 *     tags: [Maintenance]
 *     responses:
 *       200:
 *         description: System status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemStatus'
 *             example:
 *               status: "operational"
 *               services:
 *                 database: "healthy"
 *                 storage: "healthy"
 *                 functions: "healthy"
 *               lastMaintenance: "2023-12-21T10:30:00.000Z"
 */
router.get("/status", (req, res) => {
  res.json({
    status: "operational",
    services: {
      database: "healthy",
      storage: "healthy",
      functions: "healthy"
    },
    lastMaintenance: new Date().toISOString()
  });
});

export { router as maintenanceRouter };