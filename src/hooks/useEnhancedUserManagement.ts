/**
 * Enhanced User Management Hook
 * Integrates with the new API service for comprehensive user management
 */

import { useState, useCallback, useEffect } from 'react';
import { User, CreateUserData, UpdateUserData, UserRole } from '../types/models';
import { UserManagementService } from '../lib/userManagement';
import { useApiService, useSetUserRole, useValidateUserData, useSendNotification } from './useApiService';
import { useToast } from './use-toast';

interface UseEnhancedUserManagementReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  currentUserRole: 'admin' | 'owner' | 'tenant' | null;
  
  // User CRUD operations
  createUser: (userData: CreateUserData) => Promise<User>;
  updateUser: (userId: string, updates: UpdateUserData) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  getAllUsers: (filters?: { role?: UserRole; isActive?: boolean; search?: string }) => Promise<void>;
  getUserById: (userId: string) => Promise<User | null>;
  toggleUserStatus: (userId: string) => Promise<User>;
  
  // Enhanced API operations
  setUserRole: (userId: string, role: 'admin' | 'owner' | 'tenant') => Promise<boolean>;
  getUserClaims: (userId?: string) => Promise<any>;
  validateUserData: (userData: any) => Promise<{ valid: boolean; errors?: string[] }>;
  sendWelcomeEmail: (email: string, userName: string) => Promise<boolean>;
  
  // Utility functions
  clearError: () => void;
  refreshUsers: () => Promise<void>;
  refreshCurrentUserRole: () => Promise<void>;
}

export const useEnhancedUserManagement = (): UseEnhancedUserManagementReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'owner' | 'tenant' | null>(null);

  const { api, utils } = useApiService();
  const { setUserRole: apiSetUserRole } = useSetUserRole();
  const { validateData } = useValidateUserData();
  const { sendEmail } = useSendNotification();
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: any, operation: string) => {
    const message = error instanceof Error ? error.message : `Error in ${operation}`;
    console.error(`User management error (${operation}):`, error);
    setError(message);
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
    return message;
  }, [toast]);

  // Get current user role
  const refreshCurrentUserRole = useCallback(async () => {
    try {
      const role = await utils.getCurrentUserRole();
      setCurrentUserRole(role);
    } catch (error) {
      console.error('Error getting current user role:', error);
      setCurrentUserRole(null);
    }
  }, [utils]);

  // Load current user role on mount
  useEffect(() => {
    refreshCurrentUserRole();
  }, [refreshCurrentUserRole]);

  // Enhanced user creation with API validation and notifications
  const createUser = useCallback(async (userData: CreateUserData): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate user data using API
      const validation = await validateData(userData, 'user');
      if (!validation.valid) {
        throw new Error(validation.errors?.join(', ') || 'Validation failed');
      }

      // Create user using existing service
      const newUser = await UserManagementService.createUser(userData);
      
      // Send welcome email
      try {
        await sendEmail(
          newUser.email,
          'Welcome to Kiosko Inmobiliario',
          undefined,
          'welcome'
        );
      } catch (emailError) {
        console.warn('Failed to send welcome email:', emailError);
        // Don't fail user creation if email fails
      }

      // Refresh users list
      await refreshUsers();
      
      toast({
        title: "Success",
        description: `User ${newUser.name} created successfully`,
      });

      return newUser;
    } catch (error) {
      handleError(error, 'create user');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [validateData, sendEmail, toast, handleError]);

  // Enhanced user update with API validation
  const updateUser = useCallback(async (userId: string, updates: UpdateUserData): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate update data using API
      const validation = await validateData(updates, 'user');
      if (!validation.valid) {
        throw new Error(validation.errors?.join(', ') || 'Validation failed');
      }

      // Update user using existing service
      const updatedUser = await UserManagementService.updateUser(userId, updates);
      
      // Refresh users list
      await refreshUsers();
      
      toast({
        title: "Success",
        description: `User ${updatedUser.name} updated successfully`,
      });

      return updatedUser;
    } catch (error) {
      handleError(error, 'update user');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [validateData, toast, handleError]);

  // Enhanced user deletion with confirmation
  const deleteUser = useCallback(async (userId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await UserManagementService.deleteUser(userId);
      
      // Refresh users list
      await refreshUsers();
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      handleError(error, 'delete user');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast, handleError]);

  // Get all users
  const getAllUsers = useCallback(async (filters?: { role?: UserRole; isActive?: boolean; search?: string }): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const usersList = await UserManagementService.getAllUsers(filters);
      setUsers(usersList);
    } catch (error) {
      handleError(error, 'get all users');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Get user by ID
  const getUserById = useCallback(async (userId: string): Promise<User | null> => {
    try {
      return await UserManagementService.getUserById(userId);
    } catch (error) {
      handleError(error, 'get user by ID');
      return null;
    }
  }, [handleError]);

  // Toggle user status
  const toggleUserStatus = useCallback(async (userId: string): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await UserManagementService.toggleUserStatus(userId);
      
      // Refresh users list
      await refreshUsers();
      
      toast({
        title: "Success",
        description: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      });

      return updatedUser;
    } catch (error) {
      handleError(error, 'toggle user status');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast, handleError]);

  // Set user role using API
  const setUserRole = useCallback(async (userId: string, role: 'admin' | 'owner' | 'tenant'): Promise<boolean> => {
    try {
      const success = await apiSetUserRole(userId, role);
      if (success) {
        // Refresh users list to show updated role
        await refreshUsers();
      }
      return success;
    } catch (error) {
      handleError(error, 'set user role');
      return false;
    }
  }, [apiSetUserRole, handleError]);

  // Get user claims using API
  const getUserClaims = useCallback(async (userId?: string) => {
    try {
      return await api.getUserClaims(userId);
    } catch (error) {
      handleError(error, 'get user claims');
      return null;
    }
  }, [api, handleError]);

  // Validate user data using API
  const validateUserData = useCallback(async (userData: any): Promise<{ valid: boolean; errors?: string[] }> => {
    try {
      return await validateData(userData, 'user');
    } catch (error) {
      handleError(error, 'validate user data');
      return { valid: false, errors: ['Validation service unavailable'] };
    }
  }, [validateData, handleError]);

  // Send welcome email using API
  const sendWelcomeEmail = useCallback(async (email: string, userName: string): Promise<boolean> => {
    try {
      await sendEmail(
        email,
        'Welcome to Kiosko Inmobiliario',
        `Welcome ${userName}! Your account has been created successfully.`,
        'welcome'
      );
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }, [sendEmail]);

  // Refresh users list
  const refreshUsers = useCallback(async (): Promise<void> => {
    await getAllUsers();
  }, [getAllUsers]);

  return {
    users,
    loading,
    error,
    currentUserRole,
    
    // User CRUD operations
    createUser,
    updateUser,
    deleteUser,
    getAllUsers,
    getUserById,
    toggleUserStatus,
    
    // Enhanced API operations
    setUserRole,
    getUserClaims,
    validateUserData,
    sendWelcomeEmail,
    
    // Utility functions
    clearError,
    refreshUsers,
    refreshCurrentUserRole,
  };
};