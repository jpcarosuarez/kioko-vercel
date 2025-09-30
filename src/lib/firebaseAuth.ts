import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  updatePassword,
  deleteUser as firebaseDeleteUser,
  sendPasswordResetEmail,
  UserCredential,
} from 'firebase/auth';
import { auth } from './firebase';

// User role types
export type UserRole = 'admin' | 'owner' | 'tenant';

// Extended user interface with custom claims
export interface AuthUser extends User {
  customClaims?: {
    role: UserRole;
  };
}

// User session management interface
export interface UserSession {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

// User creation data interface
export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

// User profile update data interface
export interface UserProfileUpdates {
  displayName?: string;
  email?: string;
}

// Firebase Auth service class
export class FirebaseAuthService {
  /**
   * Sign in user with email and password
   */
  static async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  /**
   * Create new user account
   */
  static async createUser(userData: CreateUserData): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Update user profile with display name
      if (userData.displayName) {
        await updateProfile(userCredential.user, {
          displayName: userData.displayName,
        });
      }

      // Note: Custom claims need to be set on the server side
      // This would typically be done through Firebase Admin SDK or Cloud Functions
      console.log('User created successfully. Custom claims need to be set server-side.');

      return userCredential;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(updates: UserProfileUpdates): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      await updateProfile(auth.currentUser, updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(newPassword: string): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  static async deleteUser(): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      await firebaseDeleteUser(auth.currentUser);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Get current user with custom claims
   */
  static async getCurrentUserWithClaims(): Promise<AuthUser | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      // Get the ID token to access custom claims
      const idTokenResult = await user.getIdTokenResult();
      
      return {
        ...user,
        customClaims: {
          role: (idTokenResult.claims.role as UserRole) || 'tenant',
        },
      } as AuthUser;
    } catch (error) {
      console.error('Error getting user claims:', error);
      return user as AuthUser;
    }
  }

  /**
   * Check if current user has specific role
   */
  static async hasRole(role: UserRole): Promise<boolean> {
    const user = await this.getCurrentUserWithClaims();
    return user?.customClaims?.role === role || false;
  }

  /**
   * Check if current user is admin
   */
  static async isAdmin(): Promise<boolean> {
    return this.hasRole('admin');
  }

  /**
   * Check if current user is owner
   */
  static async isOwner(): Promise<boolean> {
    return this.hasRole('owner');
  }

  /**
   * Check if current user is tenant
   */
  static async isTenant(): Promise<boolean> {
    return this.hasRole('tenant');
  }

  /**
   * Subscribe to authentication state changes
   */
  static onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userWithClaims = await this.getCurrentUserWithClaims();
        callback(userWithClaims);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Get current user session with token
   */
  static async getCurrentSession(): Promise<UserSession | null> {
    const user = await this.getCurrentUserWithClaims();
    if (!user) return null;

    try {
      // Check if user has getIdTokenResult method
      if (typeof user.getIdTokenResult !== 'function') {
        console.error('User does not have getIdTokenResult method');
        return null;
      }
      
      const idTokenResult = await user.getIdTokenResult();
      return {
        user,
        token: idTokenResult.token,
        expiresAt: new Date(idTokenResult.expirationTime).getTime(),
      };
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  }

  /**
   * Check if current session is valid
   */
  static async isSessionValid(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) return false;
      
      // Simple check: if user exists and is not null, session is valid
      // Firebase handles token refresh automatically
      return true;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }

  /**
   * Refresh user token
   */
  static async refreshToken(): Promise<string | null> {
    if (!auth.currentUser) return null;

    try {
      const token = await auth.currentUser.getIdToken(true);
      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Set custom claims for a user (requires admin privileges)
   * This calls a Firebase Cloud Function
   */
  static async setUserRole(uid: string, role: UserRole): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      // Get the current user's ID token
      const idToken = await auth.currentUser.getIdToken();

      // Call the Cloud Function to set custom claims
      const response = await fetch('/api/setCustomClaims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid, role }),
      });

      if (!response.ok) {
        throw new Error('Failed to set user role');
      }

      // Force token refresh to get updated claims
      await auth.currentUser.getIdToken(true);
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  }
}

export default FirebaseAuthService;