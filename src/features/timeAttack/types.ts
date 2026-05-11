export type TimeAttackMode = 'sprint' | 'survival';
export type DurationTier = 60 | 90 | 120;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Phase = 'idle' | 'setup' | 'playing' | 'ended';

export type DifficultyConfig = {
  difficulty: Difficulty;
  wordLength: 3 | 4 | 5;
};

export type RunSummary = {
  mode: TimeAttackMode;
  tier: DurationTier;
  solvedCount: number;
  longestStreak: number;
  timeTakenMs: number;        // for Sprint: tier*1000 - timeRemaining; for Survival: total elapsed
  bestDifficulty: Difficulty | null;
  averageSolveMs: number | null;
};
