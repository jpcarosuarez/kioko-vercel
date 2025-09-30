import { useState, useCallback } from 'react';
import { ApiService } from '../lib/apiService';
import { User, CreateUserData, UpdateUserData, UserRole } from '../types/models';
import { UserErrorHandler, handleGenericError } from '../lib/userErrorHandling';
import { validateUserCreate, validateUserUpdate } from '../lib/userValidation';

interface UseUserManagementReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  createUser: (userData: CreateUserData) => Promise<User>;
  updateUser: (userId: string, updates: UpdateUserData) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  changePassword: (userId: string, newPassword: string) => Promise<void>;
  getAllUsers: (filters?: { role?: UserRole; isActive?: boolean; search?: string }) => Promise<void>;
  getUserById: (userId: string) => Promise<User | null>;
  toggleUserStatus: (userId: string) => Promise<User>;
  clearError: () => void;
  refreshUsers: () => Promise<void>;
}

export const useUserManagement = (): UseUserManagementReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('User management error:', error);
    
    // Use enhanced error handling
    const userError = handleGenericError(error);
    setError(userError.message);
    
    return userError;
  }, []);

  const createUser = useCallback(async (userData: CreateUserData): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate user data using enhanced validator
      const validation = validateUserCreate(userData);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        const userError = UserErrorHandler.handleValidationError('userData', firstError);
        throw new Error(userError.message);
      }

      // Use backend API to create user
      const response = await ApiService.createUser({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        isActive: userData.isActive ?? true
      });
      
      // Add the new user to the current list
      setUsers(prevUsers => [response.user, ...prevUsers]);
      
      return response.user;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateUser = useCallback(async (userId: string, updates: UpdateUserData): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate user data using enhanced validator
      const validation = validateUserUpdate(updates);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        const userError = UserErrorHandler.handleValidationError('updates', firstError);
        throw new Error(userError.message);
      }

      // Use backend API to update user
      const response = await ApiService.updateUser(userId, updates);
      
      // Update the user in the current list
      setUsers(prevUsers => 
        prevUsers.map(user => user.id === userId ? response.user : user)
      );
      
      return response.user;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteUser = useCallback(async (userId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use backend API to delete user
      await ApiService.deleteUser(userId);
      
      // Remove the user from the current list
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const changePassword = useCallback(async (userId: string, newPassword: string, confirmPassword?: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate password if confirmPassword is provided
      if (confirmPassword !== undefined) {
        const { validatePasswordChange } = await import('../lib/userValidation');
        const validation = validatePasswordChange(newPassword, confirmPassword);
        if (!validation.isValid) {
          const firstError = Object.values(validation.errors)[0];
          const userError = UserErrorHandler.handleValidationError('password', firstError);
          throw new Error(userError.message);
        }
      } else if (newPassword.length < 6) {
        const userError = UserErrorHandler.handleValidationError('password', 'La contraseña debe tener al menos 6 caracteres');
        throw new Error(userError.message);
      }

      // Note: Password change functionality should be implemented in the backend API
      // For now, we'll throw an error indicating this feature is not yet implemented
      throw new Error('Cambio de contraseña no implementado en el backend');
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getAllUsers = useCallback(async (filters?: { 
    role?: UserRole; 
    isActive?: boolean; 
    search?: string 
  }): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use backend API to get users
      const response = await ApiService.getUsers(filters);
      setUsers(response.users);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getUserById = useCallback(async (userId: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use backend API to get user by ID
      const response = await ApiService.getUserById(userId);
      return response.user;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const toggleUserStatus = useCallback(async (userId: string): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use backend API to toggle user status
      const response = await ApiService.toggleUserStatus(userId);
      
      // Update the user in the current list
      setUsers(prevUsers => 
        prevUsers.map(user => user.id === userId ? response.user : user)
      );
      
      return response.user;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const refreshUsers = useCallback(async (): Promise<void> => {
    await getAllUsers();
  }, [getAllUsers]);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    getAllUsers,
    getUserById,
    toggleUserStatus,
    clearError,
    refreshUsers
  };
};

export default useUserManagement;