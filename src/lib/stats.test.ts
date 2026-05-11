import {
  GameStats,
  getDefaultStats,
  loadStats,
  saveStats,
  recordWin,
  recordLoss,
} from './stats';

describe('stats module', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getDefaultStats', () => {
    it('returns the expected shape with all zeros', () => {
      const stats = getDefaultStats();

      expect(stats).toEqual({
        played: 0,
        won: 0,
        currentStreak: 0,
        maxStreak: 0,
        lastPlayedDate: null,
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
      localStorage.removeItem('wordLadder.stats');

      const stats = loadStats();

      expect(stats).toEqual(getDefaultStats());
    });

    it('returns defaults when localStorage contains invalid JSON', () => {
      localStorage.setItem('wordLadder.stats', 'invalid json {');

      const stats = loadStats();

      expect(stats).toEqual(getDefaultStats());
    });

    it('returns defaults when localStorage contains invalid data structure', () => {
      localStorage.setItem('wordLadder.stats', JSON.stringify({ played: 'not a number' }));

      const stats = loadStats();

      expect(stats).toEqual(getDefaultStats());
    });

    it('loads valid stats from localStorage', () => {
      const savedStats: GameStats = {
        played: 10,
        won: 7,
        currentStreak: 3,
        maxStreak: 5,
        lastPlayedDate: '2026-05-11',
      };
      localStorage.setItem('wordLadder.stats', JSON.stringify(savedStats));

      const stats = loadStats();

      expect(stats).toEqual(savedStats);
    });

    it('loads stats with null lastPlayedDate', () => {
      const savedStats: GameStats = {
        played: 1,
        won: 1,
        currentStreak: 1,
        maxStreak: 1,
        lastPlayedDate: null,
      };
      localStorage.setItem('wordLadder.stats', JSON.stringify(savedStats));

      const stats = loadStats();

      expect(stats).toEqual(savedStats);
    });
  });

  describe('saveStats', () => {
    it('persists stats to localStorage', () => {
      const stats: GameStats = {
        played: 5,
        won: 3,
        currentStreak: 2,
        maxStreak: 4,
        lastPlayedDate: '2026-05-11',
      };

      saveStats(stats);

      const retrieved = localStorage.getItem('wordLadder.stats');
      expect(retrieved).toBe(JSON.stringify(stats));
    });

    it('silently handles localStorage errors', () => {
      const stats: GameStats = getDefaultStats();

      // Mock localStorage to throw
      const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() => saveStats(stats)).not.toThrow();

      spy.mockRestore();
    });
  });

  describe('recordWin', () => {
    it('increments played and won', () => {
      const stats = getDefaultStats();

      const updated = recordWin(stats);

      expect(updated.played).toBe(1);
      expect(updated.won).toBe(1);
    });

    it('increments currentStreak from 0 to 1', () => {
      const stats = getDefaultStats();

      const updated = recordWin(stats);

      expect(updated.currentStreak).toBe(1);
    });

    it('increments currentStreak when already positive', () => {
      const stats: GameStats = {
        played: 3,
        won: 3,
        currentStreak: 2,
        maxStreak: 2,
        lastPlayedDate: '2026-05-10',
      };

      const updated = recordWin(stats);

      expect(updated.currentStreak).toBe(3);
    });

    it('updates maxStreak when currentStreak exceeds it', () => {
      const stats: GameStats = {
        played: 3,
        won: 3,
        currentStreak: 2,
        maxStreak: 2,
        lastPlayedDate: '2026-05-10',
      };

      const updated = recordWin(stats);

      expect(updated.maxStreak).toBe(3);
    });

    it('does not update maxStreak when currentStreak does not exceed it', () => {
      const stats: GameStats = {
        played: 5,
        won: 5,
        currentStreak: 2,
        maxStreak: 5,
        lastPlayedDate: '2026-05-10',
      };

      const updated = recordWin(stats);

      expect(updated.maxStreak).toBe(5);
      expect(updated.currentStreak).toBe(3);
    });

    it('sets lastPlayedDate to today in YYYY-MM-DD format', () => {
      const stats = getDefaultStats();

      const updated = recordWin(stats);

      expect(updated.lastPlayedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // Verify it's today
      const today = new Date().toISOString().split('T')[0];
      expect(updated.lastPlayedDate).toBe(today);
    });

    it('is pure — does not modify input stats', () => {
      const stats = getDefaultStats();
      const original = JSON.parse(JSON.stringify(stats));

      recordWin(stats);

      expect(stats).toEqual(original);
    });
  });

  describe('recordLoss', () => {
    it('increments played, does not increment won', () => {
      const stats: GameStats = {
        played: 5,
        won: 3,
        currentStreak: 2,
        maxStreak: 3,
        lastPlayedDate: '2026-05-10',
      };

      const updated = recordLoss(stats);

      expect(updated.played).toBe(6);
      expect(updated.won).toBe(3);
    });

    it('resets currentStreak to 0', () => {
      const stats: GameStats = {
        played: 3,
        won: 3,
        currentStreak: 3,
        maxStreak: 3,
        lastPlayedDate: '2026-05-10',
      };

      const updated = recordLoss(stats);

      expect(updated.currentStreak).toBe(0);
    });

    it('preserves maxStreak', () => {
      const stats: GameStats = {
        played: 3,
        won: 3,
        currentStreak: 3,
        maxStreak: 5,
        lastPlayedDate: '2026-05-10',
      };

      const updated = recordLoss(stats);

      expect(updated.maxStreak).toBe(5);
    });

    it('sets lastPlayedDate to today in YYYY-MM-DD format', () => {
      const stats = getDefaultStats();

      const updated = recordLoss(stats);

      expect(updated.lastPlayedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const today = new Date().toISOString().split('T')[0];
      expect(updated.lastPlayedDate).toBe(today);
    });

    it('is pure — does not modify input stats', () => {
      const stats: GameStats = {
        played: 5,
        won: 3,
        currentStreak: 2,
        maxStreak: 3,
        lastPlayedDate: '2026-05-10',
      };
      const original = JSON.parse(JSON.stringify(stats));

      recordLoss(stats);

      expect(stats).toEqual(original);
    });
  });

  describe('streak behavior', () => {
    it('consecutive wins keep streaking', () => {
      let stats = getDefaultStats();

      stats = recordWin(stats);
      expect(stats.currentStreak).toBe(1);
      expect(stats.maxStreak).toBe(1);

      stats = recordWin(stats);
      expect(stats.currentStreak).toBe(2);
      expect(stats.maxStreak).toBe(2);

      stats = recordWin(stats);
      expect(stats.currentStreak).toBe(3);
      expect(stats.maxStreak).toBe(3);
    });

    it('a loss breaks the streak but preserves maxStreak', () => {
      let stats = getDefaultStats();

      // Build a 3-win streak
      stats = recordWin(stats);
      stats = recordWin(stats);
      stats = recordWin(stats);
      expect(stats.currentStreak).toBe(3);
      expect(stats.maxStreak).toBe(3);

      // Loss breaks the streak
      stats = recordLoss(stats);
      expect(stats.currentStreak).toBe(0);
      expect(stats.maxStreak).toBe(3);
      expect(stats.played).toBe(4);
      expect(stats.won).toBe(3);
    });

    it('can rebuild streak after a loss and exceed previous maxStreak', () => {
      let stats = getDefaultStats();

      // Build a 3-win streak
      stats = recordWin(stats);
      stats = recordWin(stats);
      stats = recordWin(stats);
      expect(stats.maxStreak).toBe(3);

      // Loss breaks the streak
      stats = recordLoss(stats);
      expect(stats.currentStreak).toBe(0);

      // Build a 5-win streak
      stats = recordWin(stats);
      stats = recordWin(stats);
      stats = recordWin(stats);
      stats = recordWin(stats);
      stats = recordWin(stats);
      expect(stats.currentStreak).toBe(5);
      expect(stats.maxStreak).toBe(5);
    });
  });

  describe('integration: save and load', () => {
    it('stats persist across load/save cycles', () => {
      let stats = getDefaultStats();

      // Play some games
      stats = recordWin(stats);
      stats = recordWin(stats);
      stats = recordLoss(stats);
      stats = recordWin(stats);

      saveStats(stats);
      const loaded = loadStats();

      expect(loaded).toEqual(stats);
      expect(loaded.played).toBe(4);
      expect(loaded.won).toBe(3);
      expect(loaded.currentStreak).toBe(1);
      expect(loaded.maxStreak).toBe(2);
    });
  });
});
