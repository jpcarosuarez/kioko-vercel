import { toast } from 'sonner';
import { DocumentErrorHandler } from './documentErrorHandling';

/**
 * Document notification utilities
 * Provides consistent user feedback for document operations
 */

export interface NotificationOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Success notifications for document operations
 */
export const documentNotifications = {
  /**
   * Document created successfully
   */
  documentCreated: (documentName: string, options?: NotificationOptions) => {
    toast.success(`Documento "${documentName}" creado exitosamente`, {
      duration: options?.duration || 4000,
      action: options?.action
    });
  },

  /**
   * Document updated successfully
   */
  documentUpdated: (documentName: string, options?: NotificationOptions) => {
    toast.success(`Documento "${documentName}" actualizado exitosamente`, {
      duration: options?.duration || 4000,
      action: options?.action
    });
  },

  /**
   * Document deleted successfully
   */
  documentDeleted: (documentName: string, options?: NotificationOptions) => {
    toast.success(`Documento "${documentName}" eliminado exitosamente`, {
      duration: options?.duration || 4000,
      action: options?.action
    });
  },

  /**
   * Document uploaded successfully
   */
  documentUploaded: (documentName: string, options?: NotificationOptions) => {
    toast.success(`Documento "${documentName}" subido exitosamente`, {
      duration: options?.duration || 4000,
      action: options?.action
    });
  },

  /**
   * Multiple documents processed
   */
  documentsProcessed: (count: number, operation: string, options?: NotificationOptions) => {
    toast.success(`${count} documentos ${operation} exitosamente`, {
      duration: options?.duration || 4000,
      action: options?.action
    });
  },

  /**
   * Document metadata updated
   */
  metadataUpdated: (documentName: string, options?: NotificationOptions) => {
    toast.success(`Información de "${documentName}" actualizada`, {
      duration: options?.duration || 3000,
      action: options?.action
    });
  }
};

/**
 * Error notifications for document operations
 */
export const documentErrorNotifications = {
  /**
   * Generic document operation error
   */
  operationFailed: (operation: string, error: any, options?: NotificationOptions) => {
    const message = DocumentErrorHandler.getMessage(error);
    toast.error(`Error al ${operation}: ${message}`, {
      duration: options?.duration || 6000,
      action: options?.action
    });
  },

  /**
   * Document creation failed
   */
  createFailed: (error: any, options?: NotificationOptions) => {
    const message = DocumentErrorHandler.getMessage(error);
    toast.error(`Error al crear documento: ${message}`, {
      duration: options?.duration || 6000,
      action: options?.action
    });
  },

  /**
   * Document update failed
   */
  updateFailed: (documentName: string, error: any, options?: NotificationOptions) => {
    const message = DocumentErrorHandler.getMessage(error);
    toast.error(`Error al actualizar "${documentName}": ${message}`, {
      duration: options?.duration || 6000,
      action: options?.action
    });
  },

  /**
   * Document deletion failed
   */
  deleteFailed: (documentName: string, error: any, options?: NotificationOptions) => {
    const message = DocumentErrorHandler.getMessage(error);
    toast.error(`Error al eliminar "${documentName}": ${message}`, {
      duration: options?.duration || 6000,
      action: options?.action
    });
  },

  /**
   * Document upload failed
   */
  uploadFailed: (fileName: string, error: any, options?: NotificationOptions) => {
    const message = DocumentErrorHandler.getMessage(error);
    toast.error(`Error al subir "${fileName}": ${message}`, {
      duration: options?.duration || 6000,
      action: options?.action
    });
  },

  /**
   * Document not found
   */
  documentNotFound: (documentName?: string, options?: NotificationOptions) => {
    const name = documentName ? `"${documentName}"` : 'El documento';
    toast.error(`${name} no fue encontrado`, {
      duration: options?.duration || 5000,
      action: options?.action
    });
  },

  /**
   * Permission denied
   */
  permissionDenied: (operation: string, options?: NotificationOptions) => {
    toast.error(`No tienes permisos para ${operation}`, {
      duration: options?.duration || 5000,
      action: options?.action
    });
  },

  /**
   * Network error
   */
  networkError: (options?: NotificationOptions) => {
    toast.error('Error de conexión. Verifica tu conexión a internet', {
      duration: options?.duration || 5000,
      action: options?.action
    });
  },

  /**
   * Firebase Storage error
   */
  firebaseStorageError: (error: any, options?: NotificationOptions) => {
    const message = DocumentErrorHandler.getMessage(error);
    toast.error(`Error de Firebase Storage: ${message}`, {
      duration: options?.duration || 6000,
      action: options?.action
    });
  }
};

