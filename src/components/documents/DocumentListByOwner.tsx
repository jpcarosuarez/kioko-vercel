import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Document, DocumentType, User } from '@/types/models';
import { deleteFile } from '@/lib/firebaseStorage';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  FileText, 
  Calendar,
  User as UserIcon,
  AlertCircle
} from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';

interface DocumentListByOwnerProps {
  documents: Document[];
  owner: User | null;
  loading?: boolean;
  error?: string | null;
  onView: (document: Document) => void;
  onDelete: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onRefresh?: () => void;
}

export const DocumentListByOwner: React.FC<DocumentListByOwnerProps> = ({
  documents,
  owner,
  loading = false,
  error = null,
  onView,
  onDelete,
  onDownload,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);

  // Filter documents based on search and type
  useEffect(() => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.type === typeFilter);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, typeFilter]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha no disponible';
    
    try {
      let date: Date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        return 'Fecha no disponible';
      }
      
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha no disponible';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    const labels = {
      [DocumentType.DEED]: 'Escritura',
      [DocumentType.CONTRACT]: 'Contrato',
      [DocumentType.INVOICE]: 'Factura',
      [DocumentType.RECEIPT]: 'Recibo',
      [DocumentType.INSURANCE]: 'Seguro',
      [DocumentType.TAX_DOCUMENT]: 'Documento Tributario',
      [DocumentType.MAINTENANCE]: 'Mantenimiento',
      [DocumentType.INSPECTION]: 'Inspección',
      [DocumentType.OTHER]: 'Otro'
    };
    return labels[type] || type;
  };

  const getDocumentIcon = (type: DocumentType) => {
    const icons = {
      [DocumentType.DEED]: '📜',
      [DocumentType.CONTRACT]: '📋',
      [DocumentType.INVOICE]: '🧾',
      [DocumentType.RECEIPT]: '🧾',
      [DocumentType.INSURANCE]: '🛡️',
      [DocumentType.TAX_DOCUMENT]: '📊',
      [DocumentType.MAINTENANCE]: '🔧',
      [DocumentType.INSPECTION]: '🔍',
      [DocumentType.OTHER]: '📄'
    };
    return icons[type] || '📄';
  };

  const handleDelete = async (document: Document) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${document.displayName}"?`)) {
      try {
        // Delete from Firebase Storage
        await deleteFile(document.storagePath);
        onDelete(document);
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Error al eliminar el documento');
      }
    }
  };

  const handleDownload = (document: Document) => {
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
        onRetry={onRefresh}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 font-poppins">
            Documentos del Propietario
          </h2>
          {owner && (
            <p className="text-gray-600 font-poppins">
              {owner.name} ({owner.email})
            </p>
          )}
        </div>
        <div className="text-sm text-gray-500 font-poppins">
          {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-poppins"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as DocumentType | 'all')}>
            <SelectTrigger className="font-poppins">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
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
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 font-poppins mb-2">
              No hay documentos
            </h3>
            <p className="text-gray-500 font-poppins text-center">
              {searchTerm || typeFilter !== 'all' 
                ? 'No se encontraron documentos con los filtros aplicados'
                : 'Este propietario no tiene documentos cargados'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getDocumentIcon(document.type)}</span>
                    <div>
                      <CardTitle className="text-sm font-medium text-gray-900 font-poppins line-clamp-2">
                        {document.displayName}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {getDocumentTypeLabel(document.type)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(document)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(document)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {document.description && (
                  <p className="text-sm text-gray-600 font-poppins line-clamp-2 mb-3">
                    {document.description}
                  </p>
                )}
                <div className="space-y-2 text-xs text-gray-500 font-poppins">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(document.uploadedAt)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-3 w-3" />
                    <span>{formatFileSize(document.size)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
