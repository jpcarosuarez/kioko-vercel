import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Document, getDocumentIcon, getDocumentColor } from '@/lib/mockData';
import { Download, Eye, Search, Filter } from 'lucide-react';
import { useState } from 'react';

interface DocumentListProps {
  documents: Document[];
  propertyAddress: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, propertyAddress }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDownload = (document: Document) => {
    // In a real app, this would trigger actual file download
    alert(`Descargando: ${document.name}`);
  };

  const handleView = (document: Document) => {
    // In a real app, this would open document viewer
    alert(`Abriendo: ${document.name}`);
  };

  const documentTypes = Array.from(new Set(documents.map(doc => doc.type)));

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      lease: 'Arrendamiento',
      insurance: 'Seguro',
      maintenance: 'Mantenimiento',
      financial: 'Financiero',
      legal: 'Legal',
      inspection: 'Inspección'
    };
    return labels[type] || type;
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
                {getDocumentIcon(type)} {getTypeLabel(type)}
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
                    <div className="text-2xl flex-shrink-0">
                      {getDocumentIcon(document.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{document.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{formatDate(document.uploadDate)}</span>
                        <span>{document.fileSize}</span>
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