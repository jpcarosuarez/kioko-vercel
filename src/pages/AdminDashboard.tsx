import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Users, FileText, Building, User, Settings, BarChart3, Shield } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { User as UserType, Property, Document, DashboardStats } from '@/types/models';
import { FirestoreService } from '@/lib/firestore';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { UserManagement } from '@/components/users/UserManagement';
import { PropertyManagement } from '@/components/properties/PropertyManagement';
import { DocumentManagement } from '@/components/documents/DocumentManagement';
import { ApiManagement } from '@/components/admin/ApiManagement';
import { Navbar } from '@/components/common/Navbar';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    // Redirect non-admin users to appropriate dashboard
    if (user.customClaims?.role !== 'admin') {
      if (user.customClaims?.role === 'owner') {
        navigate('/dashboard');
      } else if (user.customClaims?.role === 'tenant') {
        navigate('/tenant');
      } else {
        navigate('/');
      }
      return;
    }

    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard statistics
      const dashboardStats = await FirestoreService.getDashboardStats();
      setStats(dashboardStats);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error al cargar los datos del dashboard. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.customClaims?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState 
        message={error}
        onRetry={loadDashboardData}
      />
    );
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      owner: 'Propietario',
      tenant: 'Inquilino'
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar 
        user={user as any} 
        onLogout={handleLogout} 
        userRole="admin" 
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h2>
          <p className="text-gray-600">Gestiona usuarios, propiedades y documentos del sistema</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Usuarios</CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.totalUsers}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-green-600">{stats.activeUsers}</span> activos
                  </div>
                  <div className="text-xs text-slate-500">
                    ({Math.round((stats.activeUsers / stats.totalUsers) * 100)}%)
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Propiedades</CardTitle>
                <Building className="h-5 w-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.totalProperties}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-green-600">{stats.activeProperties}</span> activas
                  </div>
                  <div className="text-xs text-slate-500">
                    ({Math.round((stats.activeProperties / stats.totalProperties) * 100)}%)
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
                    <span className="font-medium text-green-600">{stats.totalDocuments}</span> almacenados
                  </div>
                  <div className="text-xs text-slate-500">
                    En el sistema
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Propiedades
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Resumen del Sistema
                  </CardTitle>
                  <CardDescription>Información relevante del sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900">{stats?.activeUsers}</div>
                      <div className="text-sm text-slate-600">Usuarios Activos</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900">{stats?.activeProperties}</div>
                      <div className="text-sm text-slate-600">Propiedades Activas</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Estado del sistema:</span> 
                      <span className="ml-1 text-green-600 font-medium">Operativo</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Acciones Rápidas
                  </CardTitle>
                  <CardDescription>Acciones comunes de administración</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    <div 
                      onClick={() => setActiveTab('users')} 
                      className="group p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">Gestionar Usuarios</div>
                          <div className="text-sm text-slate-600">Crear, editar y administrar usuarios</div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      onClick={() => setActiveTab('properties')} 
                      className="group p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                          <Building className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">Gestionar Propiedades</div>
                          <div className="text-sm text-slate-600">Administrar propiedades del sistema</div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      onClick={() => setActiveTab('documents')} 
                      className="group p-4 border border-slate-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                          <FileText className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">Gestionar Documentos</div>
                          <div className="text-sm text-slate-600">Subir y organizar documentos</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="properties">
            <PropertyManagement />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManagement />
          </TabsContent>

          {/* API Section - Hidden from navigation but kept in code */}
          {/* <TabsContent value="api">
            <ApiManagement />
          </TabsContent> */}
        </Tabs>
      </main>
    </div>
  );
}