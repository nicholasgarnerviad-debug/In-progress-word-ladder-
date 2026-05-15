import type { LeaderboardSyncAdapter, LeaderboardListener } from './LeaderboardSyncAdapter';
import { LeaderboardSyncError, LeaderboardSyncErrorCode } from './LeaderboardSyncAdapter';
import type {
  GameResult,
  PlayerProfile,
  LeaderboardDoc,
  AchievementConfig,
  GameMode,
  LeaderboardPeriod,
  BlitzStats,
  TimeAttackStats,
} from '../types';
import { AchievementEvaluator } from '../achievements/AchievementEvaluator';
import { getAllAchievements } from '../achievements/achievements';
import { Timestamp } from 'firebase/firestore';

/**
 * LocalLeaderboardAdapter: In-memory implementation for testing and offline mode.
 * Stores all data in memory with no persistence to Firestore.
 * Perfect for unit tests and local development.
 */
export class LocalLeaderboardAdapter implements LeaderboardSyncAdapter {
  private profiles = new Map<string, PlayerProfile>();
  private leaderboards = new Map<string, LeaderboardDoc>();
  private evaluator = new AchievementEvaluator();
  private listeners: Map<string, Set<LeaderboardListener>> = new Map();

  /**
   * Clear all profiles, leaderboards, and listeners.
   * Useful for test isolation.
   */
  reset(): void {
    this.profiles.clear();
    this.leaderboards.clear();
    this.listeners.clear();
  }

  /**
   * Records a game result and updates player profile stats.
   * Notifies all subscribed listeners for the affected game mode.
   */
  async recordGameResult(userId: string, result: GameResult): Promise<void> {
    let profile = this.profiles.get(userId);
    if (!profile) {
      this.throwProfileNotFound(userId);
    }

    // Update mode-specific stats
    const modeStats = profile.stats[result.mode as keyof typeof profile.stats];
    if (modeStats) {
      const stats = modeStats as any;  // Single cast at source
      stats.gamesPlayed += 1;
      stats.totalScore += result.score;
      stats.averageScore = stats.totalScore / stats.gamesPlayed;
      if (result.score > stats.bestScore) {
        stats.bestScore = result.score;
      }

      // Update mode-specific extra fields
      // This local adapter supports all modes without extra logic
      if (result.mode === 'blitz') {
        (stats as BlitzStats).totalTime += result.duration;
      } else if (result.mode === 'timeAttack') {
        const taStats = stats as TimeAttackStats;
        if (result.solved) {
          taStats.completedPuzzles += 1;
          if (result.duration < taStats.bestTime || taStats.bestTime === 0) {
            taStats.bestTime = result.duration;
          }
        }
      }
    }

    // Update overall profile stats
    profile.totalGames += 1;
    profile.totalScore += result.score;
    profile.lastGameAt = Timestamp.now();

    // Notify listeners
    this.notifyListeners(result.mode, 'allTime');
  }

