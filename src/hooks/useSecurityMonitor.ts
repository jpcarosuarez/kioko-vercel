/**
 * Security monitoring hook
 * Monitors user sessions, token expiration, and security events
 */

import { useEffect, useCallback, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { 
  checkTokenExpiration, 
  setupTokenExpirationCheck, 
  AuthUser,
  createAuditTrail 
} from "../lib/securityUtils";
import { toast } from "sonner";

interface SecurityEvent {
  type: "token_refresh" | "session_warning" | "logout" | "security_violation";
  timestamp: Date;
  details?: any;
}

interface UseSecurityMonitorReturn {
  isSecure: boolean;
  securityEvents: SecurityEvent[];
  refreshToken: () => Promise<boolean>;
  forceLogout: () => Promise<void>;
  clearSecurityEvents: () => void;
}

/**
 * Hook for monitoring security-related events and token expiration
 */
export const useSecurityMonitor = (): UseSecurityMonitorReturn => {
  const { user, logout } = useAuth();
  const [isSecure, setIsSecure] = useState(true);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

  const addSecurityEvent = useCallback((event: SecurityEvent) => {
    setSecurityEvents(prev => [...prev.slice(-9), event]); // Keep last 10 events
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const isValid = await checkTokenExpiration();
      
      if (isValid) {
        addSecurityEvent({
          type: "token_refresh",
          timestamp: new Date(),
          details: { success: true }
        });
        setIsSecure(true);
      } else {
        addSecurityEvent({
          type: "security_violation",
          timestamp: new Date(),
          details: { reason: "token_expired" }
        });
        setIsSecure(false);
      }
      
      return isValid;
    } catch (error) {
      addSecurityEvent({
        type: "security_violation",
        timestamp: new Date(),
        details: { reason: "token_refresh_failed", error: (error as Error).message }
      });
      setIsSecure(false);
      return false;
    }
  }, [addSecurityEvent]);

  const forceLogout = useCallback(async (): Promise<void> => {
    try {
      await createAuditTrail("forced_logout", { reason: "security_monitor" });
      addSecurityEvent({
        type: "logout",
        timestamp: new Date(),
        details: { forced: true }
      });
      await logout();
    } catch (error) {
      console.error("Error during forced logout:", error);
    }
  }, [logout, addSecurityEvent]);

  const clearSecurityEvents = useCallback(() => {
    setSecurityEvents([]);
  }, []);

  // Set up token expiration monitoring
  useEffect(() => {
    if (!user) {
      setIsSecure(false);
      return;
    }

    const authUser = user as AuthUser;
    
    // Initial token check
    refreshToken();

    // Set up periodic monitoring
    const cleanup = setupTokenExpirationCheck();

    // Monitor for suspicious activity
    const activityMonitor = setInterval(() => {
      // Check if user is still authenticated
      if (!authUser) {
        addSecurityEvent({
          type: "security_violation",
          timestamp: new Date(),
          details: { reason: "user_disappeared" }
        });
        setIsSecure(false);
        return;
      }

      // Check for role changes (potential security issue)
      if (authUser.customClaims?.role) {
        const currentRole = authUser.customClaims.role;
        // In a real implementation, you might want to store the previous role
        // and check for unexpected changes
      }
    }, 30000); // Check every 30 seconds

    return () => {
      cleanup();
      clearInterval(activityMonitor);
    };
  }, [user, refreshToken, addSecurityEvent]);

  // Monitor for tab visibility changes (security consideration)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden - could be a security consideration
        addSecurityEvent({
          type: "session_warning",
          timestamp: new Date(),
          details: { reason: "tab_hidden" }
        });
      } else {
        // Tab became visible - refresh token to ensure it's still valid
        refreshToken();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refreshToken, addSecurityEvent]);

  // Monitor for network status changes
  useEffect(() => {
    const handleOnline = () => {
      addSecurityEvent({
        type: "token_refresh",
        timestamp: new Date(),
        details: { reason: "network_restored" }
      });
      refreshToken();
    };

    const handleOffline = () => {
      addSecurityEvent({
        type: "session_warning",
        timestamp: new Date(),
        details: { reason: "network_lost" }
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshToken, addSecurityEvent]);

  // Monitor for multiple tab sessions (potential security risk)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "firebase:authUser" && e.newValue !== e.oldValue) {
        addSecurityEvent({
          type: "session_warning",
          timestamp: new Date(),
          details: { reason: "multiple_sessions_detected" }
        });
        
        // Optionally warn user about multiple sessions
        toast.warning("Se detectó una sesión en otra pestaña. Por seguridad, verifica que seas tú.");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [addSecurityEvent]);

  return {
    isSecure,
    securityEvents,
    refreshToken,
    forceLogout,
    clearSecurityEvents,
  };
};