import { Timestamp } from 'firebase/firestore';

// Base interface for all Firestore documents
export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User roles enum
export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  TENANT = 'tenant'
}

// Property types enum
export enum PropertyType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial'
}

// Document types enum
export enum DocumentType {
  DEED = 'deed',
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  INSURANCE = 'insurance',
  TAX_DOCUMENT = 'tax_document',
  MAINTENANCE = 'maintenance',
  INSPECTION = 'inspection',
  OTHER = 'other'
}

// Document visibility enum
export enum DocumentVisibility {
  BOTH = 'both',
  TENANT = 'tenant',
  OWNER = 'owner'
}

// User interface
export interface User extends BaseDocument {
  uid: string; // Firebase Auth UID
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Timestamp;
  profileImageUrl?: string;
}

// User creation data (without auto-generated fields)
export interface CreateUserData {
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  password: string;
  isActive?: boolean;
  profileImageUrl?: string;
}

// User update data (partial fields)
export interface UpdateUserData {
  name?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
  profileImageUrl?: string;
}

// Property interface
export interface Property extends BaseDocument {
  address: string;
  type: PropertyType;
  ownerId: string; // Reference to User
  tenantId?: string; // Reference to User (optional)
  imageUrl: string; // Firebase Storage URL
  imagePath?: string; // Firebase Storage path
  contractStartDate: string; // Fecha de inicio del contrato
  rentalValue: number; // Valor del arriendo
  squareMeters?: number;
  bedrooms?: number;
  isActive: boolean;
}

// Property creation data
export interface CreatePropertyData {
  address: string;
  type: PropertyType;
  ownerId: string;
  tenantId?: string; // Optional tenant assignment
  imageUrl: string; // Firebase Storage URL
  imagePath?: string; // Firebase Storage path
  contractStartDate: string;
  rentalValue: number;
  squareMeters?: number;
  bedrooms?: number;
  isActive?: boolean;
}

// Property update data
export interface UpdatePropertyData {
  address?: string;
  type?: PropertyType;
  ownerId?: string;
  tenantId?: string; // Optional tenant assignment
  imageUrl?: string; // Firebase Storage URL
  imagePath?: string; // Firebase Storage path
  contractStartDate?: string;
  rentalValue?: number;
  squareMeters?: number;
  bedrooms?: number;
  isActive?: boolean;
}

// Document interface
export interface Document extends BaseDocument {
  ownerId: string; // uid del usuario propietario (obligatorio)
  ownerDisplayName: string; // displayName del propietario (obligatorio)
  propertyId: string | null; // id de la propiedad (puede ser null)
  storagePath: string; // ruta completa en Firebase Storage (obligatorio)
  downloadUrl: string; // url de descarga (obligatorio)
  displayName: string; // nombre mostrado/editable por el usuario (obligatorio)
  originalName: string; // nombre original del archivo subido (obligatorio)
  mimeType: string; // tipo MIME del archivo (obligatorio)
  size: number; // tamaño en bytes (obligatorio)
  uploadedBy: string; // uid del usuario que subió el archivo (obligatorio)
  uploadedAt: Timestamp; // fecha/hora de subida (obligatorio)
  tags?: string[]; // opcional
  description?: string; // opcional
  type: DocumentType; // tipo de documento
  visibility: DocumentVisibility; // visibilidad del documento
  isActive: boolean;
}

// Document creation data
export interface CreateDocumentData {
  ownerId: string;
  ownerDisplayName: string;
  propertyId: string | null;
  storagePath: string;
  downloadUrl: string;
  displayName: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Timestamp;
  tags?: string[];
  description?: string;
  type: DocumentType;
  visibility: DocumentVisibility;
  isActive?: boolean;
}

// Document update data
export interface UpdateDocumentData {
  displayName?: string;
  description?: string;
  type?: DocumentType;
  visibility?: DocumentVisibility;
  isActive?: boolean;
  tags?: string[];
}

// System settings interface
export interface SystemSettings extends BaseDocument {
  key: string;
  value: any;
  description?: string;
  isPublic: boolean;
}

// Audit log interface
export interface AuditLog extends BaseDocument {
  userId: string; // User who performed the action
  action: string; // Action performed (create, update, delete, etc.)
  resourceType: string; // Type of resource (user, property, document)
  resourceId: string; // ID of the affected resource
  oldData?: any; // Previous data (for updates/deletes)
  newData?: any; // New data (for creates/updates)
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
}

// Firebase Auth custom claims interface
export interface CustomClaims {
  role: UserRole;
  isActive: boolean;
}

// Authentication user interface (extends Firebase User)
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  customClaims?: CustomClaims;
}

// Form data interfaces for UI components
export interface UserFormData {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
  isActive: boolean;
}

export interface PropertyFormData {
  address: string;
  type: PropertyType;
  ownerId: string;
  tenantId: string;
  imageUrl: string;
  purchaseDate: string;
  value: string; // String for form input, converted to number
  description: string;
  bedrooms: string;
  bathrooms: string;
  squareMeters: string;
  yearBuilt: string;
  features: string[];
}

export interface DocumentFormData {
  name: string;
  description: string;
  type: DocumentType;
  propertyId: string;
  tags: string[];
}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Filter and search interfaces
export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface PropertyFilters {
  type?: PropertyType;
  ownerId?: string;
  tenantId?: string;
  isActive?: boolean;
  minValue?: number;
  maxValue?: number;
  search?: string;
}

export interface DocumentFilters {
  type?: DocumentType;
  propertyId?: string;
  ownerId?: string;
  isActive?: boolean;
  search?: string;
  tags?: string[];
}

// Dashboard statistics interfaces
export interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalDocuments: number;
  activeUsers: number;
  activeProperties: number;
  recentActivity: AuditLog[];
}

export interface OwnerStats {
  totalProperties: number;
  totalDocuments: number;
  totalValue: number;
  recentDocuments: Document[];
}

export interface TenantStats {
  assignedProperties: number;
  availableDocuments: number;
  recentDocuments: Document[];
}

// Utility type for making all properties optional except specified ones
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Utility type for Firestore document data (without id and timestamps)
export type FirestoreData<T extends BaseDocument> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export default {
  UserRole,
  PropertyType,
  DocumentType
};