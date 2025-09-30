import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LogOut, User, Shield, Building, FileText } from 'lucide-react';
import { AuthUser } from '../../types/models';

interface NavbarProps {
  user: AuthUser;
  onLogout: () => void;
  userRole: 'admin' | 'owner' | 'tenant';
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, userRole }) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-8 w-8 text-blue-600" />;
      case 'owner':
        return <Building className="h-8 w-8 text-green-600" />;
      case 'tenant':
        return <FileText className="h-8 w-8 text-purple-600" />;
      default:
        return <User className="h-8 w-8 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'owner':
        return 'Propietario';
      case 'tenant':
        return 'Inquilino';
      default:
        return 'Usuario';
    }
  };

  const getDashboardTitle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Panel de Administración';
      case 'owner':
        return 'Panel de Propietario';
      case 'tenant':
        return 'Panel de Inquilino';
      default:
        return 'Panel de Usuario';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Kiosko Inmobiliario" 
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  // Fallback to icon if logo not found
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden">
                {getRoleIcon(userRole)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Kiosko Inmobiliario</h1>
                <p className="text-sm text-gray-500">{getDashboardTitle(userRole)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{user.displayName || user.email}</span>
              <Badge variant="default" className="text-xs">
                {getRoleLabel(userRole)}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
