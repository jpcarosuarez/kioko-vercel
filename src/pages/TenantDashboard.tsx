import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Building, FileText, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Property, Document, TenantStats } from '@/types/models';
import { FirestoreService } from '@/lib/firestore';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Navbar } from '@/components/common/Navbar';
import { DocumentViewerModal } from '@/components/documents/DocumentViewerModal';
import { formatCurrency } from '@/lib/currencyUtils';

export default function TenantDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerDocument, setViewerDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    // Redirect non-tenant users to appropriate dashboard
    if (user.customClaims?.role === 'admin') {
      navigate('/admin');
      return;
    }
    
    if (user.customClaims?.role === 'owner') {
      navigate('/dashboard');
      return;
    }

    loadTenantData();
  }, [user, navigate]);

  const loadTenantData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      // Load properties assigned to this tenant
      const tenantProperties = await FirestoreService.getPropertiesByTenant(user.uid);
      setProperties(tenantProperties);

      // Load documents for tenant's properties with visibility filtering
      const propertyIds = tenantProperties.map(p => p.id);
      const tenantDocuments = await FirestoreService.getDocumentsByProperties(propertyIds, 'tenant');
      setDocuments(tenantDocuments);

      // Calculate stats
      const tenantStats: TenantStats = {
        assignedProperties: tenantProperties.length,
        availableDocuments: tenantDocuments.length,
        recentDocuments: tenantDocuments
          .sort((a, b) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis())
          .slice(0, 5)
      };
      setStats(tenantStats);

    } catch (error) {
      console.error('Error loading tenant data:', error);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document: Document) => {
    setViewerDocument(document);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerDocument(null);
    setIsViewerOpen(false);
  };

  const handleViewProperty = (propertyId: string) => {
    navigate(`/documents/${propertyId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user || user.customClaims?.role !== 'tenant') {
    return null;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState 
        message={error}
        onRetry={loadTenantData}
      />
    );
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar 
        user={user as any} 
        onLogout={handleLogout} 
        userRole="tenant" 
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Bienvenido, {user.displayName || 'Inquilino'}!
          </h2>
          <p className="text-gray-600">Accede a los documentos de tus propiedades arrendadas</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Mis Propiedades</CardTitle>
                <Building className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.assignedProperties}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-sm text-slate-600">
                    Propiedades arrendadas
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
                <div className="text-3xl font-bold text-slate-900">{stats.availableDocuments}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-sm text-slate-600">
                    Disponibles
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Properties Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Tus Propiedades</h3>
          </div>

          {properties.length === 0 ? (
            <Card className="p-8 text-center">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se Encontraron Propiedades</h3>
              <p className="text-gray-500">
                Aún no tienes propiedades arrendadas asignadas a tu cuenta. Contacta al administrador para más información.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => {
                // Contar documentos para esta propiedad
                const propertyDocuments = documents.filter(doc => doc.propertyId === property.id);
                
                return (
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
                            className="w-full h-40 object-cover rounded-lg shadow-sm"
                          />
                        </div>
                      )}
                      <div className="space-y-3 text-sm text-gray-600 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">Valor de arriendo:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(property.rentalValue || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">Inicio de contrato:</span>
                          <span className="text-gray-600">{formatDate(property.contractStartDate)}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                          <p className={`font-medium text-center ${propertyDocuments.length > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                            {propertyDocuments.length > 0 
                              ? `${propertyDocuments.length} documento${propertyDocuments.length !== 1 ? 's' : ''} disponible${propertyDocuments.length !== 1 ? 's' : ''}`
                              : 'Sin documentos disponibles'
                            }
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleViewProperty(property.id)}
                        className="w-full bg-primary hover:bg-primary-600 text-white"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Documentos
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
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
                                  {getDocumentTypeLabel(document.type)}
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