import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  describe('rendering', () => {
    it('renders card with children', () => {
      render(
        <Card>
          <p>Test content</p>
        </Card>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders card with title', () => {
      render(
        <Card title="Card Title">
          <p>Content</p>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('renders card with title and description', () => {
      render(
        <Card title="Card Title" description="Card description">
          <p>Content</p>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card description')).toBeInTheDocument();
    });

    it('does not render title section when title not provided', () => {
      const { container } = render(
        <Card>
          <p>Content</p>
        </Card>
      );

      const heading = container.querySelector('h3');
      expect(heading).not.toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies background colors for light and dark modes', () => {
      const { container } = render(
        <Card>
          <p>Content</p>
        </Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('dark:bg-gray-800');
    });

    it('applies border styling', () => {
      const { container } = render(
        <Card>
          <p>Content</p>
        </Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-gray-200');
      expect(card).toHaveClass('dark:border-gray-700');
    });

    it('applies rounded corners', () => {
      const { container } = render(
        <Card>
          <p>Content</p>
        </Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('rounded-lg');
    });

    it('applies shadow styling', () => {
      const { container } = render(
        <Card shadow="lg">
          <p>Content</p>
        </Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('shadow-lg');
    });

    it('applies default medium padding', () => {
      const { container } = render(
        <Card>
          <p>Content</p>
        </Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('p-4');
    });

    it('applies small padding when specified', () => {
      const { container } = render(
        <Card padding="sm">
          <p>Content</p>
        </Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('p-3');
    });

    it('applies large padding when specified', () => {
      const { container } = render(
        <Card padding="lg">
          <p>Content</p>
        </Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('p-6');
    });

    it('applies transition classes', () => {
      const { container } = render(
        <Card>
          <p>Content</p>
        </Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('duration-200');
    });

    it('applies custom className', () => {
      const { container } = render(
        <Card className="custom-class">
          <p>Content</p>
        </Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('typography', () => {
    it('styles title as heading', () => {
      render(
        <Card title="Card Title">
          <p>Content</p>
        </Card>
      );

      const heading = screen.getByText('Card Title');
      expect(heading.tagName).toBe('H3');
      expect(heading).toHaveClass('text-lg');
      expect(heading).toHaveClass('font-bold');
    });

    it('styles description as subtitle', () => {
      render(
        <Card title="Title" description="Description text">
          <p>Content</p>
        </Card>
      );

      const description = screen.getByText('Description text');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-gray-600');
      expect(description).toHaveClass('dark:text-gray-400');
    });

    it('applies spacing between title and description', () => {
      const { container } = render(
        <Card title="Title" description="Description">
          <p>Content</p>
        </Card>
      );

      const description = screen.getByText('Description');
      expect(description).toHaveClass('mt-1');
    });

    it('applies spacing between title section and content', () => {
      const { container } = render(
        <Card title="Title">
          <p>Content</p>
        </Card>
      );

      // The title div should have margin-bottom
      const heading = screen.getByText('Title');
      const titleDiv = heading.closest('div');
      expect(titleDiv).toHaveClass('mb-4');
    });
  });

  describe('shadow variants', () => {
    it('applies shadow-sm for small shadow', () => {
      const { container } = render(
        <Card shadow="sm">
          <p>Content</p>
        </Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('shadow-sm');
    });

    it('applies shadow-md for medium shadow (default)', () => {
      const { container } = render(
        <Card>
          <p>Content</p>
        </Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('shadow-md');
    });

    it('applies shadow-xl for extra large shadow', () => {
      const { container } = render(
        <Card shadow="xl">
          <p>Content</p>
        </Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('shadow-xl');
    });
  });
});
