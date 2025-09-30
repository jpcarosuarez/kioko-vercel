import React, { useState, useMemo } from 'react';
import { Document, DocumentType } from '@/types/models';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { DocumentViewerModal } from './DocumentViewerModal';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { 
  Download, 
  Eye, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  FileText,
  Calendar,
  User,
  Building,
  Tag,
  File,
  FileImage,
  FileSpreadsheet,
  FileType,
} from 'lucide-react';

// Function to get file icon by extension
const getFileIcon = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return <File className="h-5 w-5 text-red-600" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'svg':
      return <FileImage className="h-5 w-5 text-green-600" />;
    case 'xlsx':
    case 'xls':
    case 'csv':
      return <FileSpreadsheet className="h-5 w-5 text-green-700" />;
    case 'docx':
    case 'doc':
      return <FileType className="h-5 w-5 text-blue-600" />;
    case 'txt':
    case 'rtf':
      return <FileText className="h-5 w-5 text-gray-600" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
};

// Document type labels and icons
const documentTypeConfig: Record<DocumentType, { label: string; icon: React.ReactNode; color: string }> = {
  [DocumentType.DEED]: { label: 'Escritura', icon: <FileText className="h-4 w-4" />, color: 'bg-primary-100 text-primary-800' },
  [DocumentType.CONTRACT]: { label: 'Contrato', icon: <FileText className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  [DocumentType.INVOICE]: { label: 'Factura', icon: <FileText className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800' },
  [DocumentType.RECEIPT]: { label: 'Recibo', icon: <FileText className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800' },
  [DocumentType.INSURANCE]: { label: 'Seguro', icon: <FileText className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
  [DocumentType.TAX_DOCUMENT]: { label: 'Documento Fiscal', icon: <FileText className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
  [DocumentType.MAINTENANCE]: { label: 'Mantenimiento', icon: <FileText className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800' },
  [DocumentType.INSPECTION]: { label: 'Inspección', icon: <FileText className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-800' },
  [DocumentType.OTHER]: { label: 'Otro', icon: <File className="h-4 w-4" />, color: 'bg-slate-100 text-slate-800' }
};

interface DocumentListEnhancedProps {
  documents: Document[];
  loading?: boolean;
  error?: string | null;
  onView: (document: Document) => void;
  onEdit: (document: Document) => void;
  onDelete: (document: Document) => void;
  onDownload?: (document: Document) => void;
  showPropertyInfo?: boolean;
  showOwnerInfo?: boolean;
  emptyMessage?: string;
}

export const DocumentListEnhanced: React.FC<DocumentListEnhancedProps> = ({
  documents,
  loading = false,
  error = null,
  onView,
  onEdit,
  onDelete,
  onDownload,
  showPropertyInfo = false,
  showOwnerInfo = false,
  emptyMessage = 'No hay documentos disponibles'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    document: Document | null;
  }>({ isOpen: false, document: null });

  const [viewerDocument, setViewerDocument] = useState<Document | null>(null);

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = (documents || []).filter(doc => {
      const matchesSearch = doc.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || doc.type === filterType;
      return matchesSearch && matchesType;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'date':
          comparison = a.uploadedAt.toMillis() - b.uploadedAt.toMillis();
          break;
        case 'type':
          comparison = documentTypeConfig[a.type].label.localeCompare(documentTypeConfig[b.type].label);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [documents, searchTerm, filterType, sortBy, sortOrder]);

  // Get unique document types from documents
  const availableTypes = useMemo(() => {
    const types = Array.from(new Set(documents.map(doc => doc.type)));
    return types.sort((a, b) => documentTypeConfig[a].label.localeCompare(documentTypeConfig[b].label));
  }, [documents]);

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      
      // Handle Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
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
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle delete confirmation
  const handleDeleteClick = (document: Document) => {
    setDeleteConfirmation({ isOpen: true, document });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation.document) {
      onDelete(deleteConfirmation.document);
    }
    setDeleteConfirmation({ isOpen: false, document: null });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false, document: null });
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
    if (onDownload) {
      onDownload(document);
    } else {
      // Default download behavior
      const link = window.document.createElement('a');
      link.href = document.downloadUrl;
      link.download = document.displayName;
      link.click();
    }
  };

  if (loading) {
    return <LoadingState title="Cargando documentos..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error al cargar documentos"
        message={error}
        showRetry={false}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Tipos</SelectItem>
              {availableTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {documentTypeConfig[type].icon} {documentTypeConfig[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [field, order] = value.split('-');
            setSortBy(field as 'name' | 'date' | 'type');
            setSortOrder(order as 'asc' | 'desc');
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Fecha (Más reciente)</SelectItem>
              <SelectItem value="date-asc">Fecha (Más antiguo)</SelectItem>
              <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
              <SelectItem value="type-asc">Tipo (A-Z)</SelectItem>
              <SelectItem value="type-desc">Tipo (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-neutral-700">Documentos</h3>
          <p className="text-xs text-neutral-400">
            {filteredAndSortedDocuments.length} de {documents.length} documentos
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="grid gap-4">
        {filteredAndSortedDocuments.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground">
              {documents.length === 0 
                ? emptyMessage
                : 'No hay documentos que coincidan con tus criterios de búsqueda.'
              }
            </div>
          </Card>
        ) : (
          filteredAndSortedDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-1">
                      {getFileIcon(document.originalName)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium truncate pr-2">{document.displayName}</h3>
                        <Badge className={documentTypeConfig[document.type].color}>
                          {documentTypeConfig[document.type].label}
                        </Badge>
                      </div>
                      
                      {document.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {document.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(document.uploadedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {formatFileSize(document.size)}
                        </div>
                        {showOwnerInfo && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {document.ownerId}
                          </div>
                        )}
                        {showPropertyInfo && (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {document.propertyId}
                          </div>
                        )}
                      </div>

                      {document.tags && document.tags.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <div className="flex flex-wrap gap-1">
                            {document.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {document.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{document.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
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

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(document)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(document)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => setDeleteConfirmation({ isOpen: open, document: null })}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Documento"
        description={`¿Estás seguro de que deseas eliminar "${deleteConfirmation.document?.displayName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />

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

export default DocumentListEnhanced;