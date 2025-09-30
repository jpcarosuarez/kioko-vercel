import { FirebaseError } from 'firebase/app';

export interface UserError {
  code: string;
  message: string;
  field?: string;
  type: 'validation' | 'auth' | 'firestore' | 'network' | 'permission' | 'unknown';
}

export class UserErrorHandler {
  /**
   * Convert Firebase Auth errors to user-friendly messages
   */
  static handleFirebaseAuthError(error: FirebaseError): UserError {
    const errorMap: Record<string, { message: string; field?: string }> = {
      // Authentication errors
      'auth/email-already-in-use': {
        message: 'Ya existe una cuenta con este email',
        field: 'email'
      },
      'auth/invalid-email': {
        message: 'El formato del email es inválido',
        field: 'email'
      },
      'auth/operation-not-allowed': {
        message: 'La operación no está permitida. Contacte al administrador'
      },
      'auth/weak-password': {
        message: 'La contraseña es muy débil. Use al menos 6 caracteres',
        field: 'password'
      },
      'auth/user-disabled': {
        message: 'Esta cuenta ha sido deshabilitada'
      },
      'auth/user-not-found': {
        message: 'No se encontró el usuario'
      },
      'auth/wrong-password': {
        message: 'Contraseña incorrecta',
        field: 'password'
      },
      'auth/too-many-requests': {
        message: 'Demasiados intentos fallidos. Intente más tarde'
      },
      'auth/network-request-failed': {
        message: 'Error de conexión. Verifique su conexión a internet'
      },
      'auth/requires-recent-login': {
        message: 'Esta operación requiere autenticación reciente. Inicie sesión nuevamente'
      },
      'auth/credential-already-in-use': {
        message: 'Las credenciales ya están en uso por otra cuenta'
      },
      'auth/invalid-credential': {
        message: 'Las credenciales proporcionadas son inválidas'
      },
      'auth/account-exists-with-different-credential': {
        message: 'Ya existe una cuenta con este email usando un método de autenticación diferente'
      },
      'auth/invalid-verification-code': {
        message: 'El código de verificación es inválido'
      },
      'auth/invalid-verification-id': {
        message: 'El ID de verificación es inválido'
      },
      'auth/missing-verification-code': {
        message: 'Falta el código de verificación'
      },
      'auth/missing-verification-id': {
        message: 'Falta el ID de verificación'
      },
      'auth/code-expired': {
        message: 'El código de verificación ha expirado'
      },
      'auth/invalid-phone-number': {
        message: 'El número de teléfono es inválido',
        field: 'phone'
      },
      'auth/missing-phone-number': {
        message: 'Falta el número de teléfono',
        field: 'phone'
      },
      'auth/quota-exceeded': {
        message: 'Se ha excedido la cuota de SMS. Intente más tarde'
      },
      'auth/captcha-check-failed': {
        message: 'La verificación reCAPTCHA falló'
      },
      'auth/invalid-app-credential': {
        message: 'Las credenciales de la aplicación son inválidas'
      },
      'auth/app-deleted': {
        message: 'La aplicación ha sido eliminada'
      },
      'auth/app-not-authorized': {
        message: 'La aplicación no está autorizada'
      },
      'auth/argument-error': {
        message: 'Argumentos inválidos proporcionados'
      },
      'auth/invalid-api-key': {
        message: 'Clave API inválida'
      },
      'auth/invalid-user-token': {
        message: 'Token de usuario inválido'
      },
      'auth/invalid-tenant-id': {
        message: 'ID de tenant inválido'
      },
      'auth/user-token-expired': {
        message: 'El token de usuario ha expirado'
      },
      'auth/web-storage-unsupported': {
        message: 'El almacenamiento web no es compatible con este navegador'
      },
      'auth/already-initialized': {
        message: 'Firebase Auth ya ha sido inicializado'
      },
      'auth/recaptcha-not-enabled': {
        message: 'reCAPTCHA no está habilitado'
      },
      'auth/missing-recaptcha-token': {
        message: 'Falta el token de reCAPTCHA'
      },
      'auth/invalid-recaptcha-token': {
        message: 'Token de reCAPTCHA inválido'
      },
      'auth/invalid-recaptcha-action': {
        message: 'Acción de reCAPTCHA inválida'
      },
      'auth/missing-client-type': {
        message: 'Falta el tipo de cliente'
      },
      'auth/missing-recaptcha-version': {
        message: 'Falta la versión de reCAPTCHA'
      },
      'auth/invalid-recaptcha-version': {
        message: 'Versión de reCAPTCHA inválida'
      },
      'auth/invalid-req-type': {
        message: 'Tipo de solicitud inválido'
      }
    };

    const errorInfo = errorMap[error.code] || {
      message: error.message || 'Error desconocido de autenticación'
    };

    return {
      code: error.code,
      message: errorInfo.message,
      field: errorInfo.field,
      type: 'auth'
    };
  }

