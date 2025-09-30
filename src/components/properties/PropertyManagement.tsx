import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  notifyPropertyCreated, 
  notifyPropertyUpdated, 
  notifyPropertyDeleted,
  showError 
} from '../../lib/propertyNotifications';
import { PropertyList } from './PropertyList';
import { PropertyForm } from './PropertyForm';
import { AssignTenantModal } from './AssignTenantModal';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';
import { usePropertyManagement } from '../../hooks/usePropertyManagement';
import { useUserManagement } from '../../hooks/useUserManagement';
import { Property, CreatePropertyData, UpdatePropertyData, UserRole, User } from '../../types/models';
import { FirebaseAuthService } from '../../lib/firebaseAuth';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Plus } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit';

export const PropertyManagement: React.FC = () => {
  const {
    properties,
    loading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
    refreshProperties,
    clearError
  } = usePropertyManagement();

  const {
    users,
    getAllUsers
  } = useUserManagement();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.TENANT);
  const [formLoading, setFormLoading] = useState(false);
  const [assignTenantModalOpen, setAssignTenantModalOpen] = useState(false);
  const [propertyForTenantAssignment, setPropertyForTenantAssignment] = useState<Property | null>(null);

  // Get current user role and load users on component mount
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

    const loadUsers = async () => {
      try {
        await getAllUsers();
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    getCurrentUserRole();
    loadUsers();
  }, [getAllUsers]);

  // Load properties on component mount
  useEffect(() => {
    const loadProperties = async () => {
      try {
        await refreshProperties();
      } catch (error) {
        console.error('Error loading properties:', error);
      }
    };

    loadProperties();
  }, [refreshProperties]);

  const handleCreateProperty = () => {
    setSelectedProperty(null);
    setViewMode('create');
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setViewMode('edit');
  };

  const handleDeleteProperty = async (property: Property): Promise<void> => {
    try {
      await deleteProperty(property.id);
      notifyPropertyDeleted(property.address);
    } catch (error: any) {
      showError(error.message || 'Error al eliminar la propiedad');
      throw error;
    }
  };

  const handleFormSubmit = async (propertyData: CreatePropertyData | UpdatePropertyData): Promise<void> => {
    setFormLoading(true);
    
    try {
      if (viewMode === 'create') {
        await createProperty(propertyData as CreatePropertyData);
        notifyPropertyCreated(propertyData.address);
      } else if (viewMode === 'edit' && selectedProperty) {
        await updateProperty(selectedProperty.id, propertyData as UpdatePropertyData);
        notifyPropertyUpdated(propertyData.address || selectedProperty.address);
      }
      
      setViewMode('list');
      setSelectedProperty(null);
    } catch (error: any) {
      showError(error.message || 'Error al procesar el formulario');
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedProperty(null);
  };

  const handleAssignTenant = (property: Property) => {
    setPropertyForTenantAssignment(property);
    setAssignTenantModalOpen(true);
  };

  const handleAssignTenantSubmit = async (propertyId: string, tenantId: string) => {
    try {
      const updateData: UpdatePropertyData = {
        tenantId: tenantId || undefined
      };
      await updateProperty(propertyId, updateData);
      setAssignTenantModalOpen(false);
      setPropertyForTenantAssignment(null);
    } catch (error) {
      console.error('Error assigning tenant:', error);
      throw error;
    }
  };

  const handleAssignTenantModalClose = () => {
    setAssignTenantModalOpen(false);
    setPropertyForTenantAssignment(null);
  };


  const handleViewDocuments = (propertyId: string) => {
    // TODO: Implement view documents functionality
    console.log('View documents for property:', propertyId);
  };

  const handleRetry = () => {
    clearError();
    refreshProperties();
  };

  // Show loading state while checking permissions
  if (loading && properties.length === 0) {
    return <LoadingState />;
  }

  // Show error state if there's an error and no properties loaded
  if (error && properties.length === 0) {
    return (
      <ErrorState
        title="Error al cargar propiedades"
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      {viewMode === 'list' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold text-gray-900 font-poppins">Gestión de Propiedades</CardTitle>
                <CardDescription className="text-gray-600 font-poppins">
                  Administra las propiedades del sistema y sus asignaciones
                </CardDescription>
              </div>
              <Button onClick={handleCreateProperty} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Crear Propiedad
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <PropertyList
              properties={properties}
              users={users}
              onEdit={handleEditProperty}
              onDelete={handleDeleteProperty}
              onViewDocuments={handleViewDocuments}
              onAssignTenant={handleAssignTenant}
              loading={loading}
              error={error}
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
                <CardTitle className="text-lg font-medium text-gray-800 font-poppins">
                  {viewMode === 'create' ? 'Crear Propiedad' : 'Editar Propiedad'}
                </CardTitle>
                <CardDescription className="text-gray-600 font-poppins">
                  {viewMode === 'create' 
                    ? 'Completa la información para registrar una nueva propiedad'
                    : 'Modifica la información de la propiedad seleccionada'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PropertyForm
              inline={true}
              property={selectedProperty}
              onSubmit={handleFormSubmit}
              onClose={handleFormCancel}
              loading={formLoading}
              owners={users.filter(user => user.role === UserRole.OWNER)}
              tenants={users.filter(user => user.role === UserRole.TENANT)}
            />
          </CardContent>
        </Card>
      )}

      {/* Assign Tenant Modal */}
      <AssignTenantModal
        isOpen={assignTenantModalOpen}
        onClose={handleAssignTenantModalClose}
        property={propertyForTenantAssignment}
        tenants={users.filter(user => user.role === UserRole.TENANT)}
        onAssign={handleAssignTenantSubmit}
      />
    </div>
  );
};

export default PropertyManagement;