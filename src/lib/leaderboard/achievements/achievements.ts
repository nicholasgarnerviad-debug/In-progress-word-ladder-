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
