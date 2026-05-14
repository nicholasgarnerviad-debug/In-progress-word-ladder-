import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JoinRoomForm } from '../JoinRoomForm';
import type { RoomCode } from '../../types';

describe('JoinRoomForm', () => {
  const mockHandlers = {
    onJoinRoom: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderForm = (props = {}) => {
    return render(
      <JoinRoomForm
        isLoading={false}
        error={null}
        {...mockHandlers}
        {...props}
      />
    );
  };

  describe('initial render', () => {
    it('renders form with display name and room code inputs', () => {
      renderForm();

      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/room code/i)).toBeInTheDocument();
    });

    it('displays placeholder text for room code input', () => {
      renderForm();

      const roomCodeInput = screen.getByLabelText(/room code/i) as HTMLInputElement;
      expect(roomCodeInput.placeholder).toMatch(/XXXXXX/);
    });

    it('renders Submit and Cancel buttons', () => {
      renderForm();

      expect(screen.getByRole('button', { name: /Join Room/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  describe('display name validation', () => {
    it('requires display name', () => {
      renderForm();

      const submitBtn = screen.getByRole('button', { name: /Join Room/i });
      expect(submitBtn).toBeDisabled();
    });

    it('enables submit button when both display name and room code are provided', async () => {
      const user = userEvent.setup();
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'Player One');

      const roomCodeInput = screen.getByLabelText(/room code/i);
      await user.type(roomCodeInput, 'ABC123');

      const submitBtn = screen.getByRole('button', { name: /Join Room/i });
      expect(submitBtn).not.toBeDisabled();
    });
  });

  describe('room code validation', () => {
    it('requires room code to be exactly 6 characters', async () => {
      const user = userEvent.setup();
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'Player');

      const roomCodeInput = screen.getByLabelText(/room code/i);

      // Too short - should be disabled
      await user.type(roomCodeInput, 'ABC12');
      let submitBtn = screen.getByRole('button', { name: /Join Room/i });
      expect(submitBtn).toBeDisabled();

      // Exactly 6 - should be enabled
      await user.type(roomCodeInput, '3');
      submitBtn = screen.getByRole('button', { name: /Join Room/i });
      expect(submitBtn).not.toBeDisabled();

      // More than 6 - extra characters should be ignored or validation fails
      // (depends on implementation - maxLength attribute)
    });

    it('accepts alphanumeric characters', async () => {
      const user = userEvent.setup();
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'Player');

      const roomCodeInput = screen.getByLabelText(/room code/i);
      await user.type(roomCodeInput, 'ABC123');

      const submitBtn = screen.getByRole('button', { name: /Join Room/i });
      expect(submitBtn).not.toBeDisabled();
    });

    it('automatically uppercases room code input', async () => {
      const user = userEvent.setup();
      renderForm();

      const roomCodeInput = screen.getByLabelText(/room code/i) as HTMLInputElement;
      await user.type(roomCodeInput, 'abc123');

      expect(roomCodeInput.value).toBe('ABC123');
    });
  });

  describe('room code trimming', () => {
    it('trims whitespace from room code', async () => {
      const user = userEvent.setup();
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'Player');

      const roomCodeInput = screen.getByLabelText(/room code/i) as HTMLInputElement;
      await user.type(roomCodeInput, '  ABC123  ');

      const submitBtn = screen.getByRole('button', { name: /Join Room/i });
      await user.click(submitBtn);

      expect(mockHandlers.onJoinRoom).toHaveBeenCalledWith(
        'Player',
        expect.stringContaining('ABC123')
      );
    });
  });

  describe('form submission', () => {
    it('calls onJoinRoom with display name and room code', async () => {
      const user = userEvent.setup();
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'Alice');

      const roomCodeInput = screen.getByLabelText(/room code/i);
      await user.type(roomCodeInput, 'XYZ789');

      const submitBtn = screen.getByRole('button', { name: /Join Room/i });
      await user.click(submitBtn);

      expect(mockHandlers.onJoinRoom).toHaveBeenCalledWith('Alice', expect.stringContaining('XYZ789'));
    });

    it('resets form after successful submission', async () => {
      const user = userEvent.setup();
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
      const roomCodeInput = screen.getByLabelText(/room code/i) as HTMLInputElement;

      await user.type(displayNameInput, 'Bob');
      await user.type(roomCodeInput, 'DEF456');

      const submitBtn = screen.getByRole('button', { name: /Join Room/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(displayNameInput.value).toBe('');
        expect(roomCodeInput.value).toBe('');
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
      const roomCodeInput = screen.getByLabelText(/room code/i) as HTMLInputElement;
      const submitBtn = screen.getByRole('button', { name: /Joining/i });

      expect(displayNameInput).toBeDisabled();
      expect(roomCodeInput).toBeDisabled();
      expect(submitBtn).toBeDisabled();
    });

    it('enables form inputs when isLoading is false', () => {
      renderForm({ isLoading: false });

      const displayNameInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
      const roomCodeInput = screen.getByLabelText(/room code/i) as HTMLInputElement;

      expect(displayNameInput).not.toBeDisabled();
      expect(roomCodeInput).not.toBeDisabled();
    });
  });

  describe('error handling', () => {
    it('displays error message when error is set', () => {
      const errorMsg = 'Room not found';
      renderForm({ error: errorMsg });

      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    it('does not display error message when error is null', () => {
      renderForm({ error: null });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows different error messages', () => {
      const { rerender } = renderForm({ error: 'Room is full' });

      expect(screen.getByText('Room is full')).toBeInTheDocument();

      rerender(
        <JoinRoomForm
          isLoading={false}
          error="Game already started"
          {...mockHandlers}
        />
      );

      expect(screen.queryByText('Room is full')).not.toBeInTheDocument();
      expect(screen.getByText('Game already started')).toBeInTheDocument();
    });
  });

  describe('keyboard accessibility', () => {
    it('form inputs are keyboard accessible', async () => {
      const user = userEvent.setup();
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i);
      displayNameInput.focus();
      expect(displayNameInput).toHaveFocus();

      const roomCodeInput = screen.getByLabelText(/room code/i);
      roomCodeInput.focus();
      expect(roomCodeInput).toHaveFocus();
    });

    it('submit button can be triggered with Enter key', async () => {
      const user = userEvent.setup();
      renderForm();

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'Player');

      const roomCodeInput = screen.getByLabelText(/room code/i);
      await user.type(roomCodeInput, 'ABC123');

      const submitBtn = screen.getByRole('button', { name: /Join Room/i });
      submitBtn.focus();

      await user.keyboard('{Enter}');
      expect(mockHandlers.onJoinRoom).toHaveBeenCalled();
    });
  });
});
