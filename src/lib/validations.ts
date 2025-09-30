import { z } from 'zod';
import { UserRole, PropertyType, DocumentType } from '../types/models';

// Common validation patterns
const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordMinLength = 6;

// User validation schemas
export const userSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  email: z
    .string()
    .email('Formato de email inválido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  
  phone: z
    .string()
    .regex(phoneRegex, 'Formato de teléfono inválido. Use: (123) 456-7890'),
  
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Debe seleccionar un rol válido' })
  }),
  
  password: z
    .string()
    .min(passwordMinLength, `La contraseña debe tener al menos ${passwordMinLength} caracteres`)
    .max(128, 'La contraseña no puede exceder 128 caracteres'),
  
  confirmPassword: z.string(),
  
  isActive: z.boolean().default(true)
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .optional(),
  
  phone: z
    .string()
    .regex(phoneRegex, 'Formato de teléfono inválido. Use: (123) 456-7890')
    .optional(),
  
  role: z.nativeEnum(UserRole).optional(),
  
  isActive: z.boolean().optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'La contraseña actual es requerida'),
  
  newPassword: z
    .string()
    .min(passwordMinLength, `La nueva contraseña debe tener al menos ${passwordMinLength} caracteres`)
    .max(128, 'La contraseña no puede exceder 128 caracteres'),
  
  confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmNewPassword']
});

// Property validation schemas
export const propertySchema = z.object({
  address: z
    .string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(200, 'La dirección no puede exceder 200 caracteres'),
  
  type: z.nativeEnum(PropertyType, {
    errorMap: () => ({ message: 'Debe seleccionar un tipo de propiedad válido' })
  }),
  
  ownerId: z
    .string()
    .min(1, 'Debe seleccionar un propietario'),
  
  tenantId: z
    .string()
    .optional(),
  
  imageUrl: z
    .string()
    .url('La URL de la imagen debe ser válida')
    .optional()
    .or(z.literal('')),
  
  purchaseDate: z
    .string()
    .min(1, 'La fecha de compra es requerida')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  
  value: z
    .string()
    .min(1, 'El valor es requerido')
    .regex(/^\d+(\.\d{1,2})?$/, 'El valor debe ser un número válido')
    .transform((val) => parseFloat(val))
    .refine((val) => val > 0, 'El valor debe ser mayor a 0'),
  
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  
  bedrooms: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val) : undefined)
    .refine((val) => val === undefined || (val >= 0 && val <= 20), 'Número de habitaciones inválido'),
  
  bathrooms: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val) : undefined)
    .refine((val) => val === undefined || (val >= 0 && val <= 20), 'Número de baños inválido'),
  
  squareMeters: z
    .string()
    .optional()
    .transform((val) => val ? parseFloat(val) : undefined)
    .refine((val) => val === undefined || (val > 0 && val <= 10000), 'Metros cuadrados inválidos'),
  
  yearBuilt: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val) : undefined)
    .refine((val) => {
      if (val === undefined) return true;
      const currentYear = new Date().getFullYear();
      return val >= 1800 && val <= currentYear;
    }, 'Año de construcción inválido'),
  
  features: z
    .array(z.string())
    .optional()
    .default([])
});

export const updatePropertySchema = propertySchema.partial();

// Document validation schemas
export const documentSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del documento es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  
  type: z.nativeEnum(DocumentType, {
    errorMap: () => ({ message: 'Debe seleccionar un tipo de documento válido' })
  }),
  
  propertyId: z
    .string()
    .min(1, 'Debe seleccionar una propiedad'),
  
  tags: z
    .array(z.string())
    .optional()
    .default([])
});

export const updateDocumentSchema = documentSchema.partial();

// Authentication validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .email('Formato de email inválido'),
  
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Formato de email inválido')
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(passwordMinLength, `La contraseña debe tener al menos ${passwordMinLength} caracteres`)
    .max(128, 'La contraseña no puede exceder 128 caracteres'),
  
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Search and filter validation schemas
export const userFiltersSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional()
});

export const propertyFiltersSchema = z.object({
  type: z.nativeEnum(PropertyType).optional(),
  ownerId: z.string().optional(),
  tenantId: z.string().optional(),
  isActive: z.boolean().optional(),
  minValue: z.number().min(0).optional(),
  maxValue: z.number().min(0).optional(),
  search: z.string().optional()
});

export const documentFiltersSchema = z.object({
  type: z.nativeEnum(DocumentType).optional(),
  propertyId: z.string().optional(),
  ownerId: z.string().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// File upload validation schema
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'El archivo no puede exceder 10MB')
    .refine(
      (file) => [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ].includes(file.type),
      'Tipo de archivo no permitido'
    )
});

// Utility functions for validation
export const validateEmail = (email: string): boolean => {
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return phoneRegex.test(phone);
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  return phone;
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < passwordMinLength) {
    errors.push(`La contraseña debe tener al menos ${passwordMinLength} caracteres`);
  }
  
  if (password.length > 128) {
    errors.push('La contraseña no puede exceder 128 caracteres');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Currency formatting utilities
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const parseCurrency = (currencyString: string): number => {
  return parseFloat(currencyString.replace(/[^\d.-]/g, ''));
};

// Export all schemas as a single object for easier imports
export const validationSchemas = {
  user: userSchema,
  updateUser: updateUserSchema,
  changePassword: changePasswordSchema,
  property: propertySchema,
  updateProperty: updatePropertySchema,
  document: documentSchema,
  updateDocument: updateDocumentSchema,
  login: loginSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  userFilters: userFiltersSchema,
  propertyFilters: propertyFiltersSchema,
  documentFilters: documentFiltersSchema,
  fileUpload: fileUploadSchema
};

export default validationSchemas;