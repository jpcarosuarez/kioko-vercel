import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { notifications } from '../../lib/notifications';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to monitoring service (in a real app, you'd send this to your error tracking service)
    this.logErrorToService(error, errorInfo);

    // Show error notification
    notifications.error(
      'Error inesperado',
      'Se ha producido un error en la aplicación. El equipo técnico ha sido notificado.',
      {
        duration: 8000,
        action: {
          label: 'Reportar problema',
          onClick: () => this.reportError(error, errorInfo)
        }
      }
    );
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to your error tracking service
    // like Sentry, LogRocket, Bugsnag, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous'
    };

    console.log('Error logged to service:', errorData);
    
    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, { extra: errorData });
  };

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Create mailto link for error reporting
    const subject = encodeURIComponent('Error Report - Kiosko Inmobiliario');
    const body = encodeURIComponent(`
Error Report:
${JSON.stringify(errorReport, null, 2)}

Please describe what you were doing when this error occurred:
[Your description here]
    `);
    
    window.open(`mailto:support@kioskoinmobiliario.com?subject=${subject}&body=${body}`);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                ¡Oops! Algo salió mal
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Se ha producido un error inesperado en la aplicación. 
                Nuestro equipo técnico ha sido notificado automáticamente.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error ID for support */}
              {this.state.errorId && (
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>ID del Error:</strong> {this.state.errorId}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Proporciona este ID al contactar con soporte técnico.
                  </p>
                </div>
              )}

              {/* Error details (only in development or if showDetails is true) */}
              {(process.env.NODE_ENV === 'development' || this.props.showDetails) && this.state.error && (
                <details className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <summary className="cursor-pointer text-sm font-medium text-red-800 mb-2">
                    Detalles técnicos del error
                  </summary>
                  <div className="text-xs text-red-700 space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 whitespace-pre-wrap bg-red-100 p-2 rounded text-xs overflow-x-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap bg-red-100 p-2 rounded text-xs overflow-x-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Intentar de nuevo</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Ir al inicio</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => this.reportError(this.state.error!, this.state.errorInfo!)}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <Bug className="w-4 h-4" />
                  <span>Reportar error</span>
                </Button>
              </div>

              {/* Additional help */}
              <div className="text-center text-sm text-gray-500">
                <p>
                  Si el problema persiste, puedes{' '}
                  <button
                    onClick={this.handleReload}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    recargar la página
                  </button>
                  {' '}o contactar con{' '}
                  <a
                    href="mailto:support@kioskoinmobiliario.com"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    soporte técnico
                  </a>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    console.error('Error handled by useErrorHandler:', error, errorInfo);
    
    // Log to error tracking service
    // errorTrackingService.captureException(error, { extra: errorInfo });
    
    // Show error notification
    notifications.error(
      'Error en la operación',
      error.message,
      {
        action: {
          label: 'Reintentar',
          onClick: () => window.location.reload()
        }
      }
    );
  }, []);

  return handleError;
}

export default ErrorBoundary;