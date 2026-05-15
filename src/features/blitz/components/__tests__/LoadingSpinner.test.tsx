import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('rendering', () => {
    it('renders spinner with default size', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.firstChild;

      expect(spinner).toHaveClass('animate-spin');
    });

    it('renders spinner with custom size', () => {
      const { container } = render(<LoadingSpinner size="large" />);
      const spinner = container.firstChild;

      expect(spinner).toHaveClass('w-8');
      expect(spinner).toHaveClass('h-8');
    });

    it('renders SVG circle for spinner', () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  describe('accessibility', () => {
    it('has status role for live region updates', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');

      expect(spinner).toBeInTheDocument();
    });

    it('has default aria-label', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');

      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('accepts custom aria-label', () => {
      render(<LoadingSpinner ariaLabel="Loading game..." />);
      const spinner = screen.getByRole('status');

      expect(spinner).toHaveAttribute('aria-label', 'Loading game...');
    });

    it('has aria-live polite for non-disruptive announcements', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');

      expect(spinner).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('styling', () => {
    it('applies size small correctly', () => {
      const { container } = render(<LoadingSpinner size="small" />);
      const spinner = container.firstChild;

      expect(spinner).toHaveClass('w-4');
      expect(spinner).toHaveClass('h-4');
    });

    it('applies size medium correctly', () => {
      const { container } = render(<LoadingSpinner size="medium" />);
      const spinner = container.firstChild;

      expect(spinner).toHaveClass('w-6');
      expect(spinner).toHaveClass('h-6');
    });

    it('has yellow color for accent', () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveClass('text-yellow-600');
      expect(svg).toHaveClass('dark:text-yellow-400');
    });

    it('applies animation class', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.firstChild;

      expect(spinner).toHaveClass('animate-spin');
    });
  });
});
