import {
  calculateBlitzCoins,
  calculateBlitzXP,
  getDifficultyMultiplier,
  type BlitzGameStats,
} from '../economy';

describe('Blitz Economy', () => {
  describe('getDifficultyMultiplier', () => {
    it('should return 1.0 for easy difficulty', () => {
      expect(getDifficultyMultiplier('easy')).toBe(1.0);
    });

    it('should return 1.5 for medium difficulty', () => {
      expect(getDifficultyMultiplier('medium')).toBe(1.5);
    });

    it('should return 2.0 for hard difficulty', () => {
      expect(getDifficultyMultiplier('hard')).toBe(2.0);
    });
  });

  describe('calculateBlitzCoins', () => {
    it('should calculate coins as base coins per puzzle solved', () => {
      const stats: BlitzGameStats = {
        solved: 5,
        wrong: 0,
        hints: 0,
        score: 500,
        difficulty: 'easy',
      };
      // 5 solved * 7 coins per solve = 35 coins
      expect(calculateBlitzCoins(stats)).toBe(35);
    });

    it('should apply difficulty multiplier to coins', () => {
      const stats: BlitzGameStats = {
        solved: 5,
        wrong: 0,
        hints: 0,
        score: 1500,
        difficulty: 'medium',
      };
      // (5 solved * 7) * 1.5 multiplier = 52.5 => 53 coins (rounded)
      expect(calculateBlitzCoins(stats)).toBe(53);
    });

    it('should handle hard difficulty multiplier for coins', () => {
      const stats: BlitzGameStats = {
        solved: 5,
        wrong: 0,
        hints: 0,
        score: 2000,
        difficulty: 'hard',
      };
      // (5 solved * 7) * 2.0 multiplier = 70 coins
      expect(calculateBlitzCoins(stats)).toBe(70);
    });

    it('should handle zero solved puzzles', () => {
      const stats: BlitzGameStats = {
        solved: 0,
        wrong: 5,
        hints: 2,
        score: 0,
        difficulty: 'easy',
      };
      expect(calculateBlitzCoins(stats)).toBe(0);
    });
  });

  describe('calculateBlitzXP', () => {
    it('should calculate XP with base multipliers for easy', () => {
      const stats: BlitzGameStats = {
        solved: 5,
        wrong: 0,
        hints: 0,
        score: 500,
        difficulty: 'easy',
      };
      // (50 base + 50 solved*10) * 1.0 = 100 XP
      expect(calculateBlitzXP(stats)).toBe(100);
    });

    it('should apply difficulty multiplier to XP', () => {
      const stats: BlitzGameStats = {
        solved: 5,
        wrong: 0,
        hints: 0,
        score: 1500,
        difficulty: 'medium',
      };
      // (50 base + 50 solved*10) * 1.5 = 150 XP
      expect(calculateBlitzXP(stats)).toBe(150);
    });

    it('should calculate XP correctly for hard difficulty', () => {
      const stats: BlitzGameStats = {
        solved: 8,
        wrong: 0,
        hints: 0,
        score: 800,
        difficulty: 'hard',
      };
      // (50 base + 80 solved*10) * 2.0 = 260 XP
      expect(calculateBlitzXP(stats)).toBe(260);
    });

    it('should handle zero solved puzzles with base XP', () => {
      const stats: BlitzGameStats = {
        solved: 0,
        wrong: 5,
        hints: 2,
        score: 0,
        difficulty: 'easy',
      };
      // (50 base + 0 solved*10) * 1.0 = 50 XP
      expect(calculateBlitzXP(stats)).toBe(50);
    });

    it('should give more XP for hard difficulty with same solves', () => {
      const easyStats: BlitzGameStats = {
        solved: 5,
        wrong: 0,
        hints: 0,
        score: 500,
        difficulty: 'easy',
      };
      const hardStats: BlitzGameStats = {
        solved: 5,
        wrong: 0,
        hints: 0,
        score: 500,
        difficulty: 'hard',
      };
      const easyXp = calculateBlitzXP(easyStats);
      const hardXp = calculateBlitzXP(hardStats);
      expect(hardXp).toBe(easyXp * 2);
    });
  });
});
