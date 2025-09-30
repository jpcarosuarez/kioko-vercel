import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user) {
      // Redirect to appropriate dashboard based on role
      if (user.customClaims?.role === 'admin') {
        navigate('/admin');
      } else if (user.customClaims?.role === 'owner') {
        navigate('/owner');
      } else if (user.customClaims?.role === 'tenant') {
        navigate('/tenant');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <FileQuestion className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Página No Encontrada
          </CardTitle>
          <CardDescription className="text-gray-600">
            La página que buscas no existe o ha sido movida. Verifica la URL e intenta de nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <span className="text-6xl font-bold text-blue-600">404</span>
          </div>
          
          <div className="space-y-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              {user ? 'Ir al Dashboard' : 'Ir al Inicio'}
            </Button>
            
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver Atrás
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
