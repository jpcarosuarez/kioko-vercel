import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DocumentType, User, Property } from '@/types/models';
import { uploadOwnerDocument } from '@/lib/firebaseStorage';
import { Upload, X, FileText, Eye, User as UserIcon, Building } from 'lucide-react';

const documentUploadSchema = z.object({
  name: z.string().min(1, 'El nombre del documento es requerido'),
  description: z.string().optional(),
  type: z.nativeEnum(DocumentType),
  customName: z.string().optional(),
});

type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

interface DocumentUploadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (documentData: any) => Promise<void>;
  owners: User[];
  properties: Property[];
  loading?: boolean;
}

export const DocumentUploadFormFirebase: React.FC<DocumentUploadFormProps> = ({
  isOpen,
  onClose,
  onSave,
  owners,
  properties,
  loading = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<DocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      name: '',
      description: '',
      type: DocumentType.OTHER,
      customName: ''
    }
  });

  // Filter properties when owner changes
  useEffect(() => {
    if (selectedOwnerId) {
      const ownerProperties = properties.filter(prop => prop.ownerId === selectedOwnerId);
      setFilteredProperties(ownerProperties);
      setSelectedPropertyId(''); // Reset property selection
    } else {
      setFilteredProperties([]);
      setSelectedPropertyId('');
    }
  }, [selectedOwnerId, properties]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('customName', { message: 'El archivo no puede ser mayor a 10MB' });
        return;
      }
      
      setSelectedFile(file);
      setValue('name', file.name);
      setValue('customName', file.name.split('.')[0]);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
      
      clearErrors('customName');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setValue('name', '');
    setValue('customName', '');
    clearErrors('customName');
  };

  const handleOwnerChange = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    setSelectedPropertyId('');
  };

  const onSubmit = async (data: DocumentUploadFormData) => {
    if (!selectedFile || !selectedOwnerId || !selectedPropertyId) {
      setError('customName', { message: 'Debe seleccionar un archivo, propietario y propiedad' });
      return;
    }

    try {
      setIsUploading(true);
      
      // Get owner and property info
      const owner = owners.find(o => o.uid === selectedOwnerId);
      const property = filteredProperties.find(p => p.id === selectedPropertyId);
      
      if (!owner || !property) {
        setError('customName', { message: 'Error: propietario o propiedad no encontrados' });
        return;
      }
      
      // Upload file to Firebase Storage with new path structure
      const uploadResult = await uploadOwnerDocument(
        selectedFile,
        owner.name, // ownerDisplayName
        property.id, // propertyId
        data.customName || data.name
      );

      if (!uploadResult.success) {
        setError('customName', { message: uploadResult.error || 'Error al subir el archivo' });
        return;
      }

      // Create document data
      const documentData = {
        name: data.customName || data.name,
        description: data.description,
        type: data.type,
        ownerId: owner.uid,
        propertyId: property.id,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        storagePath: uploadResult.file!.path,
        downloadUrl: uploadResult.file!.url,
        uploadedBy: 'current-user-id', // TODO: Get from auth context
        isActive: true,
        tags: [],
        version: 1
      };

      await onSave(documentData);
      handleClose();
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('customName', { message: 'Error al procesar el documento' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setFilePreview(null);
    setSelectedOwnerId('');
    setSelectedPropertyId('');
    setFilteredProperties([]);
    onClose();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊';
    return '📁';
  };

  const getSelectedOwner = () => owners.find(o => o.uid === selectedOwnerId);
  const getSelectedProperty = () => filteredProperties.find(p => p.id === selectedPropertyId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 font-poppins">
            Subir Documento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Owner and Property Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 font-poppins">Selección de Propietario y Propiedad</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Owner Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-poppins flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Propietario <span className="text-red-500">*</span>
                </label>
                <Select value={selectedOwnerId} onValueChange={handleOwnerChange}>
                  <SelectTrigger className="font-poppins">
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
              </div>

              {/* Property Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-poppins flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Propiedad <span className="text-red-500">*</span>
                </label>
                <Select 
                  value={selectedPropertyId} 
                  onValueChange={setSelectedPropertyId}
                  disabled={!selectedOwnerId}
                >
                  <SelectTrigger className="font-poppins">
                    <SelectValue placeholder={selectedOwnerId ? "Seleccionar propiedad" : "Primero seleccione un propietario"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProperties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.address} ({property.type === 'residential' ? 'Residencial' : 'Comercial'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedOwnerId && (
                  <p className="text-sm text-gray-500 font-poppins">
                    Debe seleccionar un propietario primero
                  </p>
                )}
                {selectedOwnerId && filteredProperties.length === 0 && (
                  <p className="text-sm text-yellow-600 font-poppins">
                    Este propietario no tiene propiedades registradas
                  </p>
                )}
              </div>
            </div>

            {/* Selection Summary */}
            {selectedOwnerId && selectedPropertyId && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 font-poppins">Selección Confirmada</h4>
                <p className="text-green-700 font-poppins">
                  <strong>Propietario:</strong> {getSelectedOwner()?.name}
                </p>
                <p className="text-green-700 font-poppins">
                  <strong>Propiedad:</strong> {getSelectedProperty()?.address}
                </p>
                <p className="text-sm text-green-600 font-poppins">
                  El documento se guardará en: propietarios/{getSelectedOwner()?.name.replace(/[^a-zA-Z0-9]/g, '_')}/{getSelectedProperty()?.id}/
                </p>
              </div>
            )}
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 font-poppins">Archivo</h3>
            
            {/* File Preview */}
            {selectedFile && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getFileIcon(selectedFile)}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 font-poppins">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Image Preview */}
                {filePreview && (
                  <div className="mt-4">
                    <img
                      src={filePreview}
                      alt="Vista previa"
                      className="max-h-48 w-full object-cover rounded"
                    />
                  </div>
                )}
              </div>
            )}

            {/* File Input */}
            {!selectedFile && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="document-upload"
                />
                <label
                  htmlFor="document-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-12 w-12 text-gray-400" />
                  <span className="text-lg font-medium text-gray-600 font-poppins">
                    Seleccionar Archivo
                  </span>
                  <span className="text-sm text-gray-500">
                    PDF, DOC, DOCX, XLS, XLSX, JPG, PNG hasta 10MB
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Document Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 font-poppins">Detalles del Documento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-poppins">
                  Nombre del Documento <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('customName')}
                  placeholder="Ej: Contrato de Arriendo"
                  className={`font-poppins ${errors.customName ? 'border-red-500' : ''}`}
                />
                {errors.customName && (
                  <p className="text-sm text-red-500 font-poppins">{errors.customName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-poppins">
                  Tipo de Documento <span className="text-red-500">*</span>
                </label>
                <Select onValueChange={(value) => setValue('type', value as DocumentType)}>
                  <SelectTrigger className="font-poppins">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DocumentType.DEED}>Escritura</SelectItem>
                    <SelectItem value={DocumentType.CONTRACT}>Contrato</SelectItem>
                    <SelectItem value={DocumentType.INVOICE}>Factura</SelectItem>
                    <SelectItem value={DocumentType.RECEIPT}>Recibo</SelectItem>
                    <SelectItem value={DocumentType.INSURANCE}>Seguro</SelectItem>
                    <SelectItem value={DocumentType.TAX_DOCUMENT}>Documento Tributario</SelectItem>
                    <SelectItem value={DocumentType.MAINTENANCE}>Mantenimiento</SelectItem>
                    <SelectItem value={DocumentType.INSPECTION}>Inspección</SelectItem>
                    <SelectItem value={DocumentType.OTHER}>Otro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500 font-poppins">{errors.type.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 font-poppins">
                Descripción
              </label>
              <Textarea
                {...register('description')}
                placeholder="Descripción opcional del documento..."
                rows={3}
                className="font-poppins"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || !selectedOwnerId || !selectedPropertyId || isUploading}
              className="font-poppins"
            >
              {isUploading ? 'Subiendo...' : 'Subir Documento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};