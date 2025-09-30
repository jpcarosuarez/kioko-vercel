import { useState, useEffect, useCallback } from 'react';
import { 
  Document, 
  UpdateDocumentData, 
  DocumentFilters,
  DocumentType 
} from '@/types/models';
import {
  updateDocumentMetadata,
  deleteDocument,
  getDocumentsWithRelationships,
  documentRelationshipManager,
  getDocumentStatistics,
  synchronizeDocumentWithFirebaseStorage,
  batchSynchronizeDocuments,
  batchDeleteDocuments,
  verifyDocumentIntegrity
} from '@/lib/documentManagement';
import {
  documentNotifications,
  documentErrorNotifications,
  documentLoadingNotifications,
  documentWarningNotifications
} from '@/lib/documentNotifications';
import { DocumentErrorHandler } from '@/lib/documentErrorHandling';

/**
 * Custom hook for document management operations
 * Provides state management and operations for document CRUD
 */

export interface UseDocumentManagementReturn {
  // State
  documents: Document[];
  loading: boolean;
  error: string | null;
  statistics: {
    totalDocuments: number;
    documentsByType: Record<DocumentType, number>;
    recentDocuments: Document[];
  } | null;

  // Operations
  loadDocuments: (filters?: DocumentFilters) => Promise<void>;
  updateDocument: (documentId: string, updates: UpdateDocumentData) => Promise<void>;
  removeDocument: (documentId: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
  loadStatistics: (ownerId?: string) => Promise<void>;
  
  // Firebase Storage Integration
  synchronizeDocument: (documentId: string) => Promise<void>;
  batchSynchronizeDocuments: (documentIds: string[]) => Promise<void>;
  batchDeleteDocuments: (documentIds: string[]) => Promise<void>;
  verifyDocumentIntegrity: (documentId: string) => Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }>;
  
  // Utilities
  clearError: () => void;
  getDocumentById: (id: string) => Document | undefined;
  getDocumentsByProperty: (propertyId: string) => Document[];
  getDocumentsByOwner: (ownerId: string) => Document[];
}

