import type { LevelReward } from './types';

export const LEVEL_REWARDS: Record<number, LevelReward> = {
  2: {
    level: 2,
    coins: 50,
    unlocks: [{ type: 'badge', id: 'sprout', name: 'Sprout' }],
    description: 'Sprout badge earned!',
  },
  3: {
    level: 3,
    coins: 75,
    unlocks: [{ type: 'consumable', consumableType: 'hint', count: 3 }],
    description: '+3 Hints stocked in your inventory.',
  },
  5: {
    level: 5,
    coins: 200,
    unlocks: [
      { type: 'mode', modeId: 'mode_practice', name: 'Practice Mode' },
      { type: 'badge', id: 'apprentice', name: 'Apprentice' },
    ],
    description: 'Practice Mode unlocked!',
  },
  7: {
    level: 7,
    coins: 300,
    unlocks: [
      { type: 'consumable', consumableType: 'hint', count: 5 },
      { type: 'consumable', consumableType: 'undo_step', count: 3 },
    ],
    description: '+5 Hints, +3 Undos stocked.',
  },
  10: {
    level: 10,
    coins: 500,
    unlocks: [
      { type: 'mode', modeId: 'mode_endless', name: 'Endless Mode' },
      { type: 'badge', id: 'climber', name: 'Climber' },
    ],
    description: 'Endless Mode unlocked!',
  },
  12: {
    level: 12,
    coins: 600,
    unlocks: [{ type: 'dictionary_voucher', count: 1 }],
    description: 'Free dictionary pack voucher!',
  },
  15: {
    level: 15,
    coins: 1000,
    unlocks: [{ type: 'mode', modeId: 'mode_reverse', name: 'Reverse Mode' }],
    description: 'Reverse Mode unlocked!',
  },
  18: {
    level: 18,
    coins: 1200,
    unlocks: [{ type: 'badge', id: 'master', name: 'Master' }],
    description: 'Master badge earned!',
  },
  20: {
    level: 20,
    coins: 1500,
    unlocks: [
      { type: 'mode', modeId: 'mode_locked_letter', name: 'Locked-Letter Mode' },
      { type: 'badge', id: 'ladderist', name: 'Ladderist' },
    ],
    description: 'Locked-Letter Mode + Ladderist badge!',
  },
};

/**
 * Returns the reward for a specific level, or null if no special reward.
 */
export function getLevelReward(level: number): LevelReward | null {
  return LEVEL_REWARDS[level] ?? null;
}

/**
 * Returns all rewards for levels between oldLevel+1 and newLevel inclusive.
 * Used after addXp causes one or more level-ups.
 * Returns rewards in ascending level order.
 */
export function getRewardsBetween(oldLevel: number, newLevel: number): LevelReward[] {
  const rewards: LevelReward[] = [];
  for (let level = oldLevel + 1; level <= newLevel; level++) {
    const reward = getLevelReward(level);
    if (reward) {
      rewards.push(reward);
    }
  }
  return rewards;
}

/**
 * Returns the next level that has a reward, starting from currentLevel.
 * Returns null if no future level rewards exist (cap reached).
 * Used to show "Next reward: level 7" on the profile.
 */
export function getNextRewardLevel(currentLevel: number): number | null {
  const maxLevel = Math.max(...Object.keys(LEVEL_REWARDS).map(Number));
  for (let level = currentLevel + 1; level <= maxLevel + 1; level++) {
    if (getLevelReward(level)) {
      return level;
    }
  }
  return null;
}
