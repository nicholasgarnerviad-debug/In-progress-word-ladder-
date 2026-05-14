import type { BlitzDifficulty } from './types';

/**
 * Represents the statistics from a completed Blitz game
 */
export interface BlitzGameStats {
  solved: number;
  wrong: number;
  hints: number;
  score: number;
  difficulty: BlitzDifficulty;
}

/**
 * Base coins earned per puzzle solved
 */
const COINS_PER_SOLVE = 7;

/**
 * Base XP earned in a Blitz run
 */
const BASE_XP = 50;

/**
 * XP earned per puzzle solved
 */
const XP_PER_SOLVE = 10;

/**
 * Get the difficulty multiplier for coins and XP
 */
export function getDifficultyMultiplier(difficulty: BlitzDifficulty): number {
  switch (difficulty) {
    case 'easy':
      return 1.0;
    case 'medium':
      return 1.5;
    case 'hard':
      return 2.0;
  }
}

/**
 * Calculate coins earned from a Blitz game
 *
 * Formula: (solved * COINS_PER_SOLVE) * difficultyMultiplier
 * Result is rounded to nearest integer
 */
export function calculateBlitzCoins(stats: BlitzGameStats): number {
  const baseCoins = stats.solved * COINS_PER_SOLVE;
  const multiplier = getDifficultyMultiplier(stats.difficulty);
  const totalCoins = baseCoins * multiplier;
  return Math.round(totalCoins);
}

/**
 * Calculate XP earned from a Blitz game
 *
 * Formula: (BASE_XP + solved * XP_PER_SOLVE) * difficultyMultiplier
 * Result is rounded to nearest integer
 */
export function calculateBlitzXP(stats: BlitzGameStats): number {
  const baseXp = BASE_XP + stats.solved * XP_PER_SOLVE;
  const multiplier = getDifficultyMultiplier(stats.difficulty);
  const totalXp = baseXp * multiplier;
  return Math.round(totalXp);
}