/**
 * Warning notifications for document operations
 */
export const documentWarningNotifications = {
  /**
   * Document validation warning
   */
  validationWarning: (message: string, options?: NotificationOptions) => {
    toast.warning(`Advertencia: ${message}`, {
      duration: options?.duration || 5000,
      action: options?.action
    });
  },

  /**
   * Large file warning
   */
  largeFileWarning: (fileName: string, size: string, options?: NotificationOptions) => {
    toast.warning(`El archivo "${fileName}" es grande (${size}). La subida puede tardar`, {
      duration: options?.duration || 6000,
      action: options?.action
    });
  },

  /**
   * Quota warning
   */
  quotaWarning: (percentage: number, options?: NotificationOptions) => {
    toast.warning(`Almacenamiento al ${percentage}% de capacidad`, {
      duration: options?.duration || 8000,
      action: options?.action
    });
  },

  /**
   * Duplicate document warning
   */
  duplicateWarning: (documentName: string, options?: NotificationOptions) => {
    toast.warning(`Ya existe un documento llamado "${documentName}"`, {
      duration: options?.duration || 5000,
      action: options?.action
    });
  }
};

/**
 * Info notifications for document operations
 */
export const documentInfoNotifications = {
  /**
   * Document processing info
   */
  processing: (operation: string, documentName?: string, options?: NotificationOptions) => {
    const name = documentName ? ` "${documentName}"` : '';
    toast.info(`${operation}${name}...`, {
      duration: options?.duration || 3000,
      action: options?.action
    });
  },

  /**
   * Upload progress info
   */
  uploadProgress: (fileName: string, progress: number, options?: NotificationOptions) => {
    toast.info(`Subiendo "${fileName}": ${progress}%`, {
      duration: options?.duration || 2000,
      action: options?.action
    });
  },

  /**
   * Sync info
   */
  syncInfo: (message: string, options?: NotificationOptions) => {
    toast.info(message, {
      duration: options?.duration || 3000,
      action: options?.action
    });
  }
};

/**
 * Loading notifications for document operations
 */
export const documentLoadingNotifications = {
  /**
   * Show loading notification
   */
  show: (message: string, options?: { id?: string }) => {
    return toast.loading(message, {
      id: options?.id
    });
  },

  /**
   * Update loading notification to success
   */
  success: (id: string | number, message: string, options?: NotificationOptions) => {
    toast.success(message, {
      id,
      duration: options?.duration || 4000,
      action: options?.action
    });
  },

  /**
   * Update loading notification to error
   */
  error: (id: string | number, message: string, options?: NotificationOptions) => {
    toast.error(message, {
      id,
      duration: options?.duration || 6000,
      action: options?.action
    });
  },

  /**
   * Dismiss loading notification
   */
  dismiss: (id: string | number) => {
    toast.dismiss(id);
  }
};

/**
 * Confirmation notifications for document operations
 */
export const documentConfirmationNotifications = {
  /**
   * Confirm document deletion
   */
  confirmDelete: (documentName: string, onConfirm: () => void, onCancel?: () => void) => {
    toast.warning(`¿Eliminar "${documentName}"?`, {
      duration: 10000,
      action: {
        label: 'Eliminar',
        onClick: onConfirm
      },
      cancel: {
        label: 'Cancelar',
        onClick: onCancel
      }
    });
  },

  /**
   * Confirm bulk operation
   */
  confirmBulkOperation: (
    operation: string, 
    count: number, 
    onConfirm: () => void, 
    onCancel?: () => void
  ) => {
    toast.warning(`¿${operation} ${count} documentos?`, {
      duration: 10000,
      action: {
        label: 'Confirmar',
        onClick: onConfirm
      },
      cancel: {
        label: 'Cancelar',
        onClick: onCancel
      }
    });
  }
};

// Convenience functions for consistency with other notification files
export const notifyDocumentUploaded = (documentName: string) => {
  documentNotifications.documentUploaded(documentName);
};

export const notifyDocumentUpdated = (documentName: string) => {
  documentNotifications.documentUpdated(documentName);
};

export const notifyDocumentDeleted = (documentName: string) => {
  documentNotifications.documentDeleted(documentName);
};

export const showError = (error: string) => {
  toast.error('Error', {
    description: error,
    duration: 5000
  });
};

export default {
  documentNotifications,
  documentErrorNotifications,
  documentWarningNotifications,
  documentInfoNotifications,
  documentLoadingNotifications,
  documentConfirmationNotifications
};