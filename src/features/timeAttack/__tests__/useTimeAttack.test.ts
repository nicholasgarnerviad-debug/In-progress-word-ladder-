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

  beforeEach(() => {
    jest.clearAllMocks();

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

    (useTimer as jest.Mock).mockReturnValue({
      isRunning: false,
      isExpired: false,
      remainingMs: 60000,
      start: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      adjustTime: jest.fn(),
      reset: jest.fn(),
    });
  });

  describe('initial state', () => {
    it('starts in idle phase with no mode or tier selected', () => {
      const { result } = renderHook(() => useTimeAttack());

      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.mode).toBeNull();
      expect(result.current.state.tier).toBeNull();
      expect(result.current.state.solvedCount).toBe(0);
      expect(result.current.state.currentStreak).toBe(0);
      expect(result.current.state.longestStreak).toBe(0);
      expect(result.current.state.freeSkipsRemaining).toBe(2);
    });

    it('exposes all expected actions', () => {
      const { result } = renderHook(() => useTimeAttack());

      expect(typeof result.current.actions.chooseMode).toBe('function');
      expect(typeof result.current.actions.chooseTier).toBe('function');
      expect(typeof result.current.actions.backToModeSelect).toBe('function');
      expect(typeof result.current.actions.startRun).toBe('function');
      expect(typeof result.current.actions.reportSolved).toBe('function');
      expect(typeof result.current.actions.skipPuzzle).toBe('function');
      expect(typeof result.current.actions.endRun).toBe('function');
      expect(typeof result.current.actions.playAgain).toBe('function');
      expect(typeof result.current.actions.reset).toBe('function');
    });
  });

  describe('mode and tier selection', () => {
    it('chooses mode and advances to setup when tier is already selected', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.chooseMode('sprint');
      });

      expect(result.current.state.mode).toBe('sprint');
      expect(result.current.state.tier).toBe(60);
      expect(result.current.state.phase).toBe('setup');
    });

    it('chooses tier and advances to setup when mode is already selected', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('survival');
      });

      act(() => {
        result.current.actions.chooseTier(90);
      });

      expect(result.current.state.mode).toBe('survival');
      expect(result.current.state.tier).toBe(90);
      expect(result.current.state.phase).toBe('setup');
    });

    it('stays in idle if only mode is selected', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
      });

      expect(result.current.state.phase).toBe('idle');
    });

    it('stays in idle if only tier is selected', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseTier(60);
      });

      expect(result.current.state.phase).toBe('idle');
    });
  });

  describe('startRun', () => {
    it('generates first puzzle and initializes run state for sprint mode', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      expect(result.current.state.phase).toBe('playing');
      expect(result.current.state.currentPuzzle).toEqual(mockPuzzle);
      expect(result.current.state.currentPuzzleIndex).toBe(0);
      expect(result.current.state.solvedCount).toBe(0);
      expect(result.current.state.currentStreak).toBe(0);
      expect(result.current.state.longestStreak).toBe(0);
      expect(result.current.state.freeSkipsRemaining).toBe(2);
      expect(result.current.state.runStartedAt).not.toBeNull();
    });

    it('initializes sprint mode with tier * 1000 ms', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(90);
      });

      act(() => {
        result.current.actions.startRun();
      });

      expect(result.current.state.timeRemainingMs).toBe(90000);
    });

    it('initializes survival mode with getSurvivalBaseSeconds time', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('survival');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      expect(result.current.state.timeRemainingMs).toBe(30000);
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
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      expect(result.current.state.currentPuzzle).toEqual(mockPuzzle);
      expect(generatePuzzleModule.generatePuzzle).toHaveBeenCalledTimes(3);
    });

    it('does not start if not in setup phase', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.startRun();
      });

      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.currentPuzzle).toBeNull();
    });
  });

  describe('reportSolved', () => {
    it('increments solved count and streak', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      const initialSolvedCount = result.current.state.solvedCount;

      act(() => {
        result.current.actions.reportSolved();
      });

      expect(result.current.state.solvedCount).toBe(initialSolvedCount + 1);
      expect(result.current.state.currentStreak).toBe(1);
    });

    it('tracks longest streak across solve cycles', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValue(mockPuzzle);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      act(() => {
        result.current.actions.reportSolved();
        result.current.actions.reportSolved();
        result.current.actions.reportSolved();
      });

      expect(result.current.state.longestStreak).toBe(3);
    });

    it('generates next puzzle with correct difficulty', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      const firstCall = (generatePuzzleModule.generatePuzzle as jest.Mock).mock.calls[0];
      expect(firstCall[0]).toBe(3); // wordLength for index 0
      expect(firstCall[1]).toBe('easy'); // difficulty for index 0

      act(() => {
        result.current.actions.reportSolved();
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
        result.current.actions.chooseMode('survival');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      const initialTime = result.current.state.timeRemainingMs;

      act(() => {
        result.current.actions.reportSolved();
      });

      expect(result.current.state.timeRemainingMs).toBeGreaterThan(initialTime);
    });

    it('does not add time reward in sprint mode', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      const initialTime = result.current.state.timeRemainingMs;

      act(() => {
        result.current.actions.reportSolved();
      });

      expect(result.current.state.timeRemainingMs).toBe(initialTime);
    });
  });

  describe('skipPuzzle', () => {
    it('resets streak to 0', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      act(() => {
        result.current.actions.reportSolved();
        result.current.actions.reportSolved();
      });

      expect(result.current.state.currentStreak).toBe(2);

      act(() => {
        result.current.actions.skipPuzzle();
      });

      expect(result.current.state.currentStreak).toBe(0);
    });

    it('uses free skips before deducting time', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2)
        .mockReturnValueOnce(mockPuzzle);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      expect(result.current.state.freeSkipsRemaining).toBe(2);

      const initialTime = result.current.state.timeRemainingMs;

      act(() => {
        result.current.actions.skipPuzzle();
      });

      expect(result.current.state.freeSkipsRemaining).toBe(1);
      expect(result.current.state.timeRemainingMs).toBe(initialTime);
    });

    it('deducts time after free skips are exhausted', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValue(mockPuzzle);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      act(() => {
        result.current.actions.skipPuzzle();
        result.current.actions.skipPuzzle();
      });

      expect(result.current.state.freeSkipsRemaining).toBe(0);

      const timeBeforePaidSkip = result.current.state.timeRemainingMs;

      act(() => {
        result.current.actions.skipPuzzle();
      });

      expect(result.current.state.timeRemainingMs).toBeLessThan(timeBeforePaidSkip);
    });
  });

  describe('endRun', () => {
    it('builds RunSummary and persists to stats', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      act(() => {
        result.current.actions.reportSolved();
      });

      act(() => {
        result.current.actions.endRun();
      });

      expect(result.current.state.phase).toBe('ended');
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
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      act(() => {
        result.current.actions.reportSolved();
        result.current.actions.reportSolved();
        result.current.actions.reportSolved();
      });

      act(() => {
        result.current.actions.endRun();
      });

      const recordRunCall = (statsModule.recordRun as jest.Mock).mock.calls[0];
      const summary = recordRunCall[1];

      expect(typeof summary.averageSolveMs).toBe('number');
      expect(summary.averageSolveMs).toBeGreaterThan(0);
    });
  });

  describe('playAgain', () => {
    it('resets state but keeps mode and tier selected', () => {
      (generatePuzzleModule.generatePuzzle as jest.Mock)
        .mockReturnValueOnce(mockPuzzle)
        .mockReturnValueOnce(mockPuzzle2);

      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      act(() => {
        result.current.actions.reportSolved();
      });

      act(() => {
        result.current.actions.endRun();
      });

      expect(result.current.state.phase).toBe('ended');

      act(() => {
        result.current.actions.playAgain();
      });

      expect(result.current.state.phase).toBe('setup');
      expect(result.current.state.mode).toBe('sprint');
      expect(result.current.state.tier).toBe(60);
      expect(result.current.state.solvedCount).toBe(0);
      expect(result.current.state.currentStreak).toBe(0);
      expect(result.current.state.longestStreak).toBe(0);
    });
  });

  describe('reset', () => {
    it('returns to idle state', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.reset();
      });

      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.mode).toBeNull();
      expect(result.current.state.tier).toBeNull();
    });
  });

  describe('backToModeSelect', () => {
    it('returns to idle from setup', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      expect(result.current.state.phase).toBe('setup');

      act(() => {
        result.current.actions.backToModeSelect();
      });

      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.mode).toBeNull();
      expect(result.current.state.tier).toBeNull();
    });

    it('is a no-op if not in setup', () => {
      const { result } = renderHook(() => useTimeAttack());

      act(() => {
        result.current.actions.chooseMode('sprint');
        result.current.actions.chooseTier(60);
      });

      act(() => {
        result.current.actions.startRun();
      });

      expect(result.current.state.phase).toBe('playing');

      act(() => {
        result.current.actions.backToModeSelect();
      });

      expect(result.current.state.phase).toBe('playing');
      expect(result.current.state.mode).toBe('sprint');
      expect(result.current.state.tier).toBe(60);
    });
  });
});
