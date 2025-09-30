import React from 'react';
import { z } from 'zod';
import { EnhancedForm } from '../forms/EnhancedForm';
import { FormInput, FormSelect, FormSwitch, FormSection } from '../forms/FormFields';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { User, CreateUserData, UpdateUserData, UserRole } from '../../types/models';
import { userSchema, updateUserSchema } from '../../lib/validations';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { notifications } from '../../lib/notifications';
import { X } from 'lucide-react';

interface EnhancedUserFormProps {
  user?: User | null;
  onSubmit: (userData: CreateUserData | UpdateUserData) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

// Form data types
type CreateFormData = z.infer<typeof userSchema>;
type UpdateFormData = z.infer<typeof updateUserSchema>;

const roleOptions = [
  { value: UserRole.ADMIN, label: 'Administrador' },
  { value: UserRole.OWNER, label: 'Propietario' },
  { value: UserRole.TENANT, label: 'Inquilino' }
];

export const EnhancedUserForm: React.FC<EnhancedUserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  mode
}) => {
  const isEditing = mode === 'edit';
  
  // Get the appropriate schema and default values based on mode
  const schema = isEditing ? updateUserSchema : userSchema;
  const defaultValues = isEditing 
    ? {
        name: user?.name || '',
        phone: user?.phone || '',
        role: user?.role || UserRole.TENANT,
        isActive: user?.isActive ?? true
      }
    : {
        name: '',
        email: '',
        phone: '',
        role: UserRole.TENANT,
        password: '',
        confirmPassword: '',
        isActive: true
      };

  // Handle form submission with enhanced error handling
  const handleSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      await onSubmit(data as any);
      
      // Show success notification
      const action = isEditing ? 'actualizado' : 'creado';
      notifications.user[isEditing ? 'updated' : 'created'](data.name || user?.name || 'Usuario');
      
      // Close form on success
      onCancel();
    } catch (error) {
      // Error handling is managed by the EnhancedForm component
      throw error;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className="text-xl font-semibold">
          {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <EnhancedForm
          schema={schema}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          submitButtonText={isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
          successMessage={`Usuario ${isEditing ? 'actualizado' : 'creado'} exitosamente`}
          resetOnSuccess={!isEditing}
        >
          <FormSection
            title="Información Personal"
            description="Datos básicos del usuario"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput<CreateFormData | UpdateFormData>
                name="name"
                label="Nombre Completo"
                placeholder="Ingresa el nombre completo"
                required
                autoComplete="name"
              />
              
              {!isEditing && (
                <FormInput<CreateFormData>
                  name="email"
                  label="Correo Electrónico"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  required
                  autoComplete="email"
                  description="El email será usado para iniciar sesión"
                />
              )}
              
              <FormInput<CreateFormData | UpdateFormData>
                name="phone"
                label="Teléfono"
                type="tel"
                placeholder="(123) 456-7890"
                required
                autoComplete="tel"
                description="Formato: (123) 456-7890"
              />
              
              <FormSelect<CreateFormData | UpdateFormData>
                name="role"
                label="Rol del Usuario"
                options={roleOptions}
                required
                description="Define los permisos del usuario en el sistema"
              />
            </div>
          </FormSection>

          {!isEditing && (
            <FormSection
              title="Credenciales de Acceso"
              description="Configuración de la contraseña inicial"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput<CreateFormData>
                  name="password"
                  label="Contraseña"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete="new-password"
                  description="La contraseña debe tener al menos 6 caracteres"
                />
                
                <FormInput<CreateFormData>
                  name="confirmPassword"
                  label="Confirmar Contraseña"
                  type="password"
                  placeholder="Repite la contraseña"
                  required
                  autoComplete="new-password"
                />
              </div>
            </FormSection>
          )}

          <FormSection
            title="Configuración de la Cuenta"
            description="Estado y permisos del usuario"
          >
            <FormSwitch<CreateFormData | UpdateFormData>
              name="isActive"
              label="Usuario Activo"
              description="Los usuarios inactivos no pueden acceder al sistema"
            />
          </FormSection>
        </EnhancedForm>
      </CardContent>
    </Card>
  );
};

export default EnhancedUserForm;