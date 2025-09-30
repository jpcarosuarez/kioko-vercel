import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface SubmissionState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  submitCount: number;
}

interface UseFormSubmissionOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  resetOnSuccess?: boolean;
  maxRetries?: number;
}

export function useFormSubmission<T>(
  submitFunction: (data: T) => Promise<any>,
  options: UseFormSubmissionOptions = {}
) {
  const {
    onSuccess,
    onError,
    successMessage = 'Operación completada exitosamente',
    errorMessage = 'Ocurrió un error. Por favor, inténtalo de nuevo.',
    resetOnSuccess = false,
    maxRetries = 3
  } = options;

  const [state, setState] = useState<SubmissionState>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    submitCount: 0
  });

  const [retryCount, setRetryCount] = useState(0);

  // Submit handler
  const handleSubmit = useCallback(async (data: T, resetForm?: () => void) => {
    setState(prev => ({
      ...prev,
      isSubmitting: true,
      error: null,
      submitCount: prev.submitCount + 1
    }));

    try {
      const result = await submitFunction(data);
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: true,
        error: null
      }));

      // Reset retry count on success
      setRetryCount(0);

      // Show success message
      toast.success(successMessage);

      // Reset form if requested
      if (resetOnSuccess && resetForm) {
        resetForm();
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error(String(error));
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: false,
        error: errorInstance.message
      }));

      // Show error message
      toast.error(getErrorMessage(errorInstance));

      // Call error callback
      if (onError) {
        onError(errorInstance);
      }

      throw errorInstance;
    }
  }, [submitFunction, successMessage, resetOnSuccess, onSuccess, onError]);

  // Retry handler
  const handleRetry = useCallback(async (data: T, resetForm?: () => void) => {
    if (retryCount >= maxRetries) {
      toast.error(`Máximo número de intentos alcanzado (${maxRetries})`);
      return;
    }

    setRetryCount(prev => prev + 1);
    toast.info(`Reintentando... (${retryCount + 1}/${maxRetries})`);
    
    return handleSubmit(data, resetForm);
  }, [retryCount, maxRetries, handleSubmit]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      isSuccess: false,
      error: null,
      submitCount: 0
    });
    setRetryCount(0);
  }, []);

  // Get user-friendly error message
  const getErrorMessage = useCallback((error: Error): string => {
    // Firebase Auth errors
    if (error.message.includes('auth/')) {
      const authErrors: Record<string, string> = {
        'auth/invalid-email': 'El formato del email es inválido',
        'auth/user-not-found': 'No existe un usuario con este email',
        'auth/wrong-password': 'La contraseña es incorrecta',
        'auth/email-already-in-use': 'Ya existe un usuario con este email',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/too-many-requests': 'Demasiados intentos fallidos. Inténtalo más tarde',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
        'auth/invalid-credential': 'Credenciales inválidas'
      };

      const errorCode = error.message.match(/auth\/[\w-]+/)?.[0];
      return errorCode ? authErrors[errorCode] || errorMessage : errorMessage;
    }

    // Firestore errors
    if (error.message.includes('firestore/')) {
      const firestoreErrors: Record<string, string> = {
        'firestore/permission-denied': 'No tienes permisos para realizar esta acción',
        'firestore/not-found': 'El documento solicitado no existe',
        'firestore/already-exists': 'El documento ya existe',
        'firestore/resource-exhausted': 'Se ha excedido el límite de operaciones',
        'firestore/failed-precondition': 'La operación no se puede completar en el estado actual',
        'firestore/aborted': 'La operación fue cancelada debido a un conflicto',
        'firestore/out-of-range': 'Los datos están fuera del rango permitido',
        'firestore/unimplemented': 'Esta operación no está implementada',
        'firestore/internal': 'Error interno del servidor',
        'firestore/unavailable': 'El servicio no está disponible temporalmente',
        'firestore/data-loss': 'Se ha perdido información crítica'
      };

      const errorCode = error.message.match(/firestore\/[\w-]+/)?.[0];
      return errorCode ? firestoreErrors[errorCode] || errorMessage : errorMessage;
    }

    // Network errors
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
      return 'Error de conexión. Verifica tu internet e inténtalo de nuevo.';
    }

    // Validation errors
    if (error.message.includes('validation') || error.message.includes('required')) {
      return 'Por favor, verifica que todos los campos requeridos estén completos.';
    }

    // Generic error
    return error.message || errorMessage;
  }, [errorMessage]);

  return {
    // State
    isSubmitting: state.isSubmitting,
    isSuccess: state.isSuccess,
    error: state.error,
    submitCount: state.submitCount,
    retryCount,
    canRetry: retryCount < maxRetries,

    // Actions
    handleSubmit,
    handleRetry,
    reset,

    // Utilities
    getErrorMessage
  };
}