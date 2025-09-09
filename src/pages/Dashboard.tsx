import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { PropertyCard } from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStoredProperties } from '@/lib/mockData';
import { LogOut, User, Building, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState(getStoredProperties());

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    // Redirect admin users to admin dashboard
    if (user.role === 'admin') {
      navigate('/admin');
      return;
    }
  }, [user, navigate]);

  const userProperties = properties.filter(property => property.ownerId === user?.id);

  const handleViewDocuments = (propertyId: string) => {
    navigate(`/documents/${propertyId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user || user.role === 'admin') {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Kiosko Inmobiliario</h1>
                <p className="text-sm text-gray-500">Portal de Gestión de Documentos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{user.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido de nuevo, {user.name}!</h2>
          <p className="text-gray-600">Gestiona y visualiza los documentos de tus propiedades</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Propiedades</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userProperties.length}</div>
              <p className="text-xs text-muted-foreground">Propiedades bajo gestión</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <span className="text-green-600">$</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(userProperties.reduce((sum, prop) => sum + prop.value, 0))}
              </div>
              <p className="text-xs text-muted-foreground">Valor combinado de propiedades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userProperties.length * 3}
              </div>
              <p className="text-xs text-muted-foreground">Disponibles para revisión</p>
            </CardContent>
          </Card>
        </div>

        {/* Properties Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Tus Propiedades</h3>
          </div>

          {userProperties.length === 0 ? (
            <Card className="p-8 text-center">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se Encontraron Propiedades</h3>
              <p className="text-gray-500">Aún no tienes propiedades asignadas a tu cuenta.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDocuments={handleViewDocuments}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}