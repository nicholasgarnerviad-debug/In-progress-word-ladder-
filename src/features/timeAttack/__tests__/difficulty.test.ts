import {
  getDifficultyForIndex,
  getSkipCostSeconds,
  getTimeRewardSeconds,
  getSurvivalBaseSeconds,
  compareDifficulty,
  FREE_SKIPS_PER_RUN,
} from '../difficulty';

describe('difficulty module', () => {
  describe('getDifficultyForIndex', () => {
    it('returns easy/3 for indices 0-2', () => {
      expect(getDifficultyForIndex(0)).toEqual({ difficulty: 'easy', wordLength: 3 });
      expect(getDifficultyForIndex(1)).toEqual({ difficulty: 'easy', wordLength: 3 });
      expect(getDifficultyForIndex(2)).toEqual({ difficulty: 'easy', wordLength: 3 });
    });

    it('returns easy/4 for indices 3-5', () => {
      expect(getDifficultyForIndex(3)).toEqual({ difficulty: 'easy', wordLength: 4 });
      expect(getDifficultyForIndex(4)).toEqual({ difficulty: 'easy', wordLength: 4 });
      expect(getDifficultyForIndex(5)).toEqual({ difficulty: 'easy', wordLength: 4 });
    });

    it('returns medium/4 for indices 6-8', () => {
      expect(getDifficultyForIndex(6)).toEqual({ difficulty: 'medium', wordLength: 4 });
      expect(getDifficultyForIndex(7)).toEqual({ difficulty: 'medium', wordLength: 4 });
      expect(getDifficultyForIndex(8)).toEqual({ difficulty: 'medium', wordLength: 4 });
    });

    it('returns medium/5 for indices 9-12', () => {
      expect(getDifficultyForIndex(9)).toEqual({ difficulty: 'medium', wordLength: 5 });
      expect(getDifficultyForIndex(10)).toEqual({ difficulty: 'medium', wordLength: 5 });
      expect(getDifficultyForIndex(12)).toEqual({ difficulty: 'medium', wordLength: 5 });
    });

    it('returns hard/5 for indices 13+', () => {
      expect(getDifficultyForIndex(13)).toEqual({ difficulty: 'hard', wordLength: 5 });
      expect(getDifficultyForIndex(50)).toEqual({ difficulty: 'hard', wordLength: 5 });
      expect(getDifficultyForIndex(1000)).toEqual({ difficulty: 'hard', wordLength: 5 });
    });
  });

  describe('getSkipCostSeconds', () => {
    it('returns 0 when freeSkipsRemaining > 0', () => {
      expect(getSkipCostSeconds(60, 1)).toBe(0);
      expect(getSkipCostSeconds(60, 2)).toBe(0);
      expect(getSkipCostSeconds(90, 1)).toBe(0);
      expect(getSkipCostSeconds(120, 2)).toBe(0);
    });

    it('returns tier-based cost when freeSkipsRemaining is 0', () => {
      expect(getSkipCostSeconds(60, 0)).toBe(5);
      expect(getSkipCostSeconds(90, 0)).toBe(10);
      expect(getSkipCostSeconds(120, 0)).toBe(15);
    });

    it('respects the boundary at freeSkipsRemaining = 1', () => {
      expect(getSkipCostSeconds(60, 1)).toBe(0);
      expect(getSkipCostSeconds(60, 0)).toBe(5);
    });
  });

  describe('getTimeRewardSeconds', () => {
    it('returns 6 for easy', () => {
      expect(getTimeRewardSeconds('easy')).toBe(6);
    });

    it('returns 9 for medium', () => {
      expect(getTimeRewardSeconds('medium')).toBe(9);
    });

    it('returns 12 for hard', () => {
      expect(getTimeRewardSeconds('hard')).toBe(12);
    });
  });

  describe('getSurvivalBaseSeconds', () => {
    it('returns 30 for tier 60', () => {
      expect(getSurvivalBaseSeconds(60)).toBe(30);
    });

    it('returns 45 for tier 90', () => {
      expect(getSurvivalBaseSeconds(90)).toBe(45);
    });

    it('returns 60 for tier 120', () => {
      expect(getSurvivalBaseSeconds(120)).toBe(60);
    });
  });

  describe('compareDifficulty', () => {
    it('returns 0 when difficulties are equal', () => {
      expect(compareDifficulty('easy', 'easy')).toBe(0);
      expect(compareDifficulty('medium', 'medium')).toBe(0);
      expect(compareDifficulty('hard', 'hard')).toBe(0);
    });

    it('returns negative when a < b', () => {
      expect(compareDifficulty('easy', 'medium')).toBeLessThan(0);
      expect(compareDifficulty('easy', 'hard')).toBeLessThan(0);
      expect(compareDifficulty('medium', 'hard')).toBeLessThan(0);
    });

    it('returns positive when a > b', () => {
      expect(compareDifficulty('medium', 'easy')).toBeGreaterThan(0);
      expect(compareDifficulty('hard', 'easy')).toBeGreaterThan(0);
      expect(compareDifficulty('hard', 'medium')).toBeGreaterThan(0);
    });
  });

  describe('constants', () => {
    it('FREE_SKIPS_PER_RUN is 2', () => {
      expect(FREE_SKIPS_PER_RUN).toBe(2);
    });
  });
});
