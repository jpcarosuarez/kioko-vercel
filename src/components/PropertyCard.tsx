import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Property } from '@/types/models';
import { FileText, MapPin, Calendar, DollarSign, MoreHorizontal, Edit, Trash2, User } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onViewDocuments: (propertyId: string) => void;
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  onTransferOwnership?: (property: Property) => void;
  showManagementActions?: boolean;
  documentCount?: number;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  onViewDocuments,
  onEdit,
  onDelete,
  onTransferOwnership,
  showManagementActions = false,
  documentCount = 0
}) => {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={property.imageUrl}
          alt={property.address}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <Badge 
          className={`absolute top-3 right-3 ${
            property.type === 'residential' 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-purple-500 hover:bg-purple-600'
          }`}
        >
          {property.type === 'residential' ? 'Residencial' : 'Comercial'}
        </Badge>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="flex items-start gap-2 text-lg">
          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{property.address}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-medium">{formatCurrency(property.value)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>{formatDate(property.purchaseDate)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{documentCount} documento{documentCount !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => onViewDocuments(property.id)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ver Documentos
            </Button>
            
            {showManagementActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(property)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Propiedad
                    </DropdownMenuItem>
                  )}
                  {onTransferOwnership && (
                    <DropdownMenuItem onClick={() => onTransferOwnership(property)}>
                      <User className="h-4 w-4 mr-2" />
                      Transfer Ownership
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(property)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Propiedad
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};