export const useDocumentManagement = (
  initialFilters?: DocumentFilters
): UseDocumentManagementReturn => {
  // State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{
    totalDocuments: number;
    documentsByType: Record<DocumentType, number>;
    recentDocuments: Document[];
  } | null>(null);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Load documents with optional filters
   */
  const loadDocuments = useCallback(async (filters?: DocumentFilters) => {
    try {
      setLoading(true);
      setError(null);

      const loadedDocuments = await getDocumentsWithRelationships(filters);
      setDocuments(loadedDocuments);
    } catch (err) {
      const error = DocumentErrorHandler.handle(err, 'cargar documentos');
      setError(DocumentErrorHandler.getMessage(error));
      documentErrorNotifications.operationFailed('cargar documentos', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update document metadata
   */
  const updateDocument = useCallback(async (
    documentId: string, 
    updates: UpdateDocumentData
  ) => {
    const loadingId = documentLoadingNotifications.show('Actualizando documento...');
    
    try {
      setError(null);

      // Find the document to get its name
      const document = documents.find(doc => doc.id === documentId);
      const documentName = document?.name || 'documento';

      await updateDocumentMetadata(documentId, updates);

      // Update local state
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === documentId 
            ? { ...doc, ...updates }
            : doc
        )
      );

      documentLoadingNotifications.success(
        loadingId, 
        `Documento "${documentName}" actualizado exitosamente`
      );
      
      documentNotifications.documentUpdated(documentName);
    } catch (err) {
      const error = DocumentErrorHandler.handle(err, 'actualizar documento', { documentId });
      setError(DocumentErrorHandler.getMessage(error));
      
      documentLoadingNotifications.error(
        loadingId, 
        `Error al actualizar documento: ${DocumentErrorHandler.getMessage(error)}`
      );
      
      documentErrorNotifications.updateFailed(
        documents.find(doc => doc.id === documentId)?.name || 'documento',
        error
      );
      throw error;
    }
  }, [documents]);

  /**
   * Delete document
   */
  const removeDocument = useCallback(async (documentId: string) => {
    const loadingId = documentLoadingNotifications.show('Eliminando documento...');
    
    try {
      setError(null);

      // Find the document to get its name
      const document = documents.find(doc => doc.id === documentId);
      const documentName = document?.name || 'documento';

      await deleteDocument(documentId);

      // Update local state
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));

      documentLoadingNotifications.success(
        loadingId, 
        `Documento "${documentName}" eliminado exitosamente`
      );
      
      documentNotifications.documentDeleted(documentName);
    } catch (err) {
      const error = DocumentErrorHandler.handle(err, 'eliminar documento', { documentId });
      setError(DocumentErrorHandler.getMessage(error));
      
      documentLoadingNotifications.error(
        loadingId, 
        `Error al eliminar documento: ${DocumentErrorHandler.getMessage(error)}`
      );
      
      documentErrorNotifications.deleteFailed(
        documents.find(doc => doc.id === documentId)?.name || 'documento',
        error
      );
      throw error;
    }
  }, [documents]);

  /**
   * Refresh documents (reload with current filters)
   */
  const refreshDocuments = useCallback(async () => {
    await loadDocuments(initialFilters);
  }, [loadDocuments, initialFilters]);

  /**
   * Load document statistics
   */
  const loadStatistics = useCallback(async (ownerId?: string) => {
    try {
      setError(null);
      const stats = await getDocumentStatistics(ownerId);
      setStatistics(stats);
    } catch (err) {
      const error = DocumentErrorHandler.handle(err, 'cargar estadísticas');
      setError(DocumentErrorHandler.getMessage(error));
      documentErrorNotifications.operationFailed('cargar estadísticas', error);
    }
  }, []);

  /**
   * Get document by ID
   */
  const getDocumentById = useCallback((id: string): Document | undefined => {
    return documents.find(doc => doc.id === id);
  }, [documents]);

  /**
   * Get documents by property ID
   */
  const getDocumentsByProperty = useCallback((propertyId: string): Document[] => {
    return documents.filter(doc => doc.propertyId === propertyId);
  }, [documents]);

  /**
   * Get documents by owner ID
   */
  const getDocumentsByOwner = useCallback((ownerId: string): Document[] => {
    return documents.filter(doc => doc.ownerId === ownerId);
  }, [documents]);

  /**
   * Synchronize document with Firebase Storage
   */
  const synchronizeDocument = useCallback(async (documentId: string) => {
    const loadingId = documentLoadingNotifications.show('Sincronizando con Firebase Storage...');
    
    try {
      setError(null);

      const document = documents.find(doc => doc.id === documentId);
      const documentName = document?.name || 'documento';

      await synchronizeDocumentWithFirebaseStorage(documentId);

      // Refresh documents to get updated metadata
      await refreshDocuments();

      documentLoadingNotifications.success(
        loadingId, 
        `Documento "${documentName}" sincronizado exitosamente`
      );
      
      documentNotifications.metadataUpdated(documentName);
    } catch (err) {
      const error = DocumentErrorHandler.handle(err, 'sincronizar documento', { documentId });
      setError(DocumentErrorHandler.getMessage(error));
      
      documentLoadingNotifications.error(
        loadingId, 
        `Error al sincronizar: ${DocumentErrorHandler.getMessage(error)}`
      );
      
      documentErrorNotifications.operationFailed('sincronizar documento', error);
      throw error;
    }
  }, [documents, refreshDocuments]);

  /**
   * Batch synchronize multiple documents
   */
  const batchSynchronizeDocumentsHook = useCallback(async (documentIds: string[]) => {
    const loadingId = documentLoadingNotifications.show(`Sincronizando ${documentIds.length} documentos...`);
    
    try {
      setError(null);

      const result = await batchSynchronizeDocuments(documentIds);

      // Refresh documents to get updated metadata
      await refreshDocuments();

      if (result.failed.length === 0) {
        documentLoadingNotifications.success(
          loadingId, 
          `${result.successful.length} documentos sincronizados exitosamente`
        );
        documentNotifications.documentsProcessed(result.successful.length, 'sincronizados');
      } else {
        documentLoadingNotifications.error(
          loadingId, 
          `${result.successful.length} sincronizados, ${result.failed.length} fallaron`
        );
        documentErrorNotifications.operationFailed(
          'sincronizar algunos documentos', 
          new Error(`${result.failed.length} documentos fallaron`)
        );
      }
    } catch (err) {
      const error = DocumentErrorHandler.handle(err, 'sincronizar documentos');
      setError(DocumentErrorHandler.getMessage(error));
      
      documentLoadingNotifications.error(
        loadingId, 
        `Error al sincronizar documentos: ${DocumentErrorHandler.getMessage(error)}`
      );
      
      documentErrorNotifications.operationFailed('sincronizar documentos', error);
      throw error;
    }
  }, [refreshDocuments]);

  /**
   * Batch delete multiple documents
   */
  const batchDeleteDocumentsHook = useCallback(async (documentIds: string[]) => {
    const loadingId = documentLoadingNotifications.show(`Eliminando ${documentIds.length} documentos...`);
    
    try {
      setError(null);

      const result = await batchDeleteDocuments(documentIds);

      // Update local state
      setDocuments(prevDocs => 
        prevDocs.filter(doc => !result.successful.includes(doc.id))
      );

      if (result.failed.length === 0) {
        documentLoadingNotifications.success(
          loadingId, 
          `${result.successful.length} documentos eliminados exitosamente`
        );
        documentNotifications.documentsProcessed(result.successful.length, 'eliminados');
      } else {
        documentLoadingNotifications.error(
          loadingId, 
          `${result.successful.length} eliminados, ${result.failed.length} fallaron`
        );
        documentErrorNotifications.operationFailed(
          'eliminar algunos documentos', 
          new Error(`${result.failed.length} documentos fallaron`)
        );
      }
    } catch (err) {
      const error = DocumentErrorHandler.handle(err, 'eliminar documentos');
      setError(DocumentErrorHandler.getMessage(error));
      
      documentLoadingNotifications.error(
        loadingId, 
        `Error al eliminar documentos: ${DocumentErrorHandler.getMessage(error)}`
      );
      
      documentErrorNotifications.operationFailed('eliminar documentos', error);
      throw error;
    }
  }, []);

  /**
   * Verify document integrity with Firebase Storage
   */
  const verifyDocumentIntegrityHook = useCallback(async (documentId: string) => {
    try {
      setError(null);

      const result = await verifyDocumentIntegrity(documentId);
      
      if (!result.isValid) {
        const document = documents.find(doc => doc.id === documentId);
        const documentName = document?.name || 'documento';
        
        documentWarningNotifications.validationWarning(
          `Problemas encontrados en "${documentName}": ${result.issues.join(', ')}`
        );
      }

      return result;
    } catch (err) {
      const error = DocumentErrorHandler.handle(err, 'verificar integridad del documento', { documentId });
      setError(DocumentErrorHandler.getMessage(error));
      documentErrorNotifications.operationFailed('verificar integridad', error);
      throw error;
    }
  }, [documents]);

  // Load initial documents
  useEffect(() => {
    if (initialFilters) {
      loadDocuments(initialFilters);
    }
  }, [loadDocuments, initialFilters]);

  return {
    // State
    documents,
    loading,
    error,
    statistics,

    // Operations
    loadDocuments,
    updateDocument,
    removeDocument,
    refreshDocuments,
    loadStatistics,

    // Firebase Storage Integration
    synchronizeDocument,
    batchSynchronizeDocuments: batchSynchronizeDocumentsHook,
    batchDeleteDocuments: batchDeleteDocumentsHook,
    verifyDocumentIntegrity: verifyDocumentIntegrityHook,

    // Utilities
    clearError,
    getDocumentById,
    getDocumentsByProperty,
    getDocumentsByOwner
  };
};

/**
 * Hook for managing documents for a specific property
 */
export const usePropertyDocuments = (propertyId: string) => {
  return useDocumentManagement({ propertyId });
};

/**
 * Hook for managing documents for a specific owner
 */
export const useOwnerDocuments = (ownerId: string) => {
  return useDocumentManagement({ ownerId });
};

/**
 * Hook for managing all documents (admin view)
 */
export const useAllDocuments = () => {
  return useDocumentManagement();
};

export default useDocumentManagement;