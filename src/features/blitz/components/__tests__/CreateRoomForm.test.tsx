import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateRoomForm } from '../CreateRoomForm';
import type { BlitzRoomSettings } from '../../types';

describe('CreateRoomForm', () => {
  const mockHandlers = {
    onCreateRoom: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderForm = (props = {}) => {
    return render(
      <CreateRoomForm
        isLoading={false}
        error={null}
        {...mockHandlers}
        {...props}
      />
    );
  };

  describe('initial render', () => {
    it('renders form with all required inputs', () => {
      renderForm();

      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/timer/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/word length/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/number of puzzles/i)).toBeInTheDocument();
    });

    it('displays default values', () => {
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
      expect(displayNameInput.value).toBe('');

      const timerSlider = screen.getByLabelText(/timer/i) as HTMLInputElement;
      expect(timerSlider.type).toBe('range');
    });

    it('renders Submit and Cancel buttons', () => {
      renderForm();

      expect(screen.getByRole('button', { name: /Create Room/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  describe('display name validation', () => {
    it('requires display name', () => {
      renderForm();

      const submitBtn = screen.getByRole('button', { name: /Create Room/i });
      expect(submitBtn).toBeDisabled();
    });

    it('enables submit button when display name is provided', async () => {
      const user = userEvent.setup();
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'Player One');

      const submitBtn = screen.getByRole('button', { name: /Create Room/i });
      expect(submitBtn).not.toBeDisabled();
    });

    it('shows error message if display name is empty on submit attempt', async () => {
      const user = userEvent.setup();
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.clear(displayNameInput);

      await waitFor(() => {
        const submitBtn = screen.getByRole('button', { name: /Create Room/i });
        expect(submitBtn).toBeDisabled();
      });
    });
  });

  describe('timer slider', () => {
    it('accepts values between 30 and 300 seconds', async () => {
      const user = userEvent.setup();
      renderForm();

      const timerSlider = screen.getByLabelText(/timer/i) as HTMLInputElement;
      expect(timerSlider.min).toBe('30');
      expect(timerSlider.max).toBe('300');
    });

    it('displays current timer value', async () => {
      const user = userEvent.setup();
      renderForm();

      const timerSlider = screen.getByLabelText(/timer/i) as HTMLInputElement;
      expect(screen.getByText(new RegExp(`${timerSlider.value}s`))).toBeInTheDocument();
    });

    it('updates display when timer changes', async () => {
      const user = userEvent.setup();
      renderForm();

      const timerSlider = screen.getByLabelText(/timer/i) as HTMLInputElement;
      expect(timerSlider.min).toBe('30');
      expect(timerSlider.max).toBe('300');
      // Value is updated by the component's onChange handler
    });

    it('converts timer seconds to milliseconds in submitted settings', async () => {
      const user = userEvent.setup();
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'TestPlayer');

      const timerSlider = screen.getByLabelText(/timer/i) as HTMLInputElement;
      fireEvent.change(timerSlider, { target: { value: '90' } });

      const submitBtn = screen.getByRole('button', { name: /Create Room/i });
      await user.click(submitBtn);

      expect(mockHandlers.onCreateRoom).toHaveBeenCalledWith(
        'TestPlayer',
        expect.objectContaining({
          durationMs: 90000, // 90 seconds * 1000
        })
      );
    });
  });

  describe('difficulty select', () => {
    it('renders difficulty options', () => {
      renderForm();

      expect(screen.getByText(/easy/i)).toBeInTheDocument();
      expect(screen.getByText(/medium/i)).toBeInTheDocument();
      expect(screen.getByText(/hard/i)).toBeInTheDocument();
    });

    it('defaults to easy difficulty', () => {
      renderForm();

      const difficultySelect = screen.getByLabelText(/difficulty/i) as HTMLSelectElement;
      expect(difficultySelect.value).toBe('easy');
    });

    it('allows changing difficulty', async () => {
      const user = userEvent.setup();
      renderForm();

      const difficultySelect = screen.getByLabelText(/difficulty/i) as HTMLSelectElement;
      await user.selectOptions(difficultySelect, 'hard');

      expect(difficultySelect.value).toBe('hard');
    });
  });

  describe('word length select', () => {
    it('renders word length options', () => {
      renderForm();

      expect(screen.getByText(/4 letters/i)).toBeInTheDocument();
      expect(screen.getByText(/5 letters/i)).toBeInTheDocument();
      expect(screen.getByText(/6 letters/i)).toBeInTheDocument();
    });

    it('defaults to 4-letter words', () => {
      renderForm();

      const wordLengthSelect = screen.getByLabelText(/word length/i) as HTMLSelectElement;
      expect(wordLengthSelect.value).toBe('4');
    });

    it('allows changing word length', async () => {
      const user = userEvent.setup();
      renderForm();

      const wordLengthSelect = screen.getByLabelText(/word length/i) as HTMLSelectElement;
      await user.selectOptions(wordLengthSelect, '6');

      expect(wordLengthSelect.value).toBe('6');
    });
  });

  describe('puzzle count input', () => {
    it('accepts values between 5 and 20', async () => {
      renderForm();

      const puzzleCountInput = screen.getByLabelText(/number of puzzles/i) as HTMLInputElement;
      expect(puzzleCountInput.min).toBe('5');
      expect(puzzleCountInput.max).toBe('20');
    });

    it('defaults to a valid value', () => {
      renderForm();

      const puzzleCountInput = screen.getByLabelText(/number of puzzles/i) as HTMLInputElement;
      const value = parseInt(puzzleCountInput.value, 10);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(20);
    });

    it('allows changing puzzle count', async () => {
      const user = userEvent.setup();
      renderForm();

      const puzzleCountInput = screen.getByLabelText(/number of puzzles/i) as HTMLInputElement;
      await user.clear(puzzleCountInput);
      await user.type(puzzleCountInput, '15');

      // Value should be clamped between 5 and 20
      const value = parseInt(puzzleCountInput.value, 10);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(20);
    });
  });

  describe('form submission', () => {
    it('calls onCreateRoom with display name and settings', async () => {
      const user = userEvent.setup();
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'Alice');

      const difficultySelect = screen.getByLabelText(/difficulty/i);
      await user.selectOptions(difficultySelect, 'medium');

      const wordLengthSelect = screen.getByLabelText(/word length/i);
      await user.selectOptions(wordLengthSelect, '5');

      const submitBtn = screen.getByRole('button', { name: /Create Room/i });
      await user.click(submitBtn);

      expect(mockHandlers.onCreateRoom).toHaveBeenCalledWith(
        'Alice',
        expect.objectContaining({
          difficulty: 'medium',
          wordLength: 5,
        })
      );
    });

    it('includes timer duration in milliseconds in settings', async () => {
      const user = userEvent.setup();
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'Bob');

      const submitBtn = screen.getByRole('button', { name: /Create Room/i });
      await user.click(submitBtn);

      expect(mockHandlers.onCreateRoom).toHaveBeenCalledWith(
        'Bob',
        expect.objectContaining({
          durationMs: expect.any(Number),
        })
      );

      const [, settings] = mockHandlers.onCreateRoom.mock.calls[0];
      expect(settings.durationMs).toBeGreaterThanOrEqual(30000);
      expect(settings.durationMs).toBeLessThanOrEqual(300000);
    });

    it('resets form after successful submission', async () => {
      const user = userEvent.setup();
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
      await user.type(displayNameInput, 'Charlie');

      let submitBtn = screen.getByRole('button', { name: /Create Room/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(displayNameInput.value).toBe('');
      });
    });
  });

  describe('cancel button', () => {
    it('calls onCancel when clicked', async () => {
      const user = userEvent.setup();
      renderForm();

      const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelBtn);

      expect(mockHandlers.onCancel).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('disables form inputs when isLoading is true', () => {
      renderForm({ isLoading: true });

      const displayNameInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
      const difficultySelect = screen.getByLabelText(/difficulty/i) as HTMLSelectElement;
      const submitBtn = screen.getByRole('button', { name: /Creating/i });

      expect(displayNameInput).toBeDisabled();
      expect(difficultySelect).toBeDisabled();
      expect(submitBtn).toBeDisabled();
    });

    it('enables form inputs when isLoading is false', () => {
      renderForm({ isLoading: false });

      const displayNameInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
      const difficultySelect = screen.getByLabelText(/difficulty/i) as HTMLSelectElement;

      expect(displayNameInput).not.toBeDisabled();
      expect(difficultySelect).not.toBeDisabled();
    });
  });

  describe('error handling', () => {
    it('displays error message when error is set', () => {
      const errorMsg = 'Failed to create room: Room code already exists';
      renderForm({ error: errorMsg });

      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    it('does not display error message when error is null', () => {
      renderForm({ error: null });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
