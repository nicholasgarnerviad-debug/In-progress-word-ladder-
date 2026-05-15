import type {
  GameResult,
  PlayerProfile,
  LeaderboardDoc,
  AchievementConfig,
  GameMode,
  LeaderboardPeriod,
} from '../types';

/**
 * Sync adapter error codes for leaderboard operations
 */
export enum LeaderboardSyncErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  FIRESTORE_ERROR = 'FIRESTORE_ERROR',
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  INVALID_SETTINGS = 'INVALID_SETTINGS',
  SYNC_ERROR = 'SYNC_ERROR',
  ACHIEVEMENT_CHECK_ERROR = 'ACHIEVEMENT_CHECK_ERROR',
}

/**
 * Sync adapter error with code for structured error handling
 */
export class LeaderboardSyncError extends Error {
  constructor(
    public code: LeaderboardSyncErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'LeaderboardSyncError';
  }
}

/**
 * Listener type for real-time leaderboard updates
 */
export type LeaderboardListener = (leaderboard: LeaderboardDoc) => void;

/**
 * Interface for leaderboard sync adapters.
 * Implementations handle leaderboard sync, player profiles, game results, and achievements.
 * All methods are async (return Promises) even if in-memory for consistency with future Firebase adapter.
 */
export interface LeaderboardSyncAdapter {
  /**
   * Initializes the adapter, setting up cache, Firebase connection, etc.
   * Optional but recommended to call before using other methods.
   *
   * @returns Promise that resolves when initialization is complete
   * @throws LeaderboardSyncError if initialization fails
   */
  initialize?(): Promise<void>;

  /**
   * Records a game result and queues it for synchronization with the backend.
   * Updates local player profile stats immediately.
   *
   * @param userId - The user ID
   * @param result - The game result to record
   * @returns Promise that resolves when the result is queued
   * @throws LeaderboardSyncError with SYNC_ERROR if queuing fails
   */
  recordGameResult(userId: string, result: GameResult): Promise<void>;

  /**
   * Subscribes to real-time leaderboard updates for a specific mode and period.
   * Listener is immediately called with current leaderboard snapshot (if available).
   * On each leaderboard update, listener is called with a fresh copy of the leaderboard.
   *
   * @param mode - The game mode (blitz, classic, timeAttack)
   * @param period - The leaderboard period (allTime, weekly, monthly)
   * @param listener - Function called with updated leaderboard
   * @returns Unsubscribe function to stop listening
   * @throws LeaderboardSyncError if subscription fails
   */
  subscribeToLeaderboard(
    mode: GameMode,
    period: LeaderboardPeriod,
    listener: LeaderboardListener
  ): () => void;

  /**
   * Loads or fetches a player profile by user ID.
   * Attempts to load from cache first, then from Firestore if not cached.
   *
   * @param userId - The user ID
   * @returns Promise resolving to the player profile
   * @throws LeaderboardSyncError with PROFILE_NOT_FOUND if profile does not exist
   * @throws LeaderboardSyncError with FIRESTORE_ERROR if fetch fails
   */
  getPlayerProfile(userId: string): Promise<PlayerProfile>;

  /**
   * Checks for newly-unlocked achievements and grants them to the player.
   * Evaluates all achievement criteria against the player's current stats.
   *
   * @param userId - The user ID
   * @returns Promise resolving to array of newly-granted achievement IDs
   * @throws LeaderboardSyncError with ACHIEVEMENT_CHECK_ERROR if check fails
   */
  checkAndGrantAchievements(userId: string): Promise<string[]>;

  /**
   * Retrieves all available achievement configurations.
   * Used by UI to display achievement information and track progress.
   *
   * @returns Promise resolving to array of achievement configurations
   * @throws LeaderboardSyncError with FIRESTORE_ERROR if fetch fails
   */
  getAchievements(): Promise<AchievementConfig[]>;

  /**
   * Synchronizes queued local game results to the backend.
   * Uploads pending results and updates remote player profile and leaderboards.
   *
   * @param userId - The user ID
   * @returns Promise that resolves when sync is complete
   * @throws LeaderboardSyncError with NETWORK_ERROR if sync fails
   * @throws LeaderboardSyncError with SYNC_ERROR if there are local errors
   */
  syncLocalResults(userId: string): Promise<void>;
}
