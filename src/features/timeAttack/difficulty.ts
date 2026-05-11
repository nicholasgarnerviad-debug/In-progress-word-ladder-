import { Difficulty, DifficultyConfig, DurationTier } from './types';

/**
 * Returns the difficulty + word length for the Nth puzzle in a run (0-indexed).
 * Ramp:
 *   0-2:   easy / 3 letters
 *   3-5:   easy / 4 letters
 *   6-8:   medium / 4 letters
 *   9-12:  medium / 5 letters
 *   13+:   hard / 5 letters
 */
export function getDifficultyForIndex(index: number): DifficultyConfig {
  if (index <= 2) {
    return { difficulty: 'easy', wordLength: 3 };
  }
  if (index <= 5) {
    return { difficulty: 'easy', wordLength: 4 };
  }
  if (index <= 8) {
    return { difficulty: 'medium', wordLength: 4 };
  }
  if (index <= 12) {
    return { difficulty: 'medium', wordLength: 5 };
  }
  return { difficulty: 'hard', wordLength: 5 };
}

/**
 * Skip cost in seconds AFTER free skips are exhausted.
 *   tier 60  -> 5s
 *   tier 90  -> 10s
 *   tier 120 -> 15s
 * Returns 0 if freeSkipsRemaining > 0.
 */
export function getSkipCostSeconds(
  tier: DurationTier,
  freeSkipsRemaining: number
): number {
  if (freeSkipsRemaining > 0) {
    return 0;
  }

  switch (tier) {
    case 60:
      return 5;
    case 90:
      return 10;
    case 120:
      return 15;
    default:
      const _exhaustive: never = tier;
      return _exhaustive;
  }
}

/**
 * Time reward in seconds for solving a puzzle in Survival mode.
 *   easy: 6, medium: 9, hard: 12
 * In Sprint mode this is never called.
 */
export function getTimeRewardSeconds(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 6;
    case 'medium':
      return 9;
    case 'hard':
      return 12;
    default:
      const _exhaustive: never = difficulty;
      return _exhaustive;
  }
}

/**
 * Survival base time in seconds for a chosen tier.
 *   60  -> 30
 *   90  -> 45
 *   120 -> 60
 */
export function getSurvivalBaseSeconds(tier: DurationTier): number {
  switch (tier) {
    case 60:
      return 30;
    case 90:
      return 45;
    case 120:
      return 60;
    default:
      const _exhaustive: never = tier;
      return _exhaustive;
  }
}

/** Compares difficulties as a ranking. easy < medium < hard. */
export function compareDifficulty(a: Difficulty, b: Difficulty): number {
  const rank: Record<Difficulty, number> = {
    easy: 0,
    medium: 1,
    hard: 2,
  };
  return rank[a] - rank[b];
}

export const FREE_SKIPS_PER_RUN = 2;
