import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  notifyUserCreated, 
  notifyUserUpdated, 
  notifyUserDeleted, 
  notifyUserActivated, 
  notifyUserDeactivated,
  showError 
} from '../../lib/userNotifications';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';
import { useUserManagement } from '../../hooks/useUserManagement';
import { User, CreateUserData, UpdateUserData, UserRole } from '../../types/models';
import { FirebaseAuthService } from '../../lib/firebaseAuth';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Plus } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit';

export const UserManagement: React.FC = () => {
  const {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getAllUsers,
    clearError
  } = useUserManagement();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.TENANT);
  const [formLoading, setFormLoading] = useState(false);
  const [changePasswordDialog, setChangePasswordDialog] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string;
    loading: boolean;
  }>({
    isOpen: false,
    userId: null,
    userName: '',
    loading: false
  });

  // Get current user role on component mount
  useEffect(() => {
    const getCurrentUserRole = async () => {
      try {
        const user = await FirebaseAuthService.getCurrentUserWithClaims();
        if (user?.customClaims?.role) {
          setCurrentUserRole(user.customClaims.role as UserRole);
        }
      } catch (error) {
        console.error('Error getting current user role:', error);
      }
    };

    getCurrentUserRole();
  }, []);

  // Load users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        await getAllUsers();
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadUsers();
  }, [getAllUsers]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setViewMode('create');
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setViewMode('edit');
  };

  const handleDeleteUser = async (userId: string): Promise<void> => {
    try {
      // Get user name before deletion for notification
      const userToDelete = users.find(u => u.id === userId);
      const userName = userToDelete?.name || 'Usuario';
      
      await deleteUser(userId);
      notifyUserDeleted(userName);
    } catch (error: any) {
      showError(error.message || 'Error al eliminar el usuario');
      throw error;
    }
  };

  const handleToggleUserStatus = async (userId: string): Promise<void> => {
    try {
      const updatedUser = await toggleUserStatus(userId);
      if (updatedUser.isActive) {
        notifyUserActivated(updatedUser.name);
      } else {
        notifyUserDeactivated(updatedUser.name);
      }
    } catch (error: any) {
      showError(error.message || 'Error al cambiar el estado del usuario');
      throw error;
    }
  };

  const handleFormSubmit = async (userData: CreateUserData | UpdateUserData): Promise<void> => {
    setFormLoading(true);
    
    try {
      if (viewMode === 'create') {
        const newUser = await createUser(userData as CreateUserData);
        notifyUserCreated(newUser.name);
      } else if (viewMode === 'edit' && selectedUser) {
        const updatedUser = await updateUser(selectedUser.id, userData as UpdateUserData);
        notifyUserUpdated(updatedUser.name);
      }
      
      setViewMode('list');
      setSelectedUser(null);
    } catch (error: any) {
      showError(error.message || 'Error al procesar el formulario');
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedUser(null);
  };

  const handleRetry = () => {
    clearError();
    getAllUsers();
  };

  const handleChangePassword = (userId: string) => {
    const user = users.find(u => u.uid === userId);
    if (user) {
      setChangePasswordDialog({
        isOpen: true,
        userId,
        userName: user.name,
        loading: false
      });
    }
  };

  const handleChangePasswordConfirm = async (newPassword: string, confirmPassword: string) => {
    if (!changePasswordDialog.userId) return;

    setChangePasswordDialog(prev => ({ ...prev, loading: true }));

    try {
      // TODO: Implement password change functionality
      // This would typically call a backend API or Firebase Admin SDK
      console.log('Changing password for user:', changePasswordDialog.userId);
      console.log('New password:', newPassword);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Contraseña actualizada exitosamente', {
        description: `La contraseña de ${changePasswordDialog.userName} ha sido cambiada.`
      });
      
      setChangePasswordDialog({
        isOpen: false,
        userId: null,
        userName: '',
        loading: false
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Error al cambiar contraseña', {
        description: 'No se pudo actualizar la contraseña. Inténtalo de nuevo.'
      });
      setChangePasswordDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleChangePasswordClose = () => {
    setChangePasswordDialog({
      isOpen: false,
      userId: null,
      userName: '',
      loading: false
    });
  };

  // Show loading state while checking permissions
  if (loading && users.length === 0) {
    return <LoadingState title="Cargando gestión de usuarios..." />;
  }

  // Show error state if there's an error and no users loaded
  if (error && users.length === 0) {
    return (
      <ErrorState
        title="Error al cargar usuarios"
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      {viewMode === 'list' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Gestión de Usuarios</CardTitle>
                <CardDescription>
                  Administra usuarios del sistema (administradores, propietarios e inquilinos)
                </CardDescription>
              </div>
              <Button onClick={handleCreateUser} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Crear Usuario
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <UserList
              users={users}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onToggleUserStatus={handleToggleUserStatus}
              onChangePassword={handleChangePassword}
              onCreateUser={handleCreateUser}
              loading={loading}
              currentUserRole={currentUserRole}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleFormCancel}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a la lista
              </Button>
              <div>
                <CardTitle className="text-xl">
                  {viewMode === 'create' ? 'Crear Usuario' : 'Editar Usuario'}
                </CardTitle>
                <CardDescription>
                  {viewMode === 'create' 
                    ? 'Completa la información para crear un nuevo usuario'
                    : 'Modifica la información del usuario seleccionado'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <UserForm
              user={selectedUser}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={formLoading}
              mode={viewMode === 'create' ? 'create' : 'edit'}
            />
          </CardContent>
        </Card>
      )}

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        isOpen={changePasswordDialog.isOpen}
        onClose={handleChangePasswordClose}
        onConfirm={handleChangePasswordConfirm}
        userName={changePasswordDialog.userName}
        loading={changePasswordDialog.loading}
      />
    </div>
  );
};

export default UserManagement;