import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { setupGlobalErrorHandlers } from '@/lib/errorHandling';
import AdminInitializerService from '@/lib/adminInitializer';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import TenantDashboard from './pages/TenantDashboard';
import DocumentViewer from './pages/DocumentViewer';
import NotFound from './pages/NotFound';
import UnauthorizedAccess from './pages/UnauthorizedAccess';

// Setup global error handlers
setupGlobalErrorHandlers();

const queryClient = new QueryClient();

// Protected Route Component - Uses Firebase Auth
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Check if user is authenticated via Firebase
  return user ? <>{children}</> : <Navigate to="/" replace />;
};

// Admin Route Component - Uses Firebase custom claims
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isAdmin } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Check if user has admin role via Firebase custom claims
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

// Owner Route Component - Uses Firebase custom claims for owner access
const OwnerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isOwner, isAdmin } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Check if user has owner or admin role via Firebase custom claims
  if (!isOwner && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

// Tenant Route Component - Uses Firebase custom claims for tenant access
const TenantRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isTenant, isOwner, isAdmin } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Check if user has tenant, owner, or admin role via Firebase custom claims
  if (!isTenant && !isOwner && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

// Role-based Dashboard Redirect Component
const DashboardRedirect = () => {
  const { user, isLoading, isAdmin, isOwner, isTenant } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Redirect to appropriate dashboard based on role
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  } else if (isOwner) {
    return <Navigate to="/owner" replace />;
  } else if (isTenant) {
    return <Navigate to="/tenant" replace />;
  } else {
    return <Navigate to="/unauthorized" replace />;
  }
};

// App content component with session monitoring
const AppContent = () => {
  // Initialize session monitoring for automatic logout on expiration
  useSessionMonitor();

  // Initialize admin user check
  React.useEffect(() => {
    AdminInitializerService.ensureAdminExists();
  }, []);

  return (
    <>
      <Toaster />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Dashboard redirect - automatically redirects to appropriate dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } 
          />
          
          {/* Role-specific dashboards */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          
          <Route 
            path="/owner" 
            element={
              <OwnerRoute>
                <Dashboard />
              </OwnerRoute>
            } 
          />
          
          <Route 
            path="/tenant" 
            element={
              <TenantRoute>
                <TenantDashboard />
              </TenantRoute>
            } 
          />
          
          {/* Document viewer - accessible by all authenticated users */}
          <Route 
            path="/documents/:propertyId" 
            element={
              <ProtectedRoute>
                <DocumentViewer />
              </ProtectedRoute>
            } 
          />
          
          {/* Unauthorized access page */}
          <Route path="/unauthorized" element={<UnauthorizedAccess />} />
          
          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;