import { FirebaseError } from 'firebase/app';

/**
 * Document-specific error handling utilities
 * Provides user-friendly error messages for document operations
 */

export enum DocumentErrorCode {
  // Validation errors
  INVALID_NAME = 'document/invalid-name',
  INVALID_DESCRIPTION = 'document/invalid-description',
  INVALID_TYPE = 'document/invalid-type',
  INVALID_FILE_SIZE = 'document/invalid-file-size',
  INVALID_FILE_TYPE = 'document/invalid-file-type',
  
  // Relationship errors
  PROPERTY_NOT_FOUND = 'document/property-not-found',
  OWNER_NOT_FOUND = 'document/owner-not-found',
  INVALID_OWNERSHIP = 'document/invalid-ownership',
  
  // Operation errors
  DOCUMENT_NOT_FOUND = 'document/not-found',
  DOCUMENT_ALREADY_EXISTS = 'document/already-exists',
  UPLOAD_FAILED = 'document/upload-failed',
  DELETE_FAILED = 'document/delete-failed',
  UPDATE_FAILED = 'document/update-failed',
  
  // Google Drive errors
  DRIVE_AUTH_FAILED = 'document/drive-auth-failed',
  DRIVE_QUOTA_EXCEEDED = 'document/drive-quota-exceeded',
  DRIVE_FILE_NOT_FOUND = 'document/drive-file-not-found',
  DRIVE_PERMISSION_DENIED = 'document/drive-permission-denied',
  
  // Network errors
  NETWORK_ERROR = 'document/network-error',
  TIMEOUT_ERROR = 'document/timeout-error',
  
  // Generic errors
  UNKNOWN_ERROR = 'document/unknown-error'
}

export interface DocumentError extends Error {
  code: DocumentErrorCode;
  originalError?: Error;
  context?: Record<string, any>;
}

/**
 * Create a document error with proper typing
 */
export const createDocumentError = (
  code: DocumentErrorCode,
  message: string,
  originalError?: Error,
  context?: Record<string, any>
): DocumentError => {
  const error = new Error(message) as DocumentError;
  error.code = code;
  error.originalError = originalError;
  error.context = context;
  return error;
};

/**
 * User-friendly error messages in Spanish
 */
const errorMessages: Record<DocumentErrorCode, string> = {
  // Validation errors
  [DocumentErrorCode.INVALID_NAME]: 'El nombre del documento no es válido',
  [DocumentErrorCode.INVALID_DESCRIPTION]: 'La descripción del documento no es válida',
  [DocumentErrorCode.INVALID_TYPE]: 'El tipo de documento no es válido',
  [DocumentErrorCode.INVALID_FILE_SIZE]: 'El tamaño del archivo excede el límite permitido',
  [DocumentErrorCode.INVALID_FILE_TYPE]: 'El tipo de archivo no está permitido',
  
  // Relationship errors
  [DocumentErrorCode.PROPERTY_NOT_FOUND]: 'La propiedad asociada no fue encontrada',
  [DocumentErrorCode.OWNER_NOT_FOUND]: 'El propietario no fue encontrado',
  [DocumentErrorCode.INVALID_OWNERSHIP]: 'El propietario no tiene permisos sobre esta propiedad',
  
  // Operation errors
  [DocumentErrorCode.DOCUMENT_NOT_FOUND]: 'El documento no fue encontrado',
  [DocumentErrorCode.DOCUMENT_ALREADY_EXISTS]: 'Ya existe un documento con este nombre',
  [DocumentErrorCode.UPLOAD_FAILED]: 'Error al subir el documento',
  [DocumentErrorCode.DELETE_FAILED]: 'Error al eliminar el documento',
  [DocumentErrorCode.UPDATE_FAILED]: 'Error al actualizar el documento',
  
  // Google Drive errors
  [DocumentErrorCode.DRIVE_AUTH_FAILED]: 'Error de autenticación con Google Drive',
  [DocumentErrorCode.DRIVE_QUOTA_EXCEEDED]: 'Se ha excedido la cuota de almacenamiento de Google Drive',
  [DocumentErrorCode.DRIVE_FILE_NOT_FOUND]: 'El archivo no fue encontrado en Google Drive',
  [DocumentErrorCode.DRIVE_PERMISSION_DENIED]: 'Permisos insuficientes para acceder a Google Drive',
  
  // Network errors
  [DocumentErrorCode.NETWORK_ERROR]: 'Error de conexión. Verifica tu conexión a internet',
  [DocumentErrorCode.TIMEOUT_ERROR]: 'La operación tardó demasiado tiempo. Inténtalo de nuevo',
  
  // Generic errors
  [DocumentErrorCode.UNKNOWN_ERROR]: 'Ocurrió un error inesperado'
};

/**
 * Handle Firebase errors and convert them to document errors
 */
