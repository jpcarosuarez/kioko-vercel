import React from 'react';
import { Progress } from '../ui/progress';
import { CheckCircle, AlertCircle, Clock, Upload } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ProgressIndicatorProps {
  value: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

interface StepProgressProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'current' | 'completed' | 'error';
  }>;
  className?: string;
}

interface FileUploadProgressProps {
  files: Array<{
    name: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
  }>;
  className?: string;
}

// Basic progress indicator
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  max = 100,
  className,
  showPercentage = true,
  size = 'md',
  variant = 'default'
}) => {
  const percentage = Math.round((value / max) * 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Progreso
        </span>
        {showPercentage && (
          <span className="text-sm text-gray-500">
            {percentage}%
          </span>
        )}
      </div>
      <Progress 
        value={percentage} 
        className={cn(sizeClasses[size])}
        // Apply variant styling through CSS custom properties
        style={{
          '--progress-foreground': variantClasses[variant]
        } as React.CSSProperties}
      />
    </div>
  );
};

// Step-by-step progress indicator
export const StepProgress: React.FC<StepProgressProps> = ({ steps, className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        
        return (
          <div key={step.id} className="relative">
            <div className="flex items-start">
              {/* Step indicator */}
              <div className="flex-shrink-0 relative">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2',
                  {
                    'bg-blue-600 border-blue-600 text-white': step.status === 'current',
                    'bg-green-600 border-green-600 text-white': step.status === 'completed',
                    'bg-red-600 border-red-600 text-white': step.status === 'error',
                    'bg-white border-gray-300 text-gray-400': step.status === 'pending'
                  }
                )}>
                  {step.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                  {step.status === 'error' && <AlertCircle className="w-4 h-4" />}
                  {step.status === 'current' && <Clock className="w-4 h-4" />}
                  {step.status === 'pending' && <span className="text-xs font-medium">{index + 1}</span>}
                </div>
                
                {/* Connecting line */}
                {!isLast && (
                  <div className={cn(
                    'absolute top-8 left-4 w-0.5 h-6 -ml-px',
                    step.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                  )} />
                )}
              </div>
              
              {/* Step content */}
              <div className="ml-4 flex-1 min-w-0">
                <h4 className={cn(
                  'text-sm font-medium',
                  {
                    'text-blue-600': step.status === 'current',
                    'text-green-600': step.status === 'completed',
                    'text-red-600': step.status === 'error',
                    'text-gray-500': step.status === 'pending'
                  }
                )}>
                  {step.title}
                </h4>
                {step.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// File upload progress indicator
export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({ files, className }) => {
  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const errorFiles = files.filter(f => f.status === 'error').length;
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Subiendo archivos
          </span>
          <span className="text-sm text-gray-500">
            {completedFiles} de {totalFiles} completados
          </span>
        </div>
        <Progress value={(completedFiles / totalFiles) * 100} />
      </div>
      
      {/* Individual file progress */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {files.map((file, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              {file.status === 'uploading' && <Upload className="w-4 h-4 text-blue-600 animate-pulse" />}
              {file.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
              {file.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              
              {file.status === 'uploading' && (
                <div className="mt-1">
                  <Progress value={file.progress} className="h-1" />
                  <p className="text-xs text-gray-500 mt-1">
                    {file.progress}% completado
                  </p>
                </div>
              )}
              
              {file.status === 'completed' && (
                <p className="text-xs text-green-600 mt-1">
                  Subida completada
                </p>
              )}
              
              {file.status === 'error' && (
                <p className="text-xs text-red-600 mt-1">
                  Error: {file.error || 'Error desconocido'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary */}
      {errorFiles > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            {errorFiles} archivo{errorFiles > 1 ? 's' : ''} no se pudo{errorFiles > 1 ? 'ieron' : ''} subir.
          </p>
        </div>
      )}
    </div>
  );
};

// Circular progress indicator
export const CircularProgress: React.FC<{
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
}> = ({ 
  value, 
  max = 100, 
  size = 120, 
  strokeWidth = 8, 
  className,
  showValue = true 
}) => {
  const percentage = (value / max) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-blue-600 transition-all duration-300 ease-in-out"
        />
      </svg>
      
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-900">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;