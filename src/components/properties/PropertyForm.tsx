import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Property, PropertyType, User, CreatePropertyData, UpdatePropertyData } from '@/types/models';
import { FormField } from '@/components/forms/FormField';
import { LoadingState } from '@/components/common/LoadingState';
import { applyCurrencyMask, validateCurrencyInput, formatCurrency } from '@/lib/currencyUtils';
import { PropertyErrorHandler } from '../../lib/errorHandlers';
import { Combobox } from '@/components/ui/combobox';
import { uploadPropertyImage } from '@/lib/firebaseStorage';
import { Upload, X } from 'lucide-react';

type PropertyFormData = {
  address: string;
  type: PropertyType;
  ownerId: string;
  tenantId?: string; // Optional tenant assignment
  imageFile?: File; // File to upload
  imageUrl?: string; // Existing image URL (for editing)
  contractStartDate: string;
  rentalValue: string; // Keep as string for form input
  squareMeters?: string;
  bedrooms?: string;
};

interface PropertyFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit: (data: CreatePropertyData | UpdatePropertyData) => Promise<void>;
  property?: Property | null;
  owners: User[];
  tenants?: User[]; // List of tenant users
  loading?: boolean;
  inline?: boolean;
}

export const PropertyForm: React.FC<PropertyFormProps> = ({
  isOpen = true,
  onClose,
  onSubmit,
  property,
  owners,
  tenants = [],
  loading = false,
  inline = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isEditing = !!property;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<PropertyFormData>({
    defaultValues: {
      address: '',
      type: PropertyType.RESIDENTIAL,
      ownerId: '',
      imageUrl: '',
      contractStartDate: '',
      rentalValue: '',
      squareMeters: '',
      bedrooms: ''
    }
  });

  // Reset form when property changes or dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (property && property.address) {
        // Editing existing property - validate all required fields exist
        setValue('address', property.address || '');
        setValue('type', property.type || PropertyType.RESIDENTIAL);
        setValue('ownerId', property.ownerId || '');
        setValue('tenantId', property.tenantId || '');
        setValue('imageUrl', property.imageUrl || '');
        setValue('contractStartDate', property.contractStartDate || '');
        setValue('rentalValue', property.rentalValue?.toString() || '');
        setValue('squareMeters', property.squareMeters?.toString() || '');
        setValue('bedrooms', property.bedrooms?.toString() || '');
        
        // Set image preview for existing property
        if (property.imageUrl) {
          setImagePreview(property.imageUrl);
        }
      } else {
        // Creating new property
        reset();
        setSelectedImage(null);
        setImagePreview(null);
      }
      clearErrors();
    }
  }, [isOpen, property, setValue, reset, clearErrors]);

  const handleFormSubmit = async (data: PropertyFormData) => {
    try {
      setIsSubmitting(true);
      clearErrors();
      
      // Validate currency input
      const currencyValidation = validateCurrencyInput(data.rentalValue);
      if (!currencyValidation.isValid) {
        setError('rentalValue', { message: currencyValidation.error || 'Invalid value' });
        return;
      }
      
      let imageUrl = data.imageUrl || '';
      let imagePath = '';
      
      // Handle image upload if a new image is selected
      if (selectedImage) {
        const uploadResult = await uploadPropertyImage(selectedImage, property?.id || 'temp');
        if (!uploadResult.success) {
          setError('imageFile', { message: uploadResult.error || 'Error al subir imagen' });
          return;
        }
        imageUrl = uploadResult.file!.url;
        imagePath = uploadResult.file!.path;
      }
      
      // Convert form data to proper types
      const propertyData: any = {
        address: data.address.trim(),
        type: data.type,
        ownerId: data.ownerId,
        contractStartDate: data.contractStartDate,
        rentalValue: currencyValidation.numericValue!,
      };

      // Only include optional fields if they have values
      if (data.tenantId && data.tenantId.trim() !== '') {
        propertyData.tenantId = data.tenantId;
      }
      
      if (imageUrl) {
        propertyData.imageUrl = imageUrl;
      }
      
      if (imagePath) {
        propertyData.imagePath = imagePath;
      }
      
      if (data.squareMeters && data.squareMeters.trim() !== '') {
        propertyData.squareMeters = parseFloat(data.squareMeters);
      }
      
      if (data.bedrooms && data.bedrooms.trim() !== '') {
        propertyData.bedrooms = parseInt(data.bedrooms);
      }
      
      // Additional validation
      const validation = PropertyErrorHandler.validatePropertyData(propertyData);
      if (!validation.isValid) {
        Object.entries(validation.errors).forEach(([field, message]) => {
          setError(field as keyof PropertyFormData, { message: message as string });
        });
        return;
      }

      await onSubmit(propertyData);
      onClose?.();
    } catch (error) {
      console.error('Error submitting property form:', error);
      PropertyErrorHandler.showErrorToast(error, 'Error al guardar la propiedad');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRentalValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = applyCurrencyMask(value);
    setValue('rentalValue', maskedValue);
    
    // Clear value error when user starts typing
    if (errors.rentalValue) {
      clearErrors('rentalValue');
    }
  };

  const handleNumericChange = (field: 'squareMeters' | 'bedrooms', value: string) => {
    // Only allow positive integers
    const numericValue = value.replace(/[^0-9]/g, '');
    setValue(field, numericValue);
    
    // Clear field error when user starts typing
    if (errors[field]) {
      clearErrors(field);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('imageFile', { message: 'Solo se permiten archivos de imagen' });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('imageFile', { message: 'El archivo no puede ser mayor a 5MB' });
        return;
      }
      
      setSelectedImage(file);
      setValue('imageFile', file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any existing errors
      clearErrors('imageFile');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setValue('imageFile', undefined);
    clearErrors('imageFile');
  };

  // Prepare owner options for combobox
  const ownerOptions = owners.map(owner => ({
    value: owner.id,
    label: `${owner.name} (${owner.email})`
  }));

  // Prepare tenant options for combobox
  const tenantOptions = tenants.map(tenant => ({
    value: tenant.id,
    label: `${tenant.name} (${tenant.email})`
  }));


  const formContent = (
    <>
      {!inline && (
        <DialogHeader>
          <DialogTitle className="font-poppins text-xl font-semibold">
            {isEditing ? 'Editar Propiedad' : 'Crear Nueva Propiedad'}
          </DialogTitle>
        </DialogHeader>
      )}

      {loading ? (
        <LoadingState title="Cargando datos de la propiedad..." description="Por favor espera mientras cargamos la información..." />
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 font-poppins">Información Básica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('address')}
                    placeholder="Ingresa la dirección completa de la propiedad"
                    className={`font-poppins ${errors.address ? 'border-red-500' : ''}`}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500 font-poppins">{errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Tipo de Propiedad <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={watch('type')}
                    onValueChange={(value) => setValue('type', value as PropertyType)}
                  >
                    <SelectTrigger className={`font-poppins ${errors.type ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Seleccionar tipo de propiedad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PropertyType.RESIDENTIAL}>Residencial</SelectItem>
                      <SelectItem value={PropertyType.COMMERCIAL}>Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-500 font-poppins">{errors.type.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-poppins">
                  Propietario <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={ownerOptions}
                  value={watch('ownerId')}
                  onValueChange={(value) => setValue('ownerId', value)}
                  placeholder="Buscar y seleccionar propietario"
                  searchPlaceholder="Buscar propietario..."
                  emptyText="No se encontraron propietarios"
                  className={errors.ownerId ? 'border-red-500' : ''}
                />
                {errors.ownerId && (
                  <p className="text-sm text-red-500 font-poppins">{errors.ownerId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-poppins">
                  Inquilino <span className="text-gray-400">(Opcional)</span>
                </label>
                <Combobox
                  options={tenantOptions}
                  value={watch('tenantId') || ''}
                  onValueChange={(value) => setValue('tenantId', value && value.trim() !== '' ? value : undefined)}
                  placeholder="Buscar y seleccionar inquilino"
                  searchPlaceholder="Buscar inquilino..."
                  emptyText="No se encontraron inquilinos"
                />
              </div>
            </div>

            {/* Detalles de la Propiedad */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 font-poppins">Detalles de la Propiedad</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Imagen de la Propiedad <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Vista previa"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* File Input */}
                  {!imagePreview && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600 font-poppins">
                          Haz clic para seleccionar una imagen
                        </span>
                        <span className="text-xs text-gray-500">
                          PNG, JPG, GIF hasta 5MB
                        </span>
                      </label>
                    </div>
                  )}
                  
                  {/* Change Image Button (when preview exists) */}
                  {imagePreview && (
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-change"
                      />
                      <label
                        htmlFor="image-change"
                        className="flex-1 cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Cambiar Imagen
                      </label>
                    </div>
                  )}
                  
                  {errors.imageFile && (
                    <p className="text-sm text-red-500 font-poppins">{errors.imageFile.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Metros Cuadrados
                  </label>
                  <Input
                    {...register('squareMeters')}
                    placeholder="Ej: 120"
                    onChange={(e) => handleNumericChange('squareMeters', e.target.value)}
                    className={`font-poppins ${errors.squareMeters ? 'border-red-500' : ''}`}
                  />
                  {errors.squareMeters && (
                    <p className="text-sm text-red-500 font-poppins">{errors.squareMeters.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-poppins">
                  Habitaciones
                </label>
                <Input
                  {...register('bedrooms')}
                  placeholder="Ej: 3"
                  onChange={(e) => handleNumericChange('bedrooms', e.target.value)}
                  className={`font-poppins ${errors.bedrooms ? 'border-red-500' : ''}`}
                />
                {errors.bedrooms && (
                  <p className="text-sm text-red-500 font-poppins">{errors.bedrooms.message}</p>
                )}
              </div>
            </div>

            {/* Contrato */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 font-poppins">Contrato</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Fecha de Inicio de Arriendo <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    {...register('contractStartDate')}
                    className={`font-poppins ${errors.contractStartDate ? 'border-red-500' : ''}`}
                  />
                  {errors.contractStartDate && (
                    <p className="text-sm text-red-500 font-poppins">{errors.contractStartDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Valor del Arriendo <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('rentalValue')}
                    placeholder="Ej: 1,200,000"
                    onChange={handleRentalValueChange}
                    className={`font-poppins ${errors.rentalValue ? 'border-red-500' : ''}`}
                  />
                  {watch('rentalValue') && validateCurrencyInput(watch('rentalValue')).isValid && (
                    <p className="text-sm text-muted-foreground mt-1 font-poppins">
                      {formatCurrency(validateCurrencyInput(watch('rentalValue')).numericValue!)}
                    </p>
                  )}
                  {errors.rentalValue && (
                    <p className="text-sm text-red-500 font-poppins">{errors.rentalValue.message}</p>
                  )}
                </div>
              </div>
            </div>

            {!inline && (
              <DialogFooter className="flex justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="font-poppins"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary-600 hover:bg-primary-700 font-poppins"
                >
                  {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Propiedad' : 'Crear Propiedad'}
                </Button>
              </DialogFooter>
            )}
            
            {inline && (
              <div className="flex justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="font-poppins"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary-600 hover:bg-primary-700 font-poppins"
                >
                  {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Propiedad' : 'Crear Propiedad'}
                </Button>
              </div>
            )}
        </form>
      )}
    </>
  );

  if (inline) {
    return formContent;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {formContent}
      </DialogContent>
    </Dialog>
  );
};