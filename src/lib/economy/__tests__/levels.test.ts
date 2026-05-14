import {
  computeLevel,
  xpRequiredForLevel,
  xpToNextLevel,
  xpProgressInLevel,
  xpDeltaToLevelProgress,
} from '../levels';

describe('levels.ts', () => {
  describe('computeLevel', () => {
    it('should return 1 for negative XP', () => {
      expect(computeLevel(-100)).toBe(1);
      expect(computeLevel(-1)).toBe(1);
    });

    it('should return 1 for 0 XP', () => {
      expect(computeLevel(0)).toBe(1);
    });

    it('should return 1 for XP < 300', () => {
      expect(computeLevel(299)).toBe(1);
    });

    it('should return 2 at XP = 300', () => {
      expect(computeLevel(300)).toBe(2);
    });

    it('should return 2 for XP between 300-599', () => {
      expect(computeLevel(599)).toBe(2);
    });

    it('should return 3 at XP = 600', () => {
      expect(computeLevel(600)).toBe(3);
    });

    it('should return 10 at XP = 5500', () => {
      expect(computeLevel(5500)).toBe(10);
    });

    it('should return 10 for XP at exactly 5500', () => {
      expect(computeLevel(5500)).toBe(10);
    });

    it('should still be 10 for XP > 5500 but < 6600', () => {
      expect(computeLevel(5501)).toBe(10);
    });

    it('should handle large XP values', () => {
      const largeLevel = computeLevel(100000);
      expect(typeof largeLevel).toBe('number');
      expect(largeLevel).toBeGreaterThan(1);
    });
  });

  describe('xpRequiredForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(xpRequiredForLevel(1)).toBe(0);
    });

    it('should return 0 for level <= 1', () => {
      expect(xpRequiredForLevel(0)).toBe(0);
      expect(xpRequiredForLevel(-5)).toBe(0);
    });

    it('should return 300 for level 2', () => {
      expect(xpRequiredForLevel(2)).toBe(300);
    });

    it('should return 600 for level 3', () => {
      expect(xpRequiredForLevel(3)).toBe(600);
    });

    it('should return 1000 for level 4', () => {
      expect(xpRequiredForLevel(4)).toBe(1000);
    });

    it('should return 5500 for level 10', () => {
      expect(xpRequiredForLevel(10)).toBe(5500);
    });

    it('should return 6600 for level 11', () => {
      expect(xpRequiredForLevel(11)).toBe(6600);
    });

    it('should return 21000 for level 20', () => {
      expect(xpRequiredForLevel(20)).toBe(21000);
    });

    it('should be monotonically increasing', () => {
      for (let i = 1; i <= 20; i++) {
        expect(xpRequiredForLevel(i)).toBeLessThanOrEqual(xpRequiredForLevel(i + 1));
      }
    });
  });

  describe('xpToNextLevel', () => {
    it('should return 300 for 0 XP (need 300 to reach level 2)', () => {
      expect(xpToNextLevel(0)).toBe(300);
    });

    it('should return 150 for 150 XP (halfway to level 2)', () => {
      expect(xpToNextLevel(150)).toBe(150);
    });

    it('should return 300 for 300 XP (need 300 more to reach level 3)', () => {
      expect(xpToNextLevel(300)).toBe(300);
    });

    it('should return 400 for 600 XP (need 400 to reach level 4)', () => {
      expect(xpToNextLevel(600)).toBe(400);
    });

    it('should be non-negative', () => {
      for (let xp = 0; xp <= 10000; xp += 500) {
        expect(xpToNextLevel(xp)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should decrease within a level', () => {
      expect(xpToNextLevel(150)).toBeGreaterThan(xpToNextLevel(200));
      expect(xpToNextLevel(200)).toBeGreaterThan(xpToNextLevel(250));
    });
  });

  describe('xpProgressInLevel', () => {
    it('should return 0 at level start', () => {
      expect(xpProgressInLevel(0)).toBe(0);
    });

    it('should return 0.5 at level midpoint', () => {
      expect(xpProgressInLevel(150)).toBe(0.5);
    });

    it('should return ~0.9999 just before level up', () => {
      expect(xpProgressInLevel(299.999)).toBeCloseTo(0.9999, 3);
    });

    it('should return at most 1', () => {
      for (let xp = 0; xp <= 10000; xp += 100) {
        expect(xpProgressInLevel(xp)).toBeLessThanOrEqual(1);
      }
    });

    it('should return at least 0', () => {
      for (let xp = 0; xp <= 10000; xp += 100) {
        expect(xpProgressInLevel(xp)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should increase within a level', () => {
      expect(xpProgressInLevel(100)).toBeGreaterThan(xpProgressInLevel(50));
      expect(xpProgressInLevel(150)).toBeGreaterThan(xpProgressInLevel(100));
      expect(xpProgressInLevel(200)).toBeGreaterThan(xpProgressInLevel(150));
    });

    it('should return 0 at 300 XP (start of level 2)', () => {
      expect(xpProgressInLevel(300)).toBe(0);
    });

    it('should return 0 at 600 XP (start of level 3)', () => {
      expect(xpProgressInLevel(600)).toBe(0);
    });
  });

  describe('xpDeltaToLevelProgress', () => {
    it('should detect no level-up within same level', () => {
      const result = xpDeltaToLevelProgress(100, 200);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(1);
      expect(result.leveledUp).toBe(false);
      expect(result.levelsCrossed).toEqual([]);
    });

    it('should detect single level-up', () => {
      const result = xpDeltaToLevelProgress(150, 350);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(2);
      expect(result.leveledUp).toBe(true);
      expect(result.levelsCrossed).toEqual([2]);
    });

    it('should detect multi-level jump', () => {
      const result = xpDeltaToLevelProgress(0, 1000);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBeGreaterThan(1);
      expect(result.leveledUp).toBe(true);
      expect(result.levelsCrossed.length).toBeGreaterThan(0);
      // Level progression should be contiguous
      for (let i = 0; i < result.levelsCrossed.length - 1; i++) {
        expect(result.levelsCrossed[i + 1]).toBe(result.levelsCrossed[i] + 1);
      }
    });

    it('should detect multi-level jump from 0 to 5500 XP (levels 1-10)', () => {
      const result = xpDeltaToLevelProgress(0, 5500);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(10);
      expect(result.leveledUp).toBe(true);
      expect(result.levelsCrossed).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should handle no progress', () => {
      const result = xpDeltaToLevelProgress(100, 100);
      expect(result.oldLevel).toBe(result.newLevel);
      expect(result.leveledUp).toBe(false);
      expect(result.levelsCrossed).toEqual([]);
    });

    it('should handle backwards XP (though unusual)', () => {
      const result = xpDeltaToLevelProgress(500, 100);
      expect(result.oldLevel).toBeGreaterThan(result.newLevel);
      expect(result.leveledUp).toBe(false);
    });
  });
});
