import { CreateUserData, UpdateUserData, UserRole } from '../types/models';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface UserValidationRules {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  email: {
    required: boolean;
    pattern: RegExp;
  };
  phone: {
    required: boolean;
    pattern: RegExp;
  };
  password: {
    required: boolean;
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  role: {
    required: boolean;
    allowedRoles: UserRole[];
  };
}

// Default validation rules
export const defaultValidationRules: UserValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    required: true,
    pattern: /^\+?[\d\s\-\(\)]{8,20}$/
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 128,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false
  },
  role: {
    required: true,
    allowedRoles: [UserRole.ADMIN, UserRole.OWNER, UserRole.TENANT]
  }
};

export class UserValidator {
  private rules: UserValidationRules;

  constructor(rules: UserValidationRules = defaultValidationRules) {
    this.rules = rules;
  }

  /**
   * Validate user creation data
   */
  validateCreateUser(data: CreateUserData): ValidationResult {
    const errors: Record<string, string> = {};

    // Validate name
    const nameValidation = this.validateName(data.name);
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error;
    }

    // Validate email
    const emailValidation = this.validateEmail(data.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }

    // Validate phone (if provided)
    if (data.phone) {
      const phoneValidation = this.validatePhone(data.phone);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.error;
      }
    } else if (this.rules.phone.required) {
      errors.phone = 'El teléfono es requerido';
    }

    // Validate password
    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.error;
    }

    // Validate role
    const roleValidation = this.validateRole(data.role);
    if (!roleValidation.isValid) {
      errors.role = roleValidation.error;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate user update data
   */
  validateUpdateUser(data: UpdateUserData): ValidationResult {
    const errors: Record<string, string> = {};

    // Validate name (if provided)
    if (data.name !== undefined) {
      const nameValidation = this.validateName(data.name);
      if (!nameValidation.isValid) {
        errors.name = nameValidation.error;
      }
    }

    // Validate phone (if provided)
    if (data.phone !== undefined && data.phone.trim() !== '') {
      const phoneValidation = this.validatePhone(data.phone);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.error;
      }
    }

    // Validate role (if provided)
    if (data.role !== undefined) {
      const roleValidation = this.validateRole(data.role);
      if (!roleValidation.isValid) {
        errors.role = roleValidation.error;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate password change
   */
  validatePasswordChange(newPassword: string, confirmPassword: string): ValidationResult {
    const errors: Record<string, string> = {};

    // Validate new password
    const passwordValidation = this.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.error;
    }

    // Validate password confirmation
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirme la nueva contraseña';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate name field
   */
  private validateName(name: string): { isValid: boolean; error: string } {
    if (this.rules.name.required && (!name || name.trim().length === 0)) {
      return { isValid: false, error: 'El nombre es requerido' };
    }

    if (name && name.trim().length < this.rules.name.minLength) {
      return { 
        isValid: false, 
        error: `El nombre debe tener al menos ${this.rules.name.minLength} caracteres` 
      };
    }

    if (name && name.trim().length > this.rules.name.maxLength) {
      return { 
        isValid: false, 
        error: `El nombre no puede tener más de ${this.rules.name.maxLength} caracteres` 
      };
    }

    // Check for invalid characters
    if (name && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim())) {
      return { isValid: false, error: 'El nombre solo puede contener letras y espacios' };
    }

    return { isValid: true, error: '' };
  }

  /**
   * Validate email field
   */
  private validateEmail(email: string): { isValid: boolean; error: string } {
    if (this.rules.email.required && (!email || email.trim().length === 0)) {
      return { isValid: false, error: 'El email es requerido' };
    }

    if (email && !this.rules.email.pattern.test(email.trim())) {
      return { isValid: false, error: 'Formato de email inválido' };
    }

    // Additional email validation
    if (email && email.trim().length > 254) {
      return { isValid: false, error: 'El email es demasiado largo' };
    }

    return { isValid: true, error: '' };
  }

  /**
   * Validate phone field
   */
  private validatePhone(phone: string): { isValid: boolean; error: string } {
    if (this.rules.phone.required && (!phone || phone.trim().length === 0)) {
      return { isValid: false, error: 'El teléfono es requerido' };
    }

    if (phone && !this.rules.phone.pattern.test(phone.trim())) {
      return { isValid: false, error: 'Formato de teléfono inválido' };
    }

    return { isValid: true, error: '' };
  }

  /**
   * Validate password field
   */
  private validatePassword(password: string): { isValid: boolean; error: string } {
    if (this.rules.password.required && (!password || password.length === 0)) {
      return { isValid: false, error: 'La contraseña es requerida' };
    }

    if (password && password.length < this.rules.password.minLength) {
      return { 
        isValid: false, 
        error: `La contraseña debe tener al menos ${this.rules.password.minLength} caracteres` 
      };
    }

    if (password && password.length > this.rules.password.maxLength) {
      return { 
        isValid: false, 
        error: `La contraseña no puede tener más de ${this.rules.password.maxLength} caracteres` 
      };
    }

    // Check password strength requirements
    if (password) {
      if (this.rules.password.requireUppercase && !/[A-Z]/.test(password)) {
        return { isValid: false, error: 'La contraseña debe contener al menos una letra mayúscula' };
      }

      if (this.rules.password.requireLowercase && !/[a-z]/.test(password)) {
        return { isValid: false, error: 'La contraseña debe contener al menos una letra minúscula' };
      }

      if (this.rules.password.requireNumbers && !/\d/.test(password)) {
        return { isValid: false, error: 'La contraseña debe contener al menos un número' };
      }

      if (this.rules.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, error: 'La contraseña debe contener al menos un carácter especial' };
      }
    }

    return { isValid: true, error: '' };
  }

  /**
   * Validate role field
   */
  private validateRole(role: UserRole): { isValid: boolean; error: string } {
    if (this.rules.role.required && !role) {
      return { isValid: false, error: 'El rol es requerido' };
    }

    if (role && !this.rules.role.allowedRoles.includes(role)) {
      return { isValid: false, error: 'Rol inválido' };
    }

    return { isValid: true, error: '' };
  }

  /**
   * Get password strength score (0-4)
   */
  getPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    color: 'red' | 'orange' | 'yellow' | 'green';
  } {
    if (!password) {
      return { score: 0, feedback: ['Ingrese una contraseña'], color: 'red' };
    }

    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 8) {
      score++;
    } else {
      feedback.push('Use al menos 8 caracteres');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('Incluya letras mayúsculas');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push('Incluya letras minúsculas');
    }

    // Number check
    if (/\d/.test(password)) {
      score++;
    } else {
      feedback.push('Incluya números');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score++;
    } else {
      feedback.push('Incluya caracteres especiales');
    }

    // Determine color based on score
    let color: 'red' | 'orange' | 'yellow' | 'green' = 'red';
    if (score >= 4) color = 'green';
    else if (score >= 3) color = 'yellow';
    else if (score >= 2) color = 'orange';

    return { score: Math.min(score, 4), feedback, color };
  }

  /**
   * Validate email uniqueness (async)
   */
  async validateEmailUniqueness(
    email: string, 
    currentUserId?: string,
    checkFunction?: (email: string) => Promise<boolean>
  ): Promise<{ isValid: boolean; error: string }> {
    if (!checkFunction) {
      return { isValid: true, error: '' };
    }

    try {
      const exists = await checkFunction(email);
      if (exists) {
        return { isValid: false, error: 'Ya existe un usuario con este email' };
      }
      return { isValid: true, error: '' };
    } catch (error) {
      console.error('Error checking email uniqueness:', error);
      return { isValid: false, error: 'Error al verificar la unicidad del email' };
    }
  }
}

// Export default validator instance
export const userValidator = new UserValidator();

// Export validation utilities
export const validateUserCreate = (data: CreateUserData) => userValidator.validateCreateUser(data);
export const validateUserUpdate = (data: UpdateUserData) => userValidator.validateUpdateUser(data);
export const validatePasswordChange = (newPassword: string, confirmPassword: string) => 
  userValidator.validatePasswordChange(newPassword, confirmPassword);
export const getPasswordStrength = (password: string) => userValidator.getPasswordStrength(password);

export default UserValidator;