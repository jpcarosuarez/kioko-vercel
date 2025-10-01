import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Redirect based on user role
      if (user.customClaims?.role === 'admin') {
        navigate('/admin');
      } else if (user.customClaims?.role === 'owner') {
        navigate('/owner');
      } else if (user.customClaims?.role === 'tenant') {
        navigate('/tenant');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Por favor ingrese email y contraseña');
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
      // Navigation will be handled by useEffect above
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };


  const handleDemoLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-2xl mb-4">
            <img 
              src="/logo.png" 
              alt="Kiosko Inmobiliario" 
              className="h-16 w-16 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Kiosko Inmobiliario</h1>
          <p className="text-neutral-600 text-sm">Portal de Gestión de Documentos</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="text-sm">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary-600 text-primary-foreground font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            {/* Demo Login Buttons */}
            {/*<div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center mb-3">Acceso de demostración:</p>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 text-xs"
                  onClick={() => handleDemoLogin('contacto@kioskoinmobiliario.com', 'KioskoAdmin2024!')}
                  disabled={isLoading}
                >
                  🔧 Administrador
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 text-xs"
                  onClick={() => handleDemoLogin('propietario@demo.com', 'Demo123!')}
                  disabled={isLoading}
                >
                  🏠 Propietario
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 text-xs"
                  onClick={() => handleDemoLogin('inquilino@demo.com', 'Demo123!')}
                  disabled={isLoading}
                >
                  👤 Inquilino
                </Button>
              </div>
            </div>*/}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-neutral-400 mt-6">
          <p>© {new Date().getFullYear()} Kiosko Inmobiliario</p>
        </div>
      </div>
    </div>
  );
}
