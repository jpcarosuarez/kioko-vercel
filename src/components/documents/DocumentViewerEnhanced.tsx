import React, { useState } from 'react';
import { Document, DocumentType } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import {
  FileText,
  Download,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  User,
  Building,
  Tag,
  FileIcon,
  MoreVertical,
  ArrowLeft,
  Share2,
  Eye
} from 'lucide-react';

// Document type configuration
const documentTypeConfig: Record<DocumentType, { label: string; icon: string; color: string }> = {
  [DocumentType.DEED]: { label: 'Escritura', icon: '📜', color: 'bg-blue-100 text-blue-800' },
  [DocumentType.CONTRACT]: { label: 'Contrato', icon: '📋', color: 'bg-green-100 text-green-800' },
  [DocumentType.INVOICE]: { label: 'Factura', icon: '🧾', color: 'bg-yellow-100 text-yellow-800' },
  [DocumentType.RECEIPT]: { label: 'Recibo', icon: '🧾', color: 'bg-orange-100 text-orange-800' },
  [DocumentType.INSURANCE]: { label: 'Seguro', icon: '🛡️', color: 'bg-purple-100 text-purple-800' },
  [DocumentType.TAX_DOCUMENT]: { label: 'Documento Fiscal', icon: '📊', color: 'bg-red-100 text-red-800' },
  [DocumentType.MAINTENANCE]: { label: 'Mantenimiento', icon: '🔧', color: 'bg-gray-100 text-gray-800' },
  [DocumentType.INSPECTION]: { label: 'Inspección', icon: '🔍', color: 'bg-indigo-100 text-indigo-800' },
  [DocumentType.OTHER]: { label: 'Otro', icon: '📄', color: 'bg-slate-100 text-slate-800' }
};

interface DocumentViewerEnhancedProps {
  document: Document;
  loading?: boolean;
  error?: string | null;
  onEdit: (document: Document) => void;
  onDelete: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onBack?: () => void;
  showPropertyInfo?: boolean;
  showOwnerInfo?: boolean;
  propertyAddress?: string;
  ownerName?: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const DocumentViewerEnhanced: React.FC<DocumentViewerEnhancedProps> = ({
  document,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onDownload,
  onBack,
  showPropertyInfo = false,
  showOwnerInfo = false,
  propertyAddress,
  ownerName,
  canEdit = true,
  canDelete = true
}) => {
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [isViewingDocument, setIsViewingDocument] = useState(false);

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Handle Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = () => {
    setDeleteConfirmation(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(document);
    setDeleteConfirmation(false);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation(false);
  };

  // Handle view document
  const handleViewDocument = () => {
    if (document.driveUrl) {
      window.open(document.driveUrl, '_blank');
      setIsViewingDocument(true);
    }
  };

  // Handle share document
  const handleShareDocument = async () => {
    if (navigator.share && document.driveUrl) {
      try {
        await navigator.share({
          title: document.displayName,
          text: `Documento: ${document.displayName}`,
          url: document.downloadUrl
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(document.driveUrl);
      }
    } else if (document.driveUrl) {
      navigator.clipboard.writeText(document.driveUrl);
    }
  };

  if (loading) {
    return <LoadingState message="Cargando documento..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error al cargar documento"
        message={error}
        showRetry={false}
      />
    );
  }

  const typeConfig = documentTypeConfig[document.type];

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      {onBack && (
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div className="text-sm text-muted-foreground">
            Visualizando documento
          </div>
        </div>
      )}

      {/* Document Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{typeConfig.icon}</div>
              <div className="space-y-2">
                <CardTitle className="text-xl">{document.displayName}</CardTitle>
                <Badge className={typeConfig.color}>
                  {typeConfig.label}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleViewDocument}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Ver Documento
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onDownload && (
                    <DropdownMenuItem onClick={() => onDownload(document)}>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleShareDocument}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleViewDocument}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir en Google Drive
                  </DropdownMenuItem>
                  {(canEdit || canDelete) && <DropdownMenuSeparator />}
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit(document)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={handleDeleteClick}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Document Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium">{document.displayName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <Badge className={typeConfig.color}>
                  {typeConfig.label}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tamaño:</span>
                <span>{document.fileSize}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo MIME:</span>
                <span className="font-mono text-sm">{document.mimeType}</span>
              </div>
              
              {document.version && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versión:</span>
                  <span>{document.version}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dates and Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fechas y Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha de subida:</span>
                <span>{formatDate(document.uploadDate)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Última actualización:</span>
                <span>{formatDate(document.updatedAt)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subido por:</span>
                <span>{document.uploadedBy}</span>
              </div>
              
              {showOwnerInfo && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Propietario:</span>
                  <span>{ownerName || document.ownerId}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {document.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {document.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {document.tags && document.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Etiquetas
            </CardTitle>
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

      {/* Property Information */}
      {showPropertyInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Información de Propiedad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID de Propiedad:</span>
              <span className="font-mono text-sm">{document.propertyId}</span>
            </div>
            {propertyAddress && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dirección:</span>
                <span>{propertyAddress}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles Técnicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID del Documento:</span>
            <span className="font-mono text-sm">{document.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID de Google Drive:</span>
            <span className="font-mono text-sm">{document.driveFileId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estado:</span>
            <Badge variant={document.isActive ? "default" : "secondary"}>
              {document.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="Eliminar Documento"
        message={`¿Estás seguro de que deseas eliminar "${document.displayName}"? Esta acción eliminará el archivo de Firebase Storage y no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
};

export default DocumentViewerEnhanced;