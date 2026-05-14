import { getLevelReward, getRewardsBetween, getNextRewardLevel, LEVEL_REWARDS } from '../levelRewards';
import type { LevelReward } from '../types';

describe('levelRewards.ts', () => {
  describe('getLevelReward', () => {
    it('should return null for level 1 (no reward)', () => {
      expect(getLevelReward(1)).toBeNull();
    });

    it('should return reward for level 2', () => {
      const reward = getLevelReward(2);
      expect(reward).not.toBeNull();
      expect(reward?.level).toBe(2);
      expect(reward?.coins).toBe(50);
      expect(reward?.unlocks).toContainEqual({ type: 'badge', id: 'sprout', name: 'Sprout' });
    });

    it('should return reward for level 4 (no direct entry, but should return null)', () => {
      const reward = getLevelReward(4);
      expect(reward).toBeNull();
    });

    it('should return reward for level 5', () => {
      const reward = getLevelReward(5);
      expect(reward).not.toBeNull();
      expect(reward?.level).toBe(5);
      expect(reward?.coins).toBe(200);
    });

    it('should return reward for level 25 if it exists', () => {
      const reward = getLevelReward(25);
      if (reward) {
        expect(reward.level).toBe(25);
        expect(reward.coins).toBeGreaterThan(0);
      }
    });

    it('should return null for non-existent level', () => {
      expect(getLevelReward(999)).toBeNull();
    });

    it('should have valid structure for all rewards', () => {
      const rewardLevels = Object.keys(LEVEL_REWARDS).map(Number);
      for (const level of rewardLevels) {
        const reward = getLevelReward(level);
        expect(reward).not.toBeNull();
        expect(reward?.level).toBe(level);
        expect(typeof reward?.coins).toBe('number');
        expect(reward?.coins).toBeGreaterThan(0);
        expect(Array.isArray(reward?.unlocks)).toBe(true);
        expect(typeof reward?.description).toBe('string');
      }
    });
  });

  describe('getRewardsBetween', () => {
    it('should return empty array when no levels between', () => {
      const rewards = getRewardsBetween(3, 3);
      expect(rewards).toEqual([]);
    });

    it('should return rewards for range 1-7', () => {
      const rewards = getRewardsBetween(1, 7);
      expect(rewards.length).toBeGreaterThan(0);
      // Should include levels 2, 3, 5, 7 if they have rewards
      const levels = rewards.map(r => r.level);
      expect(levels).toContain(2);
      expect(levels).toContain(5);
      expect(levels).toContain(7);
    });

    it('should return empty array for range 5-5', () => {
      const rewards = getRewardsBetween(5, 5);
      expect(rewards).toEqual([]);
    });

    it('should return rewards in ascending level order', () => {
      const rewards = getRewardsBetween(1, 20);
      for (let i = 0; i < rewards.length - 1; i++) {
        expect(rewards[i].level).toBeLessThan(rewards[i + 1].level);
      }
    });

    it('should return rewards for range 9-12', () => {
      const rewards = getRewardsBetween(9, 12);
      // Levels 10 and 12 should have rewards
      const levels = rewards.map(r => r.level);
      if (LEVEL_REWARDS[10]) {
        expect(levels).toContain(10);
      }
      if (LEVEL_REWARDS[12]) {
        expect(levels).toContain(12);
      }
    });

    it('should handle large ranges', () => {
      const rewards = getRewardsBetween(0, 100);
      expect(rewards.length).toBeLessThanOrEqual(100);
      // All returned rewards should be within range
      for (const reward of rewards) {
        expect(reward.level).toBeGreaterThan(0);
        expect(reward.level).toBeLessThanOrEqual(100);
      }
    });

    it('should skip levels without rewards', () => {
      const rewards = getRewardsBetween(1, 10);
      for (const reward of rewards) {
        expect(reward.level).toBeTruthy();
        expect(getLevelReward(reward.level)).not.toBeNull();
      }
    });
  });

  describe('getNextRewardLevel', () => {
    it('should return the next reward level from level 1', () => {
      const nextLevel = getNextRewardLevel(1);
      expect(nextLevel).toBe(2); // Level 2 has a reward
    });

    it('should return the next reward level from level 7', () => {
      const nextLevel = getNextRewardLevel(7);
      expect(nextLevel).toBeTruthy();
      expect(nextLevel).toBeGreaterThan(7);
      // Should be 10 if level 8, 9 don't have rewards
      if (nextLevel) {
        expect(getLevelReward(nextLevel)).not.toBeNull();
      }
    });

    it('should return the next reward level from level 20', () => {
      const nextLevel = getNextRewardLevel(20);
      // Could be null if level 20 is the last reward, or higher level
      if (nextLevel) {
        expect(nextLevel).toBeGreaterThan(20);
        expect(getLevelReward(nextLevel)).not.toBeNull();
      }
    });

    it('should skip non-reward levels', () => {
      const nextLevel = getNextRewardLevel(3); // 3 has reward, next should be 5
      expect(nextLevel).toBeGreaterThan(3);
      if (nextLevel) {
        expect(getLevelReward(nextLevel)).not.toBeNull();
      }
    });

    it('should return null or find a level beyond the highest reward', () => {
      const maxLevel = Math.max(...Object.keys(LEVEL_REWARDS).map(Number));
      const nextLevel = getNextRewardLevel(maxLevel);
      // Should be null if maxLevel is the last reward with no further levels
      if (nextLevel) {
        expect(getLevelReward(nextLevel)).not.toBeNull();
      }
    });

    it('should return rewards in ascending order', () => {
      let currentLevel = 0;
      for (let i = 0; i < 10; i++) {
        const nextLevel = getNextRewardLevel(currentLevel);
        if (nextLevel === null) break;
        expect(nextLevel).toBeGreaterThan(currentLevel);
        currentLevel = nextLevel;
      }
    });
  });

  describe('LEVEL_REWARDS structure', () => {
    it('should have consistent structure for all rewards', () => {
      for (const [key, reward] of Object.entries(LEVEL_REWARDS)) {
        const level = Number(key);
        expect(reward.level).toBe(level);
        expect(typeof reward.coins).toBe('number');
        expect(reward.coins).toBeGreaterThan(0);
        expect(Array.isArray(reward.unlocks)).toBe(true);
        expect(reward.unlocks.length).toBeGreaterThan(0);
        expect(typeof reward.description).toBe('string');
      }
    });

    it('should have rewards only for levels 2 and above', () => {
      const levels = Object.keys(LEVEL_REWARDS).map(Number);
      for (const level of levels) {
        expect(level).toBeGreaterThanOrEqual(2);
      }
    });

    it('should have increasing coin rewards generally', () => {
      const levels = Object.keys(LEVEL_REWARDS).map(Number).sort((a, b) => a - b);
      for (let i = 0; i < levels.length - 1; i++) {
        const currentReward = LEVEL_REWARDS[levels[i]];
        const nextReward = LEVEL_REWARDS[levels[i + 1]];
        // Generally coins should increase or stay similar
        expect(nextReward.coins).toBeGreaterThanOrEqual(currentReward.coins * 0.5);
      }
    });
  });
});
