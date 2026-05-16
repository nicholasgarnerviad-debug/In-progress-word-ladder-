/**
 * Leaderboard/Social/Achievement System Type Definitions
 * All data models for the leaderboard, player profiles, game results, and achievements
 */

import type { Timestamp } from 'firebase/firestore';

// Type aliases
export type GameMode = 'blitz' | 'classic' | 'timeAttack';
export type LeaderboardPeriod = 'allTime' | 'weekly' | 'monthly';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type AchievementRarity = 'common' | 'rare' | 'legendary';

/**
 * Mode-specific statistics tracked for each game mode
 */
export type ModeStats = {
  gamesPlayed: number;
  wins: number;
  bestScore: number;
  totalScore: number;
  averageScore: number;
};

/**
 * Blitz-specific statistics (extends ModeStats)
 */
export type BlitzStats = ModeStats & {
  totalTime: number; // milliseconds
};

/**
 * TimeAttack-specific statistics (extends ModeStats)
 */
export type TimeAttackStats = ModeStats & {
  bestTime: number; // milliseconds
  completedPuzzles: number;
};

/**
 * Player profile containing user information, stats, achievements, and badges
 */
export interface PlayerProfile {
  userId: string;
  name: string;
  avatar?: string;
  joinedAt: Timestamp;
  level: number;
  xp: number;
  totalGames: number;
  totalScore: number;
  stats: {
    blitz: BlitzStats;
    classic: ModeStats;
    timeAttack: TimeAttackStats;
  };
  achievements: string[]; // achievement IDs
  badges: string[];
  lastGameAt: Timestamp;
}

/**
 * Individual game result record
 */
export interface GameResult {
  userId: string;
  mode: GameMode;
  score: number;
  solved: boolean;
  wrong: number; // number of wrong moves/attempts
  duration: number; // milliseconds
  difficulty?: Difficulty;
  wordLength?: number;
  placement?: number; // ranking in multiplayer game
  totalPlayers?: number; // total players in multiplayer game
  timestamp: Timestamp;
}

/**
 * Leaderboard document containing ranked list of players
 */
export interface LeaderboardDoc {
  mode: GameMode;
  period: LeaderboardPeriod;
  rankings: LeaderboardEntry[];
  lastUpdated: Timestamp;
  updatedCount: number;
}

/**
 * Individual entry in a leaderboard ranking
 */
export interface LeaderboardEntry {
  userId: string;
  name: string;
  score: number;
  placement: number;
  gamesPlayed: number;
  lastGameAt: Timestamp;
}

/**
 * Achievement criteria definition
 */
export interface AchievementCriteria {
  type: string; // e.g., 'scoreThreshold', 'winStreak', 'gamesPlayed', 'timeLimit'
  value: number;
  mode?: GameMode; // optional, for mode-specific achievements
}

/**
 * Achievement reward configuration
 */
export interface AchievementReward {
  xp?: number;
  coins?: number;
}

/**
 * Achievement configuration defining how to earn and what rewards apply
 */
export interface AchievementConfig {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  rarity: AchievementRarity;
  criteria: AchievementCriteria;
  reward?: AchievementReward;
}
