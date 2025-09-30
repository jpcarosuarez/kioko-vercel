/**
 * TypeScript interfaces for Firebase Cloud Functions
 */

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

export interface InitializeAdminRequest {
  email: string;
  adminSecret: string;
}

export interface InitializeAdminResponse {
  success: boolean;
  message: string;
  uid: string;
}

export interface UserRole {
  role: "admin" | "owner" | "tenant";
}

export interface AuthContext {
  uid: string;
  token: {
    role?: "admin" | "owner" | "tenant";
    [key: string]: any;
  };
}

export interface CallableRequest<T = any> {
  auth?: AuthContext;
  data: T;
}

// User lifecycle types
export interface UserCreateData {
  uid: string;
  email: string;
  displayName?: string;
  customClaims?: UserRole;
}

export interface UserDeleteData {
  uid: string;
  email: string;
}

// Data validation types
export interface ValidationRequest {
  collection: "users" | "properties" | "documents";
  data: any;
  operation: "create" | "update" | "delete";
}

export interface ValidationResponse {
  valid: boolean;
  errors?: string[];
}

// Cleanup types
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

// Email notification types
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

// Backup types
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