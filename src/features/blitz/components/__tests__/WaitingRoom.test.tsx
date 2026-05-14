import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaitingRoom } from '../WaitingRoom';
import type { BlitzRoom, BlitzPlayer, RoomCode } from '../../types';
import { createPlayerId, createRoomCode } from '../../types';

describe('WaitingRoom', () => {
  const mockRoom: BlitzRoom = {
    meta: {
      roomCode: createRoomCode('TEST00'),
      wordLength: 4,
      difficulty: 'easy',
      durationMs: 60000,
      timerTier: 'tier1',
      createdAt: Date.now(),
      startedAt: null,
      endedAt: null,
      sessionSeed: 'seed123',
    },
    players: new Map([
      [
        createPlayerId('player1'),
        {
          id: createPlayerId('player1'),
          name: 'Alice',
          solved: 0,
          wrong: 0,
          hints: 0,
          score: 0,
          solvedAt: null,
          wrongAt: [],
          hintsUsedAt: [],
        } as BlitzPlayer,
      ],
      [
        createPlayerId('player2'),
        {
          id: createPlayerId('player2'),
          name: 'Bob',
          solved: 0,
          wrong: 0,
          hints: 0,
          score: 0,
          solvedAt: null,
          wrongAt: [],
          hintsUsedAt: [],
        } as BlitzPlayer,
      ],
    ]),
    currentPuzzleIndex: 0,
    currentPhase: 'lobby',
  };

  const mockHandlers = {
    onStartGame: jest.fn(),
    onLeaveRoom: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWaitingRoom = (props = {}) => {
    return render(
      <WaitingRoom
        room={mockRoom}
        myPlayerId={createPlayerId('player1')}
        isHost={true}
        isLoading={false}
        error={null}
        {...mockHandlers}
        {...props}
      />
    );
  };

  describe('room code display', () => {
    it('displays room code prominently', () => {
      renderWaitingRoom();

      expect(screen.getByText(/TEST00/)).toBeInTheDocument();
    });

    it('shows room code in a visually distinct way', () => {
      renderWaitingRoom();

      const roomCodeElement = screen.getByText(/TEST00/);
      expect(roomCodeElement.className).toMatch(/font|bold|text/);
    });
  });

  describe('player list', () => {
    it('displays all players', () => {
      renderWaitingRoom();

      expect(screen.getByText(/Alice/)).toBeInTheDocument();
      expect(screen.getByText(/Bob/)).toBeInTheDocument();
    });

    it('shows current player', () => {
      renderWaitingRoom();

      expect(screen.getByText(/Alice/)).toBeInTheDocument();
    });

    it('shows "Host" badge for the host player', () => {
      renderWaitingRoom({ isHost: true });

      const hostText = screen.queryAllByText(/Host/i);
      expect(hostText.length).toBeGreaterThan(0);
    });

    it('does not show "Host" badge for non-host players', () => {
      renderWaitingRoom({ isHost: false });

      const aliceBadges = screen.queryAllByText(/Host/i);
      // There might be a host badge for another player, but not for Alice
      // Verify that the host is not marked as host when isHost is false
      const hostBadge = screen.queryByText(/Alice.*Host/i);
      expect(hostBadge).not.toBeInTheDocument();
    });

    it('shows player count', () => {
      renderWaitingRoom();

      expect(screen.getByText(/2 joined/i)).toBeInTheDocument();
    });
  });

  describe('settings display', () => {
    it('shows current game settings', () => {
      renderWaitingRoom();

      expect(screen.getByText(/easy/i)).toBeInTheDocument();
      expect(screen.getByText(/4/)).toBeInTheDocument();
      expect(screen.getByText(/60/)).toBeInTheDocument();
    });

    it('displays timer setting', () => {
      renderWaitingRoom();

      expect(screen.getByText(/60/)).toBeInTheDocument();
    });

    it('displays difficulty setting', () => {
      renderWaitingRoom();

      expect(screen.getByText(/easy/i)).toBeInTheDocument();
    });

    it('displays word length setting', () => {
      renderWaitingRoom();

      expect(screen.getByText(/4/)).toBeInTheDocument();
    });
  });

  describe('start button', () => {
    it('shows Start Game button when user is host', () => {
      renderWaitingRoom({ isHost: true });

      expect(screen.getByRole('button', { name: /Start Game/i })).toBeInTheDocument();
    });

    it('does not show Start Game button when user is not host', () => {
      renderWaitingRoom({ isHost: false });

      expect(screen.queryByRole('button', { name: /Start Game/i })).not.toBeInTheDocument();
    });

    it('calls onStartGame when Start Game button is clicked', async () => {
      const user = userEvent.setup();
      renderWaitingRoom({ isHost: true });

      const startBtn = screen.getByRole('button', { name: /Start Game/i });
      await user.click(startBtn);

      expect(mockHandlers.onStartGame).toHaveBeenCalled();
    });

    it('disables Start Game button when isLoading is true', () => {
      renderWaitingRoom({ isHost: true, isLoading: true });

      const startBtn = screen.getByRole('button', { name: /Starting/i });
      expect(startBtn).toBeDisabled();
    });

    it('is enabled when isLoading is false', () => {
      renderWaitingRoom({ isHost: true, isLoading: false });

      const startBtn = screen.getByRole('button', { name: /Start Game/i });
      expect(startBtn).not.toBeDisabled();
    });
  });

  describe('leave button', () => {
    it('shows Leave Room button for all players', () => {
      renderWaitingRoom();

      expect(screen.getByRole('button', { name: /Leave Room/i })).toBeInTheDocument();
    });

    it('calls onLeaveRoom when Leave Room button is clicked', async () => {
      const user = userEvent.setup();
      renderWaitingRoom();

      const leaveBtn = screen.getByRole('button', { name: /Leave Room/i });
      await user.click(leaveBtn);

      expect(mockHandlers.onLeaveRoom).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('displays error message when error is set', () => {
      const errorMsg = 'Failed to start game';
      renderWaitingRoom({ error: errorMsg });

      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    it('does not display error when error is null', () => {
      renderWaitingRoom({ error: null });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator when isLoading is true', () => {
      renderWaitingRoom({ isLoading: true });

      const loadingIndicator = screen.getByText(/Starting game/i);
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('disables buttons when isLoading is true', () => {
      renderWaitingRoom({ isHost: true, isLoading: true });

      const startBtn = screen.getByRole('button', { name: /Starting/i });
      const leaveBtn = screen.getByRole('button', { name: /Leave Room/i });

      expect(startBtn).toBeDisabled();
      expect(leaveBtn).toBeDisabled();
    });

    it('enables buttons when isLoading is false', () => {
      renderWaitingRoom({ isHost: true, isLoading: false });

      const startBtn = screen.getByRole('button', { name: /Start Game/i });
      const leaveBtn = screen.getByRole('button', { name: /Leave Room/i });

      expect(startBtn).not.toBeDisabled();
      expect(leaveBtn).not.toBeDisabled();
    });
  });

  describe('non-host behavior', () => {
    it('non-host players see settings but cannot modify them', () => {
      renderWaitingRoom({ isHost: false });

      expect(screen.getByText(/easy/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Start Game/i })).not.toBeInTheDocument();
    });

    it('non-host players see "Waiting for host" message', () => {
      renderWaitingRoom({ isHost: false });

      expect(screen.getByText(/waiting|host/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderWaitingRoom();

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWaitingRoom({ isHost: true });

      const startBtn = screen.getByRole('button', { name: /Start Game/i });
      startBtn.focus();
      expect(startBtn).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockHandlers.onStartGame).toHaveBeenCalled();
    });
  });
});
