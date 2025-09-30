import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  FormInputField,
  FormSelectField,
  FormSwitchField,
  FormSection,
  FormActions
} from '../forms/FormField';
import { User, CreateUserData, UpdateUserData, UserRole } from '../../types/models';
import { UserManagementService } from '../../lib/userManagement';
import { validateUserCreate, validateUserUpdate, getPasswordStrength } from '../../lib/userValidation';
import { UserErrorHandler } from '../../lib/userErrorHandling';
import { Eye, EyeOff, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

interface UserFormProps {
  user?: User | null;
  onSubmit: (userData: CreateUserData | UpdateUserData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const roleOptions = [
  { value: UserRole.ADMIN, label: 'Administrador' },
  { value: UserRole.OWNER, label: 'Propietario' },
  { value: UserRole.TENANT, label: 'Inquilino' }
];

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  isLoading = false,
  mode
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    role: UserRole.TENANT,
    password: '',
    confirmPassword: '',
    isActive: true
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
    color: 'red' | 'orange' | 'yellow' | 'green';
  }>({ score: 0, feedback: [], color: 'red' });

  // Initialize form data when user prop changes
  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        password: '',
        confirmPassword: '',
        isActive: user.isActive
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: UserRole.TENANT,
        password: '',
        confirmPassword: '',
        isActive: true
      });
    }
  }, [user, mode]);

  const validateForm = (): boolean => {
    try {
      if (mode === 'create') {
        const validation = validateUserCreate({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          password: formData.password,
          isActive: formData.isActive
        });

        if (!validation.isValid) {
          setErrors(validation.errors);
          return false;
        }

        // Additional password confirmation check
        if (formData.password !== formData.confirmPassword) {
          setErrors(prev => ({
            ...prev,
            confirmPassword: 'Las contraseñas no coinciden'
          }));
          return false;
        }
      } else {
        const validation = validateUserUpdate({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          isActive: formData.isActive
        });

        if (!validation.isValid) {
          setErrors(validation.errors);
          return false;
        }

        // Validate password if provided
        if (formData.password) {
          if (formData.password !== formData.confirmPassword) {
            setErrors(prev => ({
              ...prev,
              confirmPassword: 'Las contraseñas no coinciden'
            }));
            return false;
          }
        }
      }

      setErrors({});
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      setErrors({ general: 'Error de validación' });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setErrors({});

      if (mode === 'create') {
        const createData: CreateUserData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          password: formData.password,
          isActive: formData.isActive
        };

        await onSubmit(createData);
      } else {
        const updateData: UpdateUserData = {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          isActive: formData.isActive
        };

        // Only include email if it changed
        if (user && formData.email.trim() !== user.email) {
          // Note: Email updates require special handling in Firebase Auth
          console.warn('Email updates require additional Firebase Auth handling');
        }

        await onSubmit(updateData);
      }
    } catch (error: any) {
      setErrors({
        general: error.message || 'Error al procesar el formulario'
      });
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update password strength when password changes
    if (field === 'password' && typeof value === 'string') {
      const strength = getPasswordStrength(value);
      setPasswordStrength(strength);
    }

    // Clear field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          {mode === 'create' ? 'Crear Usuario' : 'Editar Usuario'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <FormSection
            title="Información Personal"
            description="Datos básicos del usuario"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInputField
                label="Nombre Completo"
                name="name"
                value={formData.name}
                onChange={(value) => handleInputChange('name', value)}
                error={errors.name}
                required
                placeholder="Ingrese el nombre completo"
                disabled={isLoading}
              />

              <FormInputField
                label="Teléfono"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(value) => handleInputChange('phone', value)}
                error={errors.phone}
                placeholder="Ingrese el teléfono"
                disabled={isLoading}
              />
            </div>

            <FormInputField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(value) => handleInputChange('email', value)}
              error={errors.email}
              required
              placeholder="Ingrese el email"
              disabled={isLoading || mode === 'edit'} // Disable email editing for now
              description={mode === 'edit' ? 'El email no se puede modificar una vez creado el usuario' : undefined}
            />
          </FormSection>

          <FormSection
            title="Configuración de Acceso"
            description="Rol y credenciales del usuario"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelectField
                label="Rol"
                name="role"
                value={formData.role}
                onChange={(value) => handleInputChange('role', value as UserRole)}
                options={roleOptions}
                error={errors.role}
                required
                placeholder="Seleccione un rol"
                disabled={isLoading}
              />

              <FormSwitchField
                label="Usuario Activo"
                name="isActive"
                checked={formData.isActive}
                onChange={(checked) => handleInputChange('isActive', checked)}
                description="Determina si el usuario puede acceder al sistema"
                disabled={isLoading}
              />
            </div>

            {(mode === 'create' || formData.password) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <FormInputField
                    label={mode === 'create' ? 'Contraseña' : 'Nueva Contraseña'}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(value) => handleInputChange('password', value)}
                    error={errors.password}
                    required={mode === 'create'}
                    placeholder="Ingrese la contraseña"
                    disabled={isLoading}
                    description={mode === 'edit' ? 'Deje en blanco para mantener la contraseña actual' : 'Mínimo 6 caracteres'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-8 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.color === 'red' ? 'bg-red-500' :
                              passwordStrength.color === 'orange' ? 'bg-orange-500' :
                              passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.color === 'red' ? 'text-red-600' :
                          passwordStrength.color === 'orange' ? 'text-orange-600' :
                          passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {passwordStrength.score === 0 ? 'Muy débil' :
                           passwordStrength.score === 1 ? 'Débil' :
                           passwordStrength.score === 2 ? 'Regular' :
                           passwordStrength.score === 3 ? 'Buena' : 'Excelente'}
                        </span>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <div className="flex items-start space-x-1">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <div>
                              {passwordStrength.feedback.map((tip, index) => (
                                <div key={index}>{tip}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <FormInputField
                    label="Confirmar Contraseña"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(value) => handleInputChange('confirmPassword', value)}
                    error={errors.confirmPassword}
                    required={mode === 'create' || !!formData.password}
                    placeholder="Confirme la contraseña"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-8 h-8 w-8 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </FormSection>

          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}</span>
                </>
              )}
            </Button>
          </FormActions>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserForm;