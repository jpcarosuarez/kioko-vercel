import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { DocumentList } from '@/components/DocumentList';
import { Button } from '@/components/ui/button';
import { mockProperties, mockDocuments } from '@/lib/mockData';
import { ArrowLeft, Building, MapPin } from 'lucide-react';

export default function DocumentViewer() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/');
    return null;
  }

  const property = mockProperties.find(p => p.id === propertyId && p.ownerId === user.id);
  
  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Propiedad No Encontrada</h2>
          <p className="text-gray-600 mb-6">La propiedad que buscas no existe o no tienes acceso a ella.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Panel
          </Button>
        </div>
      </div>
    );
  }

  const propertyDocuments = mockDocuments.filter(doc => doc.propertyId === propertyId);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Panel
              </Button>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="font-semibold text-gray-900">Documentos de la Propiedad</h1>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span>{property.address}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {user.name}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-start gap-4">
              <img
                src={property.imageUrl}
                alt={property.address}
                className="w-24 h-24 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{property.address}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <span className="ml-2 font-medium capitalize">
                      {property.type === 'residential' ? 'Residencial' : 'Comercial'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Valor:</span>
                    <span className="ml-2 font-medium">{formatCurrency(property.value)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Fecha de Compra:</span>
                    <span className="ml-2 font-medium">{formatDate(property.purchaseDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <DocumentList 
            documents={propertyDocuments} 
            propertyAddress={property.address}
          />
        </div>
      </main>
    </div>
  );
}