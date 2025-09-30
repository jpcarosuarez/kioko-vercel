/**
 * Authentication Routes
 * Handles user authentication and authorization endpoints
 */

import express from "express";
import { AuthService } from "../services/authService";
import { verifyToken, requireAdmin, requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { HttpsError } from "firebase-functions/v2/https";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization management
 */

/**
 * @swagger
 * /auth/setCustomClaims:
 *   post:
 *     summary: Set custom claims for a user
 *     description: Assign roles to users. Only admins can call this endpoint.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetCustomClaimsRequest'
 *           example:
 *             uid: "user123"
 *             role: "owner"
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SetCustomClaimsResponse'
 *             example:
 *               success: true
 *               message: "Role owner set for user user123"
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing token
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
router.post("/setCustomClaims", verifyToken, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { uid, role } = req.body;
    
    if (!uid || !role) {
      res.status(400).json({
        error: "Missing required fields",
        required: ["uid", "role"]
      });
      return;
    }

    const result = await AuthService.setCustomClaims(uid, role, {
      uid: req.user!.uid,
      role: req.user!.role,
      email: req.user!.email
    });
    
    res.json(result);
  } catch (error: any) {
    console.error("Error setting custom claims:", error);
    
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({
        error: error.code,
        message: error.message
      });
      return;
    }
    
    res.status(500).json({
      error: "Failed to set custom claims",
      message: error.message
    });
  }
});

/**
 * @swagger
 * /auth/getUserClaims:
 *   get:
 *     summary: Get user custom claims
 *     description: Retrieve custom claims for a user. Users can only get their own claims unless they're admin.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: uid
 *         schema:
 *           type: string
 *         description: User ID (optional, defaults to authenticated user)
 *         example: "user123"
 *     responses:
 *       200:
 *         description: User claims retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserClaims'
 *             example:
 *               uid: "user123"
 *               email: "user@example.com"
 *               customClaims:
 *                 role: "owner"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Can only access own claims
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
router.get("/getUserClaims", verifyToken, requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { uid } = req.query;
    const targetUid = (uid as string) || req.user!.uid;

    const result = await AuthService.getUserClaims(targetUid, {
      uid: req.user!.uid,
      role: req.user!.role,
      email: req.user!.email
    });
    
    res.json(result);
  } catch (error: any) {
    console.error("Error getting user claims:", error);
    
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({
        error: error.code,
        message: error.message
      });
      return;
    }
    
    res.status(500).json({
      error: "Failed to get user claims",
      message: error.message
    });
  }
});

/**
 * @swagger
 * /auth/initializeAdmin:
 *   post:
 *     summary: Initialize first admin user
 *     description: Set admin role for the first user. This should only be called once during setup.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InitializeAdminRequest'
 *           example:
 *             email: "admin@example.com"
 *             adminSecret: "your-secret-key"
 *     responses:
 *       200:
 *         description: Admin initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SetCustomClaimsResponse'
 *                 - type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *             example:
 *               success: true
 *               message: "Admin role set for user admin@example.com"
 *               uid: "admin123"
 *       400:
 *         description: Missing required fields or invalid email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       403:
 *         description: Invalid admin secret
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
router.post("/initializeAdmin", async (req, res): Promise<void> => {
  try {
    const { email, adminSecret } = req.body;
    
    if (!email || !adminSecret) {
      res.status(400).json({
        error: "Missing required fields",
        required: ["email", "adminSecret"]
      });
      return;
    }

    const result = await AuthService.initializeAdmin(email, adminSecret);
    res.json(result);
  } catch (error: any) {
    console.error("Error initializing admin:", error);
    
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({
        error: error.code,
        message: error.message
      });
      return;
    }
    
    res.status(500).json({
      error: "Failed to initialize admin",
      message: error.message
    });
  }
});

/**
 * @swagger
 * /auth/createUser:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user with email, password, and role. Only admins can create users.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, phone, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 example: "+57 (300) 123-4567"
 *               role:
 *                 type: string
 *                 enum: [admin, owner, tenant]
 *                 example: "owner"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Missing required fields or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
router.post("/createUser", verifyToken, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { email, password, name, phone, role, isActive = true } = req.body;
    
    if (!email || !password || !name || !phone || !role) {
      res.status(400).json({
        error: "Missing required fields",
        required: ["email", "password", "name", "phone", "role"]
      });
      return;
    }

    const result = await AuthService.createUser({
      email,
      password,
      name,
      phone,
      role,
      isActive
    }, {
      uid: req.user!.uid,
      role: req.user!.role,
      email: req.user!.email
    });
    
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error creating user:", error);
    
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({
        error: error.code,
        message: error.message
      });
      return;
    }
    
    res.status(500).json({
      error: "Failed to create user",
      message: error.message
    });
  }
});

/**
 * @swagger
 * /auth/updateUser:
 *   put:
 *     summary: Update user information
 *     description: Update user information. Users can update their own info, admins can update any user.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uid]
 *             properties:
 *               uid:
 *                 type: string
 *                 example: "user123"
 *               name:
 *                 type: string
 *                 example: "John Doe Updated"
 *               phone:
 *                 type: string
 *                 example: "+57 (300) 123-4567"
 *               role:
 *                 type: string
 *                 enum: [admin, owner, tenant]
 *                 example: "owner"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Can only update own info or admin required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put("/updateUser", verifyToken, requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { uid, name, phone, role, isActive } = req.body;
    
    if (!uid) {
      res.status(400).json({
        error: "Missing required field: uid"
      });
      return;
    }

    const result = await AuthService.updateUser(uid, {
      name,
      phone,
      role,
      isActive
    }, {
      uid: req.user!.uid,
      role: req.user!.role,
      email: req.user!.email
    });
    
    res.json(result);
  } catch (error: any) {
    console.error("Error updating user:", error);
    
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({
        error: error.code,
        message: error.message
      });
      return;
    }
    
    res.status(500).json({
      error: "Failed to update user",
      message: error.message
    });
  }
});

/**
 * @swagger
 * /auth/deleteUser:
 *   delete:
 *     summary: Delete a user
 *     description: Delete a user from the system. Only admins can delete users.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uid]
 *             properties:
 *               uid:
 *                 type: string
 *                 example: "user123"
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete("/deleteUser", verifyToken, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { uid } = req.body;
    
    if (!uid) {
      res.status(400).json({
        error: "Missing required field: uid"
      });
      return;
    }

    const result = await AuthService.deleteUser(uid, {
      uid: req.user!.uid,
      role: req.user!.role,
      email: req.user!.email
    });
    
    res.json(result);
  } catch (error: any) {
    console.error("Error deleting user:", error);
    
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({
        error: error.code,
        message: error.message
      });
      return;
    }
    
    res.status(500).json({
      error: "Failed to delete user",
      message: error.message
    });
  }
});

/**
 * @swagger
 * /auth/getUsers:
 *   get:
 *     summary: Get all users
 *     description: Get list of all users with their information. Only admins can access this endpoint.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, owner, tenant]
 *         description: Filter users by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter users by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by name or email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       uid:
 *                         type: string
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       role:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get("/getUsers", verifyToken, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { role, isActive, search } = req.query;
    
    const filters = {
      role: role as string,
      isActive: isActive ? isActive === 'true' : undefined,
      search: search as string
    };

    const result = await AuthService.getUsers(filters, {
      uid: req.user!.uid,
      role: req.user!.role,
      email: req.user!.email
    });
    
    res.json(result);
  } catch (error: any) {
    console.error("Error getting users:", error);
    
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({
        error: error.code,
        message: error.message
      });
      return;
    }
    
    res.status(500).json({
      error: "Failed to get users",
      message: error.message
    });
  }
});

/**
 * @swagger
 * /auth/bootstrap:
 *   post:
 *     summary: Bootstrap initial users (INITIAL SETUP ONLY)
 *     description: Create initial admin and demo users without restrictions. This endpoint should only be used during initial setup.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bootstrapSecret]
 *             properties:
 *               bootstrapSecret:
 *                 type: string
 *                 example: "bootstrap-secret-key"
 *               adminEmail:
 *                 type: string
 *                 example: "contacto@kioskoinmobiliario.com"
 *               adminPassword:
 *                 type: string
 *                 example: "AdminPassword123!"
 *               adminName:
 *                 type: string
 *                 example: "Administrador Kiosko"
 *               adminPhone:
 *                 type: string
 *                 example: "+57 (300) 123-4567"
 *     responses:
 *       200:
 *         description: Bootstrap completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 *                       role:
 *                         type: string
 *                       uid:
 *                         type: string
 *       400:
 *         description: Missing required fields or invalid bootstrap secret
 *       500:
 *         description: Internal server error
 */
router.post("/bootstrap", async (req, res): Promise<void> => {
  try {
    const { 
      bootstrapSecret, 
      adminEmail = 'contacto@kioskoinmobiliario.com',
      adminPassword = 'KioskoAdmin2024!',
      adminName = 'Administrador Kiosko',
      adminPhone = '+57 (300) 123-4567'
    } = req.body;
    
    // Validate bootstrap secret
    const expectedSecret = process.env.BOOTSTRAP_SECRET || 'bootstrap-secret-change-me';
    if (!bootstrapSecret || bootstrapSecret !== expectedSecret) {
      res.status(400).json({
        error: "Invalid bootstrap secret",
        message: "Bootstrap secret is required and must match the configured value"
      });
      return;
    }

    const result = await AuthService.bootstrapInitialUsers({
      adminEmail,
      adminPassword,
      adminName,
      adminPhone
    });
    
    res.json(result);
  } catch (error: any) {
    console.error("Error during bootstrap:", error);
    
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({
        error: error.code,
        message: error.message
      });
      return;
    }
    
    res.status(500).json({
      error: "Failed to bootstrap initial users",
      message: error.message
    });
  }
});

export { router as authRouter };