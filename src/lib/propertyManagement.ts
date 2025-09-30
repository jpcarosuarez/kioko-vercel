import {
  Property,
  CreatePropertyData,
  UpdatePropertyData,
  PropertyType,
  Document
} from '@/types/models';
import { propertiesService, documentsService, COLLECTIONS } from './firestore';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Property Management Service
 * Handles all property-related operations including CRUD and ownership transfers
 */
export class PropertyManagementService {
  
  /**
   * Create a new property
   */
  async createProperty(propertyData: CreatePropertyData): Promise<string> {
    try {
      // Validate required fields
      this.validatePropertyData(propertyData);
      
      // Create property with default values
      const propertyToCreate = {
        ...propertyData,
        isActive: propertyData.isActive ?? true,
        description: propertyData.description || '',
        features: propertyData.features || []
      };

      const propertyId = await propertiesService.create(propertyToCreate);
      
      console.log('Property created successfully:', propertyId);
      return propertyId;
    } catch (error) {
      console.error('Error creating property:', error);
      throw new Error(`Failed to create property: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing property
   */
  async updateProperty(propertyId: string, updates: UpdatePropertyData): Promise<void> {
    try {
      // Check if property exists
      const existingProperty = await propertiesService.getById(propertyId);
      if (!existingProperty) {
        throw new Error('Property not found');
      }

      // Validate update data if provided
      if (Object.keys(updates).length > 0) {
        this.validatePropertyUpdateData(updates);
      }

      await propertiesService.update(propertyId, updates);
      
      console.log('Property updated successfully:', propertyId);
    } catch (error) {
      console.error('Error updating property:', error);
      throw new Error(`Failed to update property: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a property and cascade delete all associated documents
   */
  async deleteProperty(propertyId: string): Promise<void> {
    try {
      // Check if property exists
      const existingProperty = await propertiesService.getById(propertyId);
      if (!existingProperty) {
        throw new Error('Property not found');
      }

      // Get all documents associated with this property
      const associatedDocuments = await documentsService.getWhere('propertyId', '==', propertyId);
      
      // Use batch operation to delete property and all associated documents
      const batch = writeBatch(db);
      
      // Delete the property
      const propertyRef = doc(db, COLLECTIONS.PROPERTIES, propertyId);
      batch.delete(propertyRef);
      
      // Delete all associated documents
      associatedDocuments.forEach(document => {
        const docRef = doc(db, COLLECTIONS.DOCUMENTS, document.id);
        batch.delete(docRef);
      });
      
      await batch.commit();
      
      console.log(`Property ${propertyId} and ${associatedDocuments.length} associated documents deleted successfully`);
    } catch (error) {
      console.error('Error deleting property:', error);
      throw new Error(`Failed to delete property: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transfer ownership of a property to a new owner
   */
  async transferOwnership(propertyId: string, newOwnerId: string): Promise<void> {
    try {
      // Check if property exists
      const existingProperty = await propertiesService.getById(propertyId);
      if (!existingProperty) {
        throw new Error('Property not found');
      }

      // Validate new owner ID
      if (!newOwnerId || newOwnerId.trim() === '') {
        throw new Error('New owner ID is required');
      }

      // Get all documents associated with this property
      const associatedDocuments = await documentsService.getWhere('propertyId', '==', propertyId);
      
      // Use batch operation to update property owner and all associated documents
      const batch = writeBatch(db);
      
      // Update property owner
      const propertyRef = doc(db, COLLECTIONS.PROPERTIES, propertyId);
      batch.update(propertyRef, { 
        ownerId: newOwnerId,
        updatedAt: new Date()
      });
      
      // Update owner for all associated documents
      associatedDocuments.forEach(document => {
        const docRef = doc(db, COLLECTIONS.DOCUMENTS, document.id);
        batch.update(docRef, { 
          ownerId: newOwnerId,
          updatedAt: new Date()
        });
      });
      
      await batch.commit();
      
      console.log(`Property ${propertyId} ownership transferred to ${newOwnerId}. Updated ${associatedDocuments.length} associated documents.`);
    } catch (error) {
      console.error('Error transferring property ownership:', error);
      throw new Error(`Failed to transfer property ownership: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all properties
   */
  async getAllProperties(): Promise<Property[]> {
    try {
      return await propertiesService.getAll();
    } catch (error) {
      console.error('Error getting all properties:', error);
      throw new Error(`Failed to get properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get properties by owner ID
   */
  async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
    try {
      return await propertiesService.getWhere('ownerId', '==', ownerId);
    } catch (error) {
      console.error('Error getting properties by owner:', error);
      throw new Error(`Failed to get properties by owner: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get properties by tenant ID
   */
  async getPropertiesByTenant(tenantId: string): Promise<Property[]> {
    try {
      return await propertiesService.getWhere('tenantId', '==', tenantId);
    } catch (error) {
      console.error('Error getting properties by tenant:', error);
      throw new Error(`Failed to get properties by tenant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get property by ID
   */
  async getPropertyById(propertyId: string): Promise<Property | null> {
    try {
      return await propertiesService.getById(propertyId);
    } catch (error) {
      console.error('Error getting property by ID:', error);
      throw new Error(`Failed to get property: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get active properties only
   */
  async getActiveProperties(): Promise<Property[]> {
    try {
      return await propertiesService.getWhere('isActive', '==', true);
    } catch (error) {
      console.error('Error getting active properties:', error);
      throw new Error(`Failed to get active properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search properties by address
   */
  async searchPropertiesByAddress(searchTerm: string): Promise<Property[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation that gets all properties and filters client-side
      // For production, consider using Algolia or similar service for better search
      const allProperties = await this.getAllProperties();
      
      return allProperties.filter(property => 
        property.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching properties:', error);
      throw new Error(`Failed to search properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get properties by type
   */
  async getPropertiesByType(type: PropertyType): Promise<Property[]> {
    try {
      return await propertiesService.getWhere('type', '==', type);
    } catch (error) {
      console.error('Error getting properties by type:', error);
      throw new Error(`Failed to get properties by type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate property creation data
   */
  private validatePropertyData(data: CreatePropertyData): void {
    if (!data.address || data.address.trim().length < 5) {
      throw new Error('Address must be at least 5 characters long');
    }

    if (!data.type || !Object.values(PropertyType).includes(data.type)) {
      throw new Error('Valid property type is required');
    }

    if (!data.ownerId || data.ownerId.trim() === '') {
      throw new Error('Owner ID is required');
    }

    // Image URL is optional for updates, required for creation
    if (!data.imageUrl || data.imageUrl.trim() === '') {
      // Only require image for new properties, not updates
      if (!data.id) {
        throw new Error('Image URL is required for new properties');
      }
    }

    if (!data.contractStartDate || data.contractStartDate.trim() === '') {
      throw new Error('Contract start date is required');
    }

    if (typeof data.rentalValue !== 'number' || data.rentalValue <= 0) {
      throw new Error('Rental value must be a positive number');
    }

    // Validate optional numeric fields
    if (data.bedrooms !== undefined && (typeof data.bedrooms !== 'number' || data.bedrooms < 0)) {
      throw new Error('Bedrooms must be a non-negative number');
    }


    if (data.squareMeters !== undefined && (typeof data.squareMeters !== 'number' || data.squareMeters <= 0)) {
      throw new Error('Square meters must be a positive number');
    }

  }

  /**
   * Validate property update data
   */
  private validatePropertyUpdateData(data: UpdatePropertyData): void {
    if (data.address !== undefined && (!data.address || data.address.trim().length < 5)) {
      throw new Error('Address must be at least 5 characters long');
    }

    if (data.type !== undefined && !Object.values(PropertyType).includes(data.type)) {
      throw new Error('Valid property type is required');
    }

    if (data.ownerId !== undefined && (!data.ownerId || data.ownerId.trim() === '')) {
      throw new Error('Owner ID cannot be empty');
    }

    if (data.imageUrl !== undefined && (!data.imageUrl || data.imageUrl.trim() === '')) {
      throw new Error('Image URL cannot be empty');
    }

    if (data.contractStartDate !== undefined && (!data.contractStartDate || data.contractStartDate.trim() === '')) {
      throw new Error('Contract start date cannot be empty');
    }

    if (data.rentalValue !== undefined && (typeof data.rentalValue !== 'number' || data.rentalValue <= 0)) {
      throw new Error('Rental value must be a positive number');
    }

    // Validate optional numeric fields
    if (data.bedrooms !== undefined && (typeof data.bedrooms !== 'number' || data.bedrooms < 0)) {
      throw new Error('Bedrooms must be a non-negative number');
    }


    if (data.squareMeters !== undefined && (typeof data.squareMeters !== 'number' || data.squareMeters <= 0)) {
      throw new Error('Square meters must be a positive number');
    }

  }
}

// Export singleton instance
export const propertyManagementService = new PropertyManagementService();

// Export individual functions for easier importing
export const {
  createProperty,
  updateProperty,
  deleteProperty,
  transferOwnership,
  getAllProperties,
  getPropertiesByOwner,
  getPropertiesByTenant,
  getPropertyById,
  getActiveProperties,
  searchPropertiesByAddress,
  getPropertiesByType
} = propertyManagementService;

export default propertyManagementService;