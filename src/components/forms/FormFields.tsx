import React from 'react';
import { useController, useFormContext, FieldPath, FieldValues } from 'react-hook-form';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { cn } from '../../lib/utils';

interface BaseFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

interface InputFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'date';
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
}

interface TextareaFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

interface SelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

interface CheckboxFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  // No additional props needed
}

interface SwitchFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  // No additional props needed
}

// Enhanced Input Field with React Hook Form integration
export function FormInput<T extends FieldValues>({
  name,
  label,
  type = 'text',
  placeholder,
  maxLength,
  autoComplete,
  description,
  className,
  disabled = false,
  required = false
}: InputFieldProps<T>) {
  const { control } = useFormContext<T>();
  const {
    field,
    fieldState: { error }
  } = useController({
    name,
    control,
    disabled
  });

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Input
        {...field}
        id={name}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        disabled={disabled}
        className={cn(
          'w-full',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
        )}
        aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
        aria-invalid={!!error}
      />
      
      {description && !error && (
        <p id={`${name}-description`} className="text-xs text-gray-500">
          {description}
        </p>
      )}
      
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-600" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

// Enhanced Textarea Field with React Hook Form integration
export function FormTextarea<T extends FieldValues>({
  name,
  label,
  placeholder,
  rows = 3,
  maxLength,
  description,
  className,
  disabled = false,
  required = false
}: TextareaFieldProps<T>) {
  const { control } = useFormContext<T>();
  const {
    field,
    fieldState: { error }
  } = useController({
    name,
    control,
    disabled
  });

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Textarea
        {...field}
        id={name}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(
          'w-full resize-none',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
        )}
        aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
        aria-invalid={!!error}
      />
      
      {maxLength && (
        <div className="flex justify-between items-center">
          {description && !error && (
            <p id={`${name}-description`} className="text-xs text-gray-500">
              {description}
            </p>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {field.value?.length || 0}/{maxLength}
          </span>
        </div>
      )}
      
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-600" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

// Enhanced Select Field with React Hook Form integration
export function FormSelect<T extends FieldValues>({
  name,
  label,
  options,
  placeholder = 'Seleccionar...',
  description,
  className,
  disabled = false,
  required = false
}: SelectFieldProps<T>) {
  const { control } = useFormContext<T>();
  const {
    field,
    fieldState: { error }
  } = useController({
    name,
    control,
    disabled
  });

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Select
        value={field.value || ''}
        onValueChange={field.onChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            'w-full',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
          aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
          aria-invalid={!!error}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {description && !error && (
        <p id={`${name}-description`} className="text-xs text-gray-500">
          {description}
        </p>
      )}
      
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-600" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

// Enhanced Checkbox Field with React Hook Form integration
export function FormCheckbox<T extends FieldValues>({
  name,
  label,
  description,
  className,
  disabled = false
}: CheckboxFieldProps<T>) {
  const { control } = useFormContext<T>();
  const {
    field,
    fieldState: { error }
  } = useController({
    name,
    control,
    disabled
  });

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name}
          checked={field.value || false}
          onCheckedChange={field.onChange}
          disabled={disabled}
          className={cn(
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
          aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
          aria-invalid={!!error}
        />
        <Label
          htmlFor={name}
          className="text-sm font-medium text-gray-700 cursor-pointer"
        >
          {label}
        </Label>
      </div>
      
      {description && !error && (
        <p id={`${name}-description`} className="text-xs text-gray-500 ml-6">
          {description}
        </p>
      )}
      
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-600 ml-6" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

// Enhanced Switch Field with React Hook Form integration
export function FormSwitch<T extends FieldValues>({
  name,
  label,
  description,
  className,
  disabled = false
}: SwitchFieldProps<T>) {
  const { control } = useFormContext<T>();
  const {
    field,
    fieldState: { error }
  } = useController({
    name,
    control,
    disabled
  });

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label
            htmlFor={name}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </Label>
          {description && !error && (
            <p id={`${name}-description`} className="text-xs text-gray-500">
              {description}
            </p>
          )}
        </div>
        <Switch
          id={name}
          checked={field.value || false}
          onCheckedChange={field.onChange}
          disabled={disabled}
          aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
          aria-invalid={!!error}
        />
      </div>
      
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-600" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

// Form Section Component for grouping fields
export const FormSection: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, children, className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="border-b border-gray-200 pb-2">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

// Form Actions Component for buttons
export const FormActions: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn(
      'flex items-center justify-end space-x-3 pt-6 border-t border-gray-200',
      className
    )}>
      {children}
    </div>
  );
};