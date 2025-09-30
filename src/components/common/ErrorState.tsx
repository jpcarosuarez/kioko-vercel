import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  WifiOff, 
  ServerCrash, 
  ShieldAlert,
  FileX,
  UserX
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  type?: 'network' | 'server' | 'permission' | 'notFound' | 'validation' | 'general';
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showGoHome?: boolean;
  className?: string;
}

const errorConfig = {
  network: {
    icon: WifiOff,
    title: 'Error de Conexión',
    message: 'No se pudo conectar al servidor. Verifique su conexión a internet.',
    color: 'text-orange-600 bg-orange-100'
  },
  server: {
    icon: ServerCrash,
    title: 'Error del Servidor',
    message: 'Ocurrió un error en el servidor. Intente nuevamente en unos momentos.',
    color: 'text-red-600 bg-red-100'
  },
  permission: {
    icon: ShieldAlert,
    title: 'Acceso Denegado',
    message: 'No tiene permisos para acceder a este recurso.',
    color: 'text-yellow-600 bg-yellow-100'
  },
  notFound: {
    icon: FileX,
    title: 'No Encontrado',
    message: 'El recurso solicitado no existe o ha sido eliminado.',
    color: 'text-gray-600 bg-gray-100'
  },
  validation: {
    icon: AlertTriangle,
    title: 'Error de Validación',
    message: 'Los datos proporcionados no son válidos.',
    color: 'text-blue-600 bg-blue-100'
  },
  general: {
    icon: AlertTriangle,
    title: 'Error',
    message: 'Ocurrió un error inesperado.',
    color: 'text-red-600 bg-red-100'
  }
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  type = 'general',
  onRetry,
  onGoHome,
  showRetry = true,
  showGoHome = false,
  className
}) => {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn('flex flex-col items-center justify-center min-h-64 p-6', className)}>
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className={cn(
              'mx-auto w-12 h-12 rounded-full flex items-center justify-center',
              config.color
            )}>
              <Icon className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {title || config.title}
              </h3>
              <p className="text-sm text-gray-600">
                {message || config.message}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {showRetry && onRetry && (
                <Button
                  onClick={onRetry}
                  variant="default"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reintentar</span>
                </Button>
              )}
              
              {showGoHome && onGoHome && (
                <Button
                  onClick={onGoHome}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Ir al Inicio</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Inline error alert component
export const ErrorAlert: React.FC<{
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}> = ({ title, message, onDismiss, className }) => (
  <Alert variant="destructive" className={cn('', className)}>
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription>
      {title && <strong className="block">{title}</strong>}
      {message}
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="ml-2 h-auto p-0 text-red-600 hover:text-red-800"
        >
          Cerrar
        </Button>
      )}
    </AlertDescription>
  </Alert>
);

// Form field error component
export const FieldError: React.FC<{
  message: string;
  className?: string;
}> = ({ message, className }) => (
  <p className={cn('text-xs text-red-600 flex items-center space-x-1', className)}>
    <AlertTriangle className="w-3 h-3" />
    <span>{message}</span>
  </p>
);

// Network error component
export const NetworkError: React.FC<{
  onRetry?: () => void;
  className?: string;
}> = ({ onRetry, className }) => (
  <ErrorState
    type="network"
    onRetry={onRetry}
    showRetry={!!onRetry}
    className={className}
  />
);

// Server error component
export const ServerError: React.FC<{
  onRetry?: () => void;
  className?: string;
}> = ({ onRetry, className }) => (
  <ErrorState
    type="server"
    onRetry={onRetry}
    showRetry={!!onRetry}
    className={className}
  />
);

// Permission error component
export const PermissionError: React.FC<{
  onGoHome?: () => void;
  className?: string;
}> = ({ onGoHome, className }) => (
  <ErrorState
    type="permission"
    onGoHome={onGoHome}
    showGoHome={!!onGoHome}
    showRetry={false}
    className={className}
  />
);

// Not found error component
export const NotFoundError: React.FC<{
  resourceType?: string;
  onGoHome?: () => void;
  className?: string;
}> = ({ resourceType = 'recurso', onGoHome, className }) => (
  <ErrorState
    type="notFound"
    title="No Encontrado"
    message={`El ${resourceType} solicitado no existe o ha sido eliminado.`}
    onGoHome={onGoHome}
    showGoHome={!!onGoHome}
    showRetry={false}
    className={className}
  />
);

// Validation error component
export const ValidationError: React.FC<{
  errors: string[];
  className?: string;
}> = ({ errors, className }) => (
  <Alert variant="destructive" className={cn('', className)}>
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription>
      <strong>Errores de Validación:</strong>
      <ul className="mt-2 list-disc list-inside space-y-1">
        {errors.map((error, index) => (
          <li key={index} className="text-sm">{error}</li>
        ))}
      </ul>
    </AlertDescription>
  </Alert>
);

// Empty state component (not exactly an error, but related)
export const EmptyState: React.FC<{
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}> = ({ 
  title, 
  message, 
  actionLabel, 
  onAction, 
  icon: Icon = FileX, 
  className 
}) => (
  <div className={cn('flex flex-col items-center justify-center min-h-64 p-6', className)}>
    <div className="text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  </div>
);

// Error boundary fallback component
export const ErrorBoundaryFallback: React.FC<{
  error: Error;
  resetError: () => void;
}> = ({ error, resetError }) => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Card className="w-full max-w-lg">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Algo salió mal
            </h2>
            <p className="text-sm text-gray-600">
              Ocurrió un error inesperado en la aplicación.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                  Detalles del error
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto">
                  {error.message}
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={resetError} className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Ir al Inicio</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default ErrorState;