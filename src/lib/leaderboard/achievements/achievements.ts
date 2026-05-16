/**
 * Achievement Configuration Definitions
 *
 * All available achievements spanning common, rare, and legendary tiers.
 * Each achievement defines its unlock criteria, rewards, and metadata.
 */

import type { AchievementConfig, AchievementRarity } from '../types';

/**
 * Common achievements - Easy to earn (10 XP reward)
 */
const commonAchievements: AchievementConfig[] = [
  {
    id: 'firstGamePlayed',
    title: 'First Steps',
    description: 'Play your first game in any mode',
    icon: '🎮',
    rarity: 'common',
    criteria: {
      type: 'gameCount',
      value: 1,
    },
    reward: {
      xp: 10,
      coins: 25,
    },
  },
  {
    id: 'tenGamesBlitz',
    title: 'Blitz Master',
    description: 'Play 10 games in Blitz mode',
    icon: '⚡',
    rarity: 'common',
    criteria: {
      type: 'gameCount',
      value: 10,
      mode: 'blitz',
    },
    reward: {
      xp: 10,
      coins: 50,
    },
  },
  {
    id: 'tenGamesClassic',
    title: 'Classic Player',
    description: 'Play 10 games in Classic mode',
    icon: '📚',
    rarity: 'common',
    criteria: {
      type: 'gameCount',
      value: 10,
      mode: 'classic',
    },
    reward: {
      xp: 10,
      coins: 50,
    },
  },
  {
    id: 'tenGamesTimeAttack',
    title: 'Time Challenger',
    description: 'Play 10 games in Time Attack mode',
    icon: '⏱️',
    rarity: 'common',
    criteria: {
      type: 'gameCount',
      value: 10,
      mode: 'timeAttack',
    },
    reward: {
      xp: 10,
      coins: 50,
    },
  },
  {
    id: 'scoreOver200',
    title: 'Rising Star',
    description: 'Achieve a score of 200 or higher in any mode',
    icon: '⭐',
    rarity: 'common',
    criteria: {
      type: 'scoreThreshold',
      value: 200,
    },
    reward: {
      xp: 10,
      coins: 50,
    },
  },
  {
    id: 'blitzScore150',
    title: 'Blitz Scorer',
    description: 'Achieve a score of 150 in Blitz mode',
    icon: '⚡',
    rarity: 'common',
    criteria: {
      type: 'scoreThreshold',
      value: 150,
      mode: 'blitz',
    },
    reward: {
      xp: 10,
      coins: 50,
    },
  },
];

/**
 * Rare achievements - Medium effort (25 XP reward)
 */
const rareAchievements: AchievementConfig[] = [
  {
    id: 'fiftyGames',
    title: 'Dedicated Player',
    description: 'Play 50 games across all modes',
    icon: '🏆',
    rarity: 'rare',
    criteria: {
      type: 'gameCount',
      value: 50,
    },
    reward: {
      xp: 25,
      coins: 150,
    },
  },
  {
    id: 'scoreOver500',
    title: 'Elite Scorer',
    description: 'Achieve a score of 500 or higher in any mode',
    icon: '💎',
    rarity: 'rare',
    criteria: {
      type: 'scoreThreshold',
      value: 500,
    },
    reward: {
      xp: 25,
      coins: 150,
    },
  },
  {
    id: 'perfectGame',
    title: 'Flawless Victory',
    description: 'Complete a perfect game with no wrong answers',
    icon: '💯',
    rarity: 'rare',
    criteria: {
      type: 'perfectGame',
      value: 0, // 0 wrong moves
    },
    reward: {
      xp: 25,
      coins: 150,
    },
  },
  {
    id: 'winStreak5',
    title: 'On Fire',
    description: 'Achieve 5 consecutive wins in a row',
    icon: '🔥',
    rarity: 'rare',
    criteria: {
      type: 'winStreak',
      value: 5,
    },
    reward: {
      xp: 25,
      coins: 150,
    },
  },
];

/**
 * Legendary achievements - High effort (50 XP reward)
 */
const legendaryAchievements: AchievementConfig[] = [
  {
    id: 'fiveHundredGames',
    title: 'Legend',
    description: 'Play 500 games across all modes',
    icon: '👑',
    rarity: 'legendary',
    criteria: {
      type: 'gameCount',
      value: 500,
    },
    reward: {
      xp: 50,
      coins: 500,
    },
  },
  {
    id: 'scoreOver1000',
    title: 'Ultimate Master',
    description: 'Achieve a score of 1,000 or higher in any mode',
    icon: '🌟',
    rarity: 'legendary',
    criteria: {
      type: 'scoreThreshold',
      value: 1000,
    },
    reward: {
      xp: 50,
      coins: 500,
    },
  },
];

/**
 * Get all achievements as a flat array
 *
 * @returns Array of all achievement configurations (common, rare, legendary)
 */
export function getAllAchievements(): AchievementConfig[] {
  return [...commonAchievements, ...rareAchievements, ...legendaryAchievements];
}

/**
 * Get achievements filtered by rarity tier
 *
 * @param rarity The rarity tier to filter by
 * @returns Array of achievements matching the rarity tier
 */
export function getAchievementsByRarity(rarity: AchievementRarity): AchievementConfig[] {
  switch (rarity) {
    case 'common':
      return commonAchievements;
    case 'rare':
      return rareAchievements;
    case 'legendary':
      return legendaryAchievements;
    default:
      return [];
  }
}

/**
 * Get a specific achievement by ID
 *
 * @param id The achievement ID to lookup
 * @returns The achievement configuration, or undefined if not found
 */
export function getAchievementById(id: string): AchievementConfig | undefined {
  return getAllAchievements().find((achievement) => achievement.id === id);
}

// Export the achievement arrays for direct access if needed
export { commonAchievements, rareAchievements, legendaryAchievements };

// Create a Map for O(1) lookup if needed
export const achievementMap = new Map(
  getAllAchievements().map((achievement) => [achievement.id, achievement])
);

/**
 * Achievement Consumable Reward Interface
 */
export interface AchievementReward {
  consumableType: 'hint' | 'reveal_next_word' | 'undo_step' | 'time_extension_15s';
  count: number;
}

/**
 * Get consumable rewards based on achievement rarity.
 * Common: 1 Hint
 * Rare: 2 Hints + 1 Undo
 * Legendary: 5 Time Extensions
 *
 * @param rarity The rarity tier of the achievement
 * @returns Array of consumable rewards to grant
 */
export function getAchievementReward(rarity: AchievementRarity): AchievementReward[] {
  switch (rarity) {
    case 'common':
      return [{ consumableType: 'hint', count: 1 }];
    case 'rare':
      return [
        { consumableType: 'hint', count: 2 },
        { consumableType: 'undo_step', count: 1 },
      ];
    case 'legendary':
      return [{ consumableType: 'time_extension_15s', count: 5 }];
  }
}
