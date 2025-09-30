import { toast } from 'sonner';
import { Property, User } from '@/types/models';

// Property notification messages
const propertyMessages = {
  // Success messages
  created: 'Propiedad creada exitosamente',
  updated: 'Propiedad actualizada exitosamente',
  deleted: 'Propiedad eliminada exitosamente',
  ownershipTransferred: 'Propiedad transferida exitosamente',
  
  // Loading messages
  creating: 'Creando propiedad...',
  updating: 'Actualizando propiedad...',
  deleting: 'Eliminando propiedad...',
  transferring: 'Transfiriendo propiedad...',
  loading: 'Cargando propiedades...',
  
  // Warning messages
  deleteWarning: 'Esta acción eliminará la propiedad y todos sus documentos asociados',
  transferWarning: 'Esta acción transferirá la propiedad y todos sus documentos al nuevo propietario',
  unsavedChanges: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?',
  
  // Info messages
  noProperties: 'No hay propiedades registradas',
  noResults: 'No se encontraron propiedades que coincidan con los filtros',
  documentsWillBeDeleted: 'Se eliminarán todos los documentos asociados',
  documentsWillBeTransferred: 'Se transferirán todos los documentos asociados'
};

/**
 * Property notification service
 */
export class PropertyNotificationService {
  
  /**
   * Show property creation success notification
   */
  static showPropertyCreated(property: Property): void {
    toast.success(propertyMessages.created, {
      description: `Propiedad "${property.address}" creada correctamente`,
      duration: 4000
    });
  }
  
  /**
   * Show property update success notification
   */
  static showPropertyUpdated(property: Property): void {
    toast.success(propertyMessages.updated, {
      description: `Propiedad "${property.address}" actualizada correctamente`,
      duration: 4000
    });
  }
  
  /**
   * Show property deletion success notification
   */
  static showPropertyDeleted(propertyAddress: string, documentCount: number = 0): void {
    const description = documentCount > 0 
      ? `Propiedad "${propertyAddress}" y ${documentCount} documento(s) eliminados`
      : `Propiedad "${propertyAddress}" eliminada correctamente`;
      
    toast.success(propertyMessages.deleted, {
      description,
      duration: 4000
    });
  }
  
  /**
   * Show ownership transfer success notification
   */
  static showOwnershipTransferred(
    property: Property, 
    oldOwner: User, 
    newOwner: User,
    documentCount: number = 0
  ): void {
    const description = documentCount > 0
      ? `Propiedad "${property.address}" y ${documentCount} documento(s) transferidos de ${oldOwner.name} a ${newOwner.name}`
      : `Propiedad "${property.address}" transferida de ${oldOwner.name} a ${newOwner.name}`;
      
    toast.success(propertyMessages.ownershipTransferred, {
      description,
      duration: 5000
    });
  }
  
  /**
   * Show property creation loading notification
   */
  static showPropertyCreating(): string {
    return toast.loading(propertyMessages.creating);
  }
  
  /**
   * Show property update loading notification
   */
  static showPropertyUpdating(): string {
    return toast.loading(propertyMessages.updating);
  }
  
  /**
   * Show property deletion loading notification
   */
  static showPropertyDeleting(): string {
    return toast.loading(propertyMessages.deleting);
  }
  
  /**
   * Show ownership transfer loading notification
   */
  static showOwnershipTransferring(): string {
    return toast.loading(propertyMessages.transferring);
  }
  
  /**
   * Show properties loading notification
   */
  static showPropertiesLoading(): string {
    return toast.loading(propertyMessages.loading);
  }
  
  /**
   * Show property deletion warning
   */
  static showDeleteWarning(property: Property, documentCount: number = 0): void {
    const description = documentCount > 0
      ? `${propertyMessages.deleteWarning}. Se eliminarán ${documentCount} documento(s) asociados.`
      : propertyMessages.deleteWarning;
      
    toast.warning(`¿Eliminar "${property.address}"?`, {
      description,
      duration: 6000
    });
  }
  
  /**
   * Show ownership transfer warning
   */
  static showTransferWarning(
    property: Property, 
    newOwner: User,
    documentCount: number = 0
  ): void {
    const description = documentCount > 0
      ? `${propertyMessages.transferWarning}. Se transferirán ${documentCount} documento(s) asociados.`
      : propertyMessages.transferWarning;
      
    toast.warning(`¿Transferir "${property.address}" a ${newOwner.name}?`, {
      description,
      duration: 6000
    });
  }
  
  /**
   * Show unsaved changes warning
   */
  static showUnsavedChangesWarning(): void {
    toast.warning(propertyMessages.unsavedChanges, {
      duration: 5000
    });
  }
  
  /**
   * Show no properties info message
   */
  static showNoProperties(): void {
    toast.info(propertyMessages.noProperties, {
      description: 'Crea tu primera propiedad para comenzar',
      duration: 4000
    });
  }
  
  /**
   * Show no search results info message
   */
  static showNoSearchResults(): void {
    toast.info(propertyMessages.noResults, {
      description: 'Intenta ajustar los filtros de búsqueda',
      duration: 4000
    });
  }
  
