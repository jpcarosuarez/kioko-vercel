// Firebase Storage integration
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from 'firebase/storage';
import { storage } from './firebase';

export interface StorageFile {
  name: string;
  url: string;
  size: number;
  type: string;
  path: string;
  createdAt: Date;
}

export interface UploadResult {
  success: boolean;
  file?: StorageFile;
  error?: string;
}

/**
 * Upload a file to Firebase Storage
 */
export const uploadFile = async (
  file: File,
  path: string,
  metadata?: { [key: string]: string }
): Promise<UploadResult> => {
  try {
    const storageRef = ref(storage, path);
    
    // Upload file with metadata
    const uploadResult = await uploadBytes(storageRef, file, {
      customMetadata: metadata || {}
    });

    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);

    return {
      success: true,
      file: {
        name: file.name,
        url: downloadURL,
        size: file.size,
        type: file.type,
        path: path,
        createdAt: new Date()
      }
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al subir archivo'
    };
  }
};

/**
 * Delete a file from Firebase Storage
 */
export const deleteFile = async (path: string): Promise<boolean> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Get file metadata from Firebase Storage
 */
export const getFileMetadata = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    const metadata = await getMetadata(storageRef);
    return metadata;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return null;
  }
};

/**
 * Check if a file exists in Firebase Storage
 */
export const fileExists = async (path: string): Promise<boolean> => {
  try {
    const storageRef = ref(storage, path);
    await getMetadata(storageRef);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Generate unique filename with timestamp
 */
export const generateUniqueFilename = (originalName: string, customName?: string): string => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop() || '';
  const baseName = customName || originalName.split('.').slice(0, -1).join('.');
  
  // Clean filename (remove special characters)
  const cleanName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  return `${cleanName}_${timestamp}.${extension}`;
};

/**
 * Generate storage path for property images
 */
export const getPropertyImagePath = (propertyId: string, filename: string): string => {
  return `propiedades/${propertyId}/${filename}`;
};

/**
 * Generate storage path for owner documents with property context
 */
export const getOwnerDocumentPath = (ownerDisplayName: string, propertyId: string, filename: string): string => {
  // Clean owner display name for path
  const cleanOwnerName = ownerDisplayName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `propietarios/${cleanOwnerName}/${propertyId}/${filename}`;
};

/**
 * Upload property image
 */
export const uploadPropertyImage = async (
  file: File,
  propertyId: string,
  customName?: string
): Promise<UploadResult> => {
  const filename = generateUniqueFilename(file.name, customName);
  const path = getPropertyImagePath(propertyId, filename);
  
  return uploadFile(file, path, {
    type: 'property-image',
    propertyId,
    uploadedAt: new Date().toISOString()
  });
};

/**
 * Upload owner document with property context
 */
export const uploadOwnerDocument = async (
  file: File,
  ownerDisplayName: string,
  propertyId: string,
  customName?: string
): Promise<UploadResult> => {
  const filename = generateUniqueFilename(file.name, customName);
  const path = getOwnerDocumentPath(ownerDisplayName, propertyId, filename);
  
  return uploadFile(file, path, {
    type: 'owner-document',
    ownerName: ownerDisplayName,
    propertyId: propertyId,
    uploadedAt: new Date().toISOString()
  });
};
