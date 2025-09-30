import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Document, User, Property } from '@/types/models';
import { DocumentUploadFormFirebase } from './DocumentUploadFormFirebase';
import { DocumentListByOwner } from './DocumentListByOwner';
import { Plus, User as UserIcon } from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';

interface DocumentManagementByOwnerProps {
  className?: string;
}

export const DocumentManagementByOwner: React.FC<DocumentManagementByOwnerProps> = ({
  className = ""
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load owners and properties
  useEffect(() => {
    loadOwners();
    loadProperties();
  }, []);

  // Load documents when owner is selected
  useEffect(() => {
    if (selectedOwner) {
      loadDocuments(selectedOwner.id);
    } else {
      setDocuments([]);
    }
  }, [selectedOwner]);

  const loadOwners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call
      // For now, using mock data
      const mockOwners: User[] = [
        {
          id: '1',
          uid: '1',
          email: 'juan@example.com',
          name: 'Juan Pérez',
          phone: '+57 300 123 4567',
          role: 'owner' as any,
          isActive: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        },
        {
          id: '2',
          uid: '2',
          email: 'maria@example.com',
          name: 'María López',
          phone: '+57 300 987 6543',
          role: 'owner' as any,
          isActive: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        }
      ];
      
      setOwners(mockOwners);
    } catch (error) {
      console.error('Error loading owners:', error);
      setError('Error al cargar los propietarios');
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call
      // For now, using mock data
      const mockProperties: Property[] = [
        {
          id: 'prop1',
          address: 'Calle 123 #45-67, Bogotá',
          type: 'residential' as any,
          ownerId: '1',
          imageUrl: 'https://example.com/image1.jpg',
          contractStartDate: '2024-01-01',
          rentalValue: 1500000,
          squareMeters: 80,
          bedrooms: 3,
          isActive: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        },
        {
          id: 'prop2',
          address: 'Carrera 45 #78-90, Medellín',
          type: 'commercial' as any,
          ownerId: '1',
          imageUrl: 'https://example.com/image2.jpg',
          contractStartDate: '2024-02-01',
          rentalValue: 2500000,
          squareMeters: 120,
          bedrooms: 0,
          isActive: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        },
        {
          id: 'prop3',
          address: 'Avenida 80 #12-34, Cali',
          type: 'residential' as any,
          ownerId: '2',
          imageUrl: 'https://example.com/image3.jpg',
          contractStartDate: '2024-03-01',
          rentalValue: 1800000,
          squareMeters: 95,
          bedrooms: 4,
          isActive: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        }
      ];
      
      setProperties(mockProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
      setError('Error al cargar las propiedades');
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (ownerId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call to load documents by owner
      // For now, using mock data
      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'Contrato de Arriendo',
          description: 'Contrato de arriendo para la propiedad en la Calle 123',
          type: 'contract' as any,
          ownerId: ownerId,
          uploadDate: new Date() as any,
          fileSize: 1024000,
          mimeType: 'application/pdf',
          storagePath: `propietarios/JuanPerez/contrato_1696112345678.pdf`,
          downloadUrl: 'https://example.com/contrato.pdf',
          uploadedBy: 'admin-1',
          isActive: true,
          tags: ['contrato', 'arriendo'],
          version: 1,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        }
      ];
      
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = () => {
    setIsUploadOpen(true);
  };

  const handleSaveDocument = async (documentData: any) => {
    try {
      // TODO: Replace with actual API call to save document
      console.log('Saving document:', documentData);
      
      // Add to local state for now
      const newDocument: Document = {
        id: Date.now().toString(),
        ...documentData,
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      };
      
      setDocuments(prev => [...prev, newDocument]);
      setIsUploadOpen(false);
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  };

  const handleViewDocument = (document: Document) => {
    // Open document in new tab
    window.open(document.downloadUrl, '_blank');
  };

  const handleDeleteDocument = async (document: Document) => {
    try {
      // TODO: Replace with actual API call to delete document
      console.log('Deleting document:', document.id);
      
      // Remove from local state for now
      setDocuments(prev => prev.filter(doc => doc.id !== document.id));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  };

  const handleDownloadDocument = (document: Document) => {
    // Download document
    const link = document.createElement('a');
    link.href = document.downloadUrl;
    link.download = document.displayName;
    link.click();
  };

  const handleRefresh = () => {
    if (selectedOwner) {
      loadDocuments(selectedOwner.id);
    }
  };

  if (loading && owners.length === 0) {
    return <LoadingState message="Cargando propietarios..." />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-900 font-poppins">
            Gestión de Documentos por Propietario
          </CardTitle>
          <p className="text-gray-600 font-poppins">
            Administra los documentos de cada propietario de manera organizada
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 font-poppins mb-2">
                Seleccionar Propietario
              </label>
              <Select 
                value={selectedOwner?.id || ''} 
                onValueChange={(value) => {
                  const owner = owners.find(o => o.id === value);
                  setSelectedOwner(owner || null);
                }}
              >
                <SelectTrigger className="font-poppins">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Seleccionar propietario..." />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleUploadDocument}
                className="font-poppins"
              >
                <Plus className="h-4 w-4 mr-2" />
                Subir Documento
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {selectedOwner ? (
        <DocumentListByOwner
          documents={documents}
          owner={selectedOwner}
          loading={loading}
          error={error}
          onView={handleViewDocument}
          onDelete={handleDeleteDocument}
          onDownload={handleDownloadDocument}
          onRefresh={handleRefresh}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 font-poppins mb-2">
              Selecciona un Propietario
            </h3>
            <p className="text-gray-500 font-poppins text-center">
              Elige un propietario de la lista para ver y gestionar sus documentos
            </p>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <DocumentUploadFormFirebase
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSave={handleSaveDocument}
        owners={owners}
        properties={properties}
        loading={loading}
      />
    </div>
  );
};
