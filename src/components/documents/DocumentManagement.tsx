import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  notifyDocumentUploaded, 
  notifyDocumentUpdated, 
  notifyDocumentDeleted,
  showError 
} from '../../lib/documentNotifications';
import { DocumentListEnhanced } from './DocumentListEnhanced';
import { DocumentEditForm } from './DocumentEditForm';
import { DocumentUploadForm } from './DocumentUploadForm';
import { DocumentViewerModal } from './DocumentViewerModal';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';
import { useDocumentManagement } from '../../hooks/useDocumentManagement';
import { Document, CreateDocumentData, UpdateDocumentData, UserRole } from '../../types/models';
import { FirebaseAuthService } from '../../lib/firebaseAuth';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Plus, Upload, Search } from 'lucide-react';

type ViewMode = 'list' | 'upload' | 'edit';

export const DocumentManagement: React.FC = () => {
  const {
    documents,
    loading,
    error,
    updateDocument,
    removeDocument,
    loadDocuments,
    clearError
  } = useDocumentManagement();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.TENANT);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewerDocument, setViewerDocument] = useState<Document | null>(null);

  // Get current user role on component mount
  useEffect(() => {
    const getCurrentUserRole = async () => {
      try {
        const user = await FirebaseAuthService.getCurrentUserWithClaims();
        if (user?.customClaims?.role) {
          setCurrentUserRole(user.customClaims.role as UserRole);
        }
      } catch (error) {
        console.error('Error getting current user role:', error);
      }
    };

    getCurrentUserRole();
  }, []);

  // Load documents on component mount
  useEffect(() => {
    const loadDocumentsData = async () => {
      try {
        await loadDocuments();
      } catch (error) {
        console.error('Error loading documents:', error);
      }
    };

    loadDocumentsData();
  }, [loadDocuments]);

  const handleUploadDocument = () => {
    setSelectedDocument(null);
    setViewMode('upload');
  };

  const handleEditDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewMode('edit');
  };

  const handleDeleteDocument = async (documentId: string): Promise<void> => {
    try {
      // Get document name before deletion for notification
      const documentToDelete = documents.find(d => d.id === documentId);
      const documentName = documentToDelete?.displayName || 'Documento';
      
      await removeDocument(documentId);
      notifyDocumentDeleted('Documento eliminado');
    } catch (error: any) {
      showError(error.message || 'Error al eliminar el documento');
      throw error;
    }
  };

  const handleFormSubmit = async (documentData: CreateDocumentData | UpdateDocumentData): Promise<void> => {
    setFormLoading(true);
    
    try {
      if (viewMode === 'upload') {
        // For upload, we need to create the document in the database
        // The DocumentUploadForm will handle the Firebase Storage upload
        console.log('Upload document:', documentData);
        notifyDocumentUploaded('Documento subido');
      } else if (viewMode === 'edit' && selectedDocument) {
        const updatedDocument = await updateDocument(selectedDocument.id, documentData as UpdateDocumentData);
        notifyDocumentUpdated('Documento actualizado');
      }
      
      setViewMode('list');
      setSelectedDocument(null);
    } catch (error: any) {
      showError(error.message || 'Error al procesar el formulario');
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedDocument(null);
  };

  const handleRetry = () => {
    clearError();
    loadDocuments();
  };

  // Handle document viewing
  const handleViewDocument = (document: Document) => {
    setViewerDocument(document);
  };

  const handleCloseViewer = () => {
    setViewerDocument(null);
  };

  // Handle document download
  const handleDownloadDocument = (document: Document) => {
    const link = window.document.createElement('a');
    link.href = document.downloadUrl;
    link.download = document.displayName;
    link.click();
  };

  // Filter documents based on search term and type
  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || document.type === filterType;
    return matchesSearch && matchesType;
  });

  // Show loading state while checking permissions
  if (loading && documents.length === 0) {
    return <LoadingState title="Cargando gestión de documentos..." description="Por favor espera mientras cargamos los documentos..." />;
  }

  // Show error state if there's an error and no documents loaded
  if (error && documents.length === 0) {
    return (
      <ErrorState
        title="Error al cargar documentos"
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deed: 'Escritura',
      contract: 'Contrato',
      invoice: 'Factura',
      receipt: 'Recibo',
      insurance: 'Seguro',
      tax_document: 'Documento Fiscal',
      maintenance: 'Mantenimiento',
      inspection: 'Inspección',
      other: 'Otro'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {viewMode === 'list' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Gestión de Documentos</CardTitle>
                <CardDescription>
                  Administra todos los documentos del sistema
                </CardDescription>
              </div>
              <Button onClick={handleUploadDocument} className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Subir Documento
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Document List */}
            <DocumentListEnhanced
              documents={filteredDocuments}
              onView={handleViewDocument}
              onEdit={handleEditDocument}
              onDelete={(doc) => handleDeleteDocument(doc.id)}
              onDownload={handleDownloadDocument}
              loading={loading}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleFormCancel}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a la lista
              </Button>
              <div>
                <CardTitle className="text-xl">
                  {viewMode === 'upload' ? 'Subir Documento' : 'Editar Documento'}
                </CardTitle>
                <CardDescription>
                  {viewMode === 'upload' 
                    ? 'Sube un nuevo documento al sistema'
                    : 'Modifica la información del documento seleccionado'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'upload' ? (
              <DocumentUploadForm
                onSave={handleFormSubmit}
                onCancel={handleFormCancel}
                loading={formLoading}
              />
            ) : (
              <DocumentEditForm
                document={selectedDocument!}
                onSave={handleFormSubmit}
                onCancel={handleFormCancel}
                loading={formLoading}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Viewer Modal */}
      {viewerDocument && (
        <DocumentViewerModal
          document={viewerDocument}
          isOpen={!!viewerDocument}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
};

export default DocumentManagement;