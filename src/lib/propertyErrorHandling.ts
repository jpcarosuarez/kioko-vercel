import { FirebaseError } from 'firebase/app';
import { toast } from 'sonner';

// Property-specific error types
export enum PropertyErrorCode {
  PROPERTY_NOT_FOUND = 'property/not-found',
  PROPERTY_ALREADY_EXISTS = 'property/already-exists',
  INVALID_OWNER = 'property/invalid-owner',
  INVALID_TENANT = 'property/invalid-tenant',
  INVALID_PROPERTY_DATA = 'property/invalid-data',
  PROPERTY_HAS_DOCUMENTS = 'property/has-documents',
  TRANSFER_FAILED = 'property/transfer-failed',
  VALIDATION_ERROR = 'property/validation-error',
  PERMISSION_DENIED = 'property/permission-denied',
  NETWORK_ERROR = 'property/network-error',
  UNKNOWN_ERROR = 'property/unknown-error'
}

// Property error messages in Spanish
const propertyErrorMessages: Record<string, string> = {
  // Firebase Auth errors
  'permission-denied': 'No tienes permisos para realizar esta acción',
  'unauthenticated': 'Debes iniciar sesión para continuar',
  'network-request-failed': 'Error de conexión. Verifica tu conexión a internet',
  'unavailable': 'El servicio no está disponible temporalmente',
  
  // Property-specific errors
  [PropertyErrorCode.PROPERTY_NOT_FOUND]: 'La propiedad no fue encontrada',
  [PropertyErrorCode.PROPERTY_ALREADY_EXISTS]: 'Ya existe una propiedad con esta dirección',
  [PropertyErrorCode.INVALID_OWNER]: 'El propietario seleccionado no es válido',
  [PropertyErrorCode.INVALID_TENANT]: 'El inquilino seleccionado no es válido',
  [PropertyErrorCode.INVALID_PROPERTY_DATA]: 'Los datos de la propiedad son inválidos',
  [PropertyErrorCode.PROPERTY_HAS_DOCUMENTS]: 'No se puede eliminar la propiedad porque tiene documentos asociados',
  [PropertyErrorCode.TRANSFER_FAILED]: 'Error al transferir la propiedad',
  [PropertyErrorCode.VALIDATION_ERROR]: 'Error de validación en los datos',
  [PropertyErrorCode.PERMISSION_DENIED]: 'No tienes permisos para realizar esta acción',
  [PropertyErrorCode.NETWORK_ERROR]: 'Error de conexión',
  [PropertyErrorCode.UNKNOWN_ERROR]: 'Ocurrió un error inesperado',
  
  // Validation errors
  'address-required': 'La dirección es requerida',
  'address-too-short': 'La dirección debe tener al menos 5 caracteres',
  'address-too-long': 'La dirección no puede exceder 200 caracteres',
  'type-required': 'El tipo de propiedad es requerido',
  'owner-required': 'Debe seleccionar un propietario',
  'image-url-invalid': 'La URL de la imagen no es válida',
  'purchase-date-required': 'La fecha de compra es requerida',
  'purchase-date-invalid': 'La fecha de compra no es válida',
  'value-required': 'El valor de la propiedad es requerido',
  'value-invalid': 'El valor debe ser un número positivo',
  'value-too-low': 'El valor debe ser mayor a 0',
  'bedrooms-invalid': 'El número de habitaciones debe ser válido',
  'bathrooms-invalid': 'El número de baños debe ser válido',
  'square-meters-invalid': 'Los metros cuadrados deben ser válidos',
  'year-built-invalid': 'El año de construcción debe ser válido',
  'year-built-too-old': 'El año de construcción debe ser posterior a 1800',
  'year-built-future': 'El año de construcción no puede ser en el futuro',
  'description-too-long': 'La descripción no puede exceder 500 caracteres',
  'features-invalid': 'Las características deben ser válidas'
};

// Property error handler class
export class PropertyErrorHandler {
  
