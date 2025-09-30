import React from 'react';
import { FieldValues, DefaultValues } from 'react-hook-form';
import { ZodSchema } from 'zod';
import { FormProvider } from './FormProvider';
import { useFormSubmission } from '../../hooks/useFormSubmission';
import { Button } from '../ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EnhancedFormProps<T extends FieldValues> {
  schema: ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
  onSubmit: (data: T) => Promise<any>;
  children: React.ReactNode;
  className?: string;
  
  // Form options
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  resetOnSuccess?: boolean;
  
  // Submission options
  submitButtonText?: string;
  submitButtonClassName?: string;
  showRetryButton?: boolean;
  maxRetries?: number;
  
  // Messages
  successMessage?: string;
  errorMessage?: string;
  
  // Callbacks
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  
  // UI options
  showFormActions?: boolean;
  actionsClassName?: string;
  disabled?: boolean;
}

export function EnhancedForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  mode = 'onChange',
  resetOnSuccess = false,
  submitButtonText = 'Guardar',
  submitButtonClassName,
  showRetryButton = true,
  maxRetries = 3,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  showFormActions = true,
  actionsClassName,
  disabled = false
}: EnhancedFormProps<T>) {
  const {
    isSubmitting,
    isSuccess,
    error,
    canRetry,
    handleSubmit: submitHandler,
    handleRetry,
    reset: resetSubmission
  } = useFormSubmission(onSubmit, {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    resetOnSuccess,
    maxRetries
  });

  return (
    <FormProvider
      schema={schema}
      defaultValues={defaultValues}
      onSubmit={(data) => submitHandler(data)}
      mode={mode}
      className={cn('space-y-6', className)}
    >
      {(methods) => (
        <>
          {children}
          
          {showFormActions && (
            <div className={cn(
              'flex items-center justify-end space-x-3 pt-6 border-t border-gray-200',
              actionsClassName
            )}>
              {/* Reset button */}
              {(error || isSuccess) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    methods.reset();
                    resetSubmission();
                  }}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Limpiar</span>
                </Button>
              )}
              
              {/* Retry button */}
              {error && showRetryButton && canRetry && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRetry(methods.getValues())}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reintentar</span>
                </Button>
              )}
              
              {/* Submit button */}
              <Button
                type="submit"
                disabled={disabled || isSubmitting || !methods.formState.isValid}
                className={cn(
                  'flex items-center space-x-2',
                  submitButtonClassName
                )}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isSubmitting ? 'Guardando...' : submitButtonText}</span>
              </Button>
            </div>
          )}
          
          {/* Form-level error display */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error en el formulario
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Success message */}
          {isSuccess && (
            <div className="rounded-md bg-green-50 p-4 border border-green-200">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    ¡Éxito!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>{successMessage || 'Operación completada exitosamente'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </FormProvider>
  );
}