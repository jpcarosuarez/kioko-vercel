/**
 * Authentication Middleware for Express Routes
 */

import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    customClaims?: any;
  };
}

/**
 * Middleware to verify Firebase ID token
 */
export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid authorization header"
      });
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role,
      customClaims: decodedToken
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token"
    });
  }
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required"
    });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      error: "Forbidden",
      message: "Admin role required"
    });
    return;
  }

  next();
};

/**
 * Middleware to require authentication (any authenticated user)
 */
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required"
    });
    return;
  }

  next();
};