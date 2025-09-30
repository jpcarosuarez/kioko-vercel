import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Document, DocumentType, UpdateDocumentData } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Save, X, FileText, Calendar, User, Building } from 'lucide-react';

// Validation schema for document editing
const documentEditSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[^<>:"/\\|?*]+$/, 'El nombre contiene caracteres no válidos'),
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  type: z.nativeEnum(DocumentType, {
    errorMap: () => ({ message: 'Selecciona un tipo de documento válido' })
  }),
  tags: z.string().optional()
});

type DocumentEditFormData = z.infer<typeof documentEditSchema>;

interface DocumentEditFormProps {
  document: Document;
  onSave: (updates: UpdateDocumentData) => Promise<void>;
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

export const DocumentEditForm: React.FC<DocumentEditFormProps> = ({
  document,
  onSave,
  onCancel,
  loading = false,
  error = null
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<DocumentEditFormData>({
    resolver: zodResolver(documentEditSchema),
    defaultValues: {
      name: document.displayName,
      description: document.description || '',
      type: document.type,
      tags: document.tags?.join(', ') || ''
    }
  });

  const watchedType = watch('type');

  // Handle form submission
  const onSubmit = async (data: DocumentEditFormData) => {
    try {
      setIsSubmitting(true);

      const updates: UpdateDocumentData = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        type: data.type,
        tags: data.tags 
          ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
          : undefined
      };

      await onSave(updates);
    } catch (err) {
      // Error handling is done in the parent component
      console.error('Error saving document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      // Handle Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      // Handle string or number timestamp
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return <LoadingState message="Cargando documento..." />;
  }

  return (
    <div className="space-y-6">
      {/* Document Information Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información del Documento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Fecha de subida:</span>
              <span>{formatDate(document.uploadDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Tamaño:</span>
              <span>{document.fileSize}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Subido por:</span>
              <span>{document.uploadedBy}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">ID Propiedad:</span>
              <span className="font-mono text-xs">{document.propertyId}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Editar Documento</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4">
              <ErrorState 
                title="Error al guardar"
                message={error}
                showRetry={false}
              />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Document Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre del Documento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ingresa el nombre del documento"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Tipo de Documento <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchedType}
                onValueChange={(value) => setValue('type', value as DocumentType, { shouldDirty: true })}
              >
                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecciona el tipo de documento" />
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
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descripción opcional del documento"
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Máximo 500 caracteres
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <Input
                id="tags"
                {...register('tags')}
                placeholder="Etiquetas separadas por comas (ej: importante, fiscal, 2024)"
                className={errors.tags ? 'border-red-500' : ''}
              />
              {errors.tags && (
                <p className="text-sm text-red-500">{errors.tags.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Separa las etiquetas con comas
              </p>
            </div>

            <Separator />

            {/* Form Actions */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {isDirty ? 'Hay cambios sin guardar' : 'No hay cambios'}
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                
                <Button
                  type="submit"
                  disabled={!isDirty || isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Current Tags Display */}
      {document.tags && document.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Etiquetas Actuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentEditForm;