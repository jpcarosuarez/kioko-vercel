/**
 * Custom hook for API Service
 * Provides reactive state management for API calls
 */

import { useState, useCallback } from 'react';
import { ApiService, apiUtils } from '../lib/apiService';
import { useToast } from './use-toast';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApiService() {
  const { toast } = useToast();

  // Generic API call hook
  const useApiCall = <T>(
    apiFunction: () => Promise<T>,
    options: {
      onSuccess?: (data: T) => void;
      onError?: (error: string) => void;
      showSuccessToast?: boolean;
      showErrorToast?: boolean;
      successMessage?: string;
    } = {}
  ) => {
    const [state, setState] = useState<ApiState<T>>({
      data: null,
      loading: false,
      error: null,
    });

    const execute = useCallback(async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const data = await apiFunction();
        setState({ data, loading: false, error: null });
        
        if (options.onSuccess) {
          options.onSuccess(data);
        }
        
        if (options.showSuccessToast) {
          toast({
            title: "Success",
            description: options.successMessage || "Operation completed successfully",
          });
        }
        
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        
        if (options.onError) {
          options.onError(errorMessage);
        }
        
        if (options.showErrorToast) {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
        
        throw error;
      }
    }, [apiFunction, options, toast]);

    return { ...state, execute };
  };

  // Authentication hooks
  const useSetCustomClaims = () => {
    return useApiCall(
      () => Promise.resolve(null), // Placeholder, will be called with actual params
      {
        showSuccessToast: true,
        showErrorToast: true,
        successMessage: "User role updated successfully"
      }
    );
  };

  const useGetUserClaims = () => {
    return useApiCall(
      () => ApiService.getUserClaims(),
      {
        showErrorToast: true
      }
    );
  };

  const useInitializeAdmin = () => {
    return useApiCall(
      () => Promise.resolve(null), // Placeholder
      {
        showSuccessToast: true,
        showErrorToast: true,
        successMessage: "Admin initialized successfully"
      }
    );
  };

  // Validation hooks
  const useValidateData = () => {
    return useApiCall(
      () => Promise.resolve(null), // Placeholder
      {
        showErrorToast: true
      }
    );
  };

  // Maintenance hooks
  const useCleanupData = () => {
    return useApiCall(
      () => Promise.resolve(null), // Placeholder
      {
        showSuccessToast: true,
        showErrorToast: true,
        successMessage: "Data cleanup completed"
      }
    );
  };

  const useCreateBackup = () => {
    return useApiCall(
      () => Promise.resolve(null), // Placeholder
      {
        showSuccessToast: true,
        showErrorToast: true,
        successMessage: "Backup created successfully"
      }
    );
  };

  const useCheckIntegrity = () => {
    return useApiCall(
      () => ApiService.checkDataIntegrity(),
      {
        showErrorToast: true
      }
    );
  };

  const useSystemStatus = () => {
    return useApiCall(
      () => ApiService.getSystemStatus(),
      {
        showErrorToast: true
      }
    );
  };

  // Notification hooks
  const useSendEmail = () => {
    return useApiCall(
      () => Promise.resolve(null), // Placeholder
      {
        showSuccessToast: true,
        showErrorToast: true,
        successMessage: "Email sent successfully"
      }
    );
  };

  const useSendBulkEmail = () => {
    return useApiCall(
      () => Promise.resolve(null), // Placeholder
      {
        showSuccessToast: true,
        showErrorToast: true,
        successMessage: "Bulk emails sent successfully"
      }
    );
  };

  // Utility functions with hooks
  const useUserRole = () => {
    const [role, setRole] = useState<'admin' | 'owner' | 'tenant' | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchRole = useCallback(async () => {
      setLoading(true);
      try {
        const userRole = await apiUtils.getCurrentUserRole();
        setRole(userRole);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }, []);

    return { role, loading, fetchRole };
  };

  const useSystemHealth = () => {
    const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);

    const checkHealth = useCallback(async () => {
      setLoading(true);
      try {
        const healthy = await apiUtils.checkSystemHealth();
        setIsHealthy(healthy);
      } catch (error) {
        console.error('Error checking system health:', error);
        setIsHealthy(false);
      } finally {
        setLoading(false);
      }
    }, []);

    return { isHealthy, loading, checkHealth };
  };

  // Direct API service access
  const api = ApiService;
  const utils = apiUtils;

  return {
    // API service
    api,
    utils,
    
    // Authentication
    useSetCustomClaims,
    useGetUserClaims,
    useInitializeAdmin,
    
    // Validation
    useValidateData,
    
    // Maintenance
    useCleanupData,
    useCreateBackup,
    useCheckIntegrity,
    useSystemStatus,
    
    // Notifications
    useSendEmail,
    useSendBulkEmail,
    
    // Utilities
    useUserRole,
    useSystemHealth,
    
    // Generic hook
    useApiCall,
  };
}

// Specific action hooks with parameters
export function useSetUserRole() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const setUserRole = useCallback(async (uid: string, role: 'admin' | 'owner' | 'tenant') => {
    setLoading(true);
    try {
      await ApiService.setCustomClaims({ uid, role });
      toast({
        title: "Success",
        description: `User role updated to ${role}`,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user role';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { setUserRole, loading };
}

export function useValidateUserData() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const validateData = useCallback(async (data: any, schema: 'user' | 'document' | 'property' | 'transaction') => {
    setLoading(true);
    try {
      const result = await ApiService.validateData({ data, schema });
      if (!result.valid && result.errors) {
        toast({
          title: "Validation Failed",
          description: result.errors.join(', '),
          variant: "destructive",
        });
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validation failed';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return { valid: false, errors: [message], message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { validateData, loading };
}

export function useSendNotification() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const sendEmail = useCallback(async (
    to: string, 
    subject: string, 
    body?: string, 
    template?: 'welcome' | 'password-reset' | 'document-approved' | 'document-rejected' | 'maintenance-notice'
  ) => {
    setLoading(true);
    try {
      const result = await ApiService.sendEmail({ to, subject, body, template });
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send email';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { sendEmail, loading };
}