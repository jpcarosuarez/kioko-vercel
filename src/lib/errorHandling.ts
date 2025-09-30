import { notifications } from './notifications';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

// Custom error class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;
  public readonly statusCode?: number;
  public readonly isRetryable: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    options: {
      code?: string;
      statusCode?: number;
      isRetryable?: boolean;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.isRetryable = options.isRetryable ?? false;
    this.context = options.context;

    if (options.cause) {
      this.cause = options.cause;
    }

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// Error classification functions
export function classifyError(error: any): ErrorType {
  if (error instanceof AppError) {
    return error.type;
  }

  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    return ErrorType.NETWORK;
  }

  // Firebase Auth errors
  if (error.code?.startsWith('auth/')) {
    return ErrorType.AUTHENTICATION;
  }

  // Firestore permission errors
  if (error.code === 'permission-denied') {
    return ErrorType.AUTHORIZATION;
  }

  // HTTP status code based classification
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    if (status === 401) return ErrorType.AUTHENTICATION;
    if (status === 403) return ErrorType.AUTHORIZATION;
    if (status === 404) return ErrorType.NOT_FOUND;
    if (status >= 400 && status < 500) return ErrorType.CLIENT;
    if (status >= 500) return ErrorType.SERVER;
  }

  // Validation errors
  if (error.name === 'ValidationError' || error.message?.includes('validation')) {
    return ErrorType.VALIDATION;
  }

  return ErrorType.UNKNOWN;
}

// Error message mapping
const errorMessages: Record<ErrorType, { title: string; description: string }> = {
  [ErrorType.NETWORK]: {
    title: 'Error de conexión',
    description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
  },
  [ErrorType.AUTHENTICATION]: {
    title: 'Error de autenticación',
    description: 'Credenciales inválidas o sesión expirada. Por favor, inicia sesión nuevamente.'
  },
  [ErrorType.AUTHORIZATION]: {
    title: 'Acceso denegado',
    description: 'No tienes permisos para realizar esta acción.'
  },
  [ErrorType.VALIDATION]: {
    title: 'Datos inválidos',
    description: 'Por favor, verifica que todos los campos estén completos y sean válidos.'
  },
  [ErrorType.NOT_FOUND]: {
    title: 'Recurso no encontrado',
    description: 'El elemento solicitado no existe o ha sido eliminado.'
  },
  [ErrorType.SERVER]: {
    title: 'Error del servidor',
    description: 'Se ha producido un error en el servidor. Inténtalo de nuevo más tarde.'
  },
  [ErrorType.CLIENT]: {
    title: 'Error en la solicitud',
    description: 'La solicitud no pudo ser procesada. Verifica los datos e inténtalo de nuevo.'
  },
  [ErrorType.UNKNOWN]: {
    title: 'Error inesperado',
    description: 'Se ha producido un error inesperado. Inténtalo de nuevo.'
  }
};

// Get user-friendly error message
export function getErrorMessage(error: any): { title: string; description: string } {
  const errorType = classifyError(error);
  const baseMessage = errorMessages[errorType];

  // Use custom message if available
  if (error instanceof AppError && error.message) {
    return {
      title: baseMessage.title,
      description: error.message
    };
  }

  // Firebase specific error messages
  if (error.code?.startsWith('auth/')) {
    const authMessages: Record<string, string> = {
      'auth/invalid-email': 'El formato del email es inválido.',
      'auth/user-not-found': 'No existe un usuario con este email.',
      'auth/wrong-password': 'La contraseña es incorrecta.',
      'auth/email-already-in-use': 'Ya existe un usuario con este email.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Inténtalo más tarde.',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
      'auth/invalid-credential': 'Credenciales inválidas.',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
      'auth/operation-not-allowed': 'Esta operación no está permitida.',
      'auth/requires-recent-login': 'Por seguridad, debes iniciar sesión nuevamente.'
    };

    const customMessage = authMessages[error.code];
    if (customMessage) {
      return {
        title: baseMessage.title,
        description: customMessage
      };
    }
  }

  // Firestore specific error messages
  if (error.code?.startsWith('firestore/')) {
    const firestoreMessages: Record<string, string> = {
      'firestore/permission-denied': 'No tienes permisos para acceder a este recurso.',
      'firestore/not-found': 'El documento solicitado no existe.',
      'firestore/already-exists': 'El documento ya existe.',
      'firestore/resource-exhausted': 'Se ha excedido el límite de operaciones.',
      'firestore/failed-precondition': 'La operación no se puede completar en el estado actual.',
      'firestore/aborted': 'La operación fue cancelada debido a un conflicto.',
      'firestore/out-of-range': 'Los datos están fuera del rango permitido.',
      'firestore/unimplemented': 'Esta operación no está implementada.',
      'firestore/internal': 'Error interno del servidor.',
      'firestore/unavailable': 'El servicio no está disponible temporalmente.',
      'firestore/data-loss': 'Se ha perdido información crítica.'
    };

    const customMessage = firestoreMessages[error.code];
    if (customMessage) {
      return {
        title: baseMessage.title,
        description: customMessage
      };
    }
  }

  return baseMessage;
}

