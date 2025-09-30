import React from 'react';
import { useForm, FormProvider as RHFFormProvider, UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';

interface FormProviderProps<T extends FieldValues> {
  schema: ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: (methods: UseFormReturn<T>) => React.ReactNode;
  className?: string;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
}

export function FormProvider<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  mode = 'onChange'
}: FormProviderProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      // Error handling will be managed by the parent component
    }
  });

  return (
    <RHFFormProvider {...methods}>
      <form onSubmit={handleSubmit} className={className} noValidate>
        {children(methods)}
      </form>
    </RHFFormProvider>
  );
}