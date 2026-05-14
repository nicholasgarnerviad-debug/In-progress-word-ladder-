import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlitzGameScreen } from '../BlitzGameScreen';
import type { BlitzPlayer, PlayerId } from '../../types';
import { createPlayerId } from '../../types';

// Mock the hooks
jest.mock('../../useBlitzTimer', () => ({
  useBlitzTimer: jest.fn(() => ({
    remainingMs: 45000,
    isExpired: false,
    isRunning: true,
  })),
}));

jest.mock('../../useBlitzRoom', () => ({
  useBlitzRoom: jest.fn(() => ({
    room: {
      meta: { roomCode: 'TEST123', wordLength: 5, difficulty: 'easy' },
      players: new Map([
        [
          createPlayerId('p1'),
          {
            id: createPlayerId('p1'),
            name: 'Player 1',
            score: 100,
            solved: 2,
            wrong: 0,
            hints: 0,
            solvedAt: null,
            wrongAt: [],
            hintsUsedAt: [],
          },
        ],
      ]),
      puzzles: ['start', 'end', 'middle'],
      currentPuzzleIndex: 0,
      currentPhase: 'playing',
    },
    myPlayerId: createPlayerId('p1'),
    me: {
      id: createPlayerId('p1'),
      name: 'Player 1',
      score: 100,
      solved: 2,
      wrong: 0,
      hints: 0,
      solvedAt: null,
      wrongAt: [],
      hintsUsedAt: [],
    },
    error: null,
    postPuzzleResult: jest.fn(),
    updateMyState: jest.fn(),
    endGame: jest.fn(),
  })),
}));

jest.mock('../../useBlitzGame', () => ({
  useBlitzGame: jest.fn(() => ({
    currentPuzzle: {
      start: 'start',
      end: 'end',
      optimal: 5,
    },
    currentPuzzleIndex: 0,
    puzzlesSolved: 2,
    sessionScore: 100,
    isFinished: false,
    phase: 'playing',
    reportSolved: jest.fn(),
    reportFailed: jest.fn(),
  })),
}));

jest.mock('../../../../components/PuzzleBoard', () => ({
  PuzzleBoard: jest.fn(({ onSolved, onWrongGuess }) => (
    <div data-testid="puzzle-board">
      <button onClick={onSolved}>Solve Puzzle</button>
      <button onClick={onWrongGuess}>Wrong Guess</button>
    </div>
  )),
}));

describe('BlitzGameScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks to default state
    const { useBlitzTimer } = require('../../useBlitzTimer');
    const { useBlitzRoom } = require('../../useBlitzRoom');
    useBlitzTimer.mockReturnValue({
      remainingMs: 45000,
      isExpired: false,
      isRunning: true,
    });
    useBlitzRoom.mockReturnValue({
      room: {
        meta: { roomCode: 'TEST123', wordLength: 5, difficulty: 'easy' },
        players: new Map([
          [
            createPlayerId('p1'),
            {
              id: createPlayerId('p1'),
              name: 'Player 1',
              score: 100,
              solved: 2,
              wrong: 0,
              hints: 0,
              solvedAt: null,
              wrongAt: [],
              hintsUsedAt: [],
            },
          ],
        ]),
        puzzles: ['start', 'end', 'middle'],
        currentPuzzleIndex: 0,
        currentPhase: 'playing',
      },
      myPlayerId: createPlayerId('p1'),
      me: {
        id: createPlayerId('p1'),
        name: 'Player 1',
        score: 100,
        solved: 2,
        wrong: 0,
        hints: 0,
        solvedAt: null,
        wrongAt: [],
        hintsUsedAt: [],
      },
      error: null,
      postPuzzleResult: jest.fn(),
      updateMyState: jest.fn(),
      endGame: jest.fn(),
    });
  });

  describe('timer display', () => {
    it('renders timer in MM:SS format', () => {
      render(<BlitzGameScreen />);

      const timerText = screen.getByText(/\d{2}:\d{2}/);
      expect(timerText).toBeInTheDocument();
    });

    it('shows timer as red when below 10 seconds', () => {
      const { useBlitzTimer } = require('../../useBlitzTimer');
      useBlitzTimer.mockReturnValue({
        remainingMs: 5000,
        isExpired: false,
        isRunning: true,
      });

      render(<BlitzGameScreen />);

      const timerElement = screen.getByText(/\d{2}:\d{2}/);
      expect(timerElement).toHaveClass('text-red-600');
    });

    it('shows timer in white/default color when >= 10 seconds', () => {
      const { useBlitzTimer } = require('../../useBlitzTimer');
      useBlitzTimer.mockReturnValue({
        remainingMs: 15000,
        isExpired: false,
        isRunning: true,
      });

      render(<BlitzGameScreen />);

      const timerElement = screen.getByText(/\d{2}:\d{2}/);
      expect(timerElement).not.toHaveClass('text-red-600');
    });
  });

  describe('puzzle board', () => {
    it('renders PuzzleBoard component', () => {
      render(<BlitzGameScreen />);

      expect(screen.getByTestId('puzzle-board')).toBeInTheDocument();
    });

    it('displays puzzle progress', () => {
      render(<BlitzGameScreen />);

      expect(screen.getByText(/Puzzle 1\/\d+/)).toBeInTheDocument();
    });
  });

  describe('leaderboard', () => {
    it('renders BlitzLeaderboard on right side', () => {
      render(<BlitzGameScreen />);

      // Should have leaderboard with heading
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('renders Skip Puzzle button', () => {
      render(<BlitzGameScreen />);

      expect(
        screen.getByRole('button', { name: /Skip|Skip Puzzle/i })
      ).toBeInTheDocument();
    });

    it('renders Forfeit Game button', () => {
      render(<BlitzGameScreen />);

      expect(
        screen.getByRole('button', { name: /Forfeit|Forfeit Game/i })
      ).toBeInTheDocument();
    });

    it('calls endGame when Forfeit button clicked', () => {
      const { useBlitzRoom } = require('../../useBlitzRoom');
      const mockEndGame = jest.fn();
      useBlitzRoom.mockReturnValue({
        room: {
          meta: { roomCode: 'TEST123', wordLength: 5, difficulty: 'easy' },
          players: new Map([
            [
              createPlayerId('p1'),
              {
                id: createPlayerId('p1'),
                name: 'Player 1',
                score: 100,
                solved: 2,
                wrong: 0,
                hints: 0,
                solvedAt: null,
                wrongAt: [],
                hintsUsedAt: [],
              },
            ],
          ]),
          puzzles: ['start', 'end', 'middle'],
          currentPuzzleIndex: 0,
          currentPhase: 'playing',
        },
        myPlayerId: createPlayerId('p1'),
        me: {
          id: createPlayerId('p1'),
          name: 'Player 1',
          score: 100,
          solved: 2,
          wrong: 0,
          hints: 0,
          solvedAt: null,
          wrongAt: [],
          hintsUsedAt: [],
        },
        error: null,
        postPuzzleResult: jest.fn(),
        updateMyState: jest.fn(),
        endGame: mockEndGame,
      });

      render(<BlitzGameScreen />);

      const forfeitBtn = screen.getByRole('button', { name: /Forfeit/i });
      fireEvent.click(forfeitBtn);

      expect(mockEndGame).toHaveBeenCalled();
    });
  });

  describe('layout', () => {
    it('arranges components in responsive grid', () => {
      const { container } = render(<BlitzGameScreen />);

      const mainContainer = container.querySelector('[class*="grid"]');
      expect(mainContainer).toBeInTheDocument();
    });

    it('displays player name and puzzle progress', () => {
      render(<BlitzGameScreen />);

      expect(screen.getAllByText('Player 1')[0]).toBeInTheDocument();
      expect(screen.getByText(/Puzzle 1\/\d+/)).toBeInTheDocument();
    });
  });
});
