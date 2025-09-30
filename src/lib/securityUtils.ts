/**
 * Security utilities for client-side security measures
 */

import { User } from "firebase/auth";
import { auth } from "./firebase";
import { toast } from "sonner";

export interface UserRole {
  role: "admin" | "owner" | "tenant";
}

export interface AuthUser extends User {
  customClaims?: UserRole;
}

/**
 * Check if current user has admin role
 */
export const isAdmin = (user: AuthUser | null): boolean => {
  return user?.customClaims?.role === "admin";
};

/**
 * Check if current user has owner role
 */
export const isOwner = (user: AuthUser | null): boolean => {
  return user?.customClaims?.role === "owner";
};

/**
 * Check if current user has tenant role
 */
export const isTenant = (user: AuthUser | null): boolean => {
  return user?.customClaims?.role === "tenant";
};

/**
 * Check if current user has admin or owner role
 */
export const isAdminOrOwner = (user: AuthUser | null): boolean => {
  return isAdmin(user) || isOwner(user);
};

/**
 * Get user role display name
 */
export const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case "admin":
      return "Administrador";
    case "owner":
      return "Propietario";
    case "tenant":
      return "Inquilino";
    default:
      return "Usuario";
  }
};

/**
 * Check if user can access admin features
 */
export const canAccessAdminFeatures = (user: AuthUser | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can manage users
 */
export const canManageUsers = (user: AuthUser | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can manage properties
 */
export const canManageProperties = (user: AuthUser | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can manage documents
 */
export const canManageDocuments = (user: AuthUser | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can view property
 */
export const canViewProperty = (user: AuthUser | null, propertyOwnerId: string): boolean => {
  if (!user) return false;
  return isAdmin(user) || user.uid === propertyOwnerId;
};

/**
 * Check if user can view document
 */
export const canViewDocument = (user: AuthUser | null, documentOwnerId: string): boolean => {
  if (!user) return false;
  return isAdmin(user) || user.uid === documentOwnerId;
};

/**
 * Require authentication and redirect if not authenticated
 */
export const requireAuth = (user: AuthUser | null): boolean => {
  if (!user) {
    toast.error("Debes iniciar sesión para acceder a esta función");
    return false;
  }
  return true;
};

/**
 * Require admin role and show error if not admin
 */
export const requireAdmin = (user: AuthUser | null): boolean => {
  if (!requireAuth(user)) return false;
  
  if (!isAdmin(user)) {
    toast.error("No tienes permisos de administrador para realizar esta acción");
    return false;
  }
  return true;
};

/**
 * Require admin or owner role and show error if not authorized
 */
export const requireAdminOrOwner = (user: AuthUser | null): boolean => {
  if (!requireAuth(user)) return false;
  
  if (!isAdminOrOwner(user)) {
    toast.error("No tienes permisos suficientes para realizar esta acción");
    return false;
  }
  return true;
};

/**
 * Check token expiration and handle automatic logout
 */
export const checkTokenExpiration = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    // Force token refresh to check if it's still valid
    const tokenResult = await user.getIdTokenResult(true);
    
    // Check if token is about to expire (within 5 minutes)
    const expirationTime = new Date(tokenResult.expirationTime);
    const now = new Date();
    const timeUntilExpiration = expirationTime.getTime() - now.getTime();
    const fiveMinutes = 5 * 60 * 1000;

    if (timeUntilExpiration < fiveMinutes) {
      toast.warning("Tu sesión está por expirar. Por favor, guarda tu trabajo.");
      
      // If token is expired, logout
      if (timeUntilExpiration <= 0) {
        await auth.signOut();
        toast.error("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    // If there's an error getting the token, assume it's expired
    await auth.signOut();
    toast.error("Error de autenticación. Por favor, inicia sesión nuevamente.");
    return false;
  }
};

/**
 * Set up automatic token expiration checking
 */
export const setupTokenExpirationCheck = (): (() => void) => {
  const interval = setInterval(checkTokenExpiration, 60000); // Check every minute
  
  return () => clearInterval(interval);
};

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format (XXX) XXX-XXXX
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
  return phoneRegex.test(phone);
};

/**
 * Create audit trail entry for admin actions
 */
export const createAuditTrail = async (action: string, details: any): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user || !isAdmin(user as AuthUser)) return;

    // In a real implementation, this would call a Cloud Function
    // to create an audit log entry
    console.log("Audit Trail:", {
      userId: user.uid,
      userEmail: user.email,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating audit trail:", error);
  }
};