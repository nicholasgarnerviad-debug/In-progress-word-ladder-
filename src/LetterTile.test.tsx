import React from 'react';
import { render, screen } from '@testing-library/react';
import { LetterTile, TileState } from './LetterTile';

describe('LetterTile', () => {
  it('should render the letter', () => {
    render(<LetterTile letter="A" state="idle" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('should render uppercase letter', () => {
    render(<LetterTile letter="a" state="idle" />);
    expect(screen.getByText('a')).toHaveClass('uppercase');
  });

  it('should have aria-label for accessibility', () => {
    render(<LetterTile letter="C" state="idle" />);
    expect(screen.getByLabelText('Letter C, idle state')).toBeInTheDocument();
  });

  describe('state styling', () => {
    const states: TileState[] = ['idle', 'changed', 'locked', 'burned', 'input', 'selected'];

    states.forEach((state) => {
      it(`should apply correct classes for ${state} state`, () => {
        const { container } = render(<LetterTile letter="X" state={state} />);
        const tile = container.firstChild as HTMLElement;

        switch (state) {
          case 'idle':
            expect(tile).toHaveClass('bg-gray-100');
            expect(tile).toHaveClass('border-gray-200');
            break;
          case 'changed':
            expect(tile).toHaveClass('bg-blue-100');
            expect(tile).toHaveClass('border-blue-400');
            expect(tile).toHaveClass('text-blue-900');
            expect(tile).toHaveClass('font-semibold');
            break;
          case 'locked':
            expect(tile).toHaveClass('bg-amber-100');
            expect(tile).toHaveClass('border-amber-400');
            expect(tile).toHaveClass('text-amber-900');
            expect(tile).toHaveClass('font-semibold');
            break;
          case 'burned':
            expect(tile).toHaveClass('bg-red-100');
            expect(tile).toHaveClass('border-red-400');
            expect(tile).toHaveClass('text-red-900');
            expect(tile).toHaveClass('font-semibold');
            break;
          case 'input':
            expect(tile).toHaveClass('bg-white');
            expect(tile).toHaveClass('border-dashed');
            expect(tile).toHaveClass('border-gray-300');
            break;
          case 'selected':
            expect(tile).toHaveClass('bg-blue-50');
            expect(tile).toHaveClass('border-blue-500');
            expect(tile).toHaveClass('ring-blue-200');
            break;
        }
      });
    });
  });

  it('should have consistent size and styling', () => {
    const { container } = render(<LetterTile letter="T" state="idle" />);
    const tile = container.firstChild as HTMLElement;

    expect(tile).toHaveClass('w-12');
    expect(tile).toHaveClass('h-12');
    expect(tile).toHaveClass('rounded-lg');
    expect(tile).toHaveClass('text-lg');
    expect(tile).toHaveClass('font-bold');
  });

  it('should support transition effects', () => {
    const { container } = render(<LetterTile letter="E" state="idle" />);
    const tile = container.firstChild as HTMLElement;

    expect(tile).toHaveClass('transition-all');
    expect(tile).toHaveClass('duration-200');
  });

  it('should render different letters', () => {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    letters.forEach((letter) => {
      const { container } = render(<LetterTile letter={letter} state="idle" />);
      expect(screen.getByText(letter)).toBeInTheDocument();
      container.remove();
    });
  });
});
