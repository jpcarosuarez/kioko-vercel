import { toast } from 'sonner';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Notification options
interface NotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

// Base notification function
const showNotification = (
  type: NotificationType,
  message: string,
  description?: string,
  options: NotificationOptions = {}
) => {
  const {
    duration = 4000,
    dismissible = true,
    action,
    cancel,
    onDismiss,
    onAutoClose
  } = options;

  const toastOptions = {
    duration,
    dismissible,
    onDismiss,
    onAutoClose,
    action: action ? {
      label: action.label,
      onClick: action.onClick
    } : undefined,
    cancel: cancel ? {
      label: cancel.label,
      onClick: cancel.onClick
    } : undefined
  };

  switch (type) {
    case 'success':
      return toast.success(message, {
        description,
        ...toastOptions
      });
    case 'error':
      return toast.error(message, {
        description,
        ...toastOptions
      });
    case 'warning':
      return toast.warning(message, {
        description,
        ...toastOptions
      });
    case 'info':
      return toast.info(message, {
        description,
        ...toastOptions
      });
    default:
      return toast(message, {
        description,
        ...toastOptions
      });
  }
};

// Success notifications
export const showSuccess = (message: string, description?: string, options?: NotificationOptions) => {
  return showNotification('success', message, description, options);
};

// Error notifications
export const showError = (message: string, description?: string, options?: NotificationOptions) => {
  return showNotification('error', message, description, {
    duration: 6000, // Longer duration for errors
    ...options
  });
};

// Warning notifications
export const showWarning = (message: string, description?: string, options?: NotificationOptions) => {
  return showNotification('warning', message, description, options);
};

// Info notifications
export const showInfo = (message: string, description?: string, options?: NotificationOptions) => {
  return showNotification('info', message, description, options);
};

// Loading notification with promise
export const showLoading = (
  promise: Promise<any>,
  messages: {
    loading: string;
    success: string;
    error: string;
  },
  options?: NotificationOptions
) => {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    ...options
  });
};

// Specialized notifications for common use cases

// User management notifications
export const userNotifications = {
  created: (userName: string) => showSuccess(
    'Usuario creado exitosamente',
    `El usuario "${userName}" ha sido creado y puede acceder al sistema.`
  ),
  
  updated: (userName: string) => showSuccess(
    'Usuario actualizado',
    `Los datos de "${userName}" han sido actualizados correctamente.`
  ),
  
  deleted: (userName: string) => showSuccess(
    'Usuario eliminado',
    `El usuario "${userName}" ha sido eliminado del sistema.`
  ),
  
  passwordChanged: (userName: string) => showSuccess(
    'Contraseña actualizada',
    `La contraseña de "${userName}" ha sido cambiada exitosamente.`
  ),
  
  createError: (error: string) => showError(
    'Error al crear usuario',
    error,
    {
      action: {
        label: 'Reintentar',
        onClick: () => window.location.reload()
      }
    }
  ),
  
  updateError: (error: string) => showError(
    'Error al actualizar usuario',
    error
  ),
  
  deleteError: (error: string) => showError(
    'Error al eliminar usuario',
    error
  )
};

// Property management notifications
export const propertyNotifications = {
  created: (address: string) => showSuccess(
    'Propiedad creada exitosamente',
    `La propiedad en "${address}" ha sido registrada en el sistema.`
  ),
  
  updated: (address: string) => showSuccess(
    'Propiedad actualizada',
    `Los datos de la propiedad en "${address}" han sido actualizados.`
  ),
  
  deleted: (address: string) => showSuccess(
    'Propiedad eliminada',
    `La propiedad en "${address}" y todos sus documentos han sido eliminados.`
  ),
  
  ownershipTransferred: (address: string, newOwner: string) => showSuccess(
    'Propiedad transferida',
    `La propiedad en "${address}" ha sido transferida a "${newOwner}".`
  ),
  
  createError: (error: string) => showError(
    'Error al crear propiedad',
    error
  ),
  
  updateError: (error: string) => showError(
    'Error al actualizar propiedad',
    error
  ),
  
  deleteError: (error: string) => showError(
    'Error al eliminar propiedad',
    error
  ),
  
  transferError: (error: string) => showError(
    'Error al transferir propiedad',
    error
  )
};

