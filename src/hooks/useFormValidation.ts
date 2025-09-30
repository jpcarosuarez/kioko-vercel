import { useState, useCallback } from 'react';
import { ZodSchema, ZodError } from 'zod';

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  fieldErrors: Record<string, string[]>;
}

interface UseFormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export function useFormValidation<T>(
  schema: ZodSchema<T>,
  options: UseFormValidationOptions = {}
) {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300
  } = options;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Debounce utility
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Validate entire form
  const validateForm = useCallback(async (data: T): Promise<ValidationResult> => {
    setIsValidating(true);
    
    try {
      await schema.parseAsync(data);
      setErrors({});
      setFieldErrors({});
      setIsValidating(false);
      
      return {
        isValid: true,
        errors: {},
        fieldErrors: {}
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string> = {};
        const formattedFieldErrors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!formattedErrors[path]) {
            formattedErrors[path] = err.message;
            formattedFieldErrors[path] = [err.message];
          } else {
            formattedFieldErrors[path].push(err.message);
          }
        });
        
        setErrors(formattedErrors);
        setFieldErrors(formattedFieldErrors);
        setIsValidating(false);
        
        return {
          isValid: false,
          errors: formattedErrors,
          fieldErrors: formattedFieldErrors
        };
      }
      
      setIsValidating(false);
      throw error;
    }
  }, [schema]);

  // Validate single field
  const validateField = useCallback(async (fieldName: string, value: any, formData: Partial<T>) => {
    if (!validateOnChange && !touchedFields.has(fieldName)) {
      return;
    }

    try {
      // Create a partial schema for the specific field
      const fieldSchema = schema.pick({ [fieldName]: true } as any);
      await fieldSchema.parseAsync({ [fieldName]: value });
      
      // Clear errors for this field
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      
      setFieldErrors(prev => {
        const newFieldErrors = { ...prev };
        delete newFieldErrors[fieldName];
        return newFieldErrors;
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldError = error.errors.find(err => err.path.includes(fieldName));
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [fieldName]: fieldError.message
          }));
          
          setFieldErrors(prev => ({
            ...prev,
            [fieldName]: [fieldError.message]
          }));
        }
      }
    }
  }, [schema, validateOnChange, touchedFields]);

  // Debounced field validation
  const debouncedValidateField = useCallback(
    debounce(validateField, debounceMs),
    [validateField, debounceMs]
  );

  // Handle field change
  const handleFieldChange = useCallback((fieldName: string, value: any, formData: Partial<T>) => {
    if (validateOnChange) {
      debouncedValidateField(fieldName, value, formData);
    }
  }, [validateOnChange, debouncedValidateField]);

  // Handle field blur
  const handleFieldBlur = useCallback((fieldName: string, value: any, formData: Partial<T>) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
    
    if (validateOnBlur) {
      validateField(fieldName, value, formData);
    }
  }, [validateOnBlur, validateField]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors({});
    setFieldErrors({});
  }, []);

  // Clear field error
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    
    setFieldErrors(prev => {
      const newFieldErrors = { ...prev };
      delete newFieldErrors[fieldName];
      return newFieldErrors;
    });
  }, []);

  // Get field error
  const getFieldError = useCallback((fieldName: string) => {
    return errors[fieldName] || null;
  }, [errors]);

  // Check if field has error
  const hasFieldError = useCallback((fieldName: string) => {
    return !!errors[fieldName];
  }, [errors]);

  // Check if form has any errors
  const hasErrors = Object.keys(errors).length > 0;

  // Get all field names with errors
  const errorFields = Object.keys(errors);

  return {
    // Validation functions
    validateForm,
    validateField,
    handleFieldChange,
    handleFieldBlur,
    
    // Error management
    errors,
    fieldErrors,
    clearErrors,
    clearFieldError,
    getFieldError,
    hasFieldError,
    hasErrors,
    errorFields,
    
    // State
    isValidating,
    touchedFields: Array.from(touchedFields)
  };
}