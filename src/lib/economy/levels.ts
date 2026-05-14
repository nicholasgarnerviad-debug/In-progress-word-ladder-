/**
 * Level math module for the economy system.
 * Returns the level for a given total XP.
 * Level 1 is the floor (0 XP = level 1).
 * Level N requires cumulative XP of `XP_PER_LEVEL_UNIT * N * (N+1) / 2`.
 *
 * Formula: S = XP_PER_LEVEL_UNIT * N * (N+1) / 2
 * Solving for N: N = (-1 + sqrt(1 + 8*S/XP_PER_LEVEL_UNIT)) / 2, then floor
 */

const XP_PER_LEVEL_UNIT = 100;

export function computeLevel(xp: number): number {
  if (xp < 0) {
    return 1;
  }
  // Quadratic formula to invert cumulative XP: S = XP_PER_LEVEL_UNIT * N * (N+1) / 2
  // Solve: XP_PER_LEVEL_UNIT*N^2 + XP_PER_LEVEL_UNIT*N - 2*S = 0
  // N = (-1 + sqrt(1 + 8*S/XP_PER_LEVEL_UNIT)) / 2
  const level = Math.floor((-1 + Math.sqrt(1 + (8 * xp) / XP_PER_LEVEL_UNIT)) / 2);
  return Math.max(1, level);
}

/**
 * Returns the total cumulative XP required to reach a given level.
 * Inverse of computeLevel.
 *
 * Examples:
 *   xpRequiredForLevel(1)  → 0
 *   xpRequiredForLevel(2)  → 300
 *   xpRequiredForLevel(10) → 5500
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) {
    return 0;
  }
  return (XP_PER_LEVEL_UNIT * level * (level + 1)) / 2;
}

/**
 * Returns XP needed to reach the next level from the current XP total.
 * Example: xpToNextLevel(150) → 150 (need 150 more to hit 300 = level 2)
 */
export function xpToNextLevel(xp: number): number {
  const currentLevel = computeLevel(xp);
  const xpForNextLevel = xpRequiredForLevel(currentLevel + 1);
  return Math.max(0, xpForNextLevel - xp);
}

/**
 * Returns a value in [0, 1) representing progress through the current level.
 * Used for rendering the XP progress bar.
 * Example: xpProgressInLevel(150) → 0.5 (halfway through level 1)
 */
export function xpProgressInLevel(xp: number): number {
  const currentLevel = computeLevel(xp);
  const xpAtLevelStart = xpRequiredForLevel(currentLevel);
  const xpAtLevelEnd = xpRequiredForLevel(currentLevel + 1);
  const xpIntoLevel = xp - xpAtLevelStart;
  const xpForLevel = xpAtLevelEnd - xpAtLevelStart;
  return Math.min(1, xpIntoLevel / xpForLevel);
}

/**
 * Returns the XP gained between two totals, expressed as level transitions.
 * Useful for "you gained X XP and progressed through levels Y and Z".
 */
export function xpDeltaToLevelProgress(oldXp: number, newXp: number): {
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  levelsCrossed: number[];
} {
  const oldLevel = computeLevel(oldXp);
  const newLevel = computeLevel(newXp);
  const leveledUp = newLevel > oldLevel;

  const levelsCrossed: number[] = [];
  if (leveledUp) {
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      levelsCrossed.push(level);
    }
  }

  return {
    oldLevel,
    newLevel,
    leveledUp,
    levelsCrossed,
  };
}
