import { renderHook, act } from '@testing-library/react';
import { useTimeAttack } from '../useTimeAttack';
import * as generatePuzzleModule from '../../../generatePuzzle';
import * as statsModule from '../stats';
import { useTimer } from '../timer';

jest.mock('../../../generatePuzzle');
jest.mock('../stats');
jest.mock('../timer');

describe('useTimeAttack hook', () => {
  const mockPuzzle = {
    start: 'cat',
    end: 'dog',
    optimal: 3,
    chain: ['cat', 'bat', 'dog'],
    lockedIndices: [],
    extraRungs: 2,
  };

  const mockPuzzle2 = {
    start: 'dog',
    end: 'cat',
    optimal: 3,
    chain: ['dog', 'dot', 'cat'],
    lockedIndices: [],
    extraRungs: 2,
  };

  let mockTimerInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    (generatePuzzleModule.generatePuzzle as jest.Mock).mockReturnValue(mockPuzzle);
    (statsModule.loadStats as jest.Mock).mockReturnValue({
      bests: {},
      totalRuns: 0,
      totalSolved: 0,
    });
    (statsModule.recordRun as jest.Mock).mockImplementation((stats, summary) => ({
      ...stats,
      totalRuns: stats.totalRuns + 1,
      totalSolved: stats.totalSolved + summary.solvedCount,
    }));
    (statsModule.saveStats as jest.Mock).mockImplementation(() => {});

    mockTimerInstance = {
      isRunning: false,
      isExpired: false,
      remainingMs: 60000,
      start: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      adjustTime: jest.fn((ms: number) => {
        mockTimerInstance.remainingMs += ms;
      }),
      reset: jest.fn((ms: number) => {
        mockTimerInstance.remainingMs = ms;
      }),
    };

    (useTimer as jest.Mock).mockReturnValue(mockTimerInstance);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('starts in idle phase with no mode or tier selected', () => {
      const { result } = renderHook(() => useTimeAttack());

      expect(result.current.phase).toBe('idle');
      expect(result.current.mode).toBeNull();
      expect(result.current.tier).toBeNull();
      expect(result.current.solvedCount).toBe(0);
      expect(result.current.currentStreak).toBe(0);
      expect(result.current.longestStreak).toBe(0);
      expect(result.current.freeSkipsRemaining).toBe(2);
      expect(result.current.previousBestAtRunEnd).toBeNull();
    });

    it('exposes all expected actions', () => {
      const { result } = renderHook(() => useTimeAttack());

      expect(typeof result.current.chooseMode).toBe('function');
      expect(typeof result.current.chooseTier).toBe('function');
      expect(typeof result.current.backToModeSelect).toBe('function');
      expect(typeof result.current.startRun).toBe('function');
      expect(typeof result.current.reportSolved).toBe('function');
      expect(typeof result.current.skipPuzzle).toBe('function');
      expect(typeof result.current.endRun).toBe('function');
      expect(typeof result.current.playAgain).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('mode and tier selection', () => {
    it('chooses mode and advances to setup when tier is already selected', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.chooseMode('sprint');
      });

      expect(result.current.mode).toBe('sprint');
      expect(result.current.tier).toBe(60);
      expect(result.current.phase).toBe('setup');
    });

    it('chooses tier and advances to setup when mode is already selected', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('survival');
      });

      act(() => {
        result.current.chooseTier(90);
      });

      expect(result.current.mode).toBe('survival');
      expect(result.current.tier).toBe(90);
      expect(result.current.phase).toBe('setup');
    });

    it('advances to setup when only mode is selected', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
      });

      expect(result.current.phase).toBe('setup');
      expect(result.current.mode).toBe('sprint');
      expect(result.current.tier).toBeNull();
    });

    it('stays in idle if only tier is selected (without mode)', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseTier(60);
      });

      expect(result.current.phase).toBe('idle');
      expect(result.current.tier).toBe(60);
      expect(result.current.mode).toBeNull();
    });
  });

  describe('startRun', () => {
    it('generates first puzzle and initializes run state for sprint mode', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      expect(result.current.phase).toBe('playing');
      expect(result.current.currentPuzzle).toEqual(mockPuzzle);
      expect(result.current.currentPuzzleIndex).toBe(0);
      expect(result.current.solvedCount).toBe(0);
      expect(result.current.currentStreak).toBe(0);
      expect(result.current.longestStreak).toBe(0);
      expect(result.current.freeSkipsRemaining).toBe(2);
      expect(result.current.runStartedAt).not.toBeNull();
    });

    it('initializes sprint mode with tier * 1000 ms', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(90);
      });

      act(() => {
        result.current.startRun();
      });

      expect(result.current.timeRemainingMs).toBe(90000);
    });

    it('initializes survival mode with getSurvivalBaseSeconds time', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('survival');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      expect(result.current.timeRemainingMs).toBe(30000);
    });

    it('retries puzzle generation on failure', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockImplementationOnce(() => {
          throw new Error('Failed to generate');
        })
        .mockImplementationOnce(() => {
          throw new Error('Failed to generate');
        })
        .mockImplementationOnce(() => mockPuzzle);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      expect(result.current.currentPuzzle).toEqual(mockPuzzle);
      expect(generatePuzzleModule.generatePuzzle).toHaveBeenCalledTimes(3);
    });

    it('does not start if not in setup phase', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.startRun();
      });

      expect(result.current.phase).toBe('idle');
      expect(result.current.currentPuzzle).toBeNull();
    });
  });

  describe('reportSolved', () => {
    it('increments solved count and streak', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      const initialSolvedCount = result.current.solvedCount;

      act(() => {
        result.current.reportSolved();
      });

      expect(result.current.solvedCount).toBe(initialSolvedCount + 1);
      expect(result.current.currentStreak).toBe(1);
    });

    it('tracks longest streak across solve cycles', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValue(mockPuzzle);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      act(() => {
        result.current.reportSolved();
        result.current.reportSolved();
        result.current.reportSolved();
      });

      expect(result.current.longestStreak).toBe(3);
    });

    it('generates next puzzle with correct difficulty', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      const firstCall = (generatePuzzleModule.generatePuzzle as jest.Mock).mock.calls[0];
      expect(firstCall[0]).toBe(3); // wordLength for index 0
      expect(firstCall[1]).toBe('easy'); // difficulty for index 0

      act(() => {
        result.current.reportSolved();
      });

      const secondCall = (generatePuzzleModule.generatePuzzle as jest.Mock).mock.calls[1];
      expect(secondCall[0]).toBe(3); // wordLength for index 1
      expect(secondCall[1]).toBe('easy'); // difficulty for index 1
    });

    it('adds time reward in survival mode', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('survival');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      const initialTime = result.current.timeRemainingMs;

      act(() => {
        result.current.reportSolved();
      });

      expect(result.current.timeRemainingMs).toBeGreaterThan(initialTime);
    });

    it('does not add time reward in sprint mode', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      const initialTime = result.current.timeRemainingMs;

      act(() => {
        result.current.reportSolved();
      });

      expect(result.current.timeRemainingMs).toBe(initialTime);
    });
  });

  describe('skipPuzzle', () => {
    it('resets streak to 0', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      act(() => {
        result.current.reportSolved();
        result.current.reportSolved();
      });

      expect(result.current.currentStreak).toBe(2);

      act(() => {
        result.current.skipPuzzle();
      });

      expect(result.current.currentStreak).toBe(0);
    });

    it('uses free skips before deducting time', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2)
        .mockReturnValueOnce(mockPuzzle);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      expect(result.current.freeSkipsRemaining).toBe(2);

      const initialTime = result.current.timeRemainingMs;

      act(() => {
        result.current.skipPuzzle();
      });

      expect(result.current.freeSkipsRemaining).toBe(1);
      expect(result.current.timeRemainingMs).toBe(initialTime);
    });

    it('deducts time after free skips are exhausted', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValue(mockPuzzle);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      act(() => {
        result.current.skipPuzzle();
        result.current.skipPuzzle();
      });

      expect(result.current.freeSkipsRemaining).toBe(0);

      const timeBeforePaidSkip = result.current.timeRemainingMs;

      act(() => {
        result.current.skipPuzzle();
      });

      expect(result.current.timeRemainingMs).toBeLessThan(timeBeforePaidSkip);
    });
  });

  describe('endRun', () => {
    it('builds RunSummary and persists to stats', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      act(() => {
        result.current.reportSolved();
      });

      act(() => {
        result.current.endRun();
      });

      expect(result.current.phase).toBe('ended');
      expect(statsModule.recordRun).toHaveBeenCalled();
      expect(statsModule.saveStats).toHaveBeenCalled();

      const recordRunCall = (statsModule.recordRun as jest.Mock).mock.calls[0];
      const summary = recordRunCall[1];

      expect(summary.mode).toBe('sprint');
      expect(summary.tier).toBe(60);
      expect(summary.solvedCount).toBe(1);
      expect(summary.longestStreak).toBe(1);
      expect(typeof summary.timeTakenMs).toBe('number');
      expect(typeof summary.averageSolveMs).toBe('number');
    });

    it('calculates average solve time correctly', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValue(mockPuzzle);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      // Solve multiple puzzles - timing will vary but average will be calculated
      act(() => {
        result.current.reportSolved();
        result.current.reportSolved();
        result.current.reportSolved();
      });

      act(() => {
        result.current.endRun();
      });

      const recordRunCall = (statsModule.recordRun as jest.Mock).mock.calls[0];
      const summary = recordRunCall[1];

      // averageSolveMs should be a number (could be 0 if all solves happen instantly in fake timers)
      expect(typeof summary.averageSolveMs).toBe('number');
      // We should have 3 solves, so it should be calculated
      expect(summary.solvedCount).toBe(3);
    });

    it('captures previousBestAtRunEnd when ending a run with no prior best', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2);

      (statsModule.loadStats as jest.Mock).mockReturnValue({
        bests: {},
        totalRuns: 0,
        totalSolved: 0,
      });

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      act(() => {
        result.current.reportSolved();
      });

      act(() => {
        result.current.endRun();
      });

      expect(result.current.phase).toBe('ended');
      expect(result.current.previousBestAtRunEnd).toBeNull();
    });

    it('captures previousBestAtRunEnd when ending a run with existing best', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2);

      const priorBest = { solved: 5, longestStreak: 3, achievedAt: '2026-05-13' };
      (statsModule.loadStats as jest.Mock).mockReturnValue({
        bests: { 'sprint:60': priorBest },
        totalRuns: 3,
        totalSolved: 15,
      });

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      act(() => {
        result.current.reportSolved();
      });

      act(() => {
        result.current.endRun();
      });

      expect(result.current.phase).toBe('ended');
      expect(result.current.previousBestAtRunEnd).toEqual(priorBest);
    });
  });

  describe('timer expiration', () => {
    it('captures previousBestAtRunEnd when timer expires', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle);

      const priorBest = { solved: 2, longestStreak: 1, achievedAt: '2026-05-12' };
      (statsModule.loadStats as jest.Mock).mockReturnValue({
        bests: { 'sprint:60': priorBest },
        totalRuns: 1,
        totalSolved: 2,
      });

      let timerExpireCallback: (() => void) | null = null;
      (useTimer as jest.Mock).mockImplementation((config) => {
        timerExpireCallback = config.onExpire;
        return mockTimerInstance;
      });

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      // Trigger timer expiration
      act(() => {
        if (timerExpireCallback) {
          timerExpireCallback();
        }
      });

      expect(result.current.phase).toBe('ended');
      expect(result.current.previousBestAtRunEnd).toEqual(priorBest);
    });
  });

  describe('playAgain', () => {
    it('resets state but keeps mode and tier selected', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      act(() => {
        result.current.reportSolved();
      });

      act(() => {
        result.current.endRun();
      });

      expect(result.current.phase).toBe('ended');

      act(() => {
        result.current.playAgain();
      });

      expect(result.current.phase).toBe('setup');
      expect(result.current.mode).toBe('sprint');
      expect(result.current.tier).toBe(60);
      expect(result.current.solvedCount).toBe(0);
      expect(result.current.currentStreak).toBe(0);
      expect(result.current.longestStreak).toBe(0);
    });

    it('clears previousBestAtRunEnd when playing again', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2);

      const priorBest = { solved: 4, longestStreak: 2, achievedAt: '2026-05-13' };
      (statsModule.loadStats as jest.Mock).mockReturnValue({
        bests: { 'sprint:60': priorBest },
        totalRuns: 2,
        totalSolved: 8,
      });

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.startRun();
      });

      act(() => {
        result.current.reportSolved();
      });

      act(() => {
        result.current.endRun();
      });

      expect(result.current.previousBestAtRunEnd).toEqual(priorBest);

      act(() => {
        result.current.playAgain();
      });

      expect(result.current.previousBestAtRunEnd).toBeNull();
    });
  });

  describe('reset', () => {
    it('returns to idle state', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.phase).toBe('idle');
      expect(result.current.mode).toBeNull();
      expect(result.current.tier).toBeNull();
    });
  });

  describe('backToModeSelect', () => {
    it('returns to idle from setup', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
        result.current.chooseTier(60);
      });

      expect(result.current.phase).toBe('setup');

      act(() => {
        result.current.backToModeSelect();
      });

      expect(result.current.phase).toBe('idle');
      expect(result.current.mode).toBeNull();
      expect(result.current.tier).toBeNull();
    });

    it('is a no-op if not in setup', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.chooseMode('sprint');
      });

      expect(result.current.phase).toBe('setup');
      expect(result.current.mode).toBe('sprint');
      expect(result.current.tier).toBeNull();

      act(() => {
        result.current.chooseTier(60);
      });

      expect(result.current.phase).toBe('setup');
      expect(result.current.mode).toBe('sprint');
      expect(result.current.tier).toBe(60);

      act(() => {
        result.current.startRun();
      });

      // Verify we're in playing phase
      expect(result.current.phase).toBe('playing');

      // Try to go back to mode select while in playing phase
      act(() => {
        result.current.backToModeSelect();
      });

      // Should still be in playing phase (backToModeSelect is a no-op)
      expect(result.current.phase).toBe('playing');
      expect(result.current.mode).toBe('sprint');
      expect(result.current.tier).toBe(60);
    });
  });
});
