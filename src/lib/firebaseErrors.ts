import { FirebaseError } from 'firebase/app';

// Firebase Auth error codes
export enum AuthErrorCode {
  INVALID_EMAIL = 'auth/invalid-email',
  USER_NOT_FOUND = 'auth/user-not-found',
  WRONG_PASSWORD = 'auth/wrong-password',
  EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use',
  WEAK_PASSWORD = 'auth/weak-password',
  TOO_MANY_REQUESTS = 'auth/too-many-requests',
  USER_DISABLED = 'auth/user-disabled',
  OPERATION_NOT_ALLOWED = 'auth/operation-not-allowed',
  INVALID_CREDENTIAL = 'auth/invalid-credential',
  REQUIRES_RECENT_LOGIN = 'auth/requires-recent-login',
}

// Firestore error codes
export enum FirestoreErrorCode {
  PERMISSION_DENIED = 'permission-denied',
  NOT_FOUND = 'not-found',
  ALREADY_EXISTS = 'already-exists',
  RESOURCE_EXHAUSTED = 'resource-exhausted',
  FAILED_PRECONDITION = 'failed-precondition',
  ABORTED = 'aborted',
  OUT_OF_RANGE = 'out-of-range',
  UNIMPLEMENTED = 'unimplemented',
  INTERNAL = 'internal',
  UNAVAILABLE = 'unavailable',
  DATA_LOSS = 'data-loss',
  UNAUTHENTICATED = 'unauthenticated',
}

// User-friendly error messages in Spanish
const authErrorMessages: Record<string, string> = {
  [AuthErrorCode.INVALID_EMAIL]: 'El formato del email es inválido',
  [AuthErrorCode.USER_NOT_FOUND]: 'No existe un usuario con este email',
  [AuthErrorCode.WRONG_PASSWORD]: 'La contraseña es incorrecta',
  [AuthErrorCode.EMAIL_ALREADY_IN_USE]: 'Ya existe un usuario con este email',
  [AuthErrorCode.WEAK_PASSWORD]: 'La contraseña debe tener al menos 6 caracteres',
  [AuthErrorCode.TOO_MANY_REQUESTS]: 'Demasiados intentos fallidos. Intenta más tarde',
  [AuthErrorCode.USER_DISABLED]: 'Esta cuenta ha sido deshabilitada',
  [AuthErrorCode.OPERATION_NOT_ALLOWED]: 'Esta operación no está permitida',
  [AuthErrorCode.INVALID_CREDENTIAL]: 'Las credenciales son inválidas',
  [AuthErrorCode.REQUIRES_RECENT_LOGIN]: 'Esta operación requiere autenticación reciente',
};

const firestoreErrorMessages: Record<string, string> = {
  [FirestoreErrorCode.PERMISSION_DENIED]: 'No tienes permisos para realizar esta acción',
  [FirestoreErrorCode.NOT_FOUND]: 'El documento solicitado no existe',
  [FirestoreErrorCode.ALREADY_EXISTS]: 'El documento ya existe',
  [FirestoreErrorCode.RESOURCE_EXHAUSTED]: 'Se ha excedido el límite de recursos',
  [FirestoreErrorCode.FAILED_PRECONDITION]: 'No se cumplieron las condiciones previas',
  [FirestoreErrorCode.ABORTED]: 'La operación fue cancelada',
  [FirestoreErrorCode.OUT_OF_RANGE]: 'El valor está fuera del rango permitido',
  [FirestoreErrorCode.UNIMPLEMENTED]: 'Esta funcionalidad no está implementada',
  [FirestoreErrorCode.INTERNAL]: 'Error interno del servidor',
  [FirestoreErrorCode.UNAVAILABLE]: 'El servicio no está disponible temporalmente',
  [FirestoreErrorCode.DATA_LOSS]: 'Se perdieron datos durante la operación',
  [FirestoreErrorCode.UNAUTHENTICATED]: 'Debes iniciar sesión para realizar esta acción',
};

// Firebase error handler class
export class FirebaseErrorHandler {
  /**
   * Handle Firebase Authentication errors
   */
  static handleAuthError(error: FirebaseError): string {
    const message = authErrorMessages[error.code];
    if (message) {
      return message;
    }

    // Log unknown errors for debugging
    console.error('Unknown auth error:', error.code, error.message);
    return 'Ocurrió un error de autenticación. Intenta nuevamente.';
  }

  /**
   * Handle Firestore errors
   */
  static handleFirestoreError(error: FirebaseError): string {
    const message = firestoreErrorMessages[error.code];
    if (message) {
      return message;
    }

    // Log unknown errors for debugging
    console.error('Unknown Firestore error:', error.code, error.message);
    return 'Ocurrió un error al acceder a los datos. Intenta nuevamente.';
  }

  /**
   * Handle general Firebase errors
   */
  static handleFirebaseError(error: FirebaseError): string {
    // Try auth errors first
    if (error.code.startsWith('auth/')) {
      return this.handleAuthError(error);
    }

    // Try Firestore errors
    if (Object.values(FirestoreErrorCode).includes(error.code as FirestoreErrorCode)) {
      return this.handleFirestoreError(error);
    }

    // Generic error handling
    console.error('Unknown Firebase error:', error.code, error.message);
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }

  /**
   * Handle general errors (non-Firebase)
   */
  static handleGeneralError(error: Error): string {
    console.error('General error:', error.message);
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}

export default FirebaseErrorHandler;