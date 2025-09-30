import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle, User as UserIcon, Building } from 'lucide-react';
import { DocumentType, DocumentVisibility, CreateDocumentData, User, Property } from '../../types/models';
import { DocumentService } from '../../lib/documentService';
import { useAuth } from '../AuthProvider';

// Document upload form schema
const documentUploadSchema = z.object({
  name: z.string().min(1, 'El nombre del documento es requerido'),
  description: z.string().optional(),
  type: z.nativeEnum(DocumentType, {
    errorMap: () => ({ message: 'Selecciona un tipo de documento válido' })
  }),
  visibility: z.nativeEnum(DocumentVisibility, {
    errorMap: () => ({ message: 'Debes seleccionar quién podrá ver este documento' })
  }),
  ownerId: z.string().min(1, 'El propietario es requerido'),
  propertyId: z.string().min(1, 'La propiedad es requerida'),
  tags: z.string().optional()
});

type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

interface DocumentUploadFormProps {
  onSave: (documentData: CreateDocumentData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

// Document type labels in Spanish
const documentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.DEED]: 'Escritura',
  [DocumentType.CONTRACT]: 'Contrato',
  [DocumentType.INVOICE]: 'Factura',
  [DocumentType.RECEIPT]: 'Recibo',
  [DocumentType.INSURANCE]: 'Seguro',
  [DocumentType.TAX_DOCUMENT]: 'Documento Fiscal',
  [DocumentType.MAINTENANCE]: 'Mantenimiento',
  [DocumentType.INSPECTION]: 'Inspección',
  [DocumentType.OTHER]: 'Otro'
};

// Document visibility labels in Spanish
const documentVisibilityLabels: Record<DocumentVisibility, string> = {
  [DocumentVisibility.BOTH]: 'Ambos (Inquilino y Propietario)',
  [DocumentVisibility.TENANT]: 'Inquilino',
  [DocumentVisibility.OWNER]: 'Propietario'
};

export const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
  onSave,
  onCancel,
  loading = false,
  error = null
}) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [owners, setOwners] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<DocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      name: '',
      description: '',
      type: DocumentType.OTHER,
      ownerId: '',
      propertyId: '',
      tags: ''
    }
  });

  const watchedType = watch('type');
  const watchedOwnerId = watch('ownerId');

  // Load owners and properties on component mount
  useEffect(() => {
    loadOwners();
    loadProperties();
  }, []);

  // Filter properties when owner changes
  useEffect(() => {
    if (watchedOwnerId) {
      const ownerProperties = properties.filter(prop => prop.ownerId === watchedOwnerId);
      setFilteredProperties(ownerProperties);
      setValue('propertyId', ''); // Reset property selection
    } else {
      setFilteredProperties([]);
      setValue('propertyId', '');
    }
  }, [watchedOwnerId, properties, setValue]);

  const loadOwners = async () => {
    try {
      // Cargar propietarios reales desde Firestore
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'owner'),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const ownersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt
      })) as User[];
      
      setOwners(ownersData);
    } catch (error) {
      console.error('Error loading owners:', error);
    }
  };

  const loadProperties = async () => {
    try {
      // Cargar propiedades reales desde Firestore
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      
      const q = query(
        collection(db, 'properties'),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const propertiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt
      })) as Property[];
      
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
      
      // Auto-fill name if not provided
      const currentName = watch('name');
      if (!currentName) {
        setValue('name', file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      }
    }
  };

  // Handle form submission
  const onSubmit = async (data: DocumentUploadFormData) => {
    if (!selectedFile) {
      setUploadError('Por favor selecciona un archivo');
      return;
    }

    if (!data.ownerId) {
      setUploadError('Por favor selecciona un propietario');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      // Get owner info
      const owner = owners.find(o => o.uid === data.ownerId);
      if (!owner) {
        setUploadError('Error: propietario no encontrado');
        return;
      }

      // Get property info if selected
      const property = data.propertyId ? filteredProperties.find(p => p.id === data.propertyId) : null;

      // Create document using service with integrity validation
      const result = await DocumentService.createDocument(
        selectedFile,
        data.ownerId,
        data.propertyId || null,
        data.name.trim(),
        data.description || '',
        data.type,
        data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
        user?.uid || '',
        data.visibility
      );

      if (!result.success) {
        setUploadError(result.error || 'Error al crear el documento');
        return;
      }

      // Success - the service already saved to Firestore
      setUploadProgress(100);
      await onSave({} as CreateDocumentData);
    } catch (err) {
      console.error('Error uploading document:', err);
      setUploadError(err instanceof Error ? err.message : 'Error al subir el documento');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Subir Documento
        </CardTitle>
        <CardDescription>
          Selecciona un archivo y completa la información del documento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="file">Archivo del Documento</Label>
          <div className="flex items-center gap-4">
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              onChange={handleFileSelect}
              className="flex-1"
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                {selectedFile.name}
              </div>
            )}
          </div>
          {selectedFile && (
            <div className="text-sm text-gray-500">
              Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              Subiendo archivo...
            </div>
            <Progress value={uploadProgress} className="w-full" />
            <div className="text-sm text-gray-500">
              {uploadProgress.toFixed(0)}% completado
            </div>
          </div>
        )}

        {/* Error Display */}
        {(error || uploadError) && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error || uploadError}
          </div>
        )}

        {/* Owner and Property Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Selección de Propietario y Propiedad</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Owner Selection */}
            <div className="space-y-2">
              <Label htmlFor="ownerId" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Propietario <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchedOwnerId}
                onValueChange={(value) => setValue('ownerId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar propietario" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.uid} value={owner.uid}>
                      {owner.name} ({owner.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ownerId && (
                <p className="text-sm text-red-600">{errors.ownerId.message}</p>
              )}
            </div>

            {/* Property Selection */}
            <div className="space-y-2">
              <Label htmlFor="propertyId" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Propiedad <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('propertyId')}
                onValueChange={(value) => setValue('propertyId', value)}
                disabled={!watchedOwnerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={watchedOwnerId ? "Seleccionar propiedad" : "Primero seleccione un propietario"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address} ({property.type === 'residential' ? 'Residencial' : 'Comercial'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!watchedOwnerId && (
                <p className="text-sm text-gray-500">
                  Debe seleccionar un propietario primero
                </p>
              )}
              {watchedOwnerId && filteredProperties.length === 0 && (
                <p className="text-sm text-yellow-600">
                  Este propietario no tiene propiedades registradas
                </p>
              )}
              {errors.propertyId && (
                <p className="text-sm text-red-600">{errors.propertyId.message}</p>
              )}
            </div>
          </div>

          {/* Selection Summary */}
          {watchedOwnerId && watch('propertyId') && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900">Selección Confirmada</h4>
              <p className="text-green-700">
                <strong>Propietario:</strong> {owners.find(o => o.uid === watchedOwnerId)?.name}
              </p>
              <p className="text-green-700">
                <strong>Propiedad:</strong> {filteredProperties.find(p => p.id === watch('propertyId'))?.address}
              </p>
              <p className="text-sm text-green-600">
                El documento se guardará en: propietarios/{owners.find(o => o.uid === watchedOwnerId)?.name.replace(/[^a-zA-Z0-9]/g, '_')}/{watch('propertyId')}/
              </p>
            </div>
          )}
        </div>

        {/* Document Visibility */}
        <div className="space-y-2">
          <Label htmlFor="visibility" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Visibilidad del Documento <span className="text-red-500">*</span>
          </Label>
          <Select
            value={watch('visibility')}
            onValueChange={(value) => setValue('visibility', value as DocumentVisibility)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar quién podrá ver este documento" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(documentVisibilityLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.visibility && (
            <p className="text-sm text-red-600">{errors.visibility.message}</p>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Documento</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ej: Escritura de propiedad"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Documento</Label>
            <Select
              value={watchedType}
              onValueChange={(value) => setValue('type', value as DocumentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción (Opcional)</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Descripción del documento..."
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Etiquetas (Opcional)</Label>
          <Input
            id="tags"
            {...register('tags')}
            placeholder="etiqueta1, etiqueta2, etiqueta3"
          />
          <p className="text-sm text-gray-500">
            Separa las etiquetas con comas
          </p>
          {errors.tags && (
            <p className="text-sm text-red-600">{errors.tags.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={loading || isUploading || !selectedFile}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Subir Documento
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUploadForm;
