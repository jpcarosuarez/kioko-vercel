import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { User, UserRole } from '../../types/models';
import { DeleteUserDialog } from '../common/ConfirmationDialog';
import { 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  UserPlus, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  ShieldCheck,
  Crown,
  User as UserIcon,
  Key
} from 'lucide-react';
import { firestoreUtils } from '../../lib/firestore';

interface UserListProps {
  users: User[];
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => Promise<void>;
  onToggleUserStatus: (userId: string) => Promise<void>;
  onChangePassword: (userId: string) => void;
  onCreateUser: () => void;
  loading?: boolean;
  currentUserRole?: UserRole;
}

interface Filters {
  search: string;
  role: string;
  status: string;
}

const roleConfig = {
  [UserRole.ADMIN]: {
    label: 'Administrador',
    icon: Shield,
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  [UserRole.OWNER]: {
    label: 'Propietario',
    icon: Crown,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  [UserRole.TENANT]: {
    label: 'Inquilino',
    icon: UserIcon,
    color: 'bg-green-100 text-green-800 border-green-200'
  }
};

export const UserList: React.FC<UserListProps> = ({
  users,
  onEditUser,
  onDeleteUser,
  onToggleUserStatus,
  onChangePassword,
  onCreateUser,
  loading = false,
  currentUserRole = UserRole.TENANT
}) => {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    role: '',
    status: ''
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: User | null;
    loading: boolean;
  }>({
    open: false,
    user: null,
    loading: false
  });

  // Filter users based on current filters
  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = !filters.search || 
      user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.phone.includes(filters.search);

    const matchesRole = !filters.role || filters.role === 'all' || user.role === filters.role;

    const matchesStatus = !filters.status || filters.status === 'all' ||
      (filters.status === 'active' && user.isActive) ||
      (filters.status === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;

    console.log('UserList handleDeleteUser - user:', deleteDialog.user);
    console.log('UserList handleDeleteUser - user.id:', deleteDialog.user.id);

    setDeleteDialog(prev => ({ ...prev, loading: true }));
    
    try {
      await onDeleteUser(deleteDialog.user.id);
      setDeleteDialog({ open: false, user: null, loading: false });
    } catch (error) {
      console.error('Error deleting user:', error);
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await onToggleUserStatus(user.id);
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const canEditUser = (user: User): boolean => {
    if (currentUserRole === UserRole.ADMIN) return true;
    return false; // Only admins can edit users
  };

  const canDeleteUser = (user: User): boolean => {
    if (currentUserRole === UserRole.ADMIN) return true;
    return false; // Only admins can delete users
  };

  const getRoleIcon = (role: UserRole) => {
    const config = roleConfig[role];
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Nunca';
    
    try {
      // Handle Firestore Timestamp
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Handle Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Handle string or number timestamp
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-neutral-600">
            {filteredUsers.length} de {users.length} usuarios
          </p>
        </div>
        
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                <SelectItem value={UserRole.OWNER}>Propietario</SelectItem>
                <SelectItem value={UserRole.TENANT}>Inquilino</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserIcon className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No se encontraron usuarios</h3>
            <p className="text-neutral-600 mb-4">
              {users.length === 0 
                ? 'No hay usuarios registrados en el sistema.'
                : 'No hay usuarios que coincidan con los filtros aplicados.'
              }
            </p>
            {currentUserRole === UserRole.ADMIN && users.length === 0 && (
              <Button onClick={onCreateUser} className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4" />
                <span>Crear Primer Usuario</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredUsers.map((user) => {
            const userRoleConfig = roleConfig[user.role];
            
            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{user.name}</h3>
                        <Badge className={`text-xs ${userRoleConfig.color}`}>
                          {userRoleConfig.label}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() => handleToggleStatus(user)}
                        disabled={!canEditUser(user)}
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-neutral-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    
                    {user.phone && (
                      <div className="flex items-center space-x-2 text-neutral-600">
                        <Phone className="w-4 h-4" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-neutral-600">
                      <Calendar className="w-4 h-4" />
                      <span>Creado: {formatDate(user.createdAt)}</span>
                    </div>
                    
                    {user.lastLoginAt && (
                      <div className="flex items-center space-x-2 text-neutral-600">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Último acceso: {formatDate(user.lastLoginAt)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-1">
                      {canEditUser(user) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditUser(user)}
                          className="flex items-center justify-center space-x-1 flex-1 min-w-0"
                        >
                          <Edit className="w-3 h-3 flex-shrink-0" />
                          <span className="hidden sm:inline truncate">Editar</span>
                        </Button>
                      )}
                      
                      {canEditUser(user) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onChangePassword(user.id)}
                          className="flex items-center justify-center space-x-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex-1 min-w-0"
                        >
                          <Key className="w-3 h-3 flex-shrink-0" />
                          <span className="hidden sm:inline truncate">Cambiar Contraseña</span>
                        </Button>
                      )}
                      
                      {canDeleteUser(user) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, user, loading: false })}
                          className="flex items-center justify-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 min-w-0"
                        >
                          <Trash2 className="w-3 h-3 flex-shrink-0" />
                          <span className="hidden sm:inline truncate">Eliminar</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteUserDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        onConfirm={handleDeleteUser}
        userName={deleteDialog.user?.name || ''}
        isLoading={deleteDialog.loading}
      />
    </div>
  );
};

export default UserList;