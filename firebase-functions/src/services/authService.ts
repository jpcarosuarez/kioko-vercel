/**
 * Authentication Service
 * Business logic extracted from Cloud Functions for reuse in Express routes
 */

import { HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { isValidRole, isValidEmail } from "../utils/validation";
import { logInfo, logError } from "../utils/logger";

export interface AuthContext {
  uid?: string;
  role?: string;
  email?: string;
}

export class AuthService {
  /**
   * Set custom claims for a user
   */
  static async setCustomClaims(
    uid: string, 
    role: string, 
    adminContext: AuthContext
  ): Promise<{ success: boolean; message: string }> {
    const context = { functionName: "setCustomClaims", userId: adminContext.uid };
    
    try {
      // Validate admin role
      if (adminContext.role !== "admin") {
        throw new HttpsError("permission-denied", "Only admins can set user roles");
      }

      // Validate role
      if (!isValidRole(role)) {
        throw new HttpsError("invalid-argument", "Invalid role. Must be admin, owner, or tenant");
      }

      // Set custom claims
      await getAuth().setCustomUserClaims(uid, { role });

      logInfo(`Role ${role} set for user ${uid}`, { ...context, targetUserId: uid, role });

      return {
        success: true,
        message: `Role ${role} set for user ${uid}`,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error setting custom claims", error as Error, context);
      throw new HttpsError("internal", "Failed to set user role");
    }
  }

  /**
   * Get user custom claims
   */
  static async getUserClaims(
    targetUid: string,
    callerContext: AuthContext
  ): Promise<{ uid: string; email: string; customClaims: any }> {
    const context = { functionName: "getUserClaims", userId: callerContext.uid };
    
    try {
      // Users can only get their own claims, unless they're admin
      if (targetUid !== callerContext.uid && callerContext.role !== "admin") {
        throw new HttpsError("permission-denied", "You can only access your own user claims");
      }

      const userRecord = await getAuth().getUser(targetUid);

      logInfo(`User claims retrieved for user ${targetUid}`, { ...context, targetUserId: targetUid });

      return {
        uid: userRecord.uid,
        email: userRecord.email || "",
        customClaims: userRecord.customClaims || {},
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error getting user claims", error as Error, context);
      throw new HttpsError("internal", "Failed to get user claims");
    }
  }

  /**
   * Initialize the first admin user
   */
  static async initializeAdmin(
    email: string,
    adminSecret: string
  ): Promise<{ success: boolean; message: string; uid: string }> {
    const context = { functionName: "initializeAdmin" };
    
    try {
      // Validate email format
      if (!isValidEmail(email)) {
        throw new HttpsError("invalid-argument", "Invalid email format");
      }

      // Check admin secret (set this in your environment)
      const expectedSecret = process.env.ADMIN_INIT_SECRET || "default-secret-change-me";
      if (adminSecret !== expectedSecret) {
        throw new HttpsError("permission-denied", "Invalid admin secret");
      }

      // Find user by email
      const userRecord = await getAuth().getUserByEmail(email);

      // Set admin role
      await getAuth().setCustomUserClaims(userRecord.uid, { role: "admin" });

      logInfo(`Admin role initialized for user ${email}`, { ...context, email, userId: userRecord.uid });

      return {
        success: true,
        message: `Admin role set for user ${email}`,
        uid: userRecord.uid,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error initializing admin", error as Error, context);
      throw new HttpsError("internal", "Failed to initialize admin user");
    }
  }

  /**
   * Create a new user with Firebase Auth and Firestore
   */
  static async createUser(
    userData: {
      email: string;
      password: string;
      name: string;
      phone: string;
      role: string;
      isActive?: boolean;
    },
    adminContext: AuthContext
  ): Promise<{ success: boolean; message: string; user: any }> {
    const context = { functionName: "createUser", userId: adminContext.uid };
    
    try {
      // Validate admin role
      if (adminContext.role !== "admin") {
        throw new HttpsError("permission-denied", "Only admins can create users");
      }

      // Validate input data
      if (!isValidEmail(userData.email)) {
        throw new HttpsError("invalid-argument", "Invalid email format");
      }

      if (!isValidRole(userData.role)) {
        throw new HttpsError("invalid-argument", "Invalid role. Must be admin, owner, or tenant");
      }

      if (userData.password.length < 6) {
        throw new HttpsError("invalid-argument", "Password must be at least 6 characters");
      }

      // Check if user already exists
      try {
        await getAuth().getUserByEmail(userData.email);
        throw new HttpsError("already-exists", "User with this email already exists");
      } catch (error: any) {
        if (error.code !== "auth/user-not-found") {
          throw error;
        }
        // User doesn't exist, continue with creation
      }

      // Create user in Firebase Auth
      const userRecord = await getAuth().createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
        emailVerified: true
      });

      // Set custom claims
      await getAuth().setCustomUserClaims(userRecord.uid, { 
        role: userData.role,
        isActive: userData.isActive ?? true 
      });

      // Create user document in Firestore
      const db = getFirestore();
      const userDoc = {
        uid: userRecord.uid,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        isActive: userData.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('users').doc(userRecord.uid).set(userDoc);

      logInfo(`User created successfully: ${userData.email}`, { 
        ...context, 
        newUserId: userRecord.uid, 
        role: userData.role 
      });

      return {
        success: true,
        message: `User ${userData.name} created successfully`,
        user: {
          uid: userRecord.uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          isActive: userData.isActive ?? true
        }
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error creating user", error as Error, context);
      throw new HttpsError("internal", "Failed to create user");
    }
  }

  /**
   * Update user information
   */
  static async updateUser(
    uid: string,
    updateData: {
      name?: string;
      phone?: string;
      role?: string;
      isActive?: boolean;
    },
    callerContext: AuthContext
  ): Promise<{ success: boolean; message: string; user: any }> {
    const context = { functionName: "updateUser", userId: callerContext.uid };
    
    try {
      // Users can only update their own info, unless they're admin
      if (uid !== callerContext.uid && callerContext.role !== "admin") {
        throw new HttpsError("permission-denied", "You can only update your own information");
      }

      // Validate role if provided
      if (updateData.role && !isValidRole(updateData.role)) {
        throw new HttpsError("invalid-argument", "Invalid role. Must be admin, owner, or tenant");
      }

      // Only admins can change roles
      if (updateData.role && callerContext.role !== "admin") {
        throw new HttpsError("permission-denied", "Only admins can change user roles");
      }

      // Get current user
      const userRecord = await getAuth().getUser(uid);
      
      // Update Firebase Auth profile if name changed
      if (updateData.name) {
        await getAuth().updateUser(uid, {
          displayName: updateData.name
        });
      }

      // Update custom claims if role or isActive changed
      if (updateData.role || updateData.isActive !== undefined) {
        const currentClaims = userRecord.customClaims || {};
        await getAuth().setCustomUserClaims(uid, {
          ...currentClaims,
          role: updateData.role || currentClaims.role,
          isActive: updateData.isActive !== undefined ? updateData.isActive : currentClaims.isActive
        });
      }

      // Update Firestore document
      const db = getFirestore();
      const userRef = db.collection('users').doc(uid);
      const updateFields: any = {
        updatedAt: new Date()
      };

      if (updateData.name) updateFields.name = updateData.name;
      if (updateData.phone) updateFields.phone = updateData.phone;
      if (updateData.role) updateFields.role = updateData.role;
      if (updateData.isActive !== undefined) updateFields.isActive = updateData.isActive;

      await userRef.update(updateFields);

      // Get updated user data
      const updatedUserDoc = await userRef.get();
      const updatedUser = updatedUserDoc.data();

      logInfo(`User updated successfully: ${uid}`, { ...context, targetUserId: uid });

      return {
        success: true,
        message: `User updated successfully`,
        user: updatedUser
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error updating user", error as Error, context);
      throw new HttpsError("internal", "Failed to update user");
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(
    uid: string,
    adminContext: AuthContext
  ): Promise<{ success: boolean; message: string }> {
    const context = { functionName: "deleteUser", userId: adminContext.uid };
    
    try {
      // Validate admin role
      if (adminContext.role !== "admin") {
        throw new HttpsError("permission-denied", "Only admins can delete users");
      }

      // Check if user exists
      try {
        await getAuth().getUser(uid);
      } catch (error: any) {
        if (error.code === "auth/user-not-found") {
          throw new HttpsError("not-found", "User not found");
        }
        throw error;
      }

      // Delete from Firebase Auth
      await getAuth().deleteUser(uid);

      // Delete from Firestore
      const db = getFirestore();
      await db.collection('users').doc(uid).delete();

      logInfo(`User deleted successfully: ${uid}`, { ...context, deletedUserId: uid });

      return {
        success: true,
        message: `User deleted successfully`
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error deleting user", error as Error, context);
      throw new HttpsError("internal", "Failed to delete user");
    }
  }

  /**
   * Get all users with optional filtering
   */
  static async getUsers(
    filters: {
      role?: string;
      isActive?: boolean;
      search?: string;
    },
    adminContext: AuthContext
  ): Promise<{ success: boolean; users: any[] }> {
    const context = { functionName: "getUsers", userId: adminContext.uid };
    
    try {
      // Validate admin role
      if (adminContext.role !== "admin") {
        throw new HttpsError("permission-denied", "Only admins can access user list");
      }

      const db = getFirestore();
      let query: any = db.collection('users');

      // Apply filters
      if (filters.role) {
        query = query.where('role', '==', filters.role);
      }
      
      if (filters.isActive !== undefined) {
        query = query.where('isActive', '==', filters.isActive);
      }

      const snapshot = await query.get();
      let users = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply search filter if provided
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        users = users.filter((user: any) => 
          user.name?.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm)
        );
      }

      logInfo(`Users retrieved successfully: ${users.length} users`, { ...context, userCount: users.length });

      return {
        success: true,
        users
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error getting users", error as Error, context);
      throw new HttpsError("internal", "Failed to get users");
    }
  }

  /**
   * Bootstrap initial users without restrictions (INITIAL SETUP ONLY)
   * This method bypasses all security checks and creates users directly
   */
  static async bootstrapInitialUsers(
    adminData: {
      adminEmail: string;
      adminPassword: string;
      adminName: string;
      adminPhone: string;
    }
  ): Promise<{ success: boolean; message: string; users: any[] }> {
    const context = { functionName: "bootstrapInitialUsers" };
    
    try {
      console.log('🚀 Starting bootstrap process - creating initial users...');
      
      const createdUsers = [];
      const db = getFirestore();
      
      // Demo users configuration
      const demoUsers = [
        {
          email: adminData.adminEmail,
          password: adminData.adminPassword,
          name: adminData.adminName,
          phone: adminData.adminPhone,
          role: 'admin',
          description: 'Usuario administrador principal del sistema'
        },
        {
          email: 'propietario@demo.com',
          password: 'Demo123!',
          name: 'María García Propietaria',
          phone: '+57 (301) 234-5678',
          role: 'owner',
          description: 'Propietaria con múltiples inmuebles'
        },
        {
          email: 'inquilino@demo.com',
          password: 'Demo123!',
          name: 'Carlos Rodríguez Inquilino',
          phone: '+57 (302) 345-6789',
          role: 'tenant',
          description: 'Inquilino con acceso a documentos de su propiedad'
        }
      ];

      // Create each user
      for (const userData of demoUsers) {
        try {
          console.log(`📝 Creating user: ${userData.email} (${userData.role})`);
          
          // Check if user already exists
          let userRecord;
          try {
            userRecord = await getAuth().getUserByEmail(userData.email);
            console.log(`⚠️  User already exists: ${userData.email}`);
          } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
              // Create new user
              userRecord = await getAuth().createUser({
                email: userData.email,
                password: userData.password,
                displayName: userData.name,
                emailVerified: true
              });
              console.log(`✅ User created: ${userData.email}`);
            } else {
              throw error;
            }
          }

          // Set custom claims (bypass validation)
          await getAuth().setCustomUserClaims(userRecord.uid, { 
            role: userData.role,
            isActive: true 
          });

          // Create/update user document in Firestore
          const userDoc = {
            uid: userRecord.uid,
            email: userData.email,
            name: userData.name,
            phone: userData.phone,
            role: userData.role,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });

          createdUsers.push({
            uid: userRecord.uid,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            phone: userData.phone
          });

          console.log(`✅ User ${userData.role} configured: ${userData.name}`);
          
        } catch (error) {
          console.error(`❌ Error creating user ${userData.email}:`, error);
          // Continue with other users even if one fails
        }
      }

      // Set bootstrap flag to prevent future bootstrap calls
      await db.collection('system').doc('bootstrap').set({
        completed: true,
        completedAt: new Date(),
        adminEmail: adminData.adminEmail,
        version: '1.0.0'
      });

      logInfo(`Bootstrap completed successfully: ${createdUsers.length} users created`, { 
        ...context, 
        userCount: createdUsers.length 
      });

      return {
        success: true,
        message: `Bootstrap completed successfully. ${createdUsers.length} users created.`,
        users: createdUsers
      };
    } catch (error) {
      logError("Error during bootstrap", error as Error, context);
      throw new HttpsError("internal", "Failed to bootstrap initial users");
    }
  }

  /**
   * Check if bootstrap has been completed
   */
  static async isBootstrapCompleted(): Promise<boolean> {
    try {
      const db = getFirestore();
      const bootstrapDoc = await db.collection('system').doc('bootstrap').get();
      return bootstrapDoc.exists && bootstrapDoc.data()?.completed === true;
    } catch (error) {
      console.error('Error checking bootstrap status:', error);
      return false;
    }
  }

  /**
   * Change user password using Firebase Admin SDK
   */
  static async changePassword(
    uid: string, 
    newPassword: string, 
    adminContext: AuthContext
  ): Promise<{ success: boolean; message: string }> {
    const context = { functionName: "changePassword", userId: adminContext.uid };
    
    try {
      // Validate admin role
      if (adminContext.role !== "admin") {
        throw new HttpsError("permission-denied", "Only admins can change user passwords");
      }

      // Validate password length
      if (newPassword.length < 6) {
        throw new HttpsError("invalid-argument", "Password must be at least 6 characters long");
      }

      // Update user password using Firebase Admin SDK
      await getAuth().updateUser(uid, {
        password: newPassword
      });

      // Update user's updatedAt timestamp in Firestore
      const db = getFirestore();
      await db.collection('users').doc(uid).update({
        updatedAt: new Date()
      });

      logInfo(`Password changed for user ${uid}`, { ...context, targetUserId: uid });

      return {
        success: true,
        message: `Password successfully changed for user ${uid}`,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      
      logError(`Failed to change password for user ${uid}`, error as Error, { ...context, targetUserId: uid });
      
      if ((error as any).code === 'auth/user-not-found') {
        throw new HttpsError("not-found", "User not found");
      }
      
      throw new HttpsError("internal", `Failed to change password: ${(error as Error).message}`);
    }
  }
}