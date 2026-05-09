import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameKeyboard } from './GameKeyboard';

describe('GameKeyboard', () => {
  const mockOnPressLetter = jest.fn();
  const mockOnDeleteLetter = jest.fn();
  const mockOnSubmitWord = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('layout and rendering', () => {
    it('should render all letter keys', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      // Check QWERTY row
      expect(screen.getByLabelText('Letter Q')).toBeInTheDocument();
      expect(screen.getByLabelText('Letter W')).toBeInTheDocument();
      expect(screen.getByLabelText('Letter P')).toBeInTheDocument();

      // Check middle row
      expect(screen.getByLabelText('Letter A')).toBeInTheDocument();
      expect(screen.getByLabelText('Letter L')).toBeInTheDocument();

      // Check bottom row
      expect(screen.getByLabelText('Letter Z')).toBeInTheDocument();
      expect(screen.getByLabelText('Letter M')).toBeInTheDocument();
    });

    it('should render delete button', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      expect(screen.getByLabelText('Delete letter')).toBeInTheDocument();
      expect(screen.getByText('⌫')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      expect(screen.getByLabelText('Submit word')).toBeInTheDocument();
      expect(screen.getByText('GO')).toBeInTheDocument();
    });

    it('should render in three rows', () => {
      const { container } = render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      const rows = container.querySelectorAll('[class*="flex gap-1"]');
      expect(rows).toHaveLength(3);
    });

    it('should use QWERTY layout', () => {
      const { container } = render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      const buttons = container.querySelectorAll('button');
      const firstRowLetters = Array.from(buttons)
        .slice(0, 10)
        .map(b => b.textContent)
        .filter(text => /^[A-Z]$/.test(text || ''));

      expect(firstRowLetters).toEqual(['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']);
    });
  });

  describe('pointer events', () => {
    it('should call onPressLetter on letter key pointer down', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      const qButton = screen.getByLabelText('Letter Q');
      fireEvent.pointerDown(qButton);

      expect(mockOnPressLetter).toHaveBeenCalledWith('Q');
    });

    it('should call onDeleteLetter on delete key pointer down', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      const deleteButton = screen.getByLabelText('Delete letter');
      fireEvent.pointerDown(deleteButton);

      expect(mockOnDeleteLetter).toHaveBeenCalled();
    });

    it('should call onSubmitWord on GO button pointer down', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      const goButton = screen.getByLabelText('Submit word');
      fireEvent.pointerDown(goButton);

      expect(mockOnSubmitWord).toHaveBeenCalled();
    });

    it('should prevent default on pointer down', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      const qButton = screen.getByLabelText('Letter Q');
      const event = new MouseEvent('pointerdown', { bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      qButton.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('keyboard events', () => {
    it('should handle letter key presses', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      fireEvent.keyDown(window, { key: 'a' });
      expect(mockOnPressLetter).toHaveBeenCalledWith('A');

      jest.clearAllMocks();

      fireEvent.keyDown(window, { key: 'z' });
      expect(mockOnPressLetter).toHaveBeenCalledWith('Z');
    });

    it('should be case insensitive for letter keys', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      fireEvent.keyDown(window, { key: 'Q' });
      expect(mockOnPressLetter).toHaveBeenCalledWith('Q');

      jest.clearAllMocks();

      fireEvent.keyDown(window, { key: 'q' });
      expect(mockOnPressLetter).toHaveBeenCalledWith('Q');
    });

    it('should handle Backspace key', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      fireEvent.keyDown(window, { key: 'Backspace' });
      expect(mockOnDeleteLetter).toHaveBeenCalled();
    });

    it('should handle Enter key', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      fireEvent.keyDown(window, { key: 'Enter' });
      expect(mockOnSubmitWord).toHaveBeenCalled();
    });

    it('should prevent default for handled keys', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      const event = new KeyboardEvent('keydown', { key: 'a' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should ignore non-letter, non-control keys', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      fireEvent.keyDown(window, { key: '1' });
      fireEvent.keyDown(window, { key: '!' });
      fireEvent.keyDown(window, { key: ' ' });

      expect(mockOnPressLetter).not.toHaveBeenCalled();
      expect(mockOnDeleteLetter).not.toHaveBeenCalled();
      expect(mockOnSubmitWord).not.toHaveBeenCalled();
    });

    it('should cleanup event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('disabled state', () => {
    it('should not trigger handlers when disabled', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
          disabled={true}
        />
      );

      const qButton = screen.getByLabelText('Letter Q');
      fireEvent.pointerDown(qButton);

      expect(mockOnPressLetter).not.toHaveBeenCalled();
    });

    it('should not handle keyboard input when disabled', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
          disabled={true}
        />
      );

      fireEvent.keyDown(window, { key: 'a' });
      expect(mockOnPressLetter).not.toHaveBeenCalled();
    });

    it('should disable all buttons when disabled prop is true', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
          disabled={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should enable all buttons when disabled prop is false', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
          disabled={false}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('styling', () => {
    it('should style letter keys with gray background', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      const qButton = screen.getByLabelText('Letter Q');
      expect(qButton).toHaveClass('bg-gray-200');
    });

    it('should style delete button with red background', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      const deleteButton = screen.getByLabelText('Delete letter');
      expect(deleteButton).toHaveClass('bg-red-100');
    });

    it('should style submit button with green background', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      const goButton = screen.getByLabelText('Submit word');
      expect(goButton).toHaveClass('bg-green-500');
      expect(goButton).toHaveClass('text-white');
    });

    it('should have proper button sizing', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      const qButton = screen.getByLabelText('Letter Q');
      expect(qButton).toHaveClass('h-10');
      expect(qButton).toHaveClass('rounded-md');
    });

    it('should have interactive effects', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      const qButton = screen.getByLabelText('Letter Q');
      expect(qButton).toHaveClass('active:scale-95');
      expect(qButton).toHaveClass('transition-all');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels for all keys', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      expect(screen.getByLabelText('Letter Q')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete letter')).toBeInTheDocument();
      expect(screen.getByLabelText('Submit word')).toBeInTheDocument();
    });

    it('should have type="button" to prevent form submission', () => {
      const { container } = render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should be keyboard focusable', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      const qButton = screen.getByLabelText('Letter Q');
      qButton.focus();
      expect(qButton).toHaveFocus();
    });
  });

  describe('integration', () => {
    it('should handle multiple key presses in sequence', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      fireEvent.keyDown(window, { key: 'c' });
      fireEvent.keyDown(window, { key: 'a' });
      fireEvent.keyDown(window, { key: 't' });

      expect(mockOnPressLetter).toHaveBeenCalledTimes(3);
      expect(mockOnPressLetter).toHaveBeenNthCalledWith(1, 'C');
      expect(mockOnPressLetter).toHaveBeenNthCalledWith(2, 'A');
      expect(mockOnPressLetter).toHaveBeenNthCalledWith(3, 'T');
    });

    it('should work with mixed keyboard and pointer input', () => {
      render(
        <GameKeyboard
          onPressLetter={mockOnPressLetter}
          onDeleteLetter={mockOnDeleteLetter}
          onSubmitWord={mockOnSubmitWord}
        />
      );

      // Press via keyboard
      fireEvent.keyDown(window, { key: 'c' });
      // Delete via pointer
      fireEvent.pointerDown(screen.getByLabelText('Delete letter'));
      // Press via pointer
      fireEvent.pointerDown(screen.getByLabelText('Letter A'));
      // Submit via keyboard
      fireEvent.keyDown(window, { key: 'Enter' });

      expect(mockOnPressLetter).toHaveBeenNthCalledWith(1, 'C');
      expect(mockOnDeleteLetter).toHaveBeenCalled();
      expect(mockOnPressLetter).toHaveBeenNthCalledWith(2, 'A');
      expect(mockOnSubmitWord).toHaveBeenCalled();
    });
  });
});
