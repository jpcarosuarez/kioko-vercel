import { useState, useEffect, useCallback } from 'react';
import {
  Property,
  CreatePropertyData,
  UpdatePropertyData,
  PropertyType
} from '@/types/models';
import { propertyManagementService } from '@/lib/propertyManagement';
import { toast } from 'sonner';

interface UsePropertyManagementReturn {
  // State
  properties: Property[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createProperty: (propertyData: CreatePropertyData) => Promise<void>;
  updateProperty: (propertyId: string, updates: UpdatePropertyData) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;
  transferOwnership: (propertyId: string, newOwnerId: string) => Promise<void>;
  refreshProperties: () => Promise<void>;
  
  // Filters and search
  getPropertiesByOwner: (ownerId: string) => Promise<Property[]>;
  getPropertiesByTenant: (tenantId: string) => Promise<Property[]>;
  getPropertiesByType: (type: PropertyType) => Promise<Property[]>;
  searchProperties: (searchTerm: string) => Promise<Property[]>;
  
  // Utilities
  clearError: () => void;
}

export const usePropertyManagement = (): UsePropertyManagementReturn => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Set error with user-friendly message
  const handleError = useCallback((error: unknown, defaultMessage: string) => {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    setError(errorMessage);
    toast.error(errorMessage);
    console.error(defaultMessage, error);
  }, []);

  // Load all properties
  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allProperties = await propertyManagementService.getAllProperties();
      setProperties(allProperties);
    } catch (error) {
      handleError(error, 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Create new property
  const createProperty = useCallback(async (propertyData: CreatePropertyData) => {
    try {
      setLoading(true);
      setError(null);
      
      const propertyId = await propertyManagementService.createProperty(propertyData);
      
      // Refresh properties list
      await loadProperties();
      
      toast.success('Property created successfully');
      console.log('Property created with ID:', propertyId);
    } catch (error) {
      handleError(error, 'Failed to create property');
      throw error; // Re-throw to allow form handling
    } finally {
      setLoading(false);
    }
  }, [loadProperties, handleError]);

  // Update existing property
  const updateProperty = useCallback(async (propertyId: string, updates: UpdatePropertyData) => {
    try {
      setLoading(true);
      setError(null);
      
      await propertyManagementService.updateProperty(propertyId, updates);
      
      // Refresh properties list
      await loadProperties();
      
      toast.success('Property updated successfully');
    } catch (error) {
      handleError(error, 'Failed to update property');
      throw error; // Re-throw to allow form handling
    } finally {
      setLoading(false);
    }
  }, [loadProperties, handleError]);

  // Delete property
  const deleteProperty = useCallback(async (propertyId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await propertyManagementService.deleteProperty(propertyId);
      
      // Refresh properties list
      await loadProperties();
      
      toast.success('Property and associated documents deleted successfully');
    } catch (error) {
      handleError(error, 'Failed to delete property');
      throw error; // Re-throw to allow UI handling
    } finally {
      setLoading(false);
    }
  }, [loadProperties, handleError]);

  // Transfer property ownership
  const transferOwnership = useCallback(async (propertyId: string, newOwnerId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await propertyManagementService.transferOwnership(propertyId, newOwnerId);
      
      // Refresh properties list
      await loadProperties();
      
      toast.success('Property ownership transferred successfully');
    } catch (error) {
      handleError(error, 'Failed to transfer property ownership');
      throw error; // Re-throw to allow UI handling
    } finally {
      setLoading(false);
    }
  }, [loadProperties, handleError]);

  // Get properties by owner
  const getPropertiesByOwner = useCallback(async (ownerId: string): Promise<Property[]> => {
    try {
      setError(null);
      return await propertyManagementService.getPropertiesByOwner(ownerId);
    } catch (error) {
      handleError(error, 'Failed to get properties by owner');
      return [];
    }
  }, [handleError]);

  // Get properties by tenant
  const getPropertiesByTenant = useCallback(async (tenantId: string): Promise<Property[]> => {
    try {
      setError(null);
      return await propertyManagementService.getPropertiesByTenant(tenantId);
    } catch (error) {
      handleError(error, 'Failed to get properties by tenant');
      return [];
    }
  }, [handleError]);

  // Get properties by type
  const getPropertiesByType = useCallback(async (type: PropertyType): Promise<Property[]> => {
    try {
      setError(null);
      return await propertyManagementService.getPropertiesByType(type);
    } catch (error) {
      handleError(error, 'Failed to get properties by type');
      return [];
    }
  }, [handleError]);

  // Search properties
  const searchProperties = useCallback(async (searchTerm: string): Promise<Property[]> => {
    try {
      setError(null);
      return await propertyManagementService.searchPropertiesByAddress(searchTerm);
    } catch (error) {
      handleError(error, 'Failed to search properties');
      return [];
    }
  }, [handleError]);

  // Refresh properties (alias for loadProperties)
  const refreshProperties = useCallback(async () => {
    await loadProperties();
  }, [loadProperties]);

  // Load properties on mount
  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  return {
    // State
    properties,
    loading,
    error,
    
    // Actions
    createProperty,
    updateProperty,
    deleteProperty,
    transferOwnership,
    refreshProperties,
    
    // Filters and search
    getPropertiesByOwner,
    getPropertiesByTenant,
    getPropertiesByType,
    searchProperties,
    
    // Utilities
    clearError
  };
};

export default usePropertyManagement;