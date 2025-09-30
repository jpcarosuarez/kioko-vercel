/**
 * Secure API call wrappers with proper TypeScript typing
 */

import { httpsCallable, HttpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import { checkTokenExpiration, createAuditTrail } from "./securityUtils";
import { toast } from "sonner";

// Type definitions for Cloud Function requests and responses
export interface SetCustomClaimsRequest {
  uid: string;
  role: "admin" | "owner" | "tenant";
}

export interface SetCustomClaimsResponse {
  success: boolean;
  message: string;
}

export interface GetUserClaimsRequest {
  uid?: string;
}

export interface GetUserClaimsResponse {
  uid: string;
  email: string;
  customClaims: {
    role?: "admin" | "owner" | "tenant";
    [key: string]: any;
  };
}

export interface ValidationRequest {
  collection: "users" | "properties" | "documents";
  data: any;
  operation: "create" | "update" | "delete";
}

export interface ValidationResponse {
  valid: boolean;
  errors?: string[];
}

export interface CleanupRequest {
  type: "orphaned_documents" | "orphaned_properties" | "all";
  dryRun?: boolean;
}

export interface CleanupResponse {
  success: boolean;
  itemsProcessed: number;
  itemsDeleted: number;
  errors?: string[];
}

export interface BackupRequest {
  collections: string[];
  includeSubcollections?: boolean;
}

export interface BackupResponse {
  success: boolean;
  backupId: string;
  timestamp: string;
  collections: string[];
}

export interface EmailNotificationRequest {
  type: "user_created" | "user_deleted" | "role_changed" | "property_assigned";
  recipientEmail: string;
  data: any;
}

export interface EmailNotificationResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Generic secure API call wrapper
 */
async function secureApiCall<T, R>(
  functionName: string,
  callable: HttpsCallable<T, R>,
  data: T,
  requiresAdmin: boolean = false
): Promise<R> {
  try {
    // Check token expiration before making the call
    const tokenValid = await checkTokenExpiration();
    if (!tokenValid) {
      throw new Error("Token expired or invalid");
    }

    // Make the API call
    const result = await callable(data);
    
    // Create audit trail for admin actions
    if (requiresAdmin) {
      await createAuditTrail(`cloud_function_${functionName}`, { data });
    }

    return result.data;
  } catch (error: any) {
    console.error(`Error calling ${functionName}:`, error);
    
    // Handle specific Firebase errors
    if (error.code === "functions/unauthenticated") {
      toast.error("Debes iniciar sesión para realizar esta acción");
    } else if (error.code === "functions/permission-denied") {
      toast.error("No tienes permisos para realizar esta acción");
    } else if (error.code === "functions/invalid-argument") {
      toast.error(`Datos inválidos: ${error.message}`);
    } else if (error.code === "functions/internal") {
      toast.error("Error interno del servidor. Inténtalo de nuevo.");
    } else {
      toast.error(`Error: ${error.message || "Error desconocido"}`);
    }
    
    throw error;
  }
}

// Cloud Function wrappers
const setCustomClaimsCallable = httpsCallable<SetCustomClaimsRequest, SetCustomClaimsResponse>(
  functions,
  "setCustomClaims"
);

const getUserClaimsCallable = httpsCallable<GetUserClaimsRequest, GetUserClaimsResponse>(
  functions,
  "getUserClaims"
);

const validateDataCallable = httpsCallable<ValidationRequest, ValidationResponse>(
  functions,
  "validateData"
);

const cleanupOrphanedDataCallable = httpsCallable<CleanupRequest, CleanupResponse>(
  functions,
  "cleanupOrphanedData"
);

const createDataBackupCallable = httpsCallable<BackupRequest, BackupResponse>(
  functions,
  "createDataBackup"
);

const checkDataIntegrityCallable = httpsCallable<{}, { issues: string[]; summary: any }>(
  functions,
  "checkDataIntegrity"
);

const sendEmailNotificationCallable = httpsCallable<EmailNotificationRequest, EmailNotificationResponse>(
  functions,
  "sendEmailNotification"
);

/**
 * Set custom claims for a user (Admin only)
 */
export const setCustomClaims = async (uid: string, role: "admin" | "owner" | "tenant"): Promise<SetCustomClaimsResponse> => {
  return secureApiCall(
    "setCustomClaims",
    setCustomClaimsCallable,
    { uid, role },
    true
  );
};

/**
 * Get user custom claims
 */
export const getUserClaims = async (uid?: string): Promise<GetUserClaimsResponse> => {
  return secureApiCall(
    "getUserClaims",
    getUserClaimsCallable,
    { uid }
  );
};

/**
 * Validate data before submission
 */
export const validateData = async (
  collection: "users" | "properties" | "documents",
  data: any,
  operation: "create" | "update" | "delete"
): Promise<ValidationResponse> => {
  return secureApiCall(
    "validateData",
    validateDataCallable,
    { collection, data, operation }
  );
};

/**
 * Cleanup orphaned data (Admin only)
 */
export const cleanupOrphanedData = async (
  type: "orphaned_documents" | "orphaned_properties" | "all",
  dryRun: boolean = true
): Promise<CleanupResponse> => {
  return secureApiCall(
    "cleanupOrphanedData",
    cleanupOrphanedDataCallable,
    { type, dryRun },
    true
  );
};

/**
 * Create data backup (Admin only)
 */
export const createDataBackup = async (
  collections: string[],
  includeSubcollections: boolean = false
): Promise<BackupResponse> => {
  return secureApiCall(
    "createDataBackup",
    createDataBackupCallable,
    { collections, includeSubcollections },
    true
  );
};

/**
 * Check data integrity (Admin only)
 */
export const checkDataIntegrity = async (): Promise<{ issues: string[]; summary: any }> => {
  return secureApiCall(
    "checkDataIntegrity",
    checkDataIntegrityCallable,
    {},
    true
  );
};

/**
 * Send email notification (Admin only)
 */
export const sendEmailNotification = async (
  type: "user_created" | "user_deleted" | "role_changed" | "property_assigned",
  recipientEmail: string,
  data: any
): Promise<EmailNotificationResponse> => {
  return secureApiCall(
    "sendEmailNotification",
    sendEmailNotificationCallable,
    { type, recipientEmail, data },
    true
  );
};