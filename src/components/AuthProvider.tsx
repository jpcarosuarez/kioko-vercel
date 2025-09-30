import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirebaseAuthService, AuthUser, CreateUserData, UserProfileUpdates, UserRole } from '@/lib/firebaseAuth';
import { FirebaseErrorHandler } from '@/lib/firebaseErrors';
import { FirebaseError } from 'firebase/app';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createUser: (userData: CreateUserData) => Promise<void>;
  updateUserProfile: (updates: UserProfileUpdates) => Promise<void>;
  deleteUser: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  isOwner: boolean;
  isTenant: boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role-based authentication checks
  const isAdmin = user?.customClaims?.role === 'admin';
  const isOwner = user?.customClaims?.role === 'owner';
  const isTenant = user?.customClaims?.role === 'tenant';

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = FirebaseAuthService.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      await FirebaseAuthService.signIn(email, password);
      // User state will be updated by the onAuthStateChanged listener
    } catch (error) {
      const errorMessage = error instanceof FirebaseError 
        ? FirebaseErrorHandler.handleAuthError(error)
        : 'Error al iniciar sesión';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      await FirebaseAuthService.signOut();
      // User state will be updated by the onAuthStateChanged listener
    } catch (error) {
      const errorMessage = error instanceof FirebaseError 
        ? FirebaseErrorHandler.handleAuthError(error)
        : 'Error al cerrar sesión';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const createUser = async (userData: CreateUserData): Promise<void> => {
    try {
      setError(null);
      await FirebaseAuthService.createUser(userData);
      // Note: Custom claims need to be set server-side via Cloud Function
    } catch (error) {
      const errorMessage = error instanceof FirebaseError 
        ? FirebaseErrorHandler.handleAuthError(error)
        : 'Error al crear usuario';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateUserProfile = async (updates: UserProfileUpdates): Promise<void> => {
    try {
      setError(null);
      await FirebaseAuthService.updateUserProfile(updates);
      // Refresh user data
      const updatedUser = await FirebaseAuthService.getCurrentUserWithClaims();
      setUser(updatedUser);
    } catch (error) {
      const errorMessage = error instanceof FirebaseError 
        ? FirebaseErrorHandler.handleAuthError(error)
        : 'Error al actualizar perfil';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteUser = async (): Promise<void> => {
    try {
      setError(null);
      await FirebaseAuthService.deleteUser();
      // User state will be updated by the onAuthStateChanged listener
    } catch (error) {
      const errorMessage = error instanceof FirebaseError 
        ? FirebaseErrorHandler.handleAuthError(error)
        : 'Error al eliminar usuario';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const changePassword = async (newPassword: string): Promise<void> => {
    try {
      setError(null);
      await FirebaseAuthService.changePassword(newPassword);
    } catch (error) {
      const errorMessage = error instanceof FirebaseError 
        ? FirebaseErrorHandler.handleAuthError(error)
        : 'Error al cambiar contraseña';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    login,
    logout,
    createUser,
    updateUserProfile,
    deleteUser,
    changePassword,
    isLoading,
    error,
    isAdmin,
    isOwner,
    isTenant,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};