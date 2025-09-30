import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { cn } from '../../lib/utils';

interface BaseFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  description?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'date';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

interface TextareaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

interface CheckboxFieldProps extends BaseFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface SwitchFieldProps extends BaseFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// Input Field Component
export const FormInputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder,
  maxLength,
  className,
  description
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(
          'w-full',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
        )}
        aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
      />
      
      {description && !error && (
        <p id={`${name}-description`} className="text-xs text-gray-500">
          {description}
        </p>
      )}
      
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Textarea Field Component
export const FormTextareaField: React.FC<TextareaFieldProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder,
  rows = 3,
  maxLength,
  className,
  description
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(
          'w-full resize-none',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
        )}
        aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
      />
      
      {maxLength && (
        <div className="flex justify-between items-center">
          {description && !error && (
            <p id={`${name}-description`} className="text-xs text-gray-500">
              {description}
            </p>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {value.length}/{maxLength}
          </span>
        </div>
      )}
      
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Select Field Component
export const FormSelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
  placeholder = 'Seleccionar...',
  className,
  description
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            'w-full',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
          aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
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
          {error}
        </p>
      )}
    </div>
  );
};

// Checkbox Field Component
export const FormCheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  name,
  checked,
  onChange,
  error,
  disabled = false,
  className,
  description
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name}
          name={name}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          className={cn(
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
          aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
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
          {error}
        </p>
      )}
    </div>
  );
};

// Switch Field Component
export const FormSwitchField: React.FC<SwitchFieldProps> = ({
  label,
  name,
  checked,
  onChange,
  error,
  disabled = false,
  className,
  description
}) => {
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
          name={name}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
        />
      </div>
      
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

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

// Main FormField component (alias for FormInputField)
export const FormField = FormInputField;