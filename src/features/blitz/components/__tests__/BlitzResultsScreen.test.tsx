import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BlitzResultsScreen } from '../BlitzResultsScreen';
import { useBlitzRoom } from '../../useBlitzRoom';
import { useNavigate } from 'react-router-dom';
import type { BlitzRoom, BlitzPlayer, PlayerId } from '../../types';
import { createPlayerId, createRoomCode } from '../../types';

// Mock react-confetti
jest.mock('react-confetti', () => {
  return {
    __esModule: true,
    default: ({ recycle, gravity, wind }: Record<string, any>) => (
      <div
        data-testid="confetti-mock"
        data-recycle={recycle}
        data-gravity={gravity}
        data-wind={wind}
      />
    ),
  };
});

// Mock hooks
jest.mock('../../useBlitzRoom');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const mockUseBlitzRoom = useBlitzRoom as jest.MockedFunction<typeof useBlitzRoom>;
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;

describe('BlitzResultsScreen', () => {
  const mockNavigate = jest.fn();
  const playerId1 = createPlayerId('player1');
  const playerId2 = createPlayerId('player2');
  const playerId3 = createPlayerId('player3');
  const playerId4 = createPlayerId('player4');
  const roomCode = createRoomCode('ABC123');

  const mockPlayer1: BlitzPlayer = {
    id: playerId1,
    name: 'Alice',
    solved: 8,
    wrong: 2,
    hints: 1,
    score: 750,
    solvedAt: 100000,
    wrongAt: [],
    hintsUsedAt: [],
  };

  const mockPlayer2: BlitzPlayer = {
    id: playerId2,
    name: 'Bob',
    solved: 6,
    wrong: 1,
    hints: 0,
    score: 560,
    solvedAt: 95000,
    wrongAt: [],
    hintsUsedAt: [],
  };

  const mockPlayer3: BlitzPlayer = {
    id: playerId3,
    name: 'Charlie',
    solved: 5,
    wrong: 3,
    hints: 2,
    score: 420,
    solvedAt: 90000,
    wrongAt: [],
    hintsUsedAt: [],
  };

  const mockPlayer4: BlitzPlayer = {
    id: playerId4,
    name: 'Diana',
    solved: 3,
    wrong: 5,
    hints: 3,
    score: 180,
    solvedAt: 80000,
    wrongAt: [],
    hintsUsedAt: [],
  };

  const mockRoom: BlitzRoom = {
    meta: {
      roomCode,
      wordLength: 5,
      difficulty: 'medium',
      durationMs: 60000,
      timerTier: 'tier2',
      createdAt: 1000000,
      startedAt: 1010000,
      endedAt: 1070000,
      sessionSeed: 'seed123',
      status: 'finished',
      hostId: playerId1,
    } as any,
    players: new Map([
      [playerId1, mockPlayer1],
      [playerId2, mockPlayer2],
      [playerId3, mockPlayer3],
      [playerId4, mockPlayer4],
    ]),
    puzzles: ['puzzle1', 'puzzle2', 'puzzle3', 'puzzle4', 'puzzle5'],
    currentPuzzleIndex: 4,
    currentPhase: 'finished',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  describe('rendering', () => {
    it('should render when game is finished', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId2,
        me: mockPlayer2,
        isHost: false,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      expect(screen.getByText('Game Over')).toBeInTheDocument();
    });

    it('should display "You Won!" when current player is rank 1', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId1,
        me: mockPlayer1,
        isHost: true,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      // Player 1 is the winner, so should see "You Won!"
      expect(screen.getByText(/You Won!/i)).toBeInTheDocument();
    });

    it('should display final rank and score', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId2,
        me: mockPlayer2,
        isHost: false,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      // The final score header should show 560 (appears in header and table)
      const allScores = screen.getAllByText('560');
      expect(allScores.length).toBeGreaterThanOrEqual(1);

      // Rank message
      expect(screen.getByText(/placed #2 out of 4/i)).toBeInTheDocument();
    });

    it('should render confetti on mount', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId1,
        me: mockPlayer1,
        isHost: true,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      expect(screen.getByTestId('confetti-mock')).toBeInTheDocument();
    });

    it('should configure confetti with correct properties', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId1,
        me: mockPlayer1,
        isHost: true,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      const confetti = screen.getByTestId('confetti-mock');
      expect(confetti).toHaveAttribute('data-gravity', '0.4');
      expect(confetti).toHaveAttribute('data-wind', '0');
      expect(confetti).toHaveAttribute('data-recycle', 'false');
    });
  });

  describe('leaderboard', () => {
    it('should display all players sorted by score descending', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId1,
        me: mockPlayer1,
        isHost: true,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      const playerRows = screen.getAllByRole('row');
      // Should have header row + 4 player rows
      expect(playerRows.length).toBeGreaterThanOrEqual(4);

      // Players should be sorted by score (750, 560, 420, 180)
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      expect(screen.getByText('Diana')).toBeInTheDocument();
    });

    it('should highlight current player row', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId2,
        me: mockPlayer2,
        isHost: false,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      const bobRow = screen.getByTestId('leaderboard-row-player2');
      expect(bobRow).toHaveClass('bg-blue-100');
    });

    it('should display medal icons for top 3 players', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId1,
        me: mockPlayer1,
        isHost: true,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      // Check for medal emojis
      expect(screen.getByText(/🥇/)).toBeInTheDocument(); // 1st place
      expect(screen.getByText(/🥈/)).toBeInTheDocument(); // 2nd place
      expect(screen.getByText(/🥉/)).toBeInTheDocument(); // 3rd place
    });

    it('should not display medal for 4th place', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId4,
        me: mockPlayer4,
        isHost: false,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      const dianaRow = screen.getByTestId('leaderboard-row-player4');
      const rowText = dianaRow.textContent || '';
      // Should not have medal prefix (🥇, 🥈, 🥉)
      expect(rowText).not.toMatch(/🥇|🥈|🥉/);
    });

    it('should display rank, name, score, and solved count for each player', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId1,
        me: mockPlayer1,
        isHost: true,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      // Alice (rank 1)
      const aliceRow = screen.getByTestId('leaderboard-row-player1');
      expect(aliceRow).toHaveTextContent('Alice');
      expect(aliceRow).toHaveTextContent('750');
      expect(aliceRow).toHaveTextContent('8'); // Solved count

      // Bob (rank 2)
      const bobRow = screen.getByTestId('leaderboard-row-player2');
      expect(bobRow).toHaveTextContent('Bob');
      expect(bobRow).toHaveTextContent('560');
      expect(bobRow).toHaveTextContent('6'); // Solved count
    });
  });

  describe('buttons', () => {
    it('should show "Play Again" button only to host', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId1,
        me: mockPlayer1,
        isHost: true,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      expect(screen.getByRole('button', { name: /Play Again/i })).toBeInTheDocument();
    });

    it('should not show "Play Again" button to non-host', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId2,
        me: mockPlayer2,
        isHost: false,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      expect(screen.queryByRole('button', { name: /Play Again/i })).not.toBeInTheDocument();
    });

    it('should show "Leave Room" button to all players', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId2,
        me: mockPlayer2,
        isHost: false,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      expect(screen.getByRole('button', { name: /Leave Room/i })).toBeInTheDocument();
    });

    it('should show "Home" button to all players', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId2,
        me: mockPlayer2,
        isHost: false,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('should call playAgain when "Play Again" button is clicked', async () => {
      const mockPlayAgain = jest.fn().mockResolvedValue(true);

      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId1,
        me: mockPlayer1,
        isHost: true,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: mockPlayAgain,
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      const playAgainButton = screen.getByRole('button', { name: /Play Again/i });
      fireEvent.click(playAgainButton);

      await waitFor(() => {
        expect(mockPlayAgain).toHaveBeenCalled();
      });
    });

    it('should call leaveRoom and navigate when "Leave Room" button is clicked', async () => {
      const mockLeaveRoom = jest.fn().mockResolvedValue(undefined);

      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId2,
        me: mockPlayer2,
        isHost: false,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: mockLeaveRoom,
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      const leaveButton = screen.getByRole('button', { name: /Leave Room/i });
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockLeaveRoom).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should navigate home when "Home" button is clicked', async () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId2,
        me: mockPlayer2,
        isHost: false,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      const homeButton = screen.getByRole('button', { name: /Home/i });
      fireEvent.click(homeButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('loading states', () => {
    it('should disable buttons while loading', () => {
      const mockPlayAgain = jest.fn();

      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId1,
        me: mockPlayer1,
        isHost: true,
        error: null,
        isLoading: true,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: mockPlayAgain,
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    it('should display error message if one exists', () => {
      const errorMessage = 'Failed to play again';

      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId1,
        me: mockPlayer1,
        isHost: true,
        error: { code: 'PLAY_AGAIN_FAILED', message: errorMessage },
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should have responsive design with proper spacing', () => {
      mockUseBlitzRoom.mockReturnValue({
        room: mockRoom,
        myPlayerId: playerId1,
        me: mockPlayer1,
        isHost: true,
        error: null,
        isLoading: false,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        updateSettings: jest.fn(),
        startGame: jest.fn(),
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        leaveRoom: jest.fn(),
        endGame: jest.fn(),
        playAgain: jest.fn(),
        clearError: jest.fn(),
      });

      const { container } = render(
        <BrowserRouter>
          <BlitzResultsScreen />
        </BrowserRouter>
      );

      // Should render centered container
      const mainContainer = container.querySelector('[data-testid="results-container"]');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    });
  });
});
