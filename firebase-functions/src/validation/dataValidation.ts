/**
 * Server-side Data Validation Functions
 * Provides validation for user, property, and document data
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import {
  ValidationRequest,
  ValidationResponse,
  CallableRequest,
} from "../types";
import { requireAuth, isValidEmail, isValidRole } from "../utils/validation";
import { logInfo, logError } from "../utils/logger";

/**
 * Validates user data before creation or update
 */
const validateUserData = async (data: any, operation: string): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  // Required fields for creation
  if (operation === "create") {
    if (!data.email) errors.push("Email is required");
    if (!data.name) errors.push("Name is required");
    if (!data.role) errors.push("Role is required");
  }

  // Email validation
  if (data.email && !isValidEmail(data.email)) {
    errors.push("Invalid email format");
  }

  // Role validation
  if (data.role && !isValidRole(data.role)) {
    errors.push("Invalid role. Must be admin, owner, or tenant");
  }

  // Check email uniqueness for creation
  if (operation === "create" && data.email) {
    try {
      await getAuth().getUserByEmail(data.email);
      errors.push("Email already exists");
    } catch (error: any) {
      // User not found is good for creation
      if (error.code !== "auth/user-not-found") {
        errors.push("Error checking email uniqueness");
      }
    }
  }

  // Name validation
  if (data.name && (data.name.length < 2 || data.name.length > 100)) {
    errors.push("Name must be between 2 and 100 characters");
  }

  // Phone validation (if provided)
  if (data.phone && !/^\(\d{3}\) \d{3}-\d{4}$/.test(data.phone)) {
    errors.push("Phone must be in format (XXX) XXX-XXXX");
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validates property data before creation or update
 */
const validatePropertyData = async (data: any, operation: string): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  // Required fields for creation
  if (operation === "create") {
    if (!data.address) errors.push("Address is required");
    if (!data.type) errors.push("Property type is required");
    if (!data.ownerId) errors.push("Owner ID is required");
    if (!data.value) errors.push("Property value is required");
  }

  // Address validation
  if (data.address && (data.address.length < 5 || data.address.length > 200)) {
    errors.push("Address must be between 5 and 200 characters");
  }

  // Type validation
  if (data.type && !["residential", "commercial"].includes(data.type)) {
    errors.push("Property type must be residential or commercial");
  }

  // Value validation
  if (data.value && (typeof data.value !== "number" || data.value <= 0)) {
    errors.push("Property value must be a positive number");
  }

  // Owner validation
  if (data.ownerId) {
    try {
      const firestore = getFirestore();
      const ownerDoc = await firestore.collection("users").doc(data.ownerId).get();
      if (!ownerDoc.exists) {
        errors.push("Owner does not exist");
      } else {
        const ownerData = ownerDoc.data();
        if (ownerData?.role !== "owner" && ownerData?.role !== "admin") {
          errors.push("Assigned user must have owner or admin role");
        }
      }
    } catch (error) {
      errors.push("Error validating owner");
    }
  }

  // Purchase date validation
  if (data.purchaseDate) {
    const date = new Date(data.purchaseDate);
    if (isNaN(date.getTime())) {
      errors.push("Invalid purchase date format");
    } else if (date > new Date()) {
      errors.push("Purchase date cannot be in the future");
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validates document data before creation or update
 */
const validateDocumentData = async (data: any, operation: string): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  // Required fields for creation
  if (operation === "create") {
    if (!data.name) errors.push("Document name is required");
    if (!data.type) errors.push("Document type is required");
    if (!data.propertyId) errors.push("Property ID is required");
    if (!data.ownerId) errors.push("Owner ID is required");
    if (!data.driveFileId) errors.push("Drive file ID is required");
  }

  // Name validation
  if (data.name && (data.name.length < 1 || data.name.length > 100)) {
    errors.push("Document name must be between 1 and 100 characters");
  }

  // Type validation
  const validTypes = ["deed", "contract", "inspection", "insurance", "tax", "other"];
  if (data.type && !validTypes.includes(data.type)) {
    errors.push(`Document type must be one of: ${validTypes.join(", ")}`);
  }

  // Property validation
  if (data.propertyId) {
    try {
      const firestore = getFirestore();
      const propertyDoc = await firestore.collection("properties").doc(data.propertyId).get();
      if (!propertyDoc.exists) {
        errors.push("Property does not exist");
      }
    } catch (error) {
      errors.push("Error validating property");
    }
  }

  // Owner validation
  if (data.ownerId) {
    try {
      const firestore = getFirestore();
      const ownerDoc = await firestore.collection("users").doc(data.ownerId).get();
      if (!ownerDoc.exists) {
        errors.push("Owner does not exist");
      }
    } catch (error) {
      errors.push("Error validating owner");
    }
  }

  // Description validation (if provided)
  if (data.description && data.description.length > 500) {
    errors.push("Description must be less than 500 characters");
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Cloud Function for server-side data validation
 * Validates data before it's stored in Firestore
 */
export const validateData = onCall<ValidationRequest>(
  async (request: CallableRequest<ValidationRequest>): Promise<ValidationResponse> => {
    const context = { functionName: "validateData", userId: request.auth?.uid };
    
    try {
      // Require authentication
      requireAuth(request.auth);

      const { collection, data, operation } = request.data;

      if (!collection || !data || !operation) {
        throw new HttpsError("invalid-argument", "Collection, data, and operation are required");
      }

      let validationResult: { valid: boolean; errors: string[] };

      switch (collection) {
        case "users":
          validationResult = await validateUserData(data, operation);
          break;
        case "properties":
          validationResult = await validatePropertyData(data, operation);
          break;
        case "documents":
          validationResult = await validateDocumentData(data, operation);
          break;
        default:
          throw new HttpsError("invalid-argument", "Invalid collection name");
      }

      logInfo(`Data validation completed for ${collection}`, {
        ...context,
        collection,
        operation,
        valid: validationResult.valid,
        errorCount: validationResult.errors.length,
      });

      return {
        valid: validationResult.valid,
        errors: validationResult.errors.length > 0 ? validationResult.errors : undefined,
      };

    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error in data validation", error as Error, context);
      throw new HttpsError("internal", "Data validation failed");
    }
  }
);