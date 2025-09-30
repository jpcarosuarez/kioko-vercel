/**
 * Error handlers for different entities
 */

export class PropertyErrorHandler {
  /**
   * Validate property data
   */
  static validatePropertyData(data: any): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!data.address || data.address.trim().length < 5) {
      errors.address = 'La dirección debe tener al menos 5 caracteres';
    }

    if (!data.type) {
      errors.type = 'El tipo de propiedad es requerido';
    }

    if (!data.ownerId) {
      errors.ownerId = 'Debe seleccionar un propietario';
    }

    if (!data.imageUrl || data.imageUrl.trim().length === 0) {
      errors.imageUrl = 'La URL de la imagen es requerida';
    }

    if (!data.contractStartDate) {
      errors.contractStartDate = 'La fecha de inicio de arriendo es requerida';
    }

    if (!data.rentalValue || data.rentalValue <= 0) {
      errors.rentalValue = 'El valor del arriendo debe ser mayor a 0';
    }

    // Validate square meters if provided
    if (data.squareMeters !== undefined && data.squareMeters !== null) {
      if (data.squareMeters <= 0) {
        errors.squareMeters = 'Los metros cuadrados deben ser un número positivo';
      }
    }

    // Validate bedrooms if provided
    if (data.bedrooms !== undefined && data.bedrooms !== null) {
      if (data.bedrooms < 0) {
        errors.bedrooms = 'El número de habitaciones no puede ser negativo';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Show error toast
   */
  static showErrorToast(error: any, defaultMessage: string): void {
    console.error('Property Error:', error);
    // This would typically show a toast notification
    // For now, we'll just log it
    console.error(defaultMessage);
  }
}

export class UserErrorHandler {
  static validateUserData(data: any): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'El email debe tener un formato válido';
    }

    if (!data.phone || data.phone.trim().length < 10) {
      errors.phone = 'El teléfono debe tener al menos 10 caracteres';
    }

    if (!data.role) {
      errors.role = 'El rol es requerido';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static showErrorToast(error: any, defaultMessage: string): void {
    console.error('User Error:', error);
    console.error(defaultMessage);
  }
}

export class DocumentErrorHandler {
  static validateDocumentData(data: any): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'El nombre del documento debe tener al menos 2 caracteres';
    }

    if (!data.type) {
      errors.type = 'El tipo de documento es requerido';
    }

    if (!data.propertyId) {
      errors.propertyId = 'Debe seleccionar una propiedad';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static showErrorToast(error: any, defaultMessage: string): void {
    console.error('Document Error:', error);
    console.error(defaultMessage);
  }
}
