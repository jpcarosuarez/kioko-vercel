import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { PropertyCard } from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Building, FileText, Plus, Eye, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Property, Document, OwnerStats } from '@/types/models';
import { FirestoreService } from '@/lib/firestore';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatCurrency } from '@/lib/currencyUtils';
import { Navbar } from '@/components/common/Navbar';
import { DocumentViewerModal } from '@/components/documents/DocumentViewerModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerDocument, setViewerDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    // Redirect users to appropriate dashboards
    if (user.customClaims?.role === 'admin') {
      navigate('/admin');
      return;
    }
    
    if (user.customClaims?.role === 'tenant') {
      navigate('/tenant');
      return;
    }

    loadOwnerData();
  }, [user, navigate]);

  const loadOwnerData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      // Load properties owned by this user
      const ownerProperties = await FirestoreService.getPropertiesByOwner(user.uid);
      setProperties(ownerProperties);

      // Load documents for owner's properties with visibility filtering
      const propertyIds = ownerProperties.map(p => p.id);
      const ownerDocuments = await FirestoreService.getDocumentsByProperties(propertyIds, 'owner');
      setDocuments(ownerDocuments);

      // Calculate stats
      const totalRentalValue = ownerProperties.reduce((sum, prop) => sum + (prop.rentalValue || 0), 0);
      const ownerStats: OwnerStats = {
        totalProperties: ownerProperties.length,
        totalDocuments: ownerDocuments.length,
        totalValue: totalRentalValue,
        recentDocuments: ownerDocuments
          .sort((a, b) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis())
          .slice(0, 5)
      };
      setStats(ownerStats);

    } catch (error) {
      console.error('Error loading owner data:', error);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocuments = (propertyId: string) => {
    navigate(`/documents/${propertyId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleViewDocument = (document: Document) => {
    setViewerDocument(document);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerDocument(null);
    setIsViewerOpen(false);
  };

  if (!user || user.customClaims?.role !== 'owner') {
    return null;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState 
        message={error}
        onRetry={loadOwnerData}
      />
    );
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar 
        user={user as any} 
        onLogout={handleLogout} 
        userRole="owner" 
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Bienvenido, {user.displayName || 'Propietario'}!
          </h2>
          <p className="text-gray-600">Gestiona y visualiza los documentos de tus propiedades</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Mis Propiedades</CardTitle>
                <Building className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.totalProperties}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-green-600">
                      {properties.filter(p => p.isActive).length}
                    </span> activas
                  </div>
                  <div className="text-xs text-slate-500">
                    ({Math.round((properties.filter(p => p.isActive).length / stats.totalProperties) * 100)}%)
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Ingresos Mensuales</CardTitle>
                <span className="text-emerald-600">$</span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {formatCurrency(stats.totalValue)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-sm text-slate-600">
                    Valor total de arriendos
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Documentos</CardTitle>
                <FileText className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.totalDocuments}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-sm text-slate-600">
                    Disponibles
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Properties Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Tus Propiedades</h3>
          </div>

          {properties.length === 0 ? (
            <Card className="p-8 text-center">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se Encontraron Propiedades</h3>
              <p className="text-gray-500">
                Aún no tienes propiedades asignadas a tu cuenta. Contacta al administrador para más información.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Card key={property.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-medium text-gray-900 mb-1">
                          {property.address}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {property.type === 'residential' ? 'Residencial' : 'Comercial'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {property.imageUrl && (
                      <div className="mb-4">
                        <img
                          src={property.imageUrl}
                          alt={property.address}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      </div>
                    )}
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p>Valor de arriendo: {formatCurrency(property.rentalValue)}</p>
                      <p>Inicio de contrato: {formatDate(property.contractStartDate)}</p>
                      {property.squareMeters && (
                        <p>Área: {property.squareMeters} m²</p>
                      )}
                      {property.bedrooms && (
                        <p>Habitaciones: {property.bedrooms}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">
                        {documents.filter(doc => doc.propertyId === property.id).length} documentos
                      </span>
                      <Badge variant={property.isActive ? "default" : "secondary"}>
                        {property.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => handleViewDocuments(property.id)}
                      className="w-full"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Documentos
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Documents Section */}
        {stats && stats.recentDocuments.length > 0 && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Documentos Recientes</h3>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {stats.recentDocuments.map((document) => (
                    <div key={document.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <h4 className="font-medium text-gray-900">{document.displayName}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Badge variant="outline" className="text-xs">
                                  {document.type}
                                </Badge>
                                <span>•</span>
                                <span>Subido el {formatDate(document.uploadedAt)}</span>
                              </div>
                              {document.description && (
                                <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(document)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Document Viewer Modal */}
      {viewerDocument && (
        <DocumentViewerModal
          document={viewerDocument}
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
}