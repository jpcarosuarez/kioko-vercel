import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  MapPin,
  DollarSign,
  Calendar,
  User,
  FileText,
  UserPlus
} from 'lucide-react';
import { Property, PropertyType, User as UserType } from '@/types/models';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { PropertyDocumentsModal } from './PropertyDocumentsModal';

interface PropertyListProps {
  properties: Property[];
  users: UserType[];
  loading?: boolean;
  error?: string | null;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onViewDocuments: (propertyId: string) => void;
  onAssignTenant?: (property: Property) => void;
}

export const PropertyList: React.FC<PropertyListProps> = ({
  properties,
  users,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onViewDocuments,
  onAssignTenant
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<PropertyType | 'all'>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Create user lookup map for performance
  const userMap = useMemo(() => {
    if (!users || !Array.isArray(users) || users.length === 0) {
      return {} as Record<string, UserType>;
    }
    return users.reduce((map, user) => {
      if (user && user.id) {
        map[user.id] = user;
      }
      return map;
    }, {} as Record<string, UserType>);
  }, [users]);

  // Filter properties based on search and filters
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesSearch = property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           userMap[property.ownerId]?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || property.type === typeFilter;
      const matchesOwner = ownerFilter === 'all' || property.ownerId === ownerFilter;
      
      return matchesSearch && matchesType && matchesOwner;
    });
  }, [properties, searchTerm, typeFilter, ownerFilter, userMap]);

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

  const getOwnerName = (ownerId: string) => {
    return userMap[ownerId]?.name || 'Unknown Owner';
  };

  const getPropertyTypeLabel = (type: string) => {
    return type === 'residential' ? 'Residencial' : 'Comercial';
  };

  const handleViewDocuments = (property: Property) => {
    setSelectedProperty(property);
    setDocumentsModalOpen(true);
  };

  const handleCloseDocumentsModal = () => {
    setDocumentsModalOpen(false);
    setSelectedProperty(null);
  };

  if (loading) {
    return <LoadingState title="Cargando propiedades..." description="Por favor espera mientras cargamos las propiedades..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar propiedades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as PropertyType | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value={PropertyType.RESIDENTIAL}>Residencial</SelectItem>
                <SelectItem value={PropertyType.COMMERCIAL}>Comercial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por propietario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los propietarios</SelectItem>
                {users && Array.isArray(users) && users.filter(user => user.role === 'owner').map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Propiedades ({filteredProperties.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProperties.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No se encontraron propiedades
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || ownerFilter !== 'all'
                  ? 'Intenta ajustar tus filtros'
                  : 'Crea tu primera propiedad para comenzar'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Valor Arriendo</TableHead>
                    <TableHead>Metros²</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <img
                            src={property.imageUrl}
                            alt={property.address}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{property.address}</p>
                            {property.bedrooms && (
                              <p className="text-sm text-muted-foreground">
                                {property.bedrooms} habitaciones
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={property.type === PropertyType.RESIDENTIAL ? 'default' : 'secondary'}
                        >
                          {getPropertyTypeLabel(property.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{getOwnerName(property.ownerId)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{formatCurrency(property.rentalValue)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span>{property.squareMeters ? `${property.squareMeters}m²` : '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{formatDate(property.contractStartDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={property.isActive ? 'default' : 'secondary'}>
                          {property.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocuments(property)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            Documentos
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEdit(property)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar Propiedad
                              </DropdownMenuItem>
                              {onAssignTenant && (
                                <DropdownMenuItem onClick={() => onAssignTenant(property)}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Asignar Inquilino
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => onDelete(property)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar Propiedad
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Documents Modal */}
      {selectedProperty && (
        <PropertyDocumentsModal
          isOpen={documentsModalOpen}
          onClose={handleCloseDocumentsModal}
          propertyId={selectedProperty.id}
          propertyAddress={selectedProperty.address}
          ownerId={selectedProperty.ownerId}
        />
      )}
    </div>
  );
};

export default PropertyList;