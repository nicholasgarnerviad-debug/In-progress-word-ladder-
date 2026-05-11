import {
  TimeAttackStats,
  TimeAttackBest,
  getDefaultStats,
  loadStats,
  saveStats,
  recordRun,
  getBest,
  STORAGE_KEY,
} from '../stats';
import { RunSummary } from '../types';

describe('timeAttack stats module', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getDefaultStats', () => {
    it('returns empty bests, zero runs, zero solved', () => {
      const stats = getDefaultStats();

      expect(stats).toEqual({
        bests: {},
        totalRuns: 0,
        totalSolved: 0,
      });
    });

    it('returns a new object each time', () => {
      const stats1 = getDefaultStats();
      const stats2 = getDefaultStats();

      expect(stats1).toEqual(stats2);
      expect(stats1).not.toBe(stats2);
    });
  });

  describe('loadStats', () => {
    it('returns defaults when localStorage is empty', () => {
      localStorage.removeItem(STORAGE_KEY);

      const stats = loadStats();

      expect(stats).toEqual(getDefaultStats());
    });

    it('returns defaults when localStorage contains invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json {');

      const stats = loadStats();

      expect(stats).toEqual(getDefaultStats());
    });

    it('returns defaults when localStorage contains invalid data structure', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ totalRuns: 'not a number' }));

      const stats = loadStats();

      expect(stats).toEqual(getDefaultStats());
    });

    it('loads valid stats from localStorage', () => {
      const savedStats: TimeAttackStats = {
        bests: {
          'sprint:60': {
            solved: 5,
            longestStreak: 3,
            achievedAt: '2026-05-11',
          },
        },
        totalRuns: 2,
        totalSolved: 10,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStats));

      const stats = loadStats();

      expect(stats).toEqual(savedStats);
    });

    it('loads stats with empty bests', () => {
      const savedStats: TimeAttackStats = {
        bests: {},
        totalRuns: 1,
        totalSolved: 3,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStats));

      const stats = loadStats();

      expect(stats).toEqual(savedStats);
    });

    it('never throws — always returns valid stats', () => {
      // Mock localStorage to throw
      const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Access denied');
      });

      expect(() => loadStats()).not.toThrow();
      const stats = loadStats();
      expect(stats).toEqual(getDefaultStats());

      spy.mockRestore();
    });
  });

  describe('saveStats', () => {
    it('persists stats to localStorage', () => {
      const stats: TimeAttackStats = {
        bests: {
          'sprint:90': { solved: 8, longestStreak: 4, achievedAt: '2026-05-11' },
        },
        totalRuns: 3,
        totalSolved: 15,
      };

      saveStats(stats);

      const retrieved = localStorage.getItem(STORAGE_KEY);
      expect(retrieved).toBe(JSON.stringify(stats));
    });

    it('silently handles localStorage errors', () => {
      const stats = getDefaultStats();

      const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => saveStats(stats)).not.toThrow();

      spy.mockRestore();
    });
  });

  describe('recordRun', () => {
    it('increments totalRuns and totalSolved', () => {
      const stats = getDefaultStats();
      const summary: RunSummary = {
        mode: 'sprint',
        tier: 60,
        solvedCount: 5,
        longestStreak: 3,
        timeTakenMs: 30000,
        bestDifficulty: 'medium',
        averageSolveMs: 6000,
      };

      const updated = recordRun(stats, summary);

      expect(updated.totalRuns).toBe(1);
      expect(updated.totalSolved).toBe(5);
    });

    it('creates a new best when none exists', () => {
      const stats = getDefaultStats();
      const summary: RunSummary = {
        mode: 'sprint',
        tier: 60,
        solvedCount: 5,
        longestStreak: 3,
        timeTakenMs: 30000,
        bestDifficulty: 'medium',
        averageSolveMs: 6000,
      };

      const updated = recordRun(stats, summary);

      const best = updated.bests['sprint:60'];
      expect(best).toBeDefined();
      expect(best?.solved).toBe(5);
      expect(best?.longestStreak).toBe(3);
    });

    it('does not update best when new run solves fewer puzzles', () => {
      const stats: TimeAttackStats = {
        bests: {
          'sprint:60': { solved: 8, longestStreak: 4, achievedAt: '2026-05-10' },
        },
        totalRuns: 1,
        totalSolved: 8,
      };
      const summary: RunSummary = {
        mode: 'sprint',
        tier: 60,
        solvedCount: 5,
        longestStreak: 3,
        timeTakenMs: 30000,
        bestDifficulty: 'easy',
        averageSolveMs: 6000,
      };

      const updated = recordRun(stats, summary);

      expect(updated.bests['sprint:60']).toEqual({
        solved: 8,
        longestStreak: 4,
        achievedAt: '2026-05-10',
      });
    });

    it('updates best when new run solves more puzzles', () => {
      const stats: TimeAttackStats = {
        bests: {
          'sprint:60': { solved: 5, longestStreak: 3, achievedAt: '2026-05-10' },
        },
        totalRuns: 1,
        totalSolved: 5,
      };
      const summary: RunSummary = {
        mode: 'sprint',
        tier: 60,
        solvedCount: 7,
        longestStreak: 3,
        timeTakenMs: 35000,
        bestDifficulty: 'medium',
        averageSolveMs: 5000,
      };

      const updated = recordRun(stats, summary);

      expect(updated.bests['sprint:60']?.solved).toBe(7);
      expect(updated.bests['sprint:60']?.longestStreak).toBe(3);
    });

    it('updates best when tied on solves but higher streak', () => {
      const stats: TimeAttackStats = {
        bests: {
          'sprint:60': { solved: 5, longestStreak: 2, achievedAt: '2026-05-10' },
        },
        totalRuns: 1,
        totalSolved: 5,
      };
      const summary: RunSummary = {
        mode: 'sprint',
        tier: 60,
        solvedCount: 5,
        longestStreak: 4,
        timeTakenMs: 30000,
        bestDifficulty: 'medium',
        averageSolveMs: 6000,
      };

      const updated = recordRun(stats, summary);

      expect(updated.bests['sprint:60']?.solved).toBe(5);
      expect(updated.bests['sprint:60']?.longestStreak).toBe(4);
    });

    it('does not update best when tied on solves and equal or lower streak', () => {
      const stats: TimeAttackStats = {
        bests: {
          'sprint:60': { solved: 5, longestStreak: 3, achievedAt: '2026-05-10' },
        },
        totalRuns: 1,
        totalSolved: 5,
      };
      const summary: RunSummary = {
        mode: 'sprint',
        tier: 60,
        solvedCount: 5,
        longestStreak: 2,
        timeTakenMs: 30000,
        bestDifficulty: 'easy',
        averageSolveMs: 6000,
      };

      const updated = recordRun(stats, summary);

      expect(updated.bests['sprint:60']).toEqual({
        solved: 5,
        longestStreak: 3,
        achievedAt: '2026-05-10',
      });
    });

    it('sets achievedAt to today in YYYY-MM-DD format', () => {
      const stats = getDefaultStats();
      const summary: RunSummary = {
        mode: 'sprint',
        tier: 60,
        solvedCount: 3,
        longestStreak: 2,
        timeTakenMs: 20000,
        bestDifficulty: 'easy',
        averageSolveMs: 6666,
      };

      const updated = recordRun(stats, summary);

      const best = updated.bests['sprint:60'];
      expect(best?.achievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const today = new Date().toISOString().split('T')[0];
      expect(best?.achievedAt).toBe(today);
    });

    it('is pure — does not modify input stats', () => {
      const stats: TimeAttackStats = {
        bests: {
          'sprint:60': { solved: 5, longestStreak: 2, achievedAt: '2026-05-10' },
        },
        totalRuns: 1,
        totalSolved: 5,
      };
      const original = JSON.parse(JSON.stringify(stats));
      const summary: RunSummary = {
        mode: 'sprint',
        tier: 60,
        solvedCount: 7,
        longestStreak: 3,
        timeTakenMs: 35000,
        bestDifficulty: 'medium',
        averageSolveMs: 5000,
      };

      recordRun(stats, summary);

      expect(stats).toEqual(original);
    });

    it('handles multiple mode:tier combinations independently', () => {
      const stats: TimeAttackStats = {
        bests: {
          'sprint:60': { solved: 5, longestStreak: 2, achievedAt: '2026-05-10' },
          'survival:90': { solved: 3, longestStreak: 1, achievedAt: '2026-05-10' },
        },
        totalRuns: 2,
        totalSolved: 8,
      };
      const summary: RunSummary = {
        mode: 'sprint',
        tier: 90,
        solvedCount: 7,
        longestStreak: 4,
        timeTakenMs: 45000,
        bestDifficulty: 'medium',
        averageSolveMs: 6428,
      };

      const updated = recordRun(stats, summary);

      // Existing bests unchanged
      expect(updated.bests['sprint:60']).toEqual({
        solved: 5,
        longestStreak: 2,
        achievedAt: '2026-05-10',
      });
      expect(updated.bests['survival:90']).toEqual({
        solved: 3,
        longestStreak: 1,
        achievedAt: '2026-05-10',
      });
      // New best created
      expect(updated.bests['sprint:90']).toEqual({
        solved: 7,
        longestStreak: 4,
        achievedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      });
    });
  });

  describe('getBest', () => {
    it('returns null when no best exists for mode:tier', () => {
      const stats = getDefaultStats();

      const best = getBest(stats, 'sprint', 60);

      expect(best).toBeNull();
    });

    it('returns the best when it exists', () => {
      const stats: TimeAttackStats = {
        bests: {
          'sprint:60': { solved: 5, longestStreak: 3, achievedAt: '2026-05-11' },
        },
        totalRuns: 1,
        totalSolved: 5,
      };

      const best = getBest(stats, 'sprint', 60);

      expect(best).toEqual({
        solved: 5,
        longestStreak: 3,
        achievedAt: '2026-05-11',
      });
    });

    it('returns null for unrecorded tier even if other tiers exist', () => {
      const stats: TimeAttackStats = {
        bests: {
          'sprint:60': { solved: 5, longestStreak: 3, achievedAt: '2026-05-11' },
        },
        totalRuns: 1,
        totalSolved: 5,
      };

      const best = getBest(stats, 'sprint', 90);

      expect(best).toBeNull();
    });

    it('returns null for unrecorded mode even if tier exists in other mode', () => {
      const stats: TimeAttackStats = {
        bests: {
          'sprint:60': { solved: 5, longestStreak: 3, achievedAt: '2026-05-11' },
        },
        totalRuns: 1,
        totalSolved: 5,
      };

      const best = getBest(stats, 'survival', 60);

      expect(best).toBeNull();
    });
  });

  describe('integration: save and load', () => {
    it('stats persist across load/save cycles', () => {
      let stats = getDefaultStats();

      const summary1: RunSummary = {
        mode: 'sprint',
        tier: 60,
        solvedCount: 5,
        longestStreak: 2,
        timeTakenMs: 30000,
        bestDifficulty: 'easy',
        averageSolveMs: 6000,
      };

      const summary2: RunSummary = {
        mode: 'sprint',
        tier: 60,
        solvedCount: 7,
        longestStreak: 4,
        timeTakenMs: 35000,
        bestDifficulty: 'medium',
        averageSolveMs: 5000,
      };

      stats = recordRun(stats, summary1);
      stats = recordRun(stats, summary2);

      saveStats(stats);
      const loaded = loadStats();

      expect(loaded.totalRuns).toBe(2);
      expect(loaded.totalSolved).toBe(12);
      expect(loaded.bests['sprint:60']?.solved).toBe(7);
      expect(loaded.bests['sprint:60']?.longestStreak).toBe(4);
    });
  });
});
