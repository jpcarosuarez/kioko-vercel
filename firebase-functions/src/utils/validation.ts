/**
 * Validation utilities for Firebase Cloud Functions
 */

import { HttpsError } from "firebase-functions/v2/https";

/**
 * Validates if a role is valid
 */
export const isValidRole = (role: string): role is "admin" | "owner" | "tenant" => {
  return ["admin", "owner", "tenant"].includes(role);
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates if user is authenticated
 */
export const requireAuth = (auth: any): void => {
  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
};

/**
 * Validates if user has admin role
 */
export const requireAdmin = (auth: any): void => {
  requireAuth(auth);
  if (auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin role required");
  }
};

/**
 * Validates required fields
 */
export const validateRequired = (fields: Record<string, any>, fieldNames: string[]): void => {
  for (const fieldName of fieldNames) {
    if (!fields[fieldName]) {
      throw new HttpsError("invalid-argument", `${fieldName} is required`);
    }
  }
};