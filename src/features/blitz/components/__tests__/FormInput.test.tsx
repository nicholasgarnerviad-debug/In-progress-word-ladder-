import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormInput } from '../FormInput';

describe('FormInput', () => {
  describe('rendering', () => {
    it('renders input with label', () => {
      render(<FormInput label="Username" />);

      const label = screen.getByText('Username');
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
    });

    it('associates label with input', () => {
      render(<FormInput label="Email" />);

      const input = screen.getByRole('textbox');
      const label = screen.getByText('Email');

      expect(label).toHaveAttribute('for', input.id);
    });

    it('renders input with custom id', () => {
      render(<FormInput label="Name" id="custom-id" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'custom-id');
    });

    it('renders placeholder text', () => {
      render(<FormInput label="Email" placeholder="Enter email" />);

      const input = screen.getByPlaceholderText('Enter email');
      expect(input).toBeInTheDocument();
    });
  });

  describe('validation states', () => {
    it('shows error message and styling when error prop set', () => {
      render(<FormInput label="Email" error="Invalid email" />);

      const errorMsg = screen.getByText('Invalid email');
      expect(errorMsg).toBeInTheDocument();

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
      expect(input).toHaveClass('bg-red-50');
    });

    it('shows error role as alert', () => {
      render(<FormInput label="Email" error="Invalid email" />);

      const errorMsg = screen.getByText('Invalid email');
      expect(errorMsg).toHaveAttribute('role', 'alert');
    });

    it('shows helper text without error styling', () => {
      render(<FormInput label="Email" helperText="Use a valid email" />);

      const helperText = screen.getByText('Use a valid email');
      expect(helperText).toBeInTheDocument();
      expect(helperText).not.toHaveAttribute('role', 'alert');
    });

    it('shows success styling when success prop set', () => {
      render(<FormInput label="Email" success={true} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-green-500');
      expect(input).toHaveClass('bg-green-50');
    });

    it('shows default styling without error or success', () => {
      render(<FormInput label="Email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-gray-300');
      expect(input).toHaveClass('bg-white');
    });

    it('prefers error styling over success styling', () => {
      render(<FormInput label="Email" error="Invalid" success={true} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
      expect(input).not.toHaveClass('border-green-500');
    });
  });

  describe('accessibility', () => {
    it('has minimum touch target size', () => {
      render(<FormInput label="Email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('min-h-[44px]');
    });

    it('associates aria-describedby with description', () => {
      render(<FormInput label="Email" error="Invalid email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('sets aria-invalid when error present', () => {
      render(<FormInput label="Email" error="Invalid email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('sets aria-invalid false when no error', () => {
      render(<FormInput label="Email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('supports dark mode classes', () => {
      render(<FormInput label="Email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('dark:border-gray-600');
      expect(input).toHaveClass('dark:bg-gray-900');
      expect(input).toHaveClass('dark:text-white');
    });
  });

  describe('interaction', () => {
    it('allows typing into input', async () => {
      const user = userEvent.setup();
      render(<FormInput label="Email" />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'test@example.com');

      expect(input.value).toBe('test@example.com');
    });

    it('focuses input on label click', async () => {
      const user = userEvent.setup();
      render(<FormInput label="Email" />);

      const label = screen.getByText('Email');
      await user.click(label);

      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });

    it('applies focus styling on focus', async () => {
      const user = userEvent.setup();
      render(<FormInput label="Email" />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      expect(input).toHaveClass('focus:ring-2');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<FormInput label="Email" className="custom-class" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('uses focus ring color from theme', () => {
      render(<FormInput label="Email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:ring-2');
      expect(input).toHaveClass('focus:ring-offset-2');
      expect(input).toHaveClass('focus:ring-yellow-500');
    });

    it('applies proper padding', () => {
      render(<FormInput label="Email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('px-4');
      expect(input).toHaveClass('py-2');
    });

    it('applies border radius', () => {
      render(<FormInput label="Email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('rounded-lg');
    });
  });
});
