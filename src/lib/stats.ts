export type GameStats = {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string | null;
};

const STORAGE_KEY = 'wordLadder.stats';

function getTodayISODate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function getDefaultStats(): GameStats {
  return {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastPlayedDate: null,
  };
}

export function loadStats(): GameStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultStats();
    }
    const parsed = JSON.parse(stored);
    // Validate the structure
    if (
      typeof parsed.played === 'number' &&
      typeof parsed.won === 'number' &&
      typeof parsed.currentStreak === 'number' &&
      typeof parsed.maxStreak === 'number' &&
      (parsed.lastPlayedDate === null || typeof parsed.lastPlayedDate === 'string')
    ) {
      return parsed as GameStats;
    }
    return getDefaultStats();
  } catch {
    return getDefaultStats();
  }
}

export function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function recordWin(stats: GameStats): GameStats {
  const newStreak = stats.currentStreak + 1;
  const newMaxStreak = Math.max(stats.maxStreak, newStreak);

  return {
    played: stats.played + 1,
    won: stats.won + 1,
    currentStreak: newStreak,
    maxStreak: newMaxStreak,
    lastPlayedDate: getTodayISODate(),
  };
}

export function recordLoss(stats: GameStats): GameStats {
  return {
    played: stats.played + 1,
    won: stats.won,
    currentStreak: 0,
    maxStreak: stats.maxStreak,
    lastPlayedDate: getTodayISODate(),
  };
}