  /**
   * Handle and format property-related errors
   */
  static handleError(error: unknown, context?: string): string {
    let errorMessage = propertyErrorMessages[PropertyErrorCode.UNKNOWN_ERROR];
    
    if (error instanceof FirebaseError) {
      errorMessage = this.handleFirebaseError(error);
    } else if (error instanceof Error) {
      errorMessage = this.handleGenericError(error);
    } else if (typeof error === 'string') {
      errorMessage = propertyErrorMessages[error] || error;
    }
    
    // Add context if provided
    if (context) {
      errorMessage = `${context}: ${errorMessage}`;
    }
    
    console.error('Property error:', error);
    return errorMessage;
  }
  
  /**
   * Handle Firebase-specific errors
   */
  private static handleFirebaseError(error: FirebaseError): string {
    const errorCode = error.code;
    
    // Map Firebase error codes to user-friendly messages
    switch (errorCode) {
      case 'permission-denied':
        return propertyErrorMessages['permission-denied'];
      case 'unauthenticated':
        return propertyErrorMessages['unauthenticated'];
      case 'network-request-failed':
        return propertyErrorMessages['network-request-failed'];
      case 'unavailable':
        return propertyErrorMessages['unavailable'];
      default:
        return propertyErrorMessages[PropertyErrorCode.UNKNOWN_ERROR];
    }
  }
  
  /**
   * Handle generic JavaScript errors
   */
  private static handleGenericError(error: Error): string {
    const message = error.message.toLowerCase();
    
    // Check for common validation errors
    if (message.includes('address')) {
      if (message.includes('required')) return propertyErrorMessages['address-required'];
      if (message.includes('short')) return propertyErrorMessages['address-too-short'];
      if (message.includes('long')) return propertyErrorMessages['address-too-long'];
    }
    
    if (message.includes('type')) {
      return propertyErrorMessages['type-required'];
    }
    
    if (message.includes('owner')) {
      if (message.includes('required')) return propertyErrorMessages['owner-required'];
      if (message.includes('invalid')) return propertyErrorMessages[PropertyErrorCode.INVALID_OWNER];
    }
    
    if (message.includes('tenant')) {
      return propertyErrorMessages[PropertyErrorCode.INVALID_TENANT];
    }
    
    if (message.includes('image') || message.includes('url')) {
      return propertyErrorMessages['image-url-invalid'];
    }
    
    if (message.includes('purchase') || message.includes('date')) {
      if (message.includes('required')) return propertyErrorMessages['purchase-date-required'];
      return propertyErrorMessages['purchase-date-invalid'];
    }
    
    if (message.includes('value')) {
      if (message.includes('required')) return propertyErrorMessages['value-required'];
      if (message.includes('positive') || message.includes('greater')) return propertyErrorMessages['value-too-low'];
      return propertyErrorMessages['value-invalid'];
    }
    
    if (message.includes('bedroom')) {
      return propertyErrorMessages['bedrooms-invalid'];
    }
    
    if (message.includes('bathroom')) {
      return propertyErrorMessages['bathrooms-invalid'];
    }
    
    if (message.includes('square') || message.includes('meter')) {
      return propertyErrorMessages['square-meters-invalid'];
    }
    
    if (message.includes('year')) {
      if (message.includes('1800')) return propertyErrorMessages['year-built-too-old'];
      if (message.includes('future')) return propertyErrorMessages['year-built-future'];
      return propertyErrorMessages['year-built-invalid'];
    }
    
    if (message.includes('description')) {
      return propertyErrorMessages['description-too-long'];
    }
    
    if (message.includes('feature')) {
      return propertyErrorMessages['features-invalid'];
    }
    
    if (message.includes('not found')) {
      return propertyErrorMessages[PropertyErrorCode.PROPERTY_NOT_FOUND];
    }
    
    if (message.includes('already exists')) {
      return propertyErrorMessages[PropertyErrorCode.PROPERTY_ALREADY_EXISTS];
    }
    
    if (message.includes('documents')) {
      return propertyErrorMessages[PropertyErrorCode.PROPERTY_HAS_DOCUMENTS];
    }
    
    if (message.includes('transfer')) {
      return propertyErrorMessages[PropertyErrorCode.TRANSFER_FAILED];
    }
    
    if (message.includes('validation')) {
      return propertyErrorMessages[PropertyErrorCode.VALIDATION_ERROR];
    }
    
    if (message.includes('permission')) {
      return propertyErrorMessages[PropertyErrorCode.PERMISSION_DENIED];
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return propertyErrorMessages[PropertyErrorCode.NETWORK_ERROR];
    }
    
    // Return the original error message if no specific mapping found
    return error.message || propertyErrorMessages[PropertyErrorCode.UNKNOWN_ERROR];
  }
  
