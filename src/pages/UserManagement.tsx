import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  notifyUserCreated, 
  notifyUserUpdated, 
  notifyUserDeleted, 
  notifyUserActivated, 
  notifyUserDeactivated,
  notifyPermissionDenied,
  showError 
} from '../lib/userNotifications';
import { UserList } from '../components/users/UserList';
import { UserForm } from '../components/users/UserForm';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { useUserManagement } from '../hooks/useUserManagement';
import { User, CreateUserData, UpdateUserData, UserRole } from '../types/models';
import { FirebaseAuthService } from '../lib/firebaseAuth';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit';

export const UserManagement: React.FC = () => {
  const navigate = useNavigate();
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

  // Get current user role on component mount
  useEffect(() => {
    const getCurrentUserRole = async () => {
      try {
        const user = await FirebaseAuthService.getCurrentUserWithClaims();
        if (user?.customClaims?.role) {
          setCurrentUserRole(user.customClaims.role);
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

  // Check if current user has permission to manage users
  const canManageUsers = currentUserRole === UserRole.ADMIN;

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!loading && !canManageUsers) {
      notifyPermissionDenied('acceder a la gestión de usuarios');
      navigate('/dashboard');
    }
  }, [canManageUsers, loading, navigate]);

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

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleRetry = () => {
    clearError();
    getAllUsers();
  };

  // Show loading state while checking permissions
  if (loading && users.length === 0) {
    return <LoadingState message="Cargando gestión de usuarios..." />;
  }

  // Show error state if there's an error and no users loaded
  if (error && users.length === 0) {
    return (
      <ErrorState
        title="Error al cargar usuarios"
        message={error}
        onRetry={handleRetry}
        showBackButton
        onBack={handleBackToDashboard}
      />
    );
  }

  // Don't render anything if user doesn't have permission (will redirect)
  if (!canManageUsers) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToDashboard}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </Button>
        </div>

        {/* Main Content */}
        {viewMode === 'list' ? (
          <UserList
            users={users}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onToggleUserStatus={handleToggleUserStatus}
            onCreateUser={handleCreateUser}
            loading={loading}
            currentUserRole={currentUserRole}
          />
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={handleFormCancel}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a la lista</span>
              </Button>
            </div>

            <UserForm
              user={selectedUser}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={formLoading}
              mode={viewMode === 'create' ? 'create' : 'edit'}
            />
          </div>
        )}

        {/* Error Toast - handled by toast notifications */}
        {error && users.length > 0 && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
            <p className="text-sm">{error}</p>
            <button
              onClick={clearError}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;