export const handleFirebaseError = (error: FirebaseError, context?: Record<string, any>): DocumentError => {
  let code: DocumentErrorCode;
  let message: string;

  switch (error.code) {
    case 'permission-denied':
      code = DocumentErrorCode.DRIVE_PERMISSION_DENIED;
      message = 'No tienes permisos para realizar esta operación';
      break;
    case 'not-found':
      code = DocumentErrorCode.DOCUMENT_NOT_FOUND;
      message = 'El documento no fue encontrado';
      break;
    case 'already-exists':
      code = DocumentErrorCode.DOCUMENT_ALREADY_EXISTS;
      message = 'El documento ya existe';
      break;
    case 'resource-exhausted':
      code = DocumentErrorCode.DRIVE_QUOTA_EXCEEDED;
      message = 'Se ha excedido la cuota de almacenamiento';
      break;
    case 'unavailable':
      code = DocumentErrorCode.NETWORK_ERROR;
      message = 'Servicio no disponible. Inténtalo más tarde';
      break;
    case 'deadline-exceeded':
      code = DocumentErrorCode.TIMEOUT_ERROR;
      message = 'La operación tardó demasiado tiempo';
      break;
    default:
      code = DocumentErrorCode.UNKNOWN_ERROR;
      message = 'Ocurrió un error inesperado';
  }

  return createDocumentError(code, message, error, context);
};

/**
 * Handle Google Drive API errors
 */
export const handleGoogleDriveError = (error: any, context?: Record<string, any>): DocumentError => {
  let code: DocumentErrorCode;
  let message: string;

  if (error.status) {
    switch (error.status) {
      case 401:
        code = DocumentErrorCode.DRIVE_AUTH_FAILED;
        message = 'Error de autenticación con Google Drive';
        break;
      case 403:
        if (error.error?.error?.message?.includes('quota')) {
          code = DocumentErrorCode.DRIVE_QUOTA_EXCEEDED;
          message = 'Se ha excedido la cuota de Google Drive';
        } else {
          code = DocumentErrorCode.DRIVE_PERMISSION_DENIED;
          message = 'Permisos insuficientes para Google Drive';
        }
        break;
      case 404:
        code = DocumentErrorCode.DRIVE_FILE_NOT_FOUND;
        message = 'El archivo no fue encontrado en Google Drive';
        break;
      case 413:
        code = DocumentErrorCode.INVALID_FILE_SIZE;
        message = 'El archivo es demasiado grande';
        break;
      case 429:
        code = DocumentErrorCode.DRIVE_QUOTA_EXCEEDED;
        message = 'Demasiadas solicitudes. Inténtalo más tarde';
        break;
      default:
        code = DocumentErrorCode.UNKNOWN_ERROR;
        message = 'Error de Google Drive';
    }
  } else {
    code = DocumentErrorCode.NETWORK_ERROR;
    message = 'Error de conexión con Google Drive';
  }

  return createDocumentError(code, message, error, context);
};

/**
 * Handle validation errors
 */
export const handleValidationError = (
  validationErrors: string[],
  context?: Record<string, any>
): DocumentError => {
  const message = validationErrors.join(', ');
  return createDocumentError(
    DocumentErrorCode.INVALID_NAME, // Generic validation error
    message,
    undefined,
    context
  );
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: DocumentError | Error): string => {
  if ('code' in error && error.code) {
    return errorMessages[error.code] || error.message;
  }
  return error.message || 'Ocurrió un error inesperado';
};

/**
 * Log error with context for debugging
 */
export const logDocumentError = (error: DocumentError, operation: string): void => {
  console.error(`Document ${operation} error:`, {
    code: error.code,
    message: error.message,
    originalError: error.originalError,
    context: error.context,
    stack: error.stack
  });
};

/**
 * Document error handler class for consistent error handling
 */
export class DocumentErrorHandler {
  /**
   * Handle any error and convert to DocumentError
   */
  static handle(error: any, operation: string, context?: Record<string, any>): DocumentError {
    let documentError: DocumentError;

    if (error.code && error.code.startsWith('document/')) {
      // Already a document error
      documentError = error as DocumentError;
    } else if (error.code && (error.code.startsWith('auth/') || error.code.startsWith('firestore/'))) {
      // Firebase error
      documentError = handleFirebaseError(error, context);
    } else if (error.status) {
      // Google Drive API error
      documentError = handleGoogleDriveError(error, context);
    } else if (Array.isArray(error)) {
      // Validation errors array
      documentError = handleValidationError(error, context);
    } else {
      // Generic error
      documentError = createDocumentError(
        DocumentErrorCode.UNKNOWN_ERROR,
        error.message || 'Ocurrió un error inesperado',
        error,
        context
      );
    }

    // Log the error
    logDocumentError(documentError, operation);

    return documentError;
  }

  /**
   * Get user-friendly message from any error
   */
  static getMessage(error: any): string {
    if ('code' in error && error.code) {
      return getErrorMessage(error);
    }
    return error.message || 'Ocurrió un error inesperado';
  }
}

export default {
  DocumentErrorCode,
  createDocumentError,
  handleFirebaseError,
  handleGoogleDriveError,
  handleValidationError,
  getErrorMessage,
  logDocumentError,
  DocumentErrorHandler
};