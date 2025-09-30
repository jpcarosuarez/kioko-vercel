import React, { useEffect, useState } from 'react';
import { Document } from '../../types/models';
import { DocumentService } from '../../lib/documentService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { FileText, Download, Eye, Calendar, User, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { showSuccess, showError } from '../../lib/notifications';

interface PropertyDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyAddress: string;
  ownerId: string;
}

export const PropertyDocumentsModal: React.FC<PropertyDocumentsModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyAddress,
  ownerId
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    if (isOpen && propertyId) {
      loadDocuments();
    }
  }, [isOpen, propertyId]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedDocuments = await DocumentService.getDocumentsByProperty(propertyId);
      setDocuments(fetchedDocuments);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Error al cargar los documentos.');
      showError('Error al cargar los documentos.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleDownloadDocument = (doc: Document) => {
    const link = window.document.createElement('a');
    link.href = doc.downloadUrl;
    link.download = doc.displayName;
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

  const getDocumentIcon = (type: string) => {
    const icons: Record<string, string> = {
      'deed': '📄',
      'contract': '📋',
      'invoice': '🧾',
      'receipt': '🧾',
      'insurance': '🛡️',
      'tax_document': '📊',
      'maintenance': '🔧',
      'inspection': '🔍',
      'other': '📄'
    };
    return icons[type] || '📄';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Documentos de la Propiedad
            </DialogTitle>
            <DialogDescription>
              {propertyAddress}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Cargando documentos...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8 text-red-500">
                <AlertCircle className="h-6 w-6 mr-2" />
                <span>{error}</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No hay documentos</p>
                <p className="text-sm">Esta propiedad no tiene documentos asociados</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {documents.map((document) => (
                  <Card key={document.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{getDocumentIcon(document.type)}</span>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-medium text-gray-900 line-clamp-2">
                              {document.displayName}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {getDocumentTypeLabel(document.type)}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatFileSize(document.size)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(document)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(document)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {document.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {document.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Subido: {formatDate(document.uploadedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Por: {document.uploadedBy}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewerModal
          document={selectedDocument}
          isOpen={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </>
  );
};

// Componente para el visor de documentos
interface DocumentViewerModalProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {document.displayName}
          </DialogTitle>
          <DialogDescription>
            {document.description || 'Sin descripción'}
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
