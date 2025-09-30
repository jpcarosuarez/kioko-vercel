import {
  createUserWithEmailAndPassword,
  updatePassword,
  deleteUser as firebaseDeleteUser,
  User as FirebaseUser,
  updateProfile,
  getAuth
} from 'firebase/auth';
import { auth, db } from './firebase';
import { usersService, propertiesService, documentsService, COLLECTIONS } from './firestore';
import { FirebaseCustomClaimsService } from './firebaseCustomClaims';
import { User, CreateUserData, UpdateUserData, UserRole, Property, Document } from '../types/models';
import { Timestamp, query, collection, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { UserValidator, validateUserCreate, validateUserUpdate } from './userValidation';
import { UserErrorHandler, handleFirebaseAuthError, handleFirestoreError, handleGenericError } from './userErrorHandling';

// User management service class
export class UserManagementService {
  /**
   * Create a new user with Firebase Auth and Firestore integration
   */
  static async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Validate user data
      const validation = validateUserCreate(userData);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        const userError = UserErrorHandler.handleValidationError('userData', firstError);
        throw new Error(userError.message);
      }

      // Check if email already exists in Firestore
      const existingUsers = await usersService.getWhere('email', '==', userData.email);
      if (existingUsers.length > 0) {
        const userError = UserErrorHandler.handleValidationError('email', 'Ya existe un usuario con este email');
        throw new Error(userError.message);
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: userData.name
      });

      // Set custom claims for role
      try {
        await FirebaseCustomClaimsService.setUserRole(firebaseUser.uid, userData.role);
      } catch (error) {
        console.warn('Could not set custom claims immediately:', error);
        // Continue with user creation, claims can be set later
      }

      // Create user document in Firestore
      const userDoc: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
        uid: firebaseUser.uid,
        email: userData.email,
        name: userData.name,
        phone: userData.phone || '',
        role: userData.role,
        isActive: userData.isActive ?? true,
        profileImageUrl: userData.profileImageUrl
      };

      const userId = await usersService.create(userDoc);

      // Get the created user document
      const createdUser = await usersService.getById(userId);
      if (!createdUser) {
        throw new Error('Failed to retrieve created user');
      }

      return createdUser as User;
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Handle different types of errors
      if (error.code) {
        if (error.code.startsWith('auth/')) {
          const userError = handleFirebaseAuthError(error);
          throw new Error(userError.message);
        } else {
          const userError = handleFirestoreError(error);
          throw new Error(userError.message);
        }
      }
      
      throw error;
    }
  }

  /**
   * Update user profile information
   */
  static async updateUser(userId: string, updates: UpdateUserData): Promise<User> {
    try {
      // Validate update data
      const validation = validateUserUpdate(updates);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        const userError = UserErrorHandler.handleValidationError('updates', firstError);
        throw new Error(userError.message);
      }

      // Get the current user document
      const currentUser = await usersService.getById(userId);
      if (!currentUser) {
        const userError = UserErrorHandler.handleValidationError('userId', 'Usuario no encontrado');
        throw new Error(userError.message);
      }

      const userDoc = currentUser as User;

      // Update user document in Firestore
      await usersService.update(userId, updates);

      // Update Firebase Auth profile if name is being updated
      if (updates.name) {
        try {
          // Get Firebase user by UID
          const firebaseUser = await this.getFirebaseUserByUid(userDoc.uid);
          if (firebaseUser && firebaseUser.displayName !== updates.name) {
            await updateProfile(firebaseUser, {
              displayName: updates.name
            });
          }
        } catch (error) {
          console.warn('Could not update Firebase Auth profile:', error);
          // Continue with Firestore update even if Auth update fails
        }
      }

      // Update custom claims if role is being updated
      if (updates.role && updates.role !== userDoc.role) {
        try {
          await FirebaseCustomClaimsService.setUserRole(userDoc.uid, updates.role);
        } catch (error) {
          console.warn('Could not update custom claims:', error);
          // Continue with update, claims can be set later
        }
      }

      // Get the updated user document
      const updatedUser = await usersService.getById(userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return updatedUser as User;
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      // Handle different types of errors
      if (error.code) {
        if (error.code.startsWith('auth/')) {
          const userError = handleFirebaseAuthError(error);
          throw new Error(userError.message);
        } else {
          const userError = handleFirestoreError(error);
          throw new Error(userError.message);
        }
      }
      
      throw error;
    }
  }

  /**
   * Delete user with cascade deletion of properties and documents
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      // Get the user document
      const userDoc = await usersService.getById(userId);
      if (!userDoc) {
        throw new Error('User not found');
      }

      const user = userDoc as User;

      // Start a batch operation for cascade deletion
      const batch = writeBatch(db);

      // Get all properties owned by this user
      const userProperties = await propertiesService.getWhere('ownerId', '==', userId);
      
      // Get all documents associated with this user's properties
      const propertyIds = userProperties.map(prop => (prop as Property).id);
      const userDocuments: Document[] = [];
      
      for (const propertyId of propertyIds) {
        const propertyDocs = await documentsService.getWhere('propertyId', '==', propertyId);
        userDocuments.push(...(propertyDocs as Document[]));
      }

      // Also get documents where user is the owner directly
      const directUserDocs = await documentsService.getWhere('ownerId', '==', userId);
      userDocuments.push(...(directUserDocs as Document[]));

      // Delete all documents from Firestore (Google Drive cleanup would be handled separately)
      for (const document of userDocuments) {
        const docRef = doc(db, COLLECTIONS.DOCUMENTS, document.id);
        batch.delete(docRef);
      }

      // Delete all properties
      for (const property of userProperties) {
        const propRef = doc(db, COLLECTIONS.PROPERTIES, (property as Property).id);
        batch.delete(propRef);
      }

      // Delete the user document
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      batch.delete(userRef);

      // Commit the batch operation
      await batch.commit();

      // Delete user from Firebase Auth
      try {
        const firebaseUser = await this.getFirebaseUserByUid(user.uid);
        if (firebaseUser) {
          await firebaseDeleteUser(firebaseUser);
        }
      } catch (error) {
        console.warn('Could not delete Firebase Auth user:', error);
        // Continue even if Auth deletion fails
      }

      console.log(`Successfully deleted user ${userId} and associated data`);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      // Handle different types of errors
      if (error.code) {
        if (error.code.startsWith('auth/')) {
          const userError = handleFirebaseAuthError(error);
          throw new Error(userError.message);
        } else {
          const userError = handleFirestoreError(error);
          throw new Error(userError.message);
        }
      }
      
      throw error;
    }
  }

  /**
   * Change user password using Firebase Auth
   */
  static async changePassword(userId: string, newPassword: string): Promise<void> {
    try {
      // Get the user document to get the UID
      const userDoc = await usersService.getById(userId);
      if (!userDoc) {
        throw new Error('User not found');
      }

      const user = userDoc as User;

      // Get Firebase user by UID
      const firebaseUser = await this.getFirebaseUserByUid(user.uid);
      if (!firebaseUser) {
        throw new Error('Firebase user not found');
      }

      // Update password in Firebase Auth
      await updatePassword(firebaseUser, newPassword);

      // Update the user's updatedAt timestamp in Firestore
      await usersService.update(userId, {});

      console.log(`Successfully changed password for user ${userId}`);
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      // Handle different types of errors
      if (error.code && error.code.startsWith('auth/')) {
        const userError = handleFirebaseAuthError(error);
        throw new Error(userError.message);
      }
      
      throw error;
    }
  }

  /**
   * Get all users with optional filtering
   */
  static async getAllUsers(filters?: {
    role?: UserRole;
    isActive?: boolean;
    search?: string;
  }): Promise<User[]> {
    try {
      let users: User[];

      if (filters?.role) {
        users = await usersService.getWhere('role', '==', filters.role) as User[];
      } else {
        users = await usersService.getAll() as User[];
      }

      // Apply additional filters
      if (filters?.isActive !== undefined) {
        users = users.filter(user => user.isActive === filters.isActive);
      }

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        users = users.filter(user => 
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.phone.includes(searchTerm)
        );
      }

      // Sort by creation date (newest first)
      users.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await usersService.getById(userId);
      return userDoc as User | null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await usersService.getWhere('email', '==', email);
      return users.length > 0 ? users[0] as User : null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Get user by Firebase UID
   */
  static async getUserByUid(uid: string): Promise<User | null> {
    try {
      const users = await usersService.getWhere('uid', '==', uid);
      return users.length > 0 ? users[0] as User : null;
    } catch (error) {
      console.error('Error getting user by UID:', error);
      throw error;
    }
  }

  /**
   * Toggle user active status
   */
  static async toggleUserStatus(userId: string): Promise<User> {
    try {
      const userDoc = await usersService.getById(userId);
      if (!userDoc) {
        throw new Error('User not found');
      }

      const user = userDoc as User;
      const newStatus = !user.isActive;

      await usersService.update(userId, { isActive: newStatus });

      const updatedUser = await usersService.getById(userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return updatedUser as User;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const users = await usersService.getWhere('role', '==', role);
      return users as User[];
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   */
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      await usersService.update(userId, {
        lastLoginAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw error for this non-critical operation
    }
  }

  /**
   * Helper method to get Firebase user by UID
   * Note: This is a simplified version. In a real app, you'd need admin SDK for this
   */
  private static async getFirebaseUserByUid(uid: string): Promise<FirebaseUser | null> {
    try {
      // In a real application, this would require Firebase Admin SDK
      // For now, we'll check if the current user matches the UID
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === uid) {
        return currentUser;
      }
      
      // In production, you'd call a Cloud Function or use Admin SDK
      console.warn('Cannot get Firebase user by UID without Admin SDK');
      return null;
    } catch (error) {
      console.error('Error getting Firebase user by UID:', error);
      return null;
    }
  }

  /**
   * Validate user data before creation/update (deprecated - use UserValidator instead)
   * @deprecated Use UserValidator class for comprehensive validation
   */
  static validateUserData(userData: Partial<CreateUserData | UpdateUserData>): string[] {
    console.warn('UserManagementService.validateUserData is deprecated. Use UserValidator instead.');
    
    // Use the new validator for backward compatibility
    const validator = new UserValidator();
    
    if ('password' in userData) {
      const validation = validator.validateCreateUser(userData as CreateUserData);
      return validation.isValid ? [] : Object.values(validation.errors);
    } else {
      const validation = validator.validateUpdateUser(userData as UpdateUserData);
      return validation.isValid ? [] : Object.values(validation.errors);
    }
  }

  /**
   * Check if current user can manage other users
   */
  static async canManageUsers(currentUserId: string): Promise<boolean> {
    try {
      const currentUser = await this.getUserById(currentUserId);
      return currentUser?.role === UserRole.ADMIN;
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return false;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
  }> {
    try {
      const allUsers = await this.getAllUsers();
      
      const stats = {
        total: allUsers.length,
        active: allUsers.filter(user => user.isActive).length,
        inactive: allUsers.filter(user => !user.isActive).length,
        byRole: {
          [UserRole.ADMIN]: allUsers.filter(user => user.role === UserRole.ADMIN).length,
          [UserRole.OWNER]: allUsers.filter(user => user.role === UserRole.OWNER).length,
          [UserRole.TENANT]: allUsers.filter(user => user.role === UserRole.TENANT).length,
        }
      };

      return stats;
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }
}

export default UserManagementService;