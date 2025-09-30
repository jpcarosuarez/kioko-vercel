import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { EnhancedForm } from '../EnhancedForm';
import { FormInput, FormSelect, FormTextarea } from '../FormFields';

// Test schema
const testSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  age: z.string().transform(val => parseInt(val)).refine(val => val >= 18, 'Debe ser mayor de edad'),
  description: z.string().max(100, 'Máximo 100 caracteres'),
  role: z.enum(['admin', 'user'], { errorMap: () => ({ message: 'Selecciona un rol válido' }) })
});

type TestFormData = z.infer<typeof testSchema>;

const TestForm = ({ onSubmit = vi.fn() }: { onSubmit?: (data: TestFormData) => Promise<void> }) => (
  <EnhancedForm
    schema={testSchema}
    onSubmit={onSubmit}
    defaultValues={{
      name: '',
      email: '',
      age: '',
      description: '',
      role: ''
    }}
  >
    <FormInput<TestFormData>
      name="name"
      label="Nombre"
      required
    />
    <FormInput<TestFormData>
      name="email"
      label="Email"
      type="email"
      required
    />
    <FormInput<TestFormData>
      name="age"
      label="Edad"
      type="number"
      required
    />
    <FormTextarea<TestFormData>
      name="description"
      label="Descripción"
      maxLength={100}
    />
    <FormSelect<TestFormData>
      name="role"
      label="Rol"
      options={[
        { value: 'admin', label: 'Administrador' },
        { value: 'user', label: 'Usuario' }
      ]}
      required
    />
  </EnhancedForm>
);

describe('Form Validation', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Field Validation', () => {
    it('should show validation error for required fields', async () => {
      render(<TestForm />);
      
      const nameInput = screen.getByLabelText(/nombre/i);
      
      // Focus and blur without entering data
      await user.click(nameInput);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('El nombre debe tener al menos 2 caracteres')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      render(<TestForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.type(emailInput, 'invalid-email');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Email inválido')).toBeInTheDocument();
      });
    });

    it('should validate minimum length', async () => {
      render(<TestForm />);
      
      const nameInput = screen.getByLabelText(/nombre/i);
      
      await user.type(nameInput, 'a');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('El nombre debe tener al menos 2 caracteres')).toBeInTheDocument();
      });
    });

    it('should validate maximum length', async () => {
      render(<TestForm />);
      
      const descriptionInput = screen.getByLabelText(/descripción/i);
      const longText = 'a'.repeat(101);
      
      await user.type(descriptionInput, longText);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Máximo 100 caracteres')).toBeInTheDocument();
      });
    });

    it('should validate number transformation and custom validation', async () => {
      render(<TestForm />);
      
      const ageInput = screen.getByLabelText(/edad/i);
      
      await user.type(ageInput, '17');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Debe ser mayor de edad')).toBeInTheDocument();
      });
    });

    it('should validate select field', async () => {
      render(<TestForm />);
      
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      
      // Try to submit without selecting a role
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Selecciona un rol válido')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Validation', () => {
    it('should clear errors when field becomes valid', async () => {
      render(<TestForm />);
      
      const nameInput = screen.getByLabelText(/nombre/i);
      
      // Enter invalid data
      await user.type(nameInput, 'a');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('El nombre debe tener al menos 2 caracteres')).toBeInTheDocument();
      });
      
      // Fix the data
      await user.clear(nameInput);
      await user.type(nameInput, 'Valid Name');
      
      await waitFor(() => {
        expect(screen.queryByText('El nombre debe tener al menos 2 caracteres')).not.toBeInTheDocument();
      });
    });

    it('should show character count for textarea', async () => {
      render(<TestForm />);
      
      const descriptionInput = screen.getByLabelText(/descripción/i);
      
      await user.type(descriptionInput, 'Hello');
      
      await waitFor(() => {
        expect(screen.getByText('5/100')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should prevent submission with validation errors', async () => {
      const mockSubmit = vi.fn();
      render(<TestForm onSubmit={mockSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      
      await user.click(submitButton);
      
      expect(mockSubmit).not.toHaveBeenCalled();
      expect(submitButton).toBeDisabled();
    });

    it('should submit valid form data', async () => {
      const mockSubmit = vi.fn().mockResolvedValue({});
      render(<TestForm onSubmit={mockSubmit} />);
      
      // Fill out valid form data
      await user.type(screen.getByLabelText(/nombre/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/edad/i), '25');
      await user.type(screen.getByLabelText(/descripción/i), 'Test description');
      
      // Select role
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByText('Administrador'));
      
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          age: 25,
          description: 'Test description',
          role: 'admin'
        });
      });
    });

    it('should show loading state during submission', async () => {
      const mockSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<TestForm onSubmit={mockSubmit} />);
      
      // Fill out valid form data
      await user.type(screen.getByLabelText(/nombre/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/edad/i), '25');
      
      // Select role
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByText('Administrador'));
      
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);
      
      expect(screen.getByText('Guardando...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should handle submission errors', async () => {
      const mockSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
      render(<TestForm onSubmit={mockSubmit} />);
      
      // Fill out valid form data
      await user.type(screen.getByLabelText(/nombre/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/edad/i), '25');
      
      // Select role
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByText('Administrador'));
      
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Submission failed')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<TestForm />);
      
      const nameInput = screen.getByLabelText(/nombre/i);
      expect(nameInput).toHaveAttribute('aria-invalid', 'false');
      
      const requiredFields = screen.getAllByText('*');
      expect(requiredFields).toHaveLength(3); // name, email, age, role
    });

    it('should associate error messages with fields', async () => {
      render(<TestForm />);
      
      const nameInput = screen.getByLabelText(/nombre/i);
      
      await user.click(nameInput);
      await user.tab();
      
      await waitFor(() => {
        const errorMessage = screen.getByText('El nombre debe tener al menos 2 caracteres');
        expect(nameInput).toHaveAttribute('aria-describedby', expect.stringContaining('name-error'));
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});