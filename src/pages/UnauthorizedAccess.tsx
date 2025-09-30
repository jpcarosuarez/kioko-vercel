import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedAccess() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoHome = () => {
    if (user) {
      // Redirect to appropriate dashboard based on role
      if (user.customClaims?.role === 'admin') {
        navigate('/admin');
      } else if (user.customClaims?.role === 'owner') {
        navigate('/dashboard');
      } else if (user.customClaims?.role === 'tenant') {
        navigate('/tenant');
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Acceso No Autorizado
          </CardTitle>
          <CardDescription className="text-gray-600">
            No tienes permisos para acceder a esta página. Tu rol actual no permite el acceso a este recurso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Usuario:</strong> {user.displayName || user.email}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Rol:</strong> {user.customClaims?.role || 'No definido'}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Ir al Dashboard Principal
            </Button>
            
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver Atrás
            </Button>
            
            {user && (
              <Button onClick={handleLogout} variant="ghost" className="w-full">
                Cerrar Sesión
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}