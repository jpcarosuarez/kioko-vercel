import React, { useState } from 'react';
import { Document } from '@/types/models';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  Eye, 
  Search, 
  Filter, 
  File, 
  FileImage, 
  FileSpreadsheet, 
  FileType, 
  FileText,
  Calendar,
  User,
  Building,
  Tag
} from 'lucide-react';

interface UnifiedDocumentListProps {
  documents: Document[];
  propertyAddress: string;
  showPropertyInfo?: boolean;
  showOwnerInfo?: boolean;
  emptyMessage?: string;
}

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

// Document type labels and colors
const documentTypeConfig: Record<string, { label: string; color: string }> = {
  deed: { label: 'Escritura', color: 'bg-primary-100 text-primary-800' },
  contract: { label: 'Contrato', color: 'bg-green-100 text-green-800' },
  invoice: { label: 'Factura', color: 'bg-yellow-100 text-yellow-800' },
  receipt: { label: 'Recibo', color: 'bg-orange-100 text-orange-800' },
  insurance: { label: 'Seguro', color: 'bg-purple-100 text-purple-800' },
  tax_document: { label: 'Documento Fiscal', color: 'bg-red-100 text-red-800' },
  maintenance: { label: 'Mantenimiento', color: 'bg-gray-100 text-gray-800' },
  inspection: { label: 'Inspección', color: 'bg-indigo-100 text-indigo-800' },
  other: { label: 'Otro', color: 'bg-slate-100 text-slate-800' },
  // Legacy types
  lease: { label: 'Arrendamiento', color: 'bg-blue-100 text-blue-800' },
  financial: { label: 'Financiero', color: 'bg-cyan-100 text-cyan-800' },
  legal: { label: 'Legal', color: 'bg-violet-100 text-violet-800' }
};

export const UnifiedDocumentList: React.FC<UnifiedDocumentListProps> = ({
  documents,
  propertyAddress,
  showPropertyInfo = false,
  showOwnerInfo = false,
  emptyMessage = 'No se encontraron documentos asociados a tu cuenta.'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (document: Document) => {
    if (document.downloadUrl) {
      const link = window.document.createElement('a');
      link.href = document.downloadUrl;
      link.download = document.displayName;
      link.click();
    } else {
      alert(`Descargando: ${document.displayName}`);
    }
  };

  const handleView = (document: Document) => {
    if (document.downloadUrl) {
      window.open(document.downloadUrl, '_blank');
    } else {
      alert(`Abriendo: ${document.displayName}`);
    }
  };

  const documentTypes = Array.from(new Set(documents.map(doc => doc.type)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-neutral-700">Documentos</h3>
          <p className="text-xs text-neutral-400">
            {filteredDocuments.length} de {documents.length} documentos
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Tipos</SelectItem>
            {documentTypes.map(type => (
              <SelectItem key={type} value={type}>
                {documentTypeConfig[type]?.label || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      <div className="grid gap-4">
        {filteredDocuments.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground">
              {documents.length === 0 
                ? emptyMessage
                : 'No hay documentos que coincidan con tus criterios de búsqueda.'
              }
            </div>
          </Card>
        ) : (
          filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-1">
                      {getFileIcon(document.originalName || document.displayName)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium truncate pr-2">{document.displayName}</h3>
                        <Badge className={documentTypeConfig[document.type]?.color || 'bg-gray-100 text-gray-800'}>
                          {documentTypeConfig[document.type]?.label || document.type}
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
                          <Tag className="h-3 w-3" />
                          {formatFileSize(document.size)}
                        </div>
                        {showPropertyInfo && document.propertyId && (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {propertyAddress}
                          </div>
                        )}
                        {showOwnerInfo && document.ownerDisplayName && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {document.ownerDisplayName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(document)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UnifiedDocumentList;
