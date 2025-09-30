/**
 * Validation Routes
 * Handles data validation endpoints
 */

import express from "express";
import { ValidationService } from "../services/validationService";
import { verifyToken, requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { HttpsError } from "firebase-functions/v2/https";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Validation
 *   description: Data validation services
 */

/**
 * @swagger
 * /validation/validateData:
 *   post:
 *     summary: Validate data against schema
 *     description: Validate data objects against predefined schemas
 *     tags: [Validation]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateDataRequest'
 *           example:
 *             data:
 *               email: "user@example.com"
 *               name: "John Doe"
 *             schema: "user"
 *     responses:
 *       200:
 *         description: Validation completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidateDataResponse'
 *             example:
 *               valid: true
 *               message: "Data is valid"
 *       400:
 *         description: Missing required fields
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
router.post("/validateData", verifyToken, requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { data, schema } = req.body;
    
    if (!data || !schema) {
      res.status(400).json({
        error: "Missing required fields",
        required: ["data", "schema"]
      });
      return;
    }

    const result = await ValidationService.validateData(data, schema, {
      uid: req.user!.uid
    });
    
    res.json(result);
  } catch (error: any) {
    console.error("Error validating data:", error);
    
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({
        error: error.code,
        message: error.message
      });
      return;
    }
    
    res.status(500).json({
      error: "Failed to validate data",
      message: error.message
    });
  }
});

/**
 * @swagger
 * /validation/schemas:
 *   get:
 *     summary: List available validation schemas
 *     description: Get a list of all available validation schemas
 *     tags: [Validation]
 *     responses:
 *       200:
 *         description: List of available schemas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 schemas:
 *                   type: array
 *                   items:
 *                     type: string
 *             example:
 *               message: "Available validation schemas"
 *               schemas: ["user", "document", "property", "transaction"]
 */
router.get("/schemas", (req, res) => {
  res.json({
    message: "Available validation schemas",
    schemas: [
      "user",
      "document",
      "property",
      "transaction"
    ]
  });
});

export { router as validationRouter };