import React, { useState } from 'react';
import { Document } from '../../types/models';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Download, AlertCircle, Loader2, Eye, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { showSuccess } from '../../lib/notifications';

interface DocumentViewerModalProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  isOpen,
  onClose
}) => {
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const canPreview = (filename: string) => {
    const extension = getFileExtension(filename);
    const previewableExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    return previewableExtensions.includes(extension);
  };

  const getPreviewComponent = () => {
    const extension = getFileExtension(document.originalName);
    
    if (!canPreview(document.originalName)) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <FileText className="h-16 w-16 mb-4" />
          <h3 className="text-lg font-medium mb-2">Formato no soportado para previsualización</h3>
          <p className="text-sm mb-4">
            Este tipo de archivo ({extension.toUpperCase()}) no se puede previsualizar en el navegador.
          </p>
          <Button onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Descargar archivo
          </Button>
        </div>
      );
    }

    if (extension === 'pdf') {
      return (
        <iframe
          src={document.downloadUrl}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          onError={() => setViewerError('Error al cargar el PDF')}
        />
      );
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return (
        <img
          src={document.downloadUrl}
          alt={document.displayName}
          className="max-w-full max-h-full object-contain"
          onLoad={() => setIsLoading(false)}
          onError={() => setViewerError('Error al cargar la imagen')}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <FileText className="h-16 w-16 mb-4" />
        <h3 className="text-lg font-medium mb-2">Vista previa no disponible</h3>
        <p className="text-sm mb-4">
          No se puede mostrar una vista previa de este archivo.
        </p>
        <Button onClick={handleDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Descargar archivo
        </Button>
      </div>
    );
  };

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.downloadUrl;
    link.download = document.displayName;
    link.click();
    showSuccess('Descarga iniciada');
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return format(timestamp.toDate(), 'dd/MM/yyyy HH:mm', { locale: es });
      }
      if (timestamp instanceof Date) {
        return format(timestamp, 'dd/MM/yyyy HH:mm', { locale: es });
      }
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
      }
      return 'N/A';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'deed': 'Escritura',
      'contract': 'Contrato',
      'invoice': 'Factura',
      'receipt': 'Recibo',
      'insurance': 'Seguro',
      'tax_document': 'Documento Fiscal',
      'maintenance': 'Mantenimiento',
      'inspection': 'Inspección',
      'other': 'Otro'
    };
    return typeLabels[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {document.displayName}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            <Badge variant="secondary">
              {getDocumentTypeLabel(document.type)}
            </Badge>
            <span className="text-sm text-gray-500">
              {formatFileSize(document.size)}
            </span>
            <span className="text-sm text-gray-500">
              Subido: {formatDate(document.uploadedAt)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Cargando vista previa...</span>
            </div>
          )}
          
          {viewerError ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-500">
              <AlertCircle className="h-16 w-16 mb-4" />
              <h3 className="text-lg font-medium mb-2">Error al cargar</h3>
              <p className="text-sm mb-4">{viewerError}</p>
              <Button onClick={handleDownload} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Descargar archivo
              </Button>
            </div>
          ) : (
            <div className="w-full h-[60vh] flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
              {getPreviewComponent()}
            </div>
          )}
        </div>

        {document.description && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Descripción</h4>
            <p className="text-sm text-gray-600">{document.description}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Descargar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
