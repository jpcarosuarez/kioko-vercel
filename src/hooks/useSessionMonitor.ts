import { useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { FirebaseAuthService } from '@/lib/firebaseAuth';

/**
 * Hook to monitor Firebase Auth session and handle automatic logout on expiration
 */
export const useSessionMonitor = () => {
  const { logout } = useAuth();

  const checkSessionValidity = useCallback(async () => {
    try {
      const isValid = await FirebaseAuthService.isSessionValid();
      if (!isValid) {
        console.log('Session expired, logging out...');
        await logout();
      }
    } catch (error) {
      console.error('Error checking session validity:', error);
      // Only logout if it's a critical error, not just a network issue
      if (error instanceof Error && error.message.includes('network')) {
        console.log('Network error checking session, will retry later');
        return;
      }
      // For other errors, logout for security
      await logout();
    }
  }, [logout]);

  const refreshTokenIfNeeded = useCallback(async () => {
    try {
      const session = await FirebaseAuthService.getCurrentSession();
      if (!session) return;

      // Refresh token if it expires in the next 5 minutes
      const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
      if (session.expiresAt < fiveMinutesFromNow) {
        await FirebaseAuthService.refreshToken();
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }, []);

  useEffect(() => {
    // Check session validity every 30 minutes (less frequent)
    const sessionCheckInterval = setInterval(checkSessionValidity, 30 * 60 * 1000);

    // Refresh token every 60 minutes
    const tokenRefreshInterval = setInterval(refreshTokenIfNeeded, 60 * 60 * 1000);

    // Check session validity on window focus (but not on every focus)
    let focusTimeout: NodeJS.Timeout;
    const handleWindowFocus = () => {
      // Debounce focus events
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        checkSessionValidity();
      }, 2000); // Wait 2 seconds after focus
    };

    window.addEventListener('focus', handleWindowFocus);

    // Cleanup intervals and event listeners
    return () => {
      clearInterval(sessionCheckInterval);
      clearInterval(tokenRefreshInterval);
      clearTimeout(focusTimeout);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [checkSessionValidity, refreshTokenIfNeeded]);

  return {
    checkSessionValidity,
    refreshTokenIfNeeded,
  };
};