import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  runTransaction,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  PROPERTIES: 'properties',
  DOCUMENTS: 'documents',
  SETTINGS: 'settings',
  AUDIT_LOGS: 'audit_logs'
} as const;

// Generic Firestore service class
export class BaseFirestoreService<T> {
  constructor(private collectionName: string) {}

  // Create a new document
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docData = {
        ...data,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(collection(db, this.collectionName), docData);
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Get a document by ID
  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as T;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting document ${id} from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Get all documents
  async getAll(): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T));
    } catch (error) {
      console.error(`Error getting all documents from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Get documents with query
  async getWhere(
    field: string, 
    operator: any, 
    value: any, 
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'asc',
    limitCount?: number
  ): Promise<T[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where(field, operator, value)
      );

      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection));
      }

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T));
    } catch (error) {
      console.error(`Error querying documents from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Update a document
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const updateData = {
        ...data,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error(`Error updating document ${id} in ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Delete a document
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document ${id} from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Listen to real-time updates for a document
  onDocumentSnapshot(id: string, callback: (data: T | null) => void): Unsubscribe {
    const docRef = doc(db, this.collectionName, id);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data()
        } as T);
      } else {
        callback(null);
      }
    });
  }

  // Listen to real-time updates for a collection
  onCollectionSnapshot(callback: (data: T[]) => void): Unsubscribe {
    const collectionRef = collection(db, this.collectionName);
    return onSnapshot(collectionRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T));
      callback(data);
    });
  }

  // Batch operations
  async batchWrite(operations: Array<{
    type: 'create' | 'update' | 'delete';
    id?: string;
    data?: any;
  }>): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      operations.forEach(operation => {
        const docRef = operation.id 
          ? doc(db, this.collectionName, operation.id)
          : doc(collection(db, this.collectionName));

        switch (operation.type) {
          case 'create':
            batch.set(docRef, {
              ...operation.data,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...operation.data,
              updatedAt: Timestamp.now()
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
    } catch (error) {
      console.error(`Error in batch operation for ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Transaction operations
  async runTransaction<R>(
    updateFunction: (transaction: any) => Promise<R>
  ): Promise<R> {
    try {
      return await runTransaction(db, updateFunction);
    } catch (error) {
      console.error(`Error in transaction for ${this.collectionName}:`, error);
      throw error;
    }
  }
}

// Specialized service instances
export const usersService = new BaseFirestoreService(COLLECTIONS.USERS);
export const propertiesService = new BaseFirestoreService(COLLECTIONS.PROPERTIES);
export const documentsService = new BaseFirestoreService(COLLECTIONS.DOCUMENTS);
export const settingsService = new BaseFirestoreService(COLLECTIONS.SETTINGS);
export const auditLogsService = new BaseFirestoreService(COLLECTIONS.AUDIT_LOGS);

// Extended Firestore service with specific business logic
export class ExtendedFirestoreService {
  // Get properties assigned to a tenant
  static async getPropertiesByTenant(tenantId: string): Promise<any[]> {
    try {
      return await propertiesService.getWhere('tenantId', '==', tenantId, 'createdAt', 'desc');
    } catch (error) {
      console.error('Error getting properties by tenant:', error);
      throw error;
    }
  }

  // Get properties owned by an owner
  static async getPropertiesByOwner(ownerId: string): Promise<any[]> {
    try {
      return await propertiesService.getWhere('ownerId', '==', ownerId, 'createdAt', 'desc');
    } catch (error) {
      console.error('Error getting properties by owner:', error);
      throw error;
    }
  }

  // Get a specific property by ID
  static async getPropertyById(propertyId: string): Promise<any | null> {
    try {
      return await propertiesService.getById(propertyId);
    } catch (error) {
      console.error('Error getting property by ID:', error);
      throw error;
    }
  }

  // Get documents for multiple properties with visibility filtering
  static async getDocumentsByProperties(propertyIds: string[], userRole?: string): Promise<any[]> {
    try {
      if (propertyIds.length === 0) return [];
      
      // Firestore 'in' queries are limited to 10 items, so we need to batch them
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < propertyIds.length; i += batchSize) {
        const batch = propertyIds.slice(i, i + batchSize);
        const batchQuery = documentsService.getWhere('propertyId', 'in', batch, 'uploadedAt', 'desc');
        batches.push(batchQuery);
      }
      
      const results = await Promise.all(batches);
      const documents = results.flat();

      // Filtrar por visibilidad si no es admin
      if (userRole && userRole !== 'admin') {
        return documents.filter((doc: any) => {
          if (userRole === 'owner') {
            return doc.visibility === 'both' || doc.visibility === 'owner';
          } else if (userRole === 'tenant') {
            return doc.visibility === 'both' || doc.visibility === 'tenant';
          }
          return true;
        });
      }

      return documents;
    } catch (error) {
      console.error('Error getting documents by properties:', error);
      throw error;
    }
  }

  // Get documents for a specific property
  static async getDocumentsByProperty(propertyId: string): Promise<any[]> {
    try {
      return await documentsService.getWhere('propertyId', '==', propertyId, 'uploadedAt', 'desc');
    } catch (error) {
      console.error('Error getting documents by property:', error);
      throw error;
    }
  }

  // Get documents owned by a user
  static async getDocumentsByOwner(ownerId: string): Promise<any[]> {
    try {
      return await documentsService.getWhere('ownerId', '==', ownerId, 'uploadedAt', 'desc');
    } catch (error) {
      console.error('Error getting documents by owner:', error);
      throw error;
    }
  }

  // Get users by role
  static async getUsersByRole(role: string): Promise<any[]> {
    try {
      return await usersService.getWhere('role', '==', role, 'createdAt', 'desc');
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }

  // Get active users
  static async getActiveUsers(): Promise<any[]> {
    try {
      return await usersService.getWhere('isActive', '==', true, 'createdAt', 'desc');
    } catch (error) {
      console.error('Error getting active users:', error);
      throw error;
    }
  }

  // Get active properties
  static async getActiveProperties(): Promise<any[]> {
    try {
      return await propertiesService.getWhere('isActive', '==', true, 'createdAt', 'desc');
    } catch (error) {
      console.error('Error getting active properties:', error);
      throw error;
    }
  }

  // Get active documents
  static async getActiveDocuments(): Promise<any[]> {
    try {
      return await documentsService.getWhere('isActive', '==', true, 'uploadedAt', 'desc');
    } catch (error) {
      console.error('Error getting active documents:', error);
      throw error;
    }
  }

  // Search properties by address
  static async searchPropertiesByAddress(searchTerm: string): Promise<any[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a simple implementation that gets all properties and filters client-side
      // For production, consider using Algolia or similar service
      const allProperties = await propertiesService.getAll();
      return allProperties.filter((property: any) => 
        property.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching properties:', error);
      throw error;
    }
  }

  // Get dashboard statistics
  static async getDashboardStats(): Promise<{
    totalUsers: number;
    totalProperties: number;
    totalDocuments: number;
    activeUsers: number;
    activeProperties: number;
    recentActivity: any[];
  }> {
    try {
      const [
        totalUsers,
        totalProperties,
        totalDocuments,
        activeUsers,
        activeProperties
      ] = await Promise.all([
        firestoreUtils.getCollectionSize(COLLECTIONS.USERS),
        firestoreUtils.getCollectionSize(COLLECTIONS.PROPERTIES),
        firestoreUtils.getCollectionSize(COLLECTIONS.DOCUMENTS),
        this.getActiveUsers().then(users => users.length),
        this.getActiveProperties().then(properties => properties.length)
      ]);

      return {
        totalUsers,
        totalProperties,
        totalDocuments,
        activeUsers,
        activeProperties,
        recentActivity: [] // TODO: Implement recent activity tracking
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }
}

// Utility functions for common operations
export const firestoreUtils = {
  // Convert Firestore timestamp to Date
  timestampToDate: (timestamp: Timestamp): Date => {
    return timestamp.toDate();
  },

  // Convert Date to Firestore timestamp
  dateToTimestamp: (date: Date): Timestamp => {
    return Timestamp.fromDate(date);
  },

  // Format timestamp for display
  formatTimestamp: (timestamp: Timestamp): string => {
    return timestamp.toDate().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Check if document exists
  documentExists: async (collectionName: string, id: string): Promise<boolean> => {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking document existence:', error);
      return false;
    }
  },

  // Get document count in collection
  getCollectionSize: async (collectionName: string): Promise<number> => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting collection size:', error);
      return 0;
    }
  }
};

// Export the extended service as the main FirestoreService
export { ExtendedFirestoreService as FirestoreService };

export default ExtendedFirestoreService;