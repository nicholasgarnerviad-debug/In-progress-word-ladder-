import { DurationTier, TimeAttackMode, RunSummary } from './types';

export type TimeAttackBest = {
  solved: number;
  longestStreak: number;
  achievedAt: string; // ISO date YYYY-MM-DD
};

export type TimeAttackStats = {
  // Key format: `${mode}:${tier}` e.g. "sprint:90"
  bests: Record<string, TimeAttackBest>;
  totalRuns: number;
  totalSolved: number;
};

export const STORAGE_KEY = 'wordLadder.timeAttack.stats';

export function getDefaultStats(): TimeAttackStats {
  return {
    bests: {},
    totalRuns: 0,
    totalSolved: 0,
  };
}

export function loadStats(): TimeAttackStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultStats();
    }

    const parsed = JSON.parse(stored) as TimeAttackStats;

    // Validate shape
    if (
      typeof parsed !== 'object' ||
      !('bests' in parsed) ||
      !('totalRuns' in parsed) ||
      !('totalSolved' in parsed) ||
      typeof parsed.totalRuns !== 'number' ||
      typeof parsed.totalSolved !== 'number' ||
      typeof parsed.bests !== 'object'
    ) {
      return getDefaultStats();
    }

    return parsed;
  } catch {
    return getDefaultStats();
  }
}

export function saveStats(stats: TimeAttackStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // localStorage not available
  }
}

/**
 * Returns updated stats after recording a completed run.
 * Pure — does not call saveStats.
 * If the run beats the existing best for that mode+tier (by solved count, with longestStreak as tiebreak),
 * the best is updated.
 */
export function recordRun(stats: TimeAttackStats, summary: RunSummary): TimeAttackStats {
  const key = `${summary.mode}:${summary.tier}`;
  const existingBest = stats.bests[key];

  let shouldUpdateBest = false;

  if (!existingBest) {
    // No previous best, this is a new record
    shouldUpdateBest = true;
  } else {
    // Check if this run beats the existing best
    if (summary.solvedCount > existingBest.solved) {
      shouldUpdateBest = true;
    } else if (
      summary.solvedCount === existingBest.solved &&
      summary.longestStreak > existingBest.longestStreak
    ) {
      shouldUpdateBest = true;
    }
  }

  const newBests = { ...stats.bests };
  if (shouldUpdateBest) {
    newBests[key] = {
      solved: summary.solvedCount,
      longestStreak: summary.longestStreak,
      achievedAt: new Date().toISOString().split('T')[0],
    };
  }

  return {
    bests: newBests,
    totalRuns: stats.totalRuns + 1,
    totalSolved: stats.totalSolved + summary.solvedCount,
  };
}

/** Returns the best for a given mode+tier, or null if none recorded yet. */
export function getBest(
  stats: TimeAttackStats,
  mode: TimeAttackMode,
  tier: DurationTier
): TimeAttackBest | null {
  const key = `${mode}:${tier}`;
  return stats.bests[key] ?? null;
}
