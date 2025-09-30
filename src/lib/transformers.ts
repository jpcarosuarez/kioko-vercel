import { Timestamp } from 'firebase/firestore';
import {
  User,
  Property,
  Document,
  CreateUserData,
  CreatePropertyData,
  CreateDocumentData,
  UserFormData,
  PropertyFormData,
  DocumentFormData,
  UserRole,
  PropertyType,
  DocumentType
} from '../types/models';

// Firestore document interfaces (what we get from Firestore)
interface FirestoreUser {
  id: string;
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Timestamp;
  profileImageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface FirestoreProperty {
  id: string;
  address: string;
  type: string;
  ownerId: string;
  tenantId?: string;
  imageUrl: string;
  purchaseDate: string;
  value: number;
  description?: string;
  isActive: boolean;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  yearBuilt?: number;
  features?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface FirestoreDocument {
  id: string;
  name: string;
  description?: string;
  type: string;
  propertyId: string;
  ownerId: string;
  uploadDate: Timestamp;
  fileSize: string;
  mimeType: string;
  driveFileId: string;
  driveUrl: string;
  uploadedBy: string;
  isActive: boolean;
  tags?: string[];
  version?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User transformers
export const userTransformers = {
  // Transform Firestore document to User model
  fromFirestore: (doc: FirestoreUser): User => ({
    id: doc.id,
    uid: doc.uid,
    email: doc.email,
    name: doc.name,
    phone: doc.phone,
    role: doc.role as UserRole,
    isActive: doc.isActive,
    lastLoginAt: doc.lastLoginAt,
    profileImageUrl: doc.profileImageUrl,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }),

  // Transform User model to Firestore document data
  toFirestore: (user: CreateUserData & { uid: string }): Omit<FirestoreUser, 'id' | 'createdAt' | 'updatedAt'> => ({
    uid: user.uid,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive ?? true,
    profileImageUrl: user.profileImageUrl
  }),

  // Transform form data to CreateUserData
  fromForm: (formData: UserFormData): CreateUserData => ({
    email: formData.email.trim().toLowerCase(),
    name: formData.name.trim(),
    phone: formData.phone,
    role: formData.role,
    password: formData.password,
    isActive: formData.isActive
  }),

  // Transform User model to form data
  toForm: (user: User): Partial<UserFormData> => ({
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    password: '', // Never populate password in forms
    confirmPassword: ''
  })
};

// Property transformers
export const propertyTransformers = {
  // Transform Firestore document to Property model
  fromFirestore: (doc: FirestoreProperty): Property => ({
    id: doc.id,
    address: doc.address,
    type: doc.type as PropertyType,
    ownerId: doc.ownerId,
    tenantId: doc.tenantId,
    imageUrl: doc.imageUrl,
    purchaseDate: doc.purchaseDate,
    value: doc.value,
    description: doc.description,
    isActive: doc.isActive,
    bedrooms: doc.bedrooms,
    bathrooms: doc.bathrooms,
    squareMeters: doc.squareMeters,
    yearBuilt: doc.yearBuilt,
    features: doc.features || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }),

  // Transform Property model to Firestore document data
  toFirestore: (property: CreatePropertyData): Omit<FirestoreProperty, 'id' | 'createdAt' | 'updatedAt'> => ({
    address: property.address,
    type: property.type,
    ownerId: property.ownerId,
    tenantId: property.tenantId,
    imageUrl: property.imageUrl,
    purchaseDate: property.purchaseDate,
    value: property.value,
    description: property.description,
    isActive: property.isActive ?? true,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareMeters: property.squareMeters,
    yearBuilt: property.yearBuilt,
    features: property.features || []
  }),

  // Transform form data to CreatePropertyData
  fromForm: (formData: PropertyFormData): CreatePropertyData => ({
    address: formData.address.trim(),
    type: formData.type,
    ownerId: formData.ownerId,
    tenantId: formData.tenantId || undefined,
    imageUrl: formData.imageUrl.trim(),
    purchaseDate: formData.purchaseDate,
    value: parseFloat(formData.value),
    description: formData.description?.trim() || undefined,
    bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
    bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
    squareMeters: formData.squareMeters ? parseFloat(formData.squareMeters) : undefined,
    yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
    features: formData.features || []
  }),

  // Transform Property model to form data
  toForm: (property: Property): PropertyFormData => ({
    address: property.address,
    type: property.type,
    ownerId: property.ownerId,
    tenantId: property.tenantId || '',
    imageUrl: property.imageUrl,
    purchaseDate: property.purchaseDate,
    value: property.value.toString(),
    description: property.description || '',
    bedrooms: property.bedrooms?.toString() || '',
    bathrooms: property.bathrooms?.toString() || '',
    squareMeters: property.squareMeters?.toString() || '',
    yearBuilt: property.yearBuilt?.toString() || '',
    features: property.features || []
  })
};

// Document transformers
export const documentTransformers = {
  // Transform Firestore document to Document model
  fromFirestore: (doc: FirestoreDocument): Document => ({
    id: doc.id,
    name: doc.name,
    description: doc.description,
    type: doc.type as DocumentType,
    propertyId: doc.propertyId,
    ownerId: doc.ownerId,
    uploadDate: doc.uploadDate,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    driveFileId: doc.driveFileId,
    driveUrl: doc.driveUrl,
    uploadedBy: doc.uploadedBy,
    isActive: doc.isActive,
    tags: doc.tags || [],
    version: doc.version || 1,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }),

  // Transform Document model to Firestore document data
  toFirestore: (document: CreateDocumentData): Omit<FirestoreDocument, 'id' | 'createdAt' | 'updatedAt'> => ({
    name: document.name,
    description: document.description,
    type: document.type,
    propertyId: document.propertyId,
    ownerId: document.ownerId,
    uploadDate: Timestamp.now(),
    fileSize: document.fileSize,
    mimeType: document.mimeType,
    driveFileId: document.driveFileId,
    driveUrl: document.driveUrl,
    uploadedBy: document.uploadedBy,
    isActive: document.isActive ?? true,
    tags: document.tags || [],
    version: document.version || 1
  }),

  // Transform form data to CreateDocumentData (partial, needs file info)
  fromForm: (formData: DocumentFormData, fileInfo: {
    fileSize: string;
    mimeType: string;
    driveFileId: string;
    driveUrl: string;
    uploadedBy: string;
    ownerId: string;
  }): CreateDocumentData => ({
    name: formData.name.trim(),
    description: formData.description?.trim() || undefined,
    type: formData.type,
    propertyId: formData.propertyId,
    ownerId: fileInfo.ownerId,
    fileSize: fileInfo.fileSize,
    mimeType: fileInfo.mimeType,
    driveFileId: fileInfo.driveFileId,
    driveUrl: fileInfo.driveUrl,
    uploadedBy: fileInfo.uploadedBy,
    tags: formData.tags || []
  }),

  // Transform Document model to form data
  toForm: (document: Document): DocumentFormData => ({
    name: document.name,
    description: document.description || '',
    type: document.type,
    propertyId: document.propertyId,
    tags: document.tags || []
  })
};

// Utility transformers
export const utilityTransformers = {
  // Convert Firestore timestamp to ISO string
  timestampToISOString: (timestamp: Timestamp): string => {
    return timestamp.toDate().toISOString();
  },

  // Convert ISO string to Firestore timestamp
  isoStringToTimestamp: (isoString: string): Timestamp => {
    return Timestamp.fromDate(new Date(isoString));
  },

  // Format timestamp for display
  formatTimestamp: (timestamp: Timestamp, locale: string = 'es-ES'): string => {
    return timestamp.toDate().toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Format date for input fields
  formatDateForInput: (timestamp: Timestamp): string => {
    return timestamp.toDate().toISOString().split('T')[0];
  },

  // Convert file size to human readable format
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Parse file size string to bytes
  parseFileSize: (sizeString: string): number => {
    const units: { [key: string]: number } = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*([A-Z]+)$/i);
    if (!match) return 0;

    const [, size, unit] = match;
    return parseFloat(size) * (units[unit.toUpperCase()] || 1);
  },

  // Sanitize string for safe display
  sanitizeString: (str: string): string => {
    return str
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  },

  // Generate slug from string
  generateSlug: (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[áéíóúñ]/g, (match) => {
        const replacements: { [key: string]: string } = {
          'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n'
        };
        return replacements[match] || match;
      })
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },

  // Validate and format phone number
  formatPhoneNumber: (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  },

  // Format currency
  formatCurrency: (amount: number, currency: string = 'EUR', locale: string = 'es-ES'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  // Parse currency string to number
  parseCurrency: (currencyString: string): number => {
    return parseFloat(currencyString.replace(/[^\d.-]/g, '')) || 0;
  }
};

// Batch transformers for arrays
export const batchTransformers = {
  // Transform array of Firestore users to User models
  usersFromFirestore: (docs: FirestoreUser[]): User[] => {
    return docs.map(userTransformers.fromFirestore);
  },

  // Transform array of Firestore properties to Property models
  propertiesFromFirestore: (docs: FirestoreProperty[]): Property[] => {
    return docs.map(propertyTransformers.fromFirestore);
  },

  // Transform array of Firestore documents to Document models
  documentsFromFirestore: (docs: FirestoreDocument[]): Document[] => {
    return docs.map(documentTransformers.fromFirestore);
  }
};

// Export all transformers
export const transformers = {
  user: userTransformers,
  property: propertyTransformers,
  document: documentTransformers,
  utility: utilityTransformers,
  batch: batchTransformers
};

export default transformers;