// Error handler function
export function handleError(error: any, context?: Record<string, any>) {
  console.error('Error handled:', error, context);

  const errorType = classifyError(error);
  const { title, description } = getErrorMessage(error);

  // Log error to monitoring service
  logError(error, context);

  // Show appropriate notification
  const isRetryable = error instanceof AppError ? error.isRetryable : isErrorRetryable(errorType);
  
  if (isRetryable) {
    notifications.error(title, description, {
      action: {
        label: 'Reintentar',
        onClick: () => {
          if (context?.retryFunction) {
            context.retryFunction();
          } else {
            window.location.reload();
          }
        }
      }
    });
  } else {
    notifications.error(title, description);
  }

  return { type: errorType, title, description, isRetryable };
}

// Check if error is retryable
function isErrorRetryable(errorType: ErrorType): boolean {
  return [
    ErrorType.NETWORK,
    ErrorType.SERVER,
    ErrorType.UNKNOWN
  ].includes(errorType);
}

// Log error to monitoring service
function logError(error: any, context?: Record<string, any>) {
  const errorData = {
    message: error.message || 'Unknown error',
    stack: error.stack,
    type: classifyError(error),
    code: error.code,
    statusCode: error.status || error.statusCode,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: localStorage.getItem('userId') || 'anonymous',
    context
  };

  // In a real application, send this to your error tracking service
  console.log('Error logged:', errorData);
  
  // Example: Send to error tracking service
  // errorTrackingService.captureException(error, { extra: errorData });
}

// Retry mechanism
export class RetryHandler {
  private maxRetries: number;
  private retryDelay: number;
  private backoffMultiplier: number;

  constructor(maxRetries = 3, retryDelay = 1000, backoffMultiplier = 2) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    this.backoffMultiplier = backoffMultiplier;
  }

  async execute<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: any) => boolean = (error) => isErrorRetryable(classifyError(error))
  ): Promise<T> {
    let lastError: any;
    let delay = this.retryDelay;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === this.maxRetries || !shouldRetry(error)) {
          throw error;
        }

        // Show retry notification
        notifications.info(
          'Reintentando operación',
          `Intento ${attempt + 1} de ${this.maxRetries} falló. Reintentando en ${delay / 1000} segundos...`
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= this.backoffMultiplier;
      }
    }

    throw lastError;
  }
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    handleError(event.reason, { type: 'unhandledrejection' });
    event.preventDefault(); // Prevent the default browser behavior
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    handleError(event.error, { 
      type: 'global',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
}

// Error boundary helper
export function createErrorBoundaryHandler(componentName: string) {
  return (error: Error, errorInfo: any) => {
    handleError(error, {
      type: 'react-error-boundary',
      componentName,
      componentStack: errorInfo.componentStack
    });
  };
}

// Async operation wrapper with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context);
    throw error;
  }
}

// Export commonly used error instances
export const commonErrors = {
  networkError: () => new AppError(
    'No se pudo conectar con el servidor',
    ErrorType.NETWORK,
    { isRetryable: true }
  ),
  
  authenticationError: () => new AppError(
    'Debes iniciar sesión para continuar',
    ErrorType.AUTHENTICATION
  ),
  
  authorizationError: () => new AppError(
    'No tienes permisos para realizar esta acción',
    ErrorType.AUTHORIZATION
  ),
  
  validationError: (field: string) => new AppError(
    `El campo "${field}" es inválido`,
    ErrorType.VALIDATION
  ),
  
  notFoundError: (resource: string) => new AppError(
    `${resource} no encontrado`,
    ErrorType.NOT_FOUND
  )
};

export default {
  AppError,
  ErrorType,
  classifyError,
  getErrorMessage,
  handleError,
  RetryHandler,
  setupGlobalErrorHandlers,
  createErrorBoundaryHandler,
  withErrorHandling,
  commonErrors
};