  /**
   * Show error toast notification
   */
  static showErrorToast(error: unknown, context?: string): void {
    const errorMessage = this.handleError(error, context);
    toast.error(errorMessage);
  }
  
  /**
   * Show success toast notification
   */
  static showSuccessToast(message: string): void {
    toast.success(message);
  }
  
  /**
   * Show warning toast notification
   */
  static showWarningToast(message: string): void {
    toast.warning(message);
  }
  
  /**
   * Show info toast notification
   */
  static showInfoToast(message: string): void {
    toast.info(message);
  }
  
  /**
   * Validate property form data and return formatted errors
   */
  static validatePropertyData(data: any): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    
    // Address validation
    if (!data.address || typeof data.address !== 'string') {
      errors.address = propertyErrorMessages['address-required'];
    } else if (data.address.trim().length < 5) {
      errors.address = propertyErrorMessages['address-too-short'];
    } else if (data.address.length > 200) {
      errors.address = propertyErrorMessages['address-too-long'];
    }
    
    // Type validation
    if (!data.type) {
      errors.type = propertyErrorMessages['type-required'];
    }
    
    // Owner validation
    if (!data.ownerId) {
      errors.ownerId = propertyErrorMessages['owner-required'];
    }
    
    // Image URL validation
    if (data.imageUrl && !this.isValidUrl(data.imageUrl)) {
      errors.imageUrl = propertyErrorMessages['image-url-invalid'];
    }
    
    // Purchase date validation
    if (!data.purchaseDate) {
      errors.purchaseDate = propertyErrorMessages['purchase-date-required'];
    } else if (!this.isValidDate(data.purchaseDate)) {
      errors.purchaseDate = propertyErrorMessages['purchase-date-invalid'];
    }
    
    // Value validation
    if (!data.value && data.value !== 0) {
      errors.value = propertyErrorMessages['value-required'];
    } else if (typeof data.value !== 'number' || data.value <= 0) {
      errors.value = propertyErrorMessages['value-too-low'];
    }
    
    // Optional field validations
    if (data.bedrooms !== undefined && (typeof data.bedrooms !== 'number' || data.bedrooms < 0)) {
      errors.bedrooms = propertyErrorMessages['bedrooms-invalid'];
    }
    
    if (data.bathrooms !== undefined && (typeof data.bathrooms !== 'number' || data.bathrooms < 0)) {
      errors.bathrooms = propertyErrorMessages['bathrooms-invalid'];
    }
    
    if (data.squareMeters !== undefined && (typeof data.squareMeters !== 'number' || data.squareMeters <= 0)) {
      errors.squareMeters = propertyErrorMessages['square-meters-invalid'];
    }
    
    if (data.yearBuilt !== undefined) {
      const currentYear = new Date().getFullYear();
      if (typeof data.yearBuilt !== 'number' || data.yearBuilt < 1800) {
        errors.yearBuilt = propertyErrorMessages['year-built-too-old'];
      } else if (data.yearBuilt > currentYear) {
        errors.yearBuilt = propertyErrorMessages['year-built-future'];
      }
    }
    
    if (data.description && data.description.length > 500) {
      errors.description = propertyErrorMessages['description-too-long'];
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
  
  /**
   * Check if a string is a valid URL
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Check if a string is a valid date
   */
  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}

// Export convenience functions
export const handlePropertyError = PropertyErrorHandler.handleError.bind(PropertyErrorHandler);
export const showPropertyErrorToast = PropertyErrorHandler.showErrorToast.bind(PropertyErrorHandler);
export const showPropertySuccessToast = PropertyErrorHandler.showSuccessToast.bind(PropertyErrorHandler);
export const showPropertyWarningToast = PropertyErrorHandler.showWarningToast.bind(PropertyErrorHandler);
export const showPropertyInfoToast = PropertyErrorHandler.showInfoToast.bind(PropertyErrorHandler);
export const validatePropertyData = PropertyErrorHandler.validatePropertyData.bind(PropertyErrorHandler);

export default PropertyErrorHandler;