  /**
   * Subscribes to real-time leaderboard updates.
   * Immediately calls listener with current leaderboard if available.
   * Returns unsubscribe function.
   */
  subscribeToLeaderboard(
    mode: GameMode,
    period: LeaderboardPeriod,
    listener: LeaderboardListener
  ): () => void {
    const key = `${mode}-${period}`;

    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(listener);

    // Immediately call listener with current leaderboard if available
    const leaderboard = this.leaderboards.get(key);
    if (leaderboard) {
      listener(leaderboard);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  /**
   * Gets a player profile by user ID.
   * Throws if profile does not exist.
   */
  async getPlayerProfile(userId: string): Promise<PlayerProfile> {
    const profile = this.profiles.get(userId);
    if (!profile) {
      this.throwProfileNotFound(userId);
    }
    return profile;
  }

  /**
   * Checks for newly-unlocked achievements and grants them.
   * Updates player profile with newly unlocked achievement IDs.
   */
  async checkAndGrantAchievements(
    userId: string,
    existingProfile?: PlayerProfile
  ): Promise<string[]> {
    const profile = existingProfile || this.profiles.get(userId);
    if (!profile) {
      return [];
    }

    const newlyUnlocked = this.evaluator.evaluateAchievements(profile);
    profile.achievements.push(...newlyUnlocked);
    return newlyUnlocked;
  }

  /**
   * Gets all available achievement configurations.
   */
  async getAchievements(): Promise<AchievementConfig[]> {
    return getAllAchievements();
  }

  /**
   * Syncs local results to backend.
   * For LocalLeaderboardAdapter, this is a no-op since there's no backend.
   */
  async syncLocalResults(userId: string): Promise<void> {
    // No-op for local adapter - no backend to sync to
  }

  /**
   * Test helper: Creates a new player profile with initialized stats.
   * Useful for setting up test data.
   */
  createProfile(userId: string, name: string): PlayerProfile {
    const profile: PlayerProfile = {
      userId,
      name,
      joinedAt: Timestamp.now(),
      totalGames: 0,
      totalScore: 0,
      stats: {
        blitz: {
          gamesPlayed: 0,
          wins: 0,
          bestScore: 0,
          totalScore: 0,
          averageScore: 0,
          totalTime: 0,
        },
        classic: {
          gamesPlayed: 0,
          wins: 0,
          bestScore: 0,
          totalScore: 0,
          averageScore: 0,
        },
        timeAttack: {
          gamesPlayed: 0,
          wins: 0,
          bestScore: 0,
          totalScore: 0,
          averageScore: 0,
          bestTime: 0,
          completedPuzzles: 0,
        },
      },
      achievements: [],
      badges: [],
      lastGameAt: Timestamp.now(),
    };
    this.profiles.set(userId, profile);
    return profile;
  }

  /**
   * Test helper: Gets the current in-memory profiles.
   * Useful for assertions in tests.
   */
  getProfiles(): Map<string, PlayerProfile> {
    return this.profiles;
  }

  /**
   * Test helper: Gets the current in-memory leaderboards.
   * Useful for assertions in tests.
   */
  getLeaderboards(): Map<string, LeaderboardDoc> {
    return this.leaderboards;
  }

  /**
   * Notifies all listeners for a mode/period combination of leaderboard updates.
   * Recomputes the leaderboard and calls each listener.
   */
  private notifyListeners(mode: GameMode, period: LeaderboardPeriod): void {
    const key = `${mode}-${period}`;
    const listeners = this.listeners.get(key);
    if (!listeners || listeners.size === 0) {
      return;
    }

    // Recompute leaderboard from current profiles
    const leaderboard = this.computeLeaderboard(mode, period);
    this.leaderboards.set(key, leaderboard);

    // Call each listener with the updated leaderboard
    listeners.forEach((listener) => listener(leaderboard));
  }

  /**
   * Computes a leaderboard from current player profiles.
   * Rankings are sorted by score (highest first) with placement numbers.
   */
  private computeLeaderboard(mode: GameMode, period: LeaderboardPeriod): LeaderboardDoc {
    const rankings = Array.from(this.profiles.values())
      .map((profile) => {
        const modeStats = profile.stats[mode as keyof typeof profile.stats];
        return {
          userId: profile.userId,
          name: profile.name,
          score: modeStats?.totalScore || 0,
          placement: 0, // Placeholder, will be set below
          gamesPlayed: modeStats?.gamesPlayed || 0,
          lastGameAt: profile.lastGameAt,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, placement: index + 1 }));

    return {
      mode,
      period,
      rankings,
      lastUpdated: Timestamp.now(),
      updatedCount: 0,
    };
  }

  /**
   * Throws a standardized profile-not-found error.
   * Extracted to reduce duplication.
   */
  private throwProfileNotFound(userId: string): never {
    throw new LeaderboardSyncError(
      LeaderboardSyncErrorCode.PROFILE_NOT_FOUND,
      `Profile not found: ${userId}`
    );
  }
}
