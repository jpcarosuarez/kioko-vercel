import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Terminal, 
  Cloud, 
  Copy, 
  ExternalLink,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import AdminInitializerService from '@/lib/adminInitializer';

interface AdminSetupGuideProps {
  onClose?: () => void;
}

export const AdminSetupGuide: React.FC<AdminSetupGuideProps> = ({ onClose }) => {
  const [copiedCommand, setCopiedCommand] = React.useState<string | null>(null);
  
  const adminInfo = AdminInitializerService.getAdminInfo();
  const setupInstructions = AdminInitializerService.getSetupInstructions();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(label);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configuración Inicial</h1>
              <p className="text-gray-600">Kiosko Inmobiliario</p>
            </div>
          </div>
        </div>

        {/* Setup Alert */}
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Configuración requerida:</strong> No se encontró un usuario administrador. 
            Sigue las instrucciones a continuación para configurar el administrador inicial.
          </AlertDescription>
        </Alert>

        {/* Setup Options */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Option 1: Firebase Console */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Opción 1: Firebase Console</CardTitle>
              </div>
              <CardDescription>
                Configuración manual a través de Firebase Console
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Paso 1</Badge>
                  <span className="text-sm">Ve a Firebase Console</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Paso 2</Badge>
                  <span className="text-sm">Authentication > Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Paso 3</Badge>
                  <span className="text-sm">Crear usuario</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white px-2 py-1 rounded">
                      {adminInfo.email}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(adminInfo.email, 'email')}
                    >
                      {copiedCommand === 'email' ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Contraseña:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white px-2 py-1 rounded">
                      KioskoAdmin2024!
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('KioskoAdmin2024!', 'password')}
                    >
                      {copiedCommand === 'password' ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('https://console.firebase.google.com', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Firebase Console
              </Button>
            </CardContent>
          </Card>

          {/* Option 2: Script */}
          <Card className="border-2 border-green-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Opción 2: Script Automatizado</CardTitle>
              </div>
              <CardDescription>
                Configuración automática con script de Node.js
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Paso 1</Badge>
                  <span className="text-sm">Descargar clave de servicio</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Paso 2</Badge>
                  <span className="text-sm">Guardar como serviceAccountKey.json</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Paso 3</Badge>
                  <span className="text-sm">Ejecutar script</span>
                </div>
              </div>
              
              <div className="bg-gray-900 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Terminal</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('node scripts/setup-demo-users.js', 'script')}
                    className="text-gray-400 hover:text-white"
                  >
                    {copiedCommand === 'script' ? (
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <code className="text-xs text-green-400">
                  node scripts/setup-demo-users.js
                </code>
              </div>
              
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Recomendado:</strong> Esta opción configura automáticamente 
                  usuarios de demo para admin, owner y tenant.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Option 3: Cloud Function */}
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Opción 3: Cloud Function</CardTitle>
              </div>
              <CardDescription>
                Configuración remota usando Firebase Functions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Paso 1</Badge>
                  <span className="text-sm">Desplegar Cloud Functions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Paso 2</Badge>
                  <span className="text-sm">Configurar ADMIN_INIT_SECRET</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Paso 3</Badge>
                  <span className="text-sm">Llamar función initializeAdmin</span>
                </div>
              </div>
              
              <div className="bg-gray-900 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Deploy</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('firebase deploy --only functions', 'deploy')}
                    className="text-gray-400 hover:text-white"
                  >
                    {copiedCommand === 'deploy' ? (
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <code className="text-xs text-purple-400">
                  firebase deploy --only functions
                </code>
              </div>
              
              <Alert className="border-purple-200 bg-purple-50">
                <AlertDescription className="text-purple-800">
                  <strong>Para producción:</strong> Esta opción es ideal para 
                  entornos de producción donde no tienes acceso directo al servidor.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Estado Actual del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Configuración de Firebase:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Firebase configurado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Firestore configurado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Authentication configurado</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Usuarios requeridos:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>Administrador: {adminInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4" />
                    <span className="text-gray-600">Owner y Tenant (opcionales para demo)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button onClick={() => window.location.reload()}>
            Verificar Configuración
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Continuar sin Configurar
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Una vez configurado el administrador, podrás crear usuarios adicionales desde el panel de administración.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSetupGuide;