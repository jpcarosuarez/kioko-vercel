import { 
  Document, 
  CreateDocumentData, 
  UpdateDocumentData, 
  DocumentType,
  DocumentFilters 
} from '@/types/models';
import { documentsService, propertiesService, usersService } from './firestore';
import { Timestamp } from 'firebase/firestore';

/**
 * Enhanced document management service functions
 * Implements CRUD operations for documents with validation and relationship management
 */

// Document validation utilities
export const documentValidation = {
  /**
   * Validate document name
   */
  validateName: (name: string): { isValid: boolean; error?: string } => {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'El nombre del documento es requerido' };
    }
    
    if (name.trim().length < 2) {
      return { isValid: false, error: 'El nombre debe tener al menos 2 caracteres' };
    }
    
    if (name.length > 100) {
      return { isValid: false, error: 'El nombre no puede exceder 100 caracteres' };
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
      return { isValid: false, error: 'El nombre contiene caracteres no válidos' };
    }
    
    return { isValid: true };
  },

  /**
   * Validate document description
   */
  validateDescription: (description?: string): { isValid: boolean; error?: string } => {
    if (description && description.length > 500) {
      return { isValid: false, error: 'La descripción no puede exceder 500 caracteres' };
    }
    
    return { isValid: true };
  },

  /**
   * Validate document type
   */
  validateType: (type: DocumentType): { isValid: boolean; error?: string } => {
    const validTypes = Object.values(DocumentType);
    if (!validTypes.includes(type)) {
      return { isValid: false, error: 'Tipo de documento no válido' };
    }
    
    return { isValid: true };
  },

  /**
   * Validate complete document data
   */
  validateDocumentData: (data: Partial<UpdateDocumentData>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (data.name !== undefined) {
      const nameValidation = documentValidation.validateName(data.name);
      if (!nameValidation.isValid && nameValidation.error) {
        errors.push(nameValidation.error);
      }
    }
    
    if (data.description !== undefined) {
      const descValidation = documentValidation.validateDescription(data.description);
      if (!descValidation.isValid && descValidation.error) {
        errors.push(descValidation.error);
      }
    }
    
    if (data.type !== undefined) {
      const typeValidation = documentValidation.validateType(data.type);
      if (!typeValidation.isValid && typeValidation.error) {
        errors.push(typeValidation.error);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

/**
 * Update document metadata (name, description, type)
 * Requirements: 4.1, 4.2
 */
export const updateDocumentMetadata = async (
  documentId: string,
  updates: UpdateDocumentData
): Promise<void> => {
  try {
    // Validate input data
    const validation = documentValidation.validateDocumentData(updates);
    if (!validation.isValid) {
      throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
    }

    // Check if document exists
    const existingDocument = await documentsService.getById(documentId);
    if (!existingDocument) {
      throw new Error('Documento no encontrado');
    }

    // Prepare update data
    const updateData: Partial<Document> = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    // Update document in Firestore
    await documentsService.update(documentId, updateData);

    console.log(`Document metadata updated successfully: ${documentId}`);
  } catch (error) {
    console.error('Error updating document metadata:', error);
    throw error;
  }
};

/**
 * Delete document and remove file from Firebase Storage
 * Requirements: 4.3, 4.4, 4.5
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    // Get document details
    const document = await documentsService.getById(documentId);
    if (!document) {
      throw new Error('Documento no encontrado');
    }

    // Import Firebase Storage functions
    const { deleteFile } = await import('./firebaseStorage');

    // Delete file from Firebase Storage
    if (document.storagePath) {
      const deleted = await deleteFile(document.storagePath);
      if (deleted) {
        console.log(`File deleted from Firebase Storage: ${document.storagePath}`);
      } else {
        console.warn(`Failed to delete file from Firebase Storage: ${document.storagePath}`);
      }
    }

    // Delete document from Firestore
    await documentsService.delete(documentId);

    console.log(`Document deleted successfully: ${documentId}`);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * Get documents with filtering and relationship data
 * Requirements: 4.1, 4.2
 */
export const getDocumentsWithRelationships = async (
  filters?: DocumentFilters
): Promise<Document[]> => {
  try {
    let documents: Document[] = [];

    if (filters?.propertyId) {
      // Get documents for specific property
      documents = await documentsService.getWhere('propertyId', '==', filters.propertyId);
    } else if (filters?.ownerId) {
      // Get documents for specific owner
      documents = await documentsService.getWhere('ownerId', '==', filters.ownerId);
    } else {
      // Get all documents
      documents = await documentsService.getAll();
    }

    // Apply additional filters
    if (filters) {
      documents = documents.filter(doc => {
        if (filters.type && doc.type !== filters.type) return false;
        if (filters.isActive !== undefined && doc.isActive !== filters.isActive) return false;
        if (filters.search && !doc.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.tags && filters.tags.length > 0) {
          const docTags = doc.tags || [];
          const hasMatchingTag = filters.tags.some(tag => docTags.includes(tag));
          if (!hasMatchingTag) return false;
        }
        return true;
      });
    }

    return documents;
  } catch (error) {
    console.error('Error getting documents with relationships:', error);
    throw error;
  }
};

/**
 * Manage document-property-owner relationships
 * Requirements: 4.5
 */
export const documentRelationshipManager = {
  /**
   * Verify document relationships are valid
   */
  validateRelationships: async (propertyId: string, ownerId: string): Promise<boolean> => {
    try {
      // Check if property exists
      const property = await propertiesService.getById(propertyId);
      if (!property) {
        throw new Error('Propiedad no encontrada');
      }

      // Check if owner exists
      const owner = await usersService.getById(ownerId);
      if (!owner) {
        throw new Error('Propietario no encontrado');
      }

      // Verify owner owns the property
      if (property.ownerId !== ownerId) {
        throw new Error('El propietario no es dueño de esta propiedad');
      }

      return true;
    } catch (error) {
      console.error('Error validating document relationships:', error);
      throw error;
    }
  },

  /**
   * Update document relationships when property ownership changes
   */
  updateDocumentOwnership: async (propertyId: string, newOwnerId: string): Promise<void> => {
    try {
      // Get all documents for the property
      const documents = await documentsService.getWhere('propertyId', '==', propertyId);

      // Update owner for all documents
      const updatePromises = documents.map(doc => 
        documentsService.update(doc.id, { ownerId: newOwnerId })
      );

      await Promise.all(updatePromises);

      console.log(`Updated ownership for ${documents.length} documents to owner: ${newOwnerId}`);
    } catch (error) {
      console.error('Error updating document ownership:', error);
      throw error;
    }
  },

  /**
   * Get documents by property with owner information
   */
  getDocumentsByPropertyWithOwner: async (propertyId: string): Promise<(Document & { ownerName?: string; propertyAddress?: string })[]> => {
    try {
      // Get documents for property
      const documents = await documentsService.getWhere('propertyId', '==', propertyId);

      // Get property and owner information
      const property = await propertiesService.getById(propertyId);
      const owner = property ? await usersService.getById(property.ownerId) : null;

      // Enrich documents with relationship data
      return documents.map(doc => ({
        ...doc,
        ownerName: owner?.name,
        propertyAddress: property?.address
      }));
    } catch (error) {
      console.error('Error getting documents with owner info:', error);
      throw error;
    }
  }
};

/**
 * Get document statistics and analytics
 */
export const getDocumentStatistics = async (ownerId?: string): Promise<{
  totalDocuments: number;
  documentsByType: Record<DocumentType, number>;
  recentDocuments: Document[];
}> => {
  try {
    let documents: Document[] = [];

    if (ownerId) {
      documents = await documentsService.getWhere('ownerId', '==', ownerId);
    } else {
      documents = await documentsService.getAll();
    }

    // Calculate statistics
    const totalDocuments = documents.length;
    
    const documentsByType = documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<DocumentType, number>);

    // Get recent documents (last 10, sorted by upload date)
    const recentDocuments = documents
      .sort((a, b) => b.uploadDate.toMillis() - a.uploadDate.toMillis())
      .slice(0, 10);

    return {
      totalDocuments,
      documentsByType,
      recentDocuments
    };
  } catch (error) {
    console.error('Error getting document statistics:', error);
    throw error;
  }
};

/**
 * Synchronize document metadata with Firebase Storage
 * Requirements: 4.2, 4.3
 */
export const synchronizeDocumentWithFirebaseStorage = async (documentId: string): Promise<void> => {
  try {
    // Get document details
    const document = await documentsService.getById(documentId);
    if (!document) {
      throw new Error('Documento no encontrado');
    }

    // Import Firebase Storage functions
    const { getFileMetadata } = await import('./firebaseStorage');

    // Get current metadata from Firebase Storage
    const storageMetadata = await getFileMetadata(document.storagePath);

    // Update document metadata if there are changes
    const updates: Partial<Document> = {};
    let hasChanges = false;

    if (document.fileSize !== storageMetadata.size) {
      updates.fileSize = storageMetadata.size;
      hasChanges = true;
    }

    if (document.mimeType !== storageMetadata.contentType) {
      updates.mimeType = storageMetadata.contentType;
      hasChanges = true;
    }

    if (document.downloadUrl !== storageMetadata.downloadURL) {
      updates.downloadUrl = storageMetadata.downloadURL;
      hasChanges = true;
    }

    if (hasChanges) {
      await documentsService.update(documentId, updates);
      console.log(`Document metadata synchronized: ${documentId}`);
    }
  } catch (error) {
    console.error('Error synchronizing document with Firebase Storage:', error);
    throw error;
  }
};

/**
 * Batch synchronize multiple documents with Firebase Storage
 */
export const batchSynchronizeDocuments = async (documentIds: string[]): Promise<{
  successful: string[];
  failed: { documentId: string; error: string }[];
}> => {
  console.log(`Synchronizing ${documentIds.length} documents with Firebase Storage`);
  
  const successful: string[] = [];
  const failed: { documentId: string; error: string }[] = [];

  for (const documentId of documentIds) {
    try {
      await synchronizeDocumentWithFirebaseStorage(documentId);
      successful.push(documentId);
    } catch (error) {
      failed.push({
        documentId,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  console.log(`Synchronization completed: ${successful.length} successful, ${failed.length} failed`);
  return { successful, failed };
};

/**
 * Batch delete multiple documents and their Firebase Storage files
 */
export const batchDeleteDocuments = async (documentIds: string[]): Promise<{
  successful: string[];
  failed: { documentId: string; error: string }[];
}> => {
  console.log(`Batch deleting ${documentIds.length} documents`);
  
  const successful: string[] = [];
  const failed: { documentId: string; error: string }[] = [];

  for (const documentId of documentIds) {
    try {
      await deleteDocument(documentId);
      successful.push(documentId);
    } catch (error) {
      failed.push({
        documentId,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  console.log(`Batch deletion completed: ${successful.length} successful, ${failed.length} failed`);
  return { successful, failed };
};

/**
 * Verify document integrity with Firebase Storage
 */
export const verifyDocumentIntegrity = async (documentId: string): Promise<{
  isValid: boolean;
  issues: string[];
  recommendations: string[];
}> => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    // Get document details
    const document = await documentsService.getById(documentId);
    if (!document) {
      issues.push('Documento no encontrado en la base de datos');
      return { isValid: false, issues, recommendations };
    }

    // Import Firebase Storage functions
    const { fileExists, getFileMetadata } = await import('./firebaseStorage');

    // Check if file exists in Firebase Storage
    const fileExistsInStorage = await fileExists(document.storagePath);
    if (!fileExistsInStorage) {
      issues.push('Archivo no encontrado en Firebase Storage');
      recommendations.push('Considerar eliminar el registro del documento o restaurar el archivo');
      return { isValid: false, issues, recommendations };
    }

    // Get current metadata from Firebase Storage
    const storageMetadata = await getFileMetadata(document.storagePath);

    // Check for metadata inconsistencies
    if (document.fileSize !== storageMetadata.size) {
      issues.push(`Tamaño de archivo inconsistente: DB=${document.fileSize}, Storage=${storageMetadata.size}`);
      recommendations.push('Sincronizar metadatos del documento');
    }

    if (document.mimeType !== storageMetadata.contentType) {
      issues.push(`Tipo MIME inconsistente: DB=${document.mimeType}, Storage=${storageMetadata.contentType}`);
      recommendations.push('Sincronizar metadatos del documento');
    }

    if (document.downloadUrl !== storageMetadata.downloadURL) {
      issues.push('URL de descarga desactualizada');
      recommendations.push('Sincronizar metadatos del documento');
    }

    const isValid = issues.length === 0;
    return { isValid, issues, recommendations };
  } catch (error) {
    issues.push(`Error verificando integridad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    return { isValid: false, issues, recommendations };
  }
};

export default {
  updateDocumentMetadata,
  deleteDocument,
  getDocumentsWithRelationships,
  documentRelationshipManager,
  getDocumentStatistics,
  documentValidation,
  synchronizeDocumentWithFirebaseStorage,
  batchSynchronizeDocuments,
  batchDeleteDocuments,
  verifyDocumentIntegrity
};