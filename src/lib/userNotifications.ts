import { toast } from 'sonner';
import { UserError } from './userErrorHandling';

export interface NotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class UserNotificationService {
  /**
   * Show success notification
   */
  static success(message: string, options?: NotificationOptions): void {
    toast.success(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      dismissible: options?.dismissible !== false,
      action: options?.action
    });
  }

  /**
   * Show error notification
   */
  static error(message: string, options?: NotificationOptions): void {
    toast.error(message, {
      duration: options?.duration || 6000,
      position: options?.position || 'top-right',
      dismissible: options?.dismissible !== false,
      action: options?.action
    });
  }

  /**
   * Show warning notification
   */
  static warning(message: string, options?: NotificationOptions): void {
    toast.warning(message, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
      dismissible: options?.dismissible !== false,
      action: options?.action
    });
  }

  /**
   * Show info notification
   */
  static info(message: string, options?: NotificationOptions): void {
    toast.info(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      dismissible: options?.dismissible !== false,
      action: options?.action
    });
  }

  /**
   * Show loading notification
   */
  static loading(message: string): string | number {
    return toast.loading(message, {
      position: 'top-right'
    });
  }

  /**
   * Dismiss a specific notification
   */
  static dismiss(toastId: string | number): void {
    toast.dismiss(toastId);
  }

  /**
   * Dismiss all notifications
   */
  static dismissAll(): void {
    toast.dismiss();
  }

  /**
   * Show user operation success messages
   */
  static userCreated(userName: string): void {
    this.success(`Usuario "${userName}" creado exitosamente`, {
      action: {
        label: 'Ver lista',
        onClick: () => {
          // This would navigate to user list
          console.log('Navigate to user list');
        }
      }
    });
  }

  static userUpdated(userName: string): void {
    this.success(`Usuario "${userName}" actualizado exitosamente`);
  }

  static userDeleted(userName: string): void {
    this.success(`Usuario "${userName}" eliminado exitosamente`);
  }

  static userActivated(userName: string): void {
    this.success(`Usuario "${userName}" activado exitosamente`);
  }

  static userDeactivated(userName: string): void {
    this.warning(`Usuario "${userName}" desactivado`);
  }

  static passwordChanged(userName: string): void {
    this.success(`Contraseña de "${userName}" cambiada exitosamente`);
  }

  /**
   * Show user operation error messages
   */
  static userCreationFailed(error: UserError): void {
    const message = error.field 
      ? `Error al crear usuario: ${error.message}`
      : `No se pudo crear el usuario: ${error.message}`;
    
    this.error(message, {
      action: {
        label: 'Reintentar',
        onClick: () => {
          console.log('Retry user creation');
        }
      }
    });
  }

  static userUpdateFailed(userName: string, error: UserError): void {
    this.error(`No se pudo actualizar "${userName}": ${error.message}`);
  }

  static userDeletionFailed(userName: string, error: UserError): void {
    this.error(`No se pudo eliminar "${userName}": ${error.message}`);
  }

  static passwordChangeFailed(error: UserError): void {
    this.error(`No se pudo cambiar la contraseña: ${error.message}`);
  }

  static permissionDenied(operation: string): void {
    this.error(`No tiene permisos para ${operation}`, {
      action: {
        label: 'Contactar Admin',
        onClick: () => {
          console.log('Contact admin');
        }
      }
    });
  }

  /**
   * Show validation error messages
   */
  static validationError(message: string): void {
    this.warning(`Error de validación: ${message}`);
  }

  static emailAlreadyExists(): void {
    this.error('Ya existe un usuario con este email', {
      action: {
        label: 'Usar otro email',
        onClick: () => {
          console.log('Focus email field');
        }
      }
    });
  }

  /**
   * Show network error messages
   */
  static networkError(): void {
    this.error('Error de conexión. Verifique su conexión a internet', {
      action: {
        label: 'Reintentar',
        onClick: () => {
          window.location.reload();
        }
      }
    });
  }

  /**
   * Show loading states for user operations
   */
  static creatingUser(): string | number {
    return this.loading('Creando usuario...');
  }

  static updatingUser(): string | number {
    return this.loading('Actualizando usuario...');
  }

  static deletingUser(): string | number {
    return this.loading('Eliminando usuario...');
  }

  static changingPassword(): string | number {
    return this.loading('Cambiando contraseña...');
  }

  static loadingUsers(): string | number {
    return this.loading('Cargando usuarios...');
  }

  /**
   * Show confirmation messages
   */
  static confirmUserDeletion(userName: string, onConfirm: () => void): void {
    toast.warning(`¿Eliminar usuario "${userName}"?`, {
      duration: 10000,
      action: {
        label: 'Confirmar',
        onClick: onConfirm
      }
    });
  }

  /**
   * Show bulk operation messages
   */
  static bulkOperationSuccess(operation: string, count: number): void {
    this.success(`${operation} completado para ${count} usuario${count > 1 ? 's' : ''}`);
  }

  static bulkOperationFailed(operation: string, failedCount: number, totalCount: number): void {
    this.error(`${operation} falló para ${failedCount} de ${totalCount} usuarios`);
  }

  /**
   * Show system messages
   */
  static systemMaintenance(): void {
    this.warning('El sistema está en mantenimiento. Algunas funciones pueden no estar disponibles', {
      duration: 10000
    });
  }

  static sessionExpired(): void {
    this.error('Su sesión ha expirado. Por favor, inicie sesión nuevamente', {
      action: {
        label: 'Iniciar Sesión',
        onClick: () => {
          window.location.href = '/login';
        }
      }
    });
  }

  /**
   * Show feature-specific messages
   */
  static emailVerificationSent(email: string): void {
    this.info(`Se ha enviado un email de verificación a ${email}`);
  }

  static passwordResetSent(email: string): void {
    this.info(`Se ha enviado un enlace de recuperación a ${email}`);
  }

  static roleChanged(userName: string, newRole: string): void {
    this.info(`El rol de "${userName}" ha sido cambiado a ${newRole}`);
  }
}

// Export convenience functions
export const showSuccess = (message: string, options?: NotificationOptions) => 
  UserNotificationService.success(message, options);

export const showError = (message: string, options?: NotificationOptions) => 
  UserNotificationService.error(message, options);

export const showWarning = (message: string, options?: NotificationOptions) => 
  UserNotificationService.warning(message, options);

export const showInfo = (message: string, options?: NotificationOptions) => 
  UserNotificationService.info(message, options);

export const showLoading = (message: string) => 
  UserNotificationService.loading(message);

export const dismissNotification = (toastId: string | number) => 
  UserNotificationService.dismiss(toastId);

export const dismissAllNotifications = () => 
  UserNotificationService.dismissAll();

// User-specific notifications
export const notifyUserCreated = (userName: string) => 
  UserNotificationService.userCreated(userName);

export const notifyUserUpdated = (userName: string) => 
  UserNotificationService.userUpdated(userName);

export const notifyUserDeleted = (userName: string) => 
  UserNotificationService.userDeleted(userName);

export const notifyUserActivated = (userName: string) => 
  UserNotificationService.userActivated(userName);

export const notifyUserDeactivated = (userName: string) => 
  UserNotificationService.userDeactivated(userName);

export const notifyPasswordChanged = (userName: string) => 
  UserNotificationService.passwordChanged(userName);

export const notifyPermissionDenied = (operation: string) => 
  UserNotificationService.permissionDenied(operation);

export const notifyNetworkError = () => 
  UserNotificationService.networkError();

export default UserNotificationService;