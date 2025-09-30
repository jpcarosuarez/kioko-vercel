import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader } from '../ui/card';
import { cn } from '../../lib/utils';

interface LoadingStateProps {
  className?: string;
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Simple loading spinner
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        <div className={cn('border-2 border-primary-100 rounded-full animate-spin', sizeClasses[size])}>
          <div className="absolute top-0 left-0 border-2 border-transparent border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
};

// Loading state for forms
export const FormLoadingState: React.FC<LoadingStateProps> = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    <div className="space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-20 w-full" />
    </div>
    <div className="flex justify-end space-x-3">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

// Loading state for tables
export const TableLoadingState: React.FC<LoadingStateProps> = ({ className }) => (
  <div className={cn('space-y-4', className)}>
    {/* Table header */}
    <div className="flex space-x-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-20" />
    </div>
    
    {/* Table rows */}
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex space-x-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-20" />
      </div>
    ))}
  </div>
);

// Loading state for cards
export const CardLoadingState: React.FC<LoadingStateProps> = ({ className }) => (
  <Card className={cn('', className)}>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-end space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </CardContent>
  </Card>
);

// Loading state for grid of cards
export const CardGridLoadingState: React.FC<{ count?: number; className?: string }> = ({ 
  count = 6, 
  className 
}) => (
  <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
    {Array.from({ length: count }).map((_, index) => (
      <CardLoadingState key={index} />
    ))}
  </div>
);

// Loading state for dashboard stats
export const StatsLoadingState: React.FC<LoadingStateProps> = ({ className }) => (
  <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
    {Array.from({ length: 4 }).map((_, index) => (
      <Card key={index}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Loading state for document list
export const DocumentListLoadingState: React.FC<LoadingStateProps> = ({ className }) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    ))}
  </div>
);

// Loading state for user profile
export const ProfileLoadingState: React.FC<LoadingStateProps> = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    <div className="flex items-center space-x-4">
      <Skeleton className="h-20 w-20 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  </div>
);

// Full page loading state
export const PageLoadingState: React.FC<{ 
  title?: string;
  description?: string;
  className?: string;
}> = ({ title = 'Cargando...', description, className }) => (
  <div className={cn('flex flex-col items-center justify-center min-h-64 space-y-6', className)}>
    <div className="relative">
      <div className="w-12 h-12 border-4 border-primary-100 rounded-full animate-spin">
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-primary-600 rounded-full animate-spin"></div>
      </div>
      <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-primary-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
    </div>
    
    <div className="text-center space-y-3">
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-600">{description}</p>
      )}
      <div className="flex items-center justify-center space-x-1">
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
);

// Loading overlay for forms and modals
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}> = ({ isLoading, children, loadingText = 'Procesando...', className }) => (
  <div className={cn('relative', className)}>
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm font-medium text-gray-700">{loadingText}</p>
        </div>
      </div>
    )}
  </div>
);

// Main LoadingState component (alias for PageLoadingState)
export const LoadingState = PageLoadingState;

export default LoadingSpinner;