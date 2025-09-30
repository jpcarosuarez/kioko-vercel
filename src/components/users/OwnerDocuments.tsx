import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  FileText, 
  Download, 
  Edit, 
  Trash2, 
  Calendar, 
  Building, 
  HardDrive,
  Search,
  Filter
} from 'lucide-react';
import { Document } from '../../types/models';
import { DocumentService } from '../../lib/documentService';
import { toast } from 'sonner';

interface OwnerDocumentsProps {
  ownerId: string;
  ownerName: string;
  canEdit?: boolean;
}

export const OwnerDocuments: React.FC<OwnerDocumentsProps> = ({
  ownerId,
  ownerName,
  canEdit = true
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [ownerId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await DocumentService.getDocumentsByOwner(ownerId);
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (document: Document) => {
    window.open(document.downloadUrl, '_blank');
  };

  const handleEditStart = (document: Document) => {
    setEditingDoc(document.id);
    setEditName(document.displayName);
  };

  const handleEditSave = async (documentId: string) => {
    try {
      const result = await DocumentService.updateDocument(documentId, {
        displayName: editName.trim()
      });

      if (result.success) {
        toast.success('Nombre del documento actualizado');
        setEditingDoc(null);
        setEditName('');
        loadDocuments();
      } else {
        toast.error(result.error || 'Error al actualizar el documento');
      }
    } catch (err) {
      console.error('Error updating document:', err);
      toast.error('Error al actualizar el documento');
    }
  };

  const handleEditCancel = () => {
    setEditingDoc(null);
    setEditName('');
  };

  const handleDelete = async (document: Document) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${document.displayName}"?`)) {
      return;
    }

    try {
      const result = await DocumentService.deleteDocument(document.id);
      
      if (result.success) {
        toast.success('Documento eliminado correctamente');
        loadDocuments();
      } else {
        toast.error(result.error || 'Error al eliminar el documento');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Error al eliminar el documento');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha no disponible';
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getDocumentTypeLabel(doc.type).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || doc.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const documentTypes = [
    { value: 'all', label: 'Todos los tipos' },
    { value: 'deed', label: 'Escritura' },
    { value: 'contract', label: 'Contrato' },
    { value: 'invoice', label: 'Factura' },
    { value: 'receipt', label: 'Recibo' },
    { value: 'insurance', label: 'Seguro' },
    { value: 'tax_document', label: 'Documento Fiscal' },
    { value: 'maintenance', label: 'Mantenimiento' },
    { value: 'inspection', label: 'Inspección' },
    { value: 'other', label: 'Otro' }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos del Propietario
          </CardTitle>
          <CardDescription>
            Cargando documentos...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos del Propietario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadDocuments} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos del Propietario
        </CardTitle>
        <CardDescription>
          {ownerName} - {documents.length} documento(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay documentos para este propietario</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      {editingDoc === document.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleEditSave(document.id)}
                            disabled={!editName.trim()}
                          >
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditCancel}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <h3 className="font-medium text-gray-900">
                          {document.displayName}
                        </h3>
                      )}
                      <Badge variant="secondary">
                        {getDocumentTypeLabel(document.type)}
                      </Badge>
                    </div>

                    {document.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {document.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(document.uploadedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatFileSize(document.size)}
                      </div>
                      {document.propertyId && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          Propiedad asociada
                        </div>
                      )}
                    </div>

                    {document.tags && document.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {document.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStart(document)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(document)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
