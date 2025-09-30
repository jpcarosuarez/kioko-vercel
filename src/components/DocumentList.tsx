import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Document } from '@/types/models';
import { Download, Eye, Search, Filter, File, FileImage, FileSpreadsheet, FileType, FileText } from 'lucide-react';
import { useState } from 'react';

// Legacy component - consider using DocumentListEnhanced for new implementations
// This component is kept for backward compatibility

interface DocumentListProps {
  documents: Document[];
  propertyAddress: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, propertyAddress }) => {
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
    // In a real app, this would trigger actual file download
    alert(`Descargando: ${document.displayName}`);
  };

  const handleView = (document: Document) => {
    // In a real app, this would open document viewer
    alert(`Abriendo: ${document.displayName}`);
  };

  const documentTypes = Array.from(new Set(documents.map(doc => doc.type)));

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deed: 'Escritura',
      contract: 'Contrato',
      invoice: 'Factura',
      receipt: 'Recibo',
      insurance: 'Seguro',
      tax_document: 'Documento Fiscal',
      maintenance: 'Mantenimiento',
      inspection: 'Inspección',
      other: 'Otro',
      // Legacy types
      lease: 'Arrendamiento',
      financial: 'Financiero',
      legal: 'Legal'
    };
    return labels[type] || type;
  };

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

  const getDocumentColor = (type: string) => {
    const colors: Record<string, string> = {
      lease: 'bg-blue-100 text-blue-800',
      insurance: 'bg-green-100 text-green-800',
      maintenance: 'bg-orange-100 text-orange-800',
      financial: 'bg-purple-100 text-purple-800',
      legal: 'bg-indigo-100 text-indigo-800',
      inspection: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
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
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Tipos</SelectItem>
            {documentTypes.map(type => (
              <SelectItem key={type} value={type}>
                {getTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground">
        Mostrando {filteredDocuments.length} de {documents.length} documentos para {propertyAddress}
      </div>

      <div className="grid gap-4">
        {filteredDocuments.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground">
              {documents.length === 0 
                ? 'No hay documentos disponibles para esta propiedad.' 
                : 'No hay documentos que coincidan con tus criterios de búsqueda.'
              }
            </div>
          </Card>
        ) : (
          filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(document.originalName || document.displayName)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{document.displayName}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{formatDate(document.uploadedAt)}</span>
                        <span>{formatFileSize(document.size)}</span>
                      </div>
                    </div>
                    
                    <Badge className={getDocumentColor(document.type)}>
                      {getTypeLabel(document.type)}
                    </Badge>
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