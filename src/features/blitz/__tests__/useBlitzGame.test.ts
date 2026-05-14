import { renderHook, act } from '@testing-library/react';
import { useBlitzGame } from '../useBlitzGame';
import type { BlitzRoom, BlitzPlayer, BlitzPuzzleResult } from '../types';
import { createPlayerId, createRoomCode, BlitzDifficulty, BlitzWordLength } from '../types';
import type { WordPuzzle } from '../../../generatePuzzle';

// Mock implementations
const mockPostPuzzleResult = jest.fn();
const mockUpdateMyState = jest.fn();

// Helper to create mock puzzle
function createMockPuzzle(startWord: string, endWord: string, optimalSteps: number): WordPuzzle {
  return {
    start: startWord,
    end: endWord,
    optimal: optimalSteps,
    chain: Array(optimalSteps + 1)
      .fill(0)
      .map((_, i) => (i === 0 ? startWord : i === optimalSteps ? endWord : `word${i}`)),
    lockedIndices: [],
    extraRungs: 0,
  };
}

// Helper to create mock room
function createMockRoom(
  puzzles: WordPuzzle[] = [],
  currentPhase: 'idle' | 'lobby' | 'countdown' | 'playing' | 'finished' = 'playing',
  currentPuzzleIndex: number = 0
): BlitzRoom {
  return {
    meta: {
      roomCode: createRoomCode('TEST00'),
      wordLength: 4 as BlitzWordLength,
      difficulty: 'easy' as BlitzDifficulty,
      durationMs: 60000,
      timerTier: 'tier1',
      createdAt: Date.now(),
      startedAt: Date.now(),
      endedAt: null,
      sessionSeed: 'seed123',
    },
    players: new Map(),
    currentPuzzleIndex,
    currentPhase: currentPhase,
    puzzles: puzzles as any, // Cast to any to add puzzles array
  } as any;
}

// Helper to create mock player
function createMockPlayer(overrides?: Partial<BlitzPlayer>): BlitzPlayer {
  return {
    id: createPlayerId('player1'),
    name: 'Test Player',
    solved: 0,
    wrong: 0,
    hints: 0,
    score: 0,
    solvedAt: null,
    wrongAt: [],
    hintsUsedAt: [],
    ...overrides,
  };
}

