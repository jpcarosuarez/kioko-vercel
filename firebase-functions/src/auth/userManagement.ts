/**
 * Firebase Cloud Functions for User Management
 * TypeScript implementation with proper type safety
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import {
  SetCustomClaimsRequest,
  SetCustomClaimsResponse,
  GetUserClaimsRequest,
  GetUserClaimsResponse,
  InitializeAdminRequest,
  InitializeAdminResponse,
  CallableRequest,
} from "../types";
import { requireAuth, requireAdmin, validateRequired, isValidRole, isValidEmail } from "../utils/validation";
import { logInfo, logError } from "../utils/logger";

/**
 * Cloud Function to set custom claims for user roles
 * Only admins can call this function
 */
export const setCustomClaims = onCall<SetCustomClaimsRequest>(
  async (request: CallableRequest<SetCustomClaimsRequest>): Promise<SetCustomClaimsResponse> => {
    const context = { functionName: "setCustomClaims", userId: request.auth?.uid };
    
    try {
      // Validate authentication and admin role
      requireAdmin(request.auth);

      const { uid, role } = request.data;

      // Validate required fields
      validateRequired(request.data, ["uid", "role"]);

      // Validate role
      if (!isValidRole(role)) {
        throw new HttpsError("invalid-argument", "Invalid role. Must be admin, owner, or tenant");
      }

      // Set custom claims
      await getAuth().setCustomUserClaims(uid, { role });

      logInfo(`Role ${role} set for user ${uid}`, { ...context, targetUserId: uid, role });

      return {
        success: true,
        message: `Role ${role} set for user ${uid}`,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error setting custom claims", error as Error, context);
      throw new HttpsError("internal", "Failed to set user role");
    }
  }
);

/**
 * Cloud Function to get user custom claims
 * Users can only get their own claims, admins can get any user's claims
 */
export const getUserClaims = onCall<GetUserClaimsRequest>(
  async (request: CallableRequest<GetUserClaimsRequest>): Promise<GetUserClaimsResponse> => {
    const context = { functionName: "getUserClaims", userId: request.auth?.uid };
    
    try {
      // Validate authentication
      requireAuth(request.auth);

      const { uid } = request.data;
      const callerUid = request.auth!.uid;
      const callerClaims = request.auth!.token;

      // Users can only get their own claims, unless they're admin
      if (uid && uid !== callerUid && callerClaims.role !== "admin") {
        throw new HttpsError("permission-denied", "You can only access your own user claims");
      }

      const targetUid = uid || callerUid;
      const userRecord = await getAuth().getUser(targetUid);

      logInfo(`User claims retrieved for user ${targetUid}`, { ...context, targetUserId: targetUid });

      return {
        uid: userRecord.uid,
        email: userRecord.email || "",
        customClaims: userRecord.customClaims || {},
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error getting user claims", error as Error, context);
      throw new HttpsError("internal", "Failed to get user claims");
    }
  }
);

/**
 * Cloud Function to initialize the first admin user
 * This should only be called once during setup
 */
export const initializeAdmin = onCall<InitializeAdminRequest>(
  async (request: CallableRequest<InitializeAdminRequest>): Promise<InitializeAdminResponse> => {
    const context = { functionName: "initializeAdmin" };
    
    try {
      const { email, adminSecret } = request.data;

      // Validate required fields
      validateRequired(request.data, ["email", "adminSecret"]);

      // Validate email format
      if (!isValidEmail(email)) {
        throw new HttpsError("invalid-argument", "Invalid email format");
      }

      // Check admin secret (set this in your environment)
      const expectedSecret = process.env.ADMIN_INIT_SECRET;
      if (!expectedSecret || adminSecret !== expectedSecret) {
        throw new HttpsError("permission-denied", "Invalid admin secret");
      }

      // Find user by email
      const userRecord = await getAuth().getUserByEmail(email);

      // Set admin role
      await getAuth().setCustomUserClaims(userRecord.uid, { role: "admin" });

      logInfo(`Admin role initialized for user ${email}`, { ...context, email, userId: userRecord.uid });

      return {
        success: true,
        message: `Admin role set for user ${email}`,
        uid: userRecord.uid,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error initializing admin", error as Error, context);
      throw new HttpsError("internal", "Failed to initialize admin user");
    }
  }
);