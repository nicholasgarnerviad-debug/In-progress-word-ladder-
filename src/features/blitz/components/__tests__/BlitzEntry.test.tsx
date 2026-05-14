import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlitzEntry } from '../BlitzEntry';

describe('BlitzEntry', () => {
  const mockHandlers = {
    onCreateRoom: jest.fn(),
    onJoinRoom: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderBlitzEntry = (props = {}) => {
    return render(
      <BlitzEntry
        isLoading={false}
        error={null}
        {...mockHandlers}
        {...props}
      />
    );
  };

  describe('initial render', () => {
    it('renders two buttons: Create Room and Join Room', () => {
      renderBlitzEntry();

      expect(screen.getByRole('button', { name: /Create Room/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Join Room/i })).toBeInTheDocument();
    });

    it('displays a title or heading', () => {
      renderBlitzEntry();

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('shows both buttons are enabled by default', () => {
      renderBlitzEntry();

      const createBtn = screen.getByRole('button', { name: /Create Room/i });
      const joinBtn = screen.getByRole('button', { name: /Join Room/i });

      expect(createBtn).not.toBeDisabled();
      expect(joinBtn).not.toBeDisabled();
    });
  });

  describe('button interactions', () => {
    it('calls onCreateRoom when Create Room button is clicked', async () => {
      const user = userEvent.setup();
      renderBlitzEntry();

      const createBtn = screen.getByRole('button', { name: /Create Room/i });
      await user.click(createBtn);

      expect(mockHandlers.onCreateRoom).toHaveBeenCalledTimes(1);
    });

    it('calls onJoinRoom when Join Room button is clicked', async () => {
      const user = userEvent.setup();
      renderBlitzEntry();

      const joinBtn = screen.getByRole('button', { name: /Join Room/i });
      await user.click(joinBtn);

      expect(mockHandlers.onJoinRoom).toHaveBeenCalledTimes(1);
    });

    it('does not call handlers when buttons are disabled', async () => {
      const user = userEvent.setup();
      renderBlitzEntry({ isLoading: true });

      const createBtn = screen.getByRole('button', { name: /Create Room/i });
      const joinBtn = screen.getByRole('button', { name: /Join Room/i });

      await user.click(createBtn);
      await user.click(joinBtn);

      expect(mockHandlers.onCreateRoom).not.toHaveBeenCalled();
      expect(mockHandlers.onJoinRoom).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('disables both buttons when isLoading is true', () => {
      renderBlitzEntry({ isLoading: true });

      const createBtn = screen.getByRole('button', { name: /Create Room/i });
      const joinBtn = screen.getByRole('button', { name: /Join Room/i });

      expect(createBtn).toBeDisabled();
      expect(joinBtn).toBeDisabled();
    });

    it('enables both buttons when isLoading is false', () => {
      renderBlitzEntry({ isLoading: false });

      const createBtn = screen.getByRole('button', { name: /Create Room/i });
      const joinBtn = screen.getByRole('button', { name: /Join Room/i });

      expect(createBtn).not.toBeDisabled();
      expect(joinBtn).not.toBeDisabled();
    });

    it('shows loading indicator when isLoading is true', () => {
      renderBlitzEntry({ isLoading: true });

      const loadingIndicator = screen.getByText(/loading|creating|joining/i);
      expect(loadingIndicator).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('displays error message when error is set', () => {
      const errorMsg = 'Failed to create room';
      renderBlitzEntry({ error: errorMsg });

      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    it('does not display error message when error is null', () => {
      renderBlitzEntry({ error: null });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows different error messages for different errors', () => {
      const { rerender } = renderBlitzEntry({ error: 'Error 1' });

      expect(screen.getByText('Error 1')).toBeInTheDocument();

      rerender(
        <BlitzEntry
          isLoading={false}
          error="Error 2"
          {...mockHandlers}
        />
      );

      expect(screen.queryByText('Error 1')).not.toBeInTheDocument();
      expect(screen.getByText('Error 2')).toBeInTheDocument();
    });
  });

  describe('keyboard accessibility', () => {
    it('Create Room button is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderBlitzEntry();

      const createBtn = screen.getByRole('button', { name: /Create Room/i });
      createBtn.focus();
      expect(createBtn).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockHandlers.onCreateRoom).toHaveBeenCalled();
    });

    it('Join Room button is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderBlitzEntry();

      const joinBtn = screen.getByRole('button', { name: /Join Room/i });
      joinBtn.focus();
      expect(joinBtn).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockHandlers.onJoinRoom).toHaveBeenCalled();
    });
  });
});
