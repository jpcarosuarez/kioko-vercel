/**
 * Currency utilities for formatting and validation
 */

export interface CurrencyValidation {
  isValid: boolean;
  numericValue?: number;
  error?: string;
}

/**
 * Apply currency mask to input value
 */
export function applyCurrencyMask(value: string): string {
  // Remove all non-numeric characters except decimal point
  const numericValue = value.replace(/[^0-9.]/g, '');
  
  // Ensure only one decimal point
  const parts = numericValue.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Format with thousands separator
  if (parts[0]) {
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts[1] !== undefined ? `${integerPart}.${parts[1]}` : integerPart;
  }
  
  return numericValue;
}

/**
 * Validate currency input
 */
export function validateCurrencyInput(value: string): CurrencyValidation {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: 'El valor es requerido'
    };
  }

  // Remove formatting characters
  const cleanValue = value.replace(/[^0-9.-]/g, '');
  const numericValue = parseFloat(cleanValue);

  if (isNaN(numericValue)) {
    return {
      isValid: false,
      error: 'El valor debe ser un número válido'
    };
  }

  if (numericValue < 0) {
    return {
      isValid: false,
      error: 'El valor no puede ser negativo'
    };
  }

  if (numericValue === 0) {
    return {
      isValid: false,
      error: 'El valor debe ser mayor a 0'
    };
  }

  return {
    isValid: true,
    numericValue
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  const cleanValue = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleanValue) || 0;
}

/**
 * Format number as currency input
 */
export function formatCurrencyInput(value: number): string {
  return value.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}