  /**
   * Show property validation error
   */
  static showValidationError(errors: Record<string, string>): void {
    const errorCount = Object.keys(errors).length;
    const firstError = Object.values(errors)[0];
    
    toast.error('Error de validación', {
      description: errorCount === 1 
        ? firstError 
        : `${errorCount} errores encontrados. Revisa el formulario.`,
      duration: 5000
    });
  }
  
  /**
   * Show property form error
   */
  static showFormError(error: string): void {
    toast.error('Error en el formulario', {
      description: error,
      duration: 5000
    });
  }
  
  /**
   * Show property operation error
   */
  static showOperationError(operation: string, error: string): void {
    toast.error(`Error al ${operation}`, {
      description: error,
      duration: 5000
    });
  }
  
  /**
   * Show property permission error
   */
  static showPermissionError(): void {
    toast.error('Sin permisos', {
      description: 'No tienes permisos para realizar esta acción',
      duration: 5000
    });
  }
  
  /**
   * Show network error
   */
  static showNetworkError(): void {
    toast.error('Error de conexión', {
      description: 'Verifica tu conexión a internet e intenta nuevamente',
      duration: 5000
    });
  }
  
  /**
   * Dismiss a specific toast notification
   */
  static dismiss(toastId: string): void {
    toast.dismiss(toastId);
  }
  
  /**
   * Dismiss all toast notifications
   */
  static dismissAll(): void {
    toast.dismiss();
  }
  
  /**
   * Update a loading toast with success message
   */
  static updateToastSuccess(toastId: string, message: string, description?: string): void {
    toast.success(message, {
      id: toastId,
      description,
      duration: 4000
    });
  }
  
  /**
   * Update a loading toast with error message
   */
  static updateToastError(toastId: string, message: string, description?: string): void {
    toast.error(message, {
      id: toastId,
      description,
      duration: 5000
    });
  }
  
  /**
   * Show property statistics update
   */
  static showStatsUpdate(stats: {
    total: number;
    active: number;
    residential: number;
    commercial: number;
  }): void {
    toast.info('Estadísticas actualizadas', {
      description: `${stats.total} propiedades totales, ${stats.active} activas`,
      duration: 3000
    });
  }
  
  /**
   * Show bulk operation result
   */
  static showBulkOperationResult(
    operation: 'delete' | 'update' | 'transfer',
    successCount: number,
    errorCount: number
  ): void {
    const operationText = {
      delete: 'eliminadas',
      update: 'actualizadas',
      transfer: 'transferidas'
    }[operation];
    
    if (errorCount === 0) {
      toast.success(`Operación completada`, {
        description: `${successCount} propiedades ${operationText} exitosamente`,
        duration: 4000
      });
    } else if (successCount === 0) {
      toast.error(`Error en la operación`, {
        description: `No se pudieron ${operation === 'delete' ? 'eliminar' : operation === 'update' ? 'actualizar' : 'transferir'} las propiedades`,
        duration: 5000
      });
    } else {
      toast.warning(`Operación parcialmente completada`, {
        description: `${successCount} propiedades ${operationText}, ${errorCount} con errores`,
        duration: 5000
      });
    }
  }
}

// Export convenience functions
export const showPropertyCreated = PropertyNotificationService.showPropertyCreated.bind(PropertyNotificationService);
export const showPropertyUpdated = PropertyNotificationService.showPropertyUpdated.bind(PropertyNotificationService);
export const showPropertyDeleted = PropertyNotificationService.showPropertyDeleted.bind(PropertyNotificationService);
export const showOwnershipTransferred = PropertyNotificationService.showOwnershipTransferred.bind(PropertyNotificationService);
export const showPropertyCreating = PropertyNotificationService.showPropertyCreating.bind(PropertyNotificationService);
export const showPropertyUpdating = PropertyNotificationService.showPropertyUpdating.bind(PropertyNotificationService);
export const showPropertyDeleting = PropertyNotificationService.showPropertyDeleting.bind(PropertyNotificationService);
export const showOwnershipTransferring = PropertyNotificationService.showOwnershipTransferring.bind(PropertyNotificationService);
export const showDeleteWarning = PropertyNotificationService.showDeleteWarning.bind(PropertyNotificationService);
export const showTransferWarning = PropertyNotificationService.showTransferWarning.bind(PropertyNotificationService);
export const showValidationError = PropertyNotificationService.showValidationError.bind(PropertyNotificationService);
export const showOperationError = PropertyNotificationService.showOperationError.bind(PropertyNotificationService);

// Additional convenience functions for consistency with other notification files
export const notifyPropertyCreated = (propertyAddress: string) => {
  toast.success(propertyMessages.created, {
    description: `Propiedad "${propertyAddress}" creada correctamente`,
    duration: 4000
  });
};

export const notifyPropertyUpdated = (propertyAddress: string) => {
  toast.success(propertyMessages.updated, {
    description: `Propiedad "${propertyAddress}" actualizada correctamente`,
    duration: 4000
  });
};

export const notifyPropertyDeleted = (propertyAddress: string) => {
  toast.success(propertyMessages.deleted, {
    description: `Propiedad "${propertyAddress}" eliminada correctamente`,
    duration: 4000
  });
};

export const showError = (error: string) => {
  toast.error('Error', {
    description: error,
    duration: 5000
  });
};

export default PropertyNotificationService;