  /**
   * Handle Firestore errors
   */
  static handleFirestoreError(error: FirebaseError): UserError {
    const errorMap: Record<string, string> = {
      'permission-denied': 'No tiene permisos para realizar esta operación',
      'not-found': 'El documento solicitado no existe',
      'already-exists': 'El documento ya existe',
      'resource-exhausted': 'Se ha excedido la cuota de recursos',
      'failed-precondition': 'La operación falló debido a una condición previa',
      'aborted': 'La operación fue abortada',
      'out-of-range': 'Valor fuera de rango',
      'unimplemented': 'Operación no implementada',
      'internal': 'Error interno del servidor',
      'unavailable': 'Servicio no disponible temporalmente',
      'data-loss': 'Pérdida de datos irrecuperable',
      'unauthenticated': 'Usuario no autenticado',
      'invalid-argument': 'Argumentos inválidos',
      'deadline-exceeded': 'Tiempo de espera agotado',
      'cancelled': 'Operación cancelada'
    };

    const message = errorMap[error.code] || error.message || 'Error de base de datos';

    return {
      code: error.code,
      message,
      type: 'firestore'
    };
  }

  /**
   * Handle network errors
   */
  static handleNetworkError(error: Error): UserError {
    return {
      code: 'network-error',
      message: 'Error de conexión. Verifique su conexión a internet',
      type: 'network'
    };
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(field: string, message: string): UserError {
    return {
      code: 'validation-error',
      message,
      field,
      type: 'validation'
    };
  }

  /**
   * Handle permission errors
   */
  static handlePermissionError(operation: string): UserError {
    return {
      code: 'permission-denied',
      message: `No tiene permisos para ${operation}`,
      type: 'permission'
    };
  }

  /**
   * Handle generic errors
   */
  static handleGenericError(error: Error): UserError {
    // Check if it's a Firebase error
    if ('code' in error && typeof error.code === 'string') {
      const firebaseError = error as FirebaseError;
      
      if (firebaseError.code.startsWith('auth/')) {
        return this.handleFirebaseAuthError(firebaseError);
      } else if (firebaseError.code.includes('firestore') || firebaseError.code.includes('permission')) {
        return this.handleFirestoreError(firebaseError);
      }
    }

    // Check if it's a network error
    if (error.message.toLowerCase().includes('network') || 
        error.message.toLowerCase().includes('connection') ||
        error.message.toLowerCase().includes('fetch')) {
      return this.handleNetworkError(error);
    }

    // Generic error
    return {
      code: 'unknown-error',
      message: error.message || 'Ha ocurrido un error inesperado',
      type: 'unknown'
    };
  }

  /**
   * Get user-friendly error message for display
   */
  static getDisplayMessage(error: UserError): string {
    return error.message;
  }

  /**
   * Get error severity level
   */
  static getErrorSeverity(error: UserError): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCodes = [
      'auth/app-deleted',
      'auth/invalid-api-key',
      'internal',
      'data-loss'
    ];

    const highCodes = [
      'permission-denied',
      'auth/user-disabled',
      'auth/too-many-requests',
      'resource-exhausted'
    ];

    const mediumCodes = [
      'auth/network-request-failed',
      'unavailable',
      'deadline-exceeded',
      'auth/requires-recent-login'
    ];

    if (criticalCodes.includes(error.code)) return 'critical';
    if (highCodes.includes(error.code)) return 'high';
    if (mediumCodes.includes(error.code)) return 'medium';
    return 'low';
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: UserError): boolean {
    const retryableCodes = [
      'auth/network-request-failed',
      'unavailable',
      'deadline-exceeded',
      'aborted',
      'cancelled'
    ];

    return retryableCodes.includes(error.code);
  }

  /**
   * Get suggested action for error
   */
  static getSuggestedAction(error: UserError): string {
    const actionMap: Record<string, string> = {
      'auth/email-already-in-use': 'Use un email diferente o inicie sesión con la cuenta existente',
      'auth/weak-password': 'Use una contraseña más fuerte con al menos 6 caracteres',
      'auth/network-request-failed': 'Verifique su conexión a internet e intente nuevamente',
      'auth/too-many-requests': 'Espere unos minutos antes de intentar nuevamente',
      'auth/requires-recent-login': 'Cierre sesión e inicie sesión nuevamente',
      'permission-denied': 'Contacte al administrador para obtener los permisos necesarios',
      'unavailable': 'El servicio está temporalmente no disponible. Intente más tarde',
      'unauthenticated': 'Inicie sesión para continuar'
    };

    return actionMap[error.code] || 'Intente nuevamente o contacte al soporte técnico';
  }
}

// Export convenience functions
export const handleFirebaseAuthError = (error: FirebaseError) => 
  UserErrorHandler.handleFirebaseAuthError(error);

export const handleFirestoreError = (error: FirebaseError) => 
  UserErrorHandler.handleFirestoreError(error);

export const handleGenericError = (error: Error) => 
  UserErrorHandler.handleGenericError(error);

export const getErrorMessage = (error: UserError) => 
  UserErrorHandler.getDisplayMessage(error);

export const isRetryableError = (error: UserError) => 
  UserErrorHandler.isRetryable(error);

export const getErrorSeverity = (error: UserError) => 
  UserErrorHandler.getErrorSeverity(error);

export const getSuggestedAction = (error: UserError) => 
  UserErrorHandler.getSuggestedAction(error);

export default UserErrorHandler;