import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BlitzPage } from './BlitzPage';
import * as useBlitzRoomModule from './useBlitzRoom';
import * as types from './types';

// Mock the useBlitzRoom hook
jest.mock('./useBlitzRoom');

// Mock child components
jest.mock('./components/BlitzEntry', () => ({
  BlitzEntry: () => <div data-testid="blitz-entry">BlitzEntry</div>,
}));

jest.mock('./components/CreateRoomForm', () => ({
  CreateRoomForm: () => <div data-testid="create-room-form">CreateRoomForm</div>,
}));

jest.mock('./components/JoinRoomForm', () => ({
  JoinRoomForm: () => <div data-testid="join-room-form">JoinRoomForm</div>,
}));

jest.mock('./components/WaitingRoom', () => ({
  WaitingRoom: () => <div data-testid="waiting-room">WaitingRoom</div>,
}));

jest.mock('./components/CountdownOverlay', () => ({
  CountdownOverlay: () => <div data-testid="countdown-overlay">CountdownOverlay</div>,
}));

jest.mock('./components/BlitzGameScreen', () => ({
  BlitzGameScreen: () => <div data-testid="blitz-game-screen">BlitzGameScreen</div>,
}));

jest.mock('./components/BlitzResultsScreen', () => ({
  BlitzResultsScreen: () => <div data-testid="blitz-results-screen">BlitzResultsScreen</div>,
}));

// Helper function to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('BlitzPage', () => {
  const createMockBlitzState = (overrides = {}) => ({
    room: null,
    myPlayerId: null,
    me: null,
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
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Idle Phase (room is null)', () => {
    it('renders BlitzEntry when room is null', () => {
      (useBlitzRoomModule.useBlitzRoom as jest.Mock).mockReturnValue(createMockBlitzState());
      renderWithRouter(<BlitzPage />);
      expect(screen.getByTestId('blitz-entry')).toBeInTheDocument();
    });
  });

  describe('Lobby Phase (room exists, status = lobby)', () => {
    it('renders WaitingRoom when room.currentPhase is lobby', () => {
      const mockRoom: types.BlitzRoom = {
        meta: {
          roomCode: types.createRoomCode('ABC123'),
          wordLength: 5,
          difficulty: 'medium',
          durationMs: 90000,
          timerTier: 'tier2',
          createdAt: Date.now(),
          startedAt: null,
          endedAt: null,
          sessionSeed: 'seed123',
        },
        players: new Map(),
        puzzles: [],
        currentPuzzleIndex: 0,
        currentPhase: 'lobby',
      };

      (useBlitzRoomModule.useBlitzRoom as jest.Mock).mockReturnValue(
        createMockBlitzState({
          room: mockRoom,
          myPlayerId: types.createPlayerId('player1'),
          me: {
            id: types.createPlayerId('player1'),
            name: 'TestPlayer',
            solved: 0,
            wrong: 0,
            hints: 0,
            score: 0,
            solvedAt: null,
            wrongAt: [],
            hintsUsedAt: [],
          },
          isHost: true,
        })
      );
      renderWithRouter(<BlitzPage />);
      expect(screen.getByTestId('waiting-room')).toBeInTheDocument();
    });
  });

  describe('Countdown Phase (room exists, status = countdown)', () => {
    it('renders CountdownOverlay when room.currentPhase is countdown', () => {
      const mockRoom: types.BlitzRoom = {
        meta: {
          roomCode: types.createRoomCode('ABC123'),
          wordLength: 5,
          difficulty: 'medium',
          durationMs: 90000,
          timerTier: 'tier2',
          createdAt: Date.now(),
          startedAt: Date.now(),
          endedAt: null,
          sessionSeed: 'seed123',
        },
        players: new Map(),
        puzzles: ['cat->bat', 'bat->rat'],
        currentPuzzleIndex: 0,
        currentPhase: 'countdown',
      };

      (useBlitzRoomModule.useBlitzRoom as jest.Mock).mockReturnValue(
        createMockBlitzState({
          room: mockRoom,
          myPlayerId: types.createPlayerId('player1'),
          isHost: true,
        })
      );
      renderWithRouter(<BlitzPage />);
      expect(screen.getByTestId('countdown-overlay')).toBeInTheDocument();
    });
  });

  describe('Playing Phase (room exists, status = playing)', () => {
    it('renders BlitzGameScreen when room.currentPhase is playing', () => {
      const mockRoom: types.BlitzRoom = {
        meta: {
          roomCode: types.createRoomCode('ABC123'),
          wordLength: 5,
          difficulty: 'medium',
          durationMs: 90000,
          timerTier: 'tier2',
          createdAt: Date.now(),
          startedAt: Date.now(),
          endedAt: null,
          sessionSeed: 'seed123',
        },
        players: new Map(),
        puzzles: ['cat->bat', 'bat->rat'],
        currentPuzzleIndex: 0,
        currentPhase: 'playing',
      };

      (useBlitzRoomModule.useBlitzRoom as jest.Mock).mockReturnValue(
        createMockBlitzState({
          room: mockRoom,
          myPlayerId: types.createPlayerId('player1'),
          isHost: true,
        })
      );
      renderWithRouter(<BlitzPage />);
      expect(screen.getByTestId('blitz-game-screen')).toBeInTheDocument();
    });
  });

  describe('Finished Phase (room exists, status = finished)', () => {
    it('renders BlitzResultsScreen when room.currentPhase is finished', () => {
      const mockRoom: types.BlitzRoom = {
        meta: {
          roomCode: types.createRoomCode('ABC123'),
          wordLength: 5,
          difficulty: 'medium',
          durationMs: 90000,
          timerTier: 'tier2',
          createdAt: Date.now(),
          startedAt: Date.now(),
          endedAt: Date.now(),
          sessionSeed: 'seed123',
        },
        players: new Map(),
        puzzles: ['cat->bat', 'bat->rat'],
        currentPuzzleIndex: 2,
        currentPhase: 'finished',
      };

      (useBlitzRoomModule.useBlitzRoom as jest.Mock).mockReturnValue(
        createMockBlitzState({
          room: mockRoom,
          myPlayerId: types.createPlayerId('player1'),
          isHost: true,
        })
      );
      renderWithRouter(<BlitzPage />);
      expect(screen.getByTestId('blitz-results-screen')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows error state if sync error occurs', () => {
      const error = { code: 'ROOM_NOT_FOUND', message: 'Room does not exist' };
      (useBlitzRoomModule.useBlitzRoom as jest.Mock).mockReturnValue(
        createMockBlitzState({
          error,
        })
      );

      renderWithRouter(<BlitzPage />);
      expect(screen.getByText(/Room does not exist/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('handles loading state', () => {
      (useBlitzRoomModule.useBlitzRoom as jest.Mock).mockReturnValue(
        createMockBlitzState({
          isLoading: true,
        })
      );

      renderWithRouter(<BlitzPage />);
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });
  });

  it('sets document title', () => {
    (useBlitzRoomModule.useBlitzRoom as jest.Mock).mockReturnValue(createMockBlitzState());
    renderWithRouter(<BlitzPage />);
    expect(document.title).toBe('Blitz — Word Ladder');
  });
});
