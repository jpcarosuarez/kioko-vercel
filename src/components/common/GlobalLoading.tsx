import React from 'react';
import { cn } from '../../lib/utils';

interface GlobalLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export const GlobalLoading: React.FC<GlobalLoadingProps> = ({
  isLoading,
  children,
  loadingText = 'Cargando...',
  className
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative min-h-screen', className)}>
      {children}
      <div className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center justify-center space-y-6 min-h-screen">
          {/* Elegant spinner */}
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary-100 rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-primary-600 rounded-full animate-spin"></div>
            </div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-primary-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          
          {/* Loading text */}
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold text-neutral-900">{loadingText}</h3>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple loading spinner for inline use
export const ElegantSpinner: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        <div className={cn('border-4 border-primary-100 rounded-full animate-spin', sizeClasses[size])}>
          <div className="absolute top-0 left-0 border-4 border-transparent border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
};

// Loading state with skeleton for better UX
export const SkeletonLoading: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className }) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        {index === lines - 1 && (
          <div className="h-4 bg-gray-200 rounded w-3/4 mt-2"></div>
        )}
      </div>
    ))}
  </div>
);

// Full screen loading with branding
export const FullScreenLoading: React.FC<{
  title?: string;
  subtitle?: string;
  className?: string;
}> = ({ 
  title = 'Kiosko Inmobiliario', 
  subtitle = 'Cargando tu experiencia...',
  className 
}) => (
  <div className={cn('fixed inset-0 bg-white flex items-center justify-center z-50', className)}>
    <div className="flex flex-col items-center space-y-6">
      {/* Logo/Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
          <div className="w-6 h-6 bg-white rounded"></div>
        </div>
        <div className="text-left">
          <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
          <p className="text-sm text-neutral-600">{subtitle}</p>
        </div>
      </div>
      
      {/* Elegant loading animation */}
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
);

export default GlobalLoading;