// Document management notifications
export const documentNotifications = {
  uploaded: (fileName: string) => showSuccess(
    'Documento subido exitosamente',
    `El archivo "${fileName}" ha sido guardado en Firebase Storage.`
  ),
  
  updated: (fileName: string) => showSuccess(
    'Documento actualizado',
    `Los datos del documento "${fileName}" han sido actualizados.`
  ),
  
  deleted: (fileName: string) => showSuccess(
    'Documento eliminado',
    `El archivo "${fileName}" ha sido eliminado de Firebase Storage.`
  ),
  
  uploadError: (fileName: string, error: string) => showError(
    'Error al subir documento',
    `No se pudo subir "${fileName}": ${error}`,
    {
      action: {
        label: 'Reintentar',
        onClick: () => window.location.reload()
      }
    }
  ),
  
  updateError: (error: string) => showError(
    'Error al actualizar documento',
    error
  ),
  
  deleteError: (error: string) => showError(
    'Error al eliminar documento',
    error
  ),
  
  downloadError: (fileName: string) => showError(
    'Error al descargar documento',
    `No se pudo descargar "${fileName}". Verifica tu conexión e inténtalo de nuevo.`
  )
};

// Authentication notifications
export const authNotifications = {
  loginSuccess: (userName: string) => showSuccess(
    'Bienvenido',
    `Has iniciado sesión como ${userName}.`
  ),
  
  logoutSuccess: () => showInfo(
    'Sesión cerrada',
    'Has cerrado sesión exitosamente.'
  ),
  
  loginError: (error: string) => showError(
    'Error de autenticación',
    error
  ),
  
  sessionExpired: () => showWarning(
    'Sesión expirada',
    'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    {
      duration: 8000,
      action: {
        label: 'Iniciar sesión',
        onClick: () => window.location.href = '/login'
      }
    }
  ),
  
  passwordResetSent: (email: string) => showInfo(
    'Email enviado',
    `Se ha enviado un enlace de recuperación a ${email}.`
  ),
  
  passwordResetError: (error: string) => showError(
    'Error al enviar email',
    error
  )
};

// System notifications
export const systemNotifications = {
  connectionLost: () => showWarning(
    'Conexión perdida',
    'Se ha perdido la conexión a internet. Algunos datos pueden no estar actualizados.',
    {
      duration: 0, // Don't auto-dismiss
      action: {
        label: 'Reintentar',
        onClick: () => window.location.reload()
      }
    }
  ),
  
  connectionRestored: () => showSuccess(
    'Conexión restaurada',
    'La conexión a internet ha sido restaurada.'
  ),
  
  maintenanceMode: () => showInfo(
    'Mantenimiento programado',
    'El sistema estará en mantenimiento en 10 minutos. Guarda tu trabajo.',
    {
      duration: 0,
      action: {
        label: 'Entendido',
        onClick: () => {}
      }
    }
  ),
  
  updateAvailable: () => showInfo(
    'Actualización disponible',
    'Hay una nueva versión disponible. Recarga la página para actualizar.',
    {
      duration: 0,
      action: {
        label: 'Actualizar',
        onClick: () => window.location.reload()
      },
      cancel: {
        label: 'Más tarde'
      }
    }
  )
};

// Batch operations notifications
export const batchNotifications = {
  operationStarted: (operation: string, count: number) => showInfo(
    `${operation} iniciada`,
    `Procesando ${count} elemento${count > 1 ? 's' : ''}...`
  ),
  
  operationCompleted: (operation: string, successful: number, failed: number) => {
    if (failed === 0) {
      return showSuccess(
        `${operation} completada`,
        `${successful} elemento${successful > 1 ? 's' : ''} procesado${successful > 1 ? 's' : ''} exitosamente.`
      );
    } else {
      return showWarning(
        `${operation} completada con errores`,
        `${successful} exitoso${successful > 1 ? 's' : ''}, ${failed} con errores.`
      );
    }
  }
};

// Utility functions
export const dismissAllNotifications = () => {
  toast.dismiss();
};

export const dismissNotification = (toastId: string | number) => {
  toast.dismiss(toastId);
};

// Export all notification functions
export const notifications = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  user: userNotifications,
  property: propertyNotifications,
  document: documentNotifications,
  auth: authNotifications,
  system: systemNotifications,
  batch: batchNotifications,
  dismissAll: dismissAllNotifications,
  dismiss: dismissNotification
};

export default notifications;