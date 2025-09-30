import { httpsCallable, getFunctions } from 'firebase/functions';
import { UserRole } from './firebaseAuth';

// Initialize Firebase Functions
const functions = getFunctions();

// Custom claims management interface
export interface CustomClaimsResponse {
  success: boolean;
  message: string;
  uid?: string;
}

export interface UserClaimsResponse {
  uid: string;
  email: string;
  customClaims: {
    role?: UserRole;
  };
}

// Custom claims service class
export class FirebaseCustomClaimsService {
  /**
   * Set custom claims for a user (admin only)
   */
  static async setUserRole(uid: string, role: UserRole): Promise<CustomClaimsResponse> {
    try {
      const setCustomClaims = httpsCallable<
        { uid: string; role: UserRole },
        CustomClaimsResponse
      >(functions, 'setCustomClaims');

      const result = await setCustomClaims({ uid, role });
      return result.data;
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  }

  /**
   * Get user custom claims
   */
  static async getUserClaims(uid?: string): Promise<UserClaimsResponse> {
    try {
      const getUserClaims = httpsCallable<
        { uid?: string },
        UserClaimsResponse
      >(functions, 'getUserClaims');

      const result = await getUserClaims({ uid });
      return result.data;
    } catch (error) {
      console.error('Error getting user claims:', error);
      throw error;
    }
  }

  /**
   * Initialize the first admin user (one-time setup)
   */
  static async initializeAdmin(
    email: string,
    adminSecret: string
  ): Promise<CustomClaimsResponse> {
    try {
      const initializeAdmin = httpsCallable<
        { email: string; adminSecret: string },
        CustomClaimsResponse
      >(functions, 'initializeAdmin');

      const result = await initializeAdmin({ email, adminSecret });
      return result.data;
    } catch (error) {
      console.error('Error initializing admin:', error);
      throw error;
    }
  }

  /**
   * Refresh user token to get updated custom claims
   */
  static async refreshUserToken(): Promise<void> {
    try {
      const { auth } = await import('./firebase');
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true); // Force refresh
      }
    } catch (error) {
      console.error('Error refreshing user token:', error);
      throw error;
    }
  }
}

export default FirebaseCustomClaimsService;