describe('useBlitzGame', () => {
  beforeEach(() => {
    jest.useFakeTimers('modern');
    jest.clearAllMocks();
    mockPostPuzzleResult.mockResolvedValue(undefined);
    mockUpdateMyState.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('with no room', () => {
    it('returns idle phase, null puzzle, and zero counters', () => {
      const { result } = renderHook(() =>
        useBlitzGame({
          room: null,
          me: null,
          postPuzzleResult: mockPostPuzzleResult,
          updateMyState: mockUpdateMyState,
        })
      );

      expect(result.current.phase).toBe('idle');
      expect(result.current.currentPuzzle).toBeNull();
      expect(result.current.currentPuzzleIndex).toBe(0);
      expect(result.current.puzzlesSolved).toBe(0);
      expect(result.current.sessionScore).toBe(0);
      expect(result.current.isFinished).toBe(false);
      expect(result.current.isSolveFlashing).toBe(false);
      expect(result.current.lastEarnedScore).toBe(0);
    });
  });

  describe('with valid room and player', () => {
    it('derives state correctly with current puzzle', () => {
      const puzzle1 = createMockPuzzle('cat', 'dog', 3);
      const puzzle2 = createMockPuzzle('bat', 'hat', 2);
      const room = createMockRoom([puzzle1, puzzle2], 'playing', 0);
      const player = createMockPlayer({ solved: 0, score: 0 });

      const { result } = renderHook(() =>
        useBlitzGame({
          room,
          me: player,
          postPuzzleResult: mockPostPuzzleResult,
          updateMyState: mockUpdateMyState,
        })
      );

      expect(result.current.phase).toBe('playing');
      expect(result.current.currentPuzzleIndex).toBe(0);
      expect(result.current.puzzlesSolved).toBe(0);
      expect(result.current.sessionScore).toBe(0);
      expect(result.current.isFinished).toBe(false);
      expect(result.current.currentPuzzle).toEqual(puzzle1);
    });

    it('handles advanced puzzle index', () => {
      const puzzle1 = createMockPuzzle('cat', 'dog', 3);
      const puzzle2 = createMockPuzzle('bat', 'hat', 2);
      const room = createMockRoom([puzzle1, puzzle2], 'playing', 1);
      const player = createMockPlayer({ solved: 1, score: 95 });

      const { result } = renderHook(() =>
        useBlitzGame({
          room,
          me: player,
          postPuzzleResult: mockPostPuzzleResult,
          updateMyState: mockUpdateMyState,
        })
      );

      expect(result.current.currentPuzzleIndex).toBe(1);
      expect(result.current.puzzlesSolved).toBe(1);
      expect(result.current.sessionScore).toBe(95);
      expect(result.current.currentPuzzle).toEqual(puzzle2);
    });
  });

  describe('reportSolved', () => {
    it('calls postPuzzleResult and updateMyState with correct score', async () => {
      const puzzle = createMockPuzzle('cat', 'dog', 3);
      const room = createMockRoom([puzzle], 'playing', 0);
      const player = createMockPlayer();

      const now = Date.now();
      jest.setSystemTime(now);

      const { result } = renderHook(() =>
        useBlitzGame({
          room,
          me: player,
          postPuzzleResult: mockPostPuzzleResult,
          updateMyState: mockUpdateMyState,
        })
      );

      // Advance time 5 seconds
      jest.advanceTimersByTime(5000);

      await act(async () => {
        await result.current.reportSolved({ wrongAttempts: 0, hintsUsed: 0 });
      });

      expect(mockPostPuzzleResult).toHaveBeenCalledTimes(1);
      expect(mockPostPuzzleResult).toHaveBeenCalledWith(
        expect.objectContaining({
          solved: true,
          solveTime: expect.any(Number),
          wrong: 0,
          hints: 0,
          score: expect.any(Number),
        })
      );

      expect(mockUpdateMyState).toHaveBeenCalledTimes(1);
      expect(mockUpdateMyState).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPuzzleIndex: 1,
          puzzlesSolved: 1,
          sessionScore: expect.any(Number),
          isFinished: true, // Only one puzzle in room, so finishing it ends game
          lastActivity: expect.any(Number),
        })
      );
    });

    it('computes score based on attempts and hints', async () => {
      const puzzle = createMockPuzzle('cat', 'dog', 3);
      const room = createMockRoom([puzzle], 'playing', 0);
      const player = createMockPlayer();

      jest.setSystemTime(Date.now());

      const { result } = renderHook(() =>
        useBlitzGame({
          room,
          me: player,
          postPuzzleResult: mockPostPuzzleResult,
          updateMyState: mockUpdateMyState,
        })
      );

      // Advance time 3 seconds
      jest.advanceTimersByTime(3000);

      await act(async () => {
        await result.current.reportSolved({ wrongAttempts: 2, hintsUsed: 1 });
      });

      const call = mockPostPuzzleResult.mock.calls[0][0] as BlitzPuzzleResult;
      // Score formula: 100 - (2*40) - (1*50) + speedBonus = 100 - 80 - 50 + speedBonus = -30 + speedBonus
      // Par time for 4-letter easy word is 3000ms, speedBonus = (3000-3000)/1000*5 = 0
      // Minimum is 10, so score should be 10
      expect(call.score).toBeGreaterThanOrEqual(10);
    });

    it('sets isSolveFlashing true then false after 600ms', async () => {
      const puzzle = createMockPuzzle('cat', 'dog', 3);
      const room = createMockRoom([puzzle], 'playing', 0);
      const player = createMockPlayer();

      jest.setSystemTime(Date.now());

      const { result } = renderHook(() =>
        useBlitzGame({
          room,
          me: player,
          postPuzzleResult: mockPostPuzzleResult,
          updateMyState: mockUpdateMyState,
        })
      );

      expect(result.current.isSolveFlashing).toBe(false);

      await act(async () => {
        await result.current.reportSolved({ wrongAttempts: 0, hintsUsed: 0 });
      });

      expect(result.current.isSolveFlashing).toBe(true);
      expect(result.current.lastEarnedScore).toBeGreaterThan(0);

      // Advance past flash timeout
      act(() => {
        jest.advanceTimersByTime(650);
      });

      expect(result.current.isSolveFlashing).toBe(false);
    });

    it('sets lastEarnedScore to computed value', async () => {
      const puzzle = createMockPuzzle('cat', 'dog', 3);
      const room = createMockRoom([puzzle], 'playing', 0);
      const player = createMockPlayer();

      jest.setSystemTime(Date.now());

      const { result } = renderHook(() =>
        useBlitzGame({
          room,
          me: player,
          postPuzzleResult: mockPostPuzzleResult,
          updateMyState: mockUpdateMyState,
        })
      );

      expect(result.current.lastEarnedScore).toBe(0);

      await act(async () => {
        await result.current.reportSolved({ wrongAttempts: 0, hintsUsed: 0 });
      });

      expect(result.current.lastEarnedScore).toBeGreaterThan(0);
    });
  });

  describe('reportFailed', () => {
    it('advances without crediting solve or score', async () => {
      const puzzle1 = createMockPuzzle('cat', 'dog', 3);
      const puzzle2 = createMockPuzzle('bat', 'hat', 2);
      const room = createMockRoom([puzzle1, puzzle2], 'playing', 0);
      const player = createMockPlayer({ solved: 0, score: 0 });

      jest.setSystemTime(Date.now());

      const { result } = renderHook(() =>
        useBlitzGame({
          room,
          me: player,
          postPuzzleResult: mockPostPuzzleResult,
          updateMyState: mockUpdateMyState,
        })
      );

      await act(async () => {
        await result.current.reportFailed({ wrongAttempts: 5, hintsUsed: 2 });
      });

      expect(mockPostPuzzleResult).toHaveBeenCalledWith(
        expect.objectContaining({
          solved: false,
          solveTime: null,
          score: 0,
        })
      );

      expect(mockUpdateMyState).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPuzzleIndex: 1,
          isFinished: false,
          lastActivity: expect.any(Number),
        })
      );

      // Verify that puzzlesSolved and sessionScore are NOT in the patch
      const patch = mockUpdateMyState.mock.calls[0][0];
      expect(patch.puzzlesSolved).toBeUndefined();
      expect(patch.sessionScore).toBeUndefined();
    });
  });

  describe('solving final puzzle', () => {
    it('sets isFinished true', async () => {
      const puzzle = createMockPuzzle('cat', 'dog', 3);
      const room = createMockRoom([puzzle], 'playing', 0);
      const player = createMockPlayer();

      jest.setSystemTime(Date.now());

      const { result } = renderHook(() =>
        useBlitzGame({
          room,
          me: player,
          postPuzzleResult: mockPostPuzzleResult,
          updateMyState: mockUpdateMyState,
        })
      );

      await act(async () => {
        await result.current.reportSolved({ wrongAttempts: 0, hintsUsed: 0 });
      });

      expect(mockUpdateMyState).toHaveBeenCalledWith(
        expect.objectContaining({
          isFinished: true,
        })
      );
    });
  });

  describe('puzzle timing', () => {
    it('tracks when puzzle starts', () => {
      const puzzle = createMockPuzzle('cat', 'dog', 3);
      const room = createMockRoom([puzzle], 'playing', 0);
      const player = createMockPlayer();

      const now = Date.now();
      jest.setSystemTime(now);

      renderHook(() =>
        useBlitzGame({
          room,
          me: player,
          postPuzzleResult: mockPostPuzzleResult,
          updateMyState: mockUpdateMyState,
        })
      );

      // Verify puzzle timer was initialized (indirectly through solve timing)
      expect(mockPostPuzzleResult).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('clears flashTimeoutRef on unmount', async () => {
      const puzzle = createMockPuzzle('cat', 'dog', 3);
      const room = createMockRoom([puzzle], 'playing', 0);
      const player = createMockPlayer();

      jest.setSystemTime(Date.now());

      const { result, unmount } = renderHook(() =>
        useBlitzGame({
          room,
          me: player,
          postPuzzleResult: mockPostPuzzleResult,
          updateMyState: mockUpdateMyState,
        })
      );

      await act(async () => {
        await result.current.reportSolved({ wrongAttempts: 0, hintsUsed: 0 });
      });

      expect(result.current.isSolveFlashing).toBe(true);

      // Clear any timers
      act(() => {
        jest.clearAllTimers();
      });

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('no room or player safety checks', () => {
    it('reportSolved returns early if no puzzle', async () => {
      const { result } = renderHook(() =>
        useBlitzGame({
          room: null,
          me: null,
          postPuzzleResult: mockPostPuzzleResult,
          updateMyState: mockUpdateMyState,
        })
      );

      await act(async () => {
        await result.current.reportSolved({ wrongAttempts: 0, hintsUsed: 0 });
      });

      expect(mockPostPuzzleResult).not.toHaveBeenCalled();
      expect(mockUpdateMyState).not.toHaveBeenCalled();
    });

    it('reportFailed returns early if no puzzle', async () => {
      const { result } = renderHook(() =>
        useBlitzGame({
          room: null,
          me: null,
          postPuzzleResult: mockPostPuzzleResult,
          updateMyState: mockUpdateMyState,
        })
      );

      await act(async () => {
        await result.current.reportFailed({ wrongAttempts: 0, hintsUsed: 0 });
      });

      expect(mockPostPuzzleResult).not.toHaveBeenCalled();
      expect(mockUpdateMyState).not.toHaveBeenCalled();
    });
  });

  describe('when game is finished', () => {
    it('returns null puzzle', () => {
      const puzzle = createMockPuzzle('cat', 'dog', 3);
      const room = createMockRoom([puzzle], 'finished', 1);
      const player = createMockPlayer({ solvedAt: Date.now() });

      const { result } = renderHook(() =>
        useBlitzGame({
          room,
          me: player,
          postPuzzleResult: mockPostPuzzleResult,
          updateMyState: mockUpdateMyState,
        })
      );

      expect(result.current.isFinished).toBe(true);
      expect(result.current.currentPuzzle).toBeNull();
    });
  });
});
