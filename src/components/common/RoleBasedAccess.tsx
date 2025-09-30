/**
 * Role-based access control component
 * Shows/hides content based on user roles with clean TailwindCSS styling
 */

import React from "react";
import { useAuth } from "../AuthProvider";
import { isAdmin, isOwner, isTenant, isAdminOrOwner, AuthUser } from "../../lib/securityUtils";

interface RoleBasedAccessProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "owner" | "tenant")[];
  requireAdmin?: boolean;
  requireOwner?: boolean;
  requireTenant?: boolean;
  requireAdminOrOwner?: boolean;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Component that conditionally renders content based on user roles
 */
export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  children,
  allowedRoles,
  requireAdmin = false,
  requireOwner = false,
  requireTenant = false,
  requireAdminOrOwner = false,
  fallback = null,
  className = "",
}) => {
  const { user } = useAuth();
  const authUser = user as AuthUser;

  // Check if user has required permissions
  const hasAccess = (): boolean => {
    if (!authUser) return false;

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

  if (!hasAccess()) {
    return <>{fallback}</>;
  }

  return <div className={className}>{children}</div>;
};

/**
 * Admin-only content wrapper
 */
export const AdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, fallback, className }) => (
  <RoleBasedAccess requireAdmin fallback={fallback} className={className}>
    {children}
  </RoleBasedAccess>
);

/**
 * Owner-only content wrapper
 */
export const OwnerOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, fallback, className }) => (
  <RoleBasedAccess requireOwner fallback={fallback} className={className}>
    {children}
  </RoleBasedAccess>
);

/**
 * Tenant-only content wrapper
 */
export const TenantOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, fallback, className }) => (
  <RoleBasedAccess requireTenant fallback={fallback} className={className}>
    {children}
  </RoleBasedAccess>
);

/**
 * Admin or Owner content wrapper
 */
export const AdminOrOwnerOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, fallback, className }) => (
  <RoleBasedAccess requireAdminOrOwner fallback={fallback} className={className}>
    {children}
  </RoleBasedAccess>
);

/**
 * Role-based navigation item
 */
export const RoleBasedNavItem: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ("admin" | "owner" | "tenant")[];
  requireAdmin?: boolean;
  requireOwner?: boolean;
  requireTenant?: boolean;
  requireAdminOrOwner?: boolean;
  className?: string;
}> = ({ children, className = "flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors", ...props }) => (
  <RoleBasedAccess {...props} className={className}>
    {children}
  </RoleBasedAccess>
);

/**
 * Role-based button wrapper
 */
export const RoleBasedButton: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ("admin" | "owner" | "tenant")[];
  requireAdmin?: boolean;
  requireOwner?: boolean;
  requireTenant?: boolean;
  requireAdminOrOwner?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}> = ({ 
  children, 
  onClick, 
  className = "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", 
  disabled = false,
  ...props 
}) => {
  const { user } = useAuth();
  const authUser = user as AuthUser;

  // Check if user has required permissions
  const hasAccess = (): boolean => {
    if (!authUser) return false;

    if (props.requireAdmin && !isAdmin(authUser)) return false;
    if (props.requireOwner && !isOwner(authUser)) return false;
    if (props.requireTenant && !isTenant(authUser)) return false;
    if (props.requireAdminOrOwner && !isAdminOrOwner(authUser)) return false;

    if (props.allowedRoles && props.allowedRoles.length > 0) {
      return props.allowedRoles.includes(authUser.customClaims?.role || "tenant");
    }

    return true;
  };

  if (!hasAccess()) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
};

/**
 * Role badge component for displaying user roles
 */
export const RoleBadge: React.FC<{
  role: "admin" | "owner" | "tenant";
  className?: string;
}> = ({ role, className = "" }) => {
  const getRoleStyles = (role: string): string => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "owner":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "tenant":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleLabel = (role: string): string => {
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

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleStyles(role)} ${className}`}
    >
      {getRoleLabel(role)}
    </span>
  );
};