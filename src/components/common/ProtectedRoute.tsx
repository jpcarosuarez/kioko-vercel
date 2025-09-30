/**
 * Enhanced Protected Route component with role-based access control
 */

import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { 
  isAdmin, 
  isOwner, 
  isTenant, 
  isAdminOrOwner, 
  AuthUser,
  setupTokenExpirationCheck 
} from "../../lib/securityUtils";
import { LoadingState } from "./LoadingState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { AlertTriangle } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "owner" | "tenant")[];
  requireAdmin?: boolean;
  requireOwner?: boolean;
  requireTenant?: boolean;
  requireAdminOrOwner?: boolean;
  redirectTo?: string;
}

/**
 * Protected route component that handles authentication and role-based access
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAdmin = false,
  requireOwner = false,
  requireTenant = false,
  requireAdminOrOwner = false,
  redirectTo = "/",
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const authUser = user as AuthUser;

  // Set up token expiration checking
  useEffect(() => {
    if (authUser) {
      const cleanup = setupTokenExpirationCheck();
      return cleanup;
    }
  }, [authUser]);

  // Show loading state while checking authentication
  if (loading) {
    return <LoadingState message="Verificando autenticación..." />;
  }

  // Redirect to login if not authenticated
  if (!authUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based permissions
  const hasAccess = (): boolean => {
    // Check specific role requirements
    if (requireAdmin && !isAdmin(authUser)) return false;
    if (requireOwner && !isOwner(authUser)) return false;
    if (requireTenant && !isTenant(authUser)) return false;
    if (requireAdminOrOwner && !isAdminOrOwner(authUser)) return false;

    // Check allowed roles array
    if (allowedRoles && allowedRoles.length > 0) {
      return allowedRoles.includes(authUser.customClaims?.role || "tenant");
    }

    return true;
  };

  // Show access denied if user doesn't have required permissions
  if (!hasAccess()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Acceso Denegado
            </CardTitle>
            <CardDescription className="text-gray-600">
              No tienes permisos para acceder a esta página
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Tu rol actual: <span className="font-medium">{authUser.customClaims?.role || "sin rol"}</span>
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Volver
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Admin-only route wrapper
 */
export const AdminRoute: React.FC<{
  children: React.ReactNode;
  redirectTo?: string;
}> = ({ children, redirectTo }) => (
  <ProtectedRoute requireAdmin redirectTo={redirectTo}>
    {children}
  </ProtectedRoute>
);

/**
 * Owner-only route wrapper
 */
export const OwnerRoute: React.FC<{
  children: React.ReactNode;
  redirectTo?: string;
}> = ({ children, redirectTo }) => (
  <ProtectedRoute requireOwner redirectTo={redirectTo}>
    {children}
  </ProtectedRoute>
);

/**
 * Tenant-only route wrapper
 */
export const TenantRoute: React.FC<{
  children: React.ReactNode;
  redirectTo?: string;
}> = ({ children, redirectTo }) => (
  <ProtectedRoute requireTenant redirectTo={redirectTo}>
    {children}
  </ProtectedRoute>
);

/**
 * Admin or Owner route wrapper
 */
export const AdminOrOwnerRoute: React.FC<{
  children: React.ReactNode;
  redirectTo?: string;
}> = ({ children, redirectTo }) => (
  <ProtectedRoute requireAdminOrOwner redirectTo={redirectTo}>
    {children}
  </ProtectedRoute>
);