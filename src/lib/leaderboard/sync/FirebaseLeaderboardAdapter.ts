/**
 * Firebase Leaderboard Adapter
 *
 * Implements LeaderboardSyncAdapter using Firestore for real-time leaderboards,
 * player profiles, game results, and achievement tracking.
 * Includes offline queueing and cache-first strategy for offline performance.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '../../firebase';
import type {
  LeaderboardSyncAdapter,
  LeaderboardListener,
} from './LeaderboardSyncAdapter';
import {
  LeaderboardSyncError,
  LeaderboardSyncErrorCode,
} from './LeaderboardSyncAdapter';
import type {
  GameResult,
  PlayerProfile,
  LeaderboardDoc,
  AchievementConfig,
  GameMode,
  LeaderboardPeriod,
  ModeStats,
  BlitzStats,
  TimeAttackStats,
} from '../types';
import { LeaderboardCache } from '../cache/LeaderboardCache';
import { AchievementEvaluator } from '../achievements/AchievementEvaluator';
import { getAllAchievements } from '../achievements/achievements';

export class FirebaseLeaderboardAdapter implements LeaderboardSyncAdapter {
  private cache: LeaderboardCache;
  private evaluator: AchievementEvaluator;
  private unsubscribers: Map<string, () => void> = new Map();
  private connectivityListener: (() => void) | null = null;
  private currentUserId: string | null = null;

  constructor() {
    this.cache = new LeaderboardCache();
    this.evaluator = new AchievementEvaluator();
  }

  /**
   * Initialize the adapter by setting up the local cache and connectivity detection.
   * Should be called before using other methods.
   */
  async initialize(): Promise<void> {
    try {
      await this.cache.initialize();
      this.setupConnectivityDetection();
    } catch (error) {
      throw new LeaderboardSyncError(
        LeaderboardSyncErrorCode.FIRESTORE_ERROR,
        `Failed to initialize adapter: ${error}`
      );
    }
  }

  /**
   * Set up listeners for connectivity changes.
   * When the app goes from offline to online, automatically sync queued results.
   */
  private setupConnectivityDetection(): void {
    // Remove existing listener if present
    if (this.connectivityListener) {
      window.removeEventListener('online', this.connectivityListener);
    }

    // Create a handler that will be called when connectivity is restored
    this.connectivityListener = () => {
      console.log('Connectivity restored, syncing queued results...');
      if (this.currentUserId) {
        this.syncLocalResults(this.currentUserId).catch((error) => {
          console.error('Error syncing results after going online:', error);
        });
      }
    };

    // Listen for the 'online' event
    window.addEventListener('online', this.connectivityListener);
  }

  /**
   * Record a game result and queue it for synchronization.
   * Results are queued locally first, then synced if online.
   * If offline, results are queued and will sync automatically when connectivity is restored.
   */
  async recordGameResult(userId: string, result: GameResult): Promise<void> {
    try {
      // Store the current user ID for connectivity detection
      this.currentUserId = userId;

      // Queue locally first
      await this.cache.queueGameResult(userId, result);

      // Try to sync immediately if online
      if (navigator.onLine) {
        console.log('Online - syncing game result immediately');
        await this.syncLocalResults(userId);
      } else {
        console.log('Offline - game result queued for sync when online');
      }
    } catch (error) {
      throw new LeaderboardSyncError(
        LeaderboardSyncErrorCode.SYNC_ERROR,
        `Failed to record game result: ${error}`
      );
    }
  }

  /**
   * Subscribe to real-time leaderboard updates for a specific game mode and period.
   * Listener is immediately called with cached data if available, then with live updates.
   */
  subscribeToLeaderboard(
    mode: GameMode,
    period: LeaderboardPeriod,
    listener: LeaderboardListener
  ): () => void {
    const docId = `${mode}-${period}`;

    // Call listener with cached data immediately
    this.cache
      .getLeaderboardFromCache(mode, period)
      .then((cached) => {
        if (cached) {
          listener(cached);
        }
      })
      .catch((error) => {
        console.error('Error retrieving cached leaderboard:', error);
      });

    try {
      // Subscribe to real-time updates from Firestore
      const leaderboardRef = doc(firestore, 'leaderboards', docId);

      const unsubscribe = onSnapshot(leaderboardRef, (snapshot) => {
        if (snapshot.exists()) {
          const leaderboardData = snapshot.data() as LeaderboardDoc;
          // Update cache with fresh data
          this.cache
            .cacheLeaderboard(mode, period, leaderboardData)
            .catch((error) => {
              console.error('Error caching leaderboard:', error);
            });
          // Call listener with updated data
          listener(leaderboardData);
        }
      });

      this.unsubscribers.set(docId, unsubscribe);
      return unsubscribe;
    } catch (error) {
      throw new LeaderboardSyncError(
        LeaderboardSyncErrorCode.FIRESTORE_ERROR,
        `Failed to subscribe to leaderboard: ${error}`
      );
    }
  }

  /**
   * Get a player's profile by user ID.
   * Attempts to load from cache first, then from Firestore if not cached.
   */
  async getPlayerProfile(userId: string): Promise<PlayerProfile> {
    try {
      // Try cache first
      const cached = await this.cache.getProfileFromCache(userId);
      if (cached) {
        return cached;
      }

      // Fetch from Firestore
      const profileRef = doc(firestore, 'players', userId);
      const snapshot = await getDoc(profileRef);

      if (!snapshot.exists()) {
        throw new LeaderboardSyncError(
          LeaderboardSyncErrorCode.PROFILE_NOT_FOUND,
          `Profile not found for user ${userId}`
        );
      }

      const profile = snapshot.data() as PlayerProfile;
      await this.cache.cacheProfile(userId, profile);
      return profile;
    } catch (error) {
      if (error instanceof LeaderboardSyncError) throw error;
      throw new LeaderboardSyncError(
        LeaderboardSyncErrorCode.FIRESTORE_ERROR,
        `Failed to get player profile: ${error}`
      );
    }
  }

  /**
   * Check for newly-unlocked achievements and grant them to the player.
   * Evaluates all achievement criteria against the player's current stats.
   * Note: Coin rewards from achievements should be awarded separately via the economy system.
   */
  async checkAndGrantAchievements(userId: string, existingProfile?: PlayerProfile): Promise<string[]> {
    try {
      const profile = existingProfile || await this.getPlayerProfile(userId);
      const newlyUnlocked = this.evaluator.evaluateAchievements(profile);

      if (newlyUnlocked.length > 0) {
        const updatedAchievements = [
          ...profile.achievements,
          ...newlyUnlocked,
        ];
        const profileRef = doc(firestore, 'players', userId);
        await updateDoc(profileRef, { achievements: updatedAchievements });

        // Update cache
        profile.achievements = updatedAchievements;
        await this.cache.cacheProfile(userId, profile);
      }

      return newlyUnlocked;
    } catch (error) {
      if (error instanceof LeaderboardSyncError) throw error;
      throw new LeaderboardSyncError(
        LeaderboardSyncErrorCode.FIRESTORE_ERROR,
        `Failed to check achievements: ${error}`
      );
    }
  }

  /**
   * Get all available achievement configurations.
   */
  async getAchievements(): Promise<AchievementConfig[]> {
    return getAllAchievements();
  }

  /**
   * Synchronize queued local game results to Firestore.
   * Uploads pending results, updates player profile stats, and checks for achievements.
   */
  async syncLocalResults(userId: string): Promise<void> {
    try {
      const pendingResults = await this.cache.getPendingGameResults(userId);

      if (pendingResults.length === 0) {
        console.log(`No pending results to sync for user ${userId}`);
        return;
      }

      console.log(`Syncing ${pendingResults.length} pending result(s) for user ${userId}...`);

      // Get the current player profile
      const profile = await this.getPlayerProfile(userId);

      // Process each pending game result
      for (const result of pendingResults) {
        // Create a new game result document in Firestore
        const resultRef = doc(collection(firestore, 'gameResults'));
        await setDoc(resultRef, {
          ...result,
          timestamp: serverTimestamp(),
        });

        // Update player profile stats with the new game result
        this.updateProfileStats(profile, result);
      }

      // Update the player profile in Firestore with accumulated stats
      const profileRef = doc(firestore, 'players', userId);
      await updateDoc(profileRef, {
        totalGames: profile.totalGames,
        totalScore: profile.totalScore,
        stats: profile.stats,
        lastGameAt: Timestamp.now(),
      });

      // Update cache with modified profile
      await this.cache.cacheProfile(userId, profile);

      // Check achievements after sync
      await this.checkAndGrantAchievements(userId, profile);

      // Mark all results as synced
      await this.cache.markGameResultSynced(userId);

      console.log(`Successfully synced ${pendingResults.length} result(s) for user ${userId}`);
    } catch (error) {
      if (error instanceof LeaderboardSyncError) throw error;
      throw new LeaderboardSyncError(
        LeaderboardSyncErrorCode.NETWORK_ERROR,
        `Failed to sync local results: ${error}`
      );
    }
  }

  /**
   * Update player profile statistics with a new game result.
   * Increments totals, updates mode-specific stats, and calculates averages.
   */
  private updateProfileStats(
    profile: PlayerProfile,
    result: GameResult
  ): void {
    // Update overall stats
    profile.totalGames += 1;
    profile.totalScore += result.score;
    profile.lastGameAt = Timestamp.now();

    // Update mode-specific stats
    const modeStats = profile.stats[result.mode as keyof typeof profile.stats] as ModeStats | BlitzStats | TimeAttackStats;
    if (modeStats) {
      modeStats.gamesPlayed += 1;
      modeStats.totalScore += result.score;
      modeStats.averageScore =
        modeStats.totalScore / modeStats.gamesPlayed;

      // Increment wins if the puzzle was solved
      if (result.solved) {
        modeStats.wins += 1;
      }

      // Update best score if this game beat the previous best
      if (result.score > modeStats.bestScore) {
        modeStats.bestScore = result.score;
      }

      // Update mode-specific fields if applicable
      if (result.mode === 'blitz' && result.duration !== undefined) {
        (modeStats as BlitzStats).totalTime += result.duration;
      } else if (
        result.mode === 'timeAttack' &&
        result.duration !== undefined
      ) {
        const timeAttackStats = modeStats as TimeAttackStats;
        if (
          result.duration < timeAttackStats.bestTime ||
          timeAttackStats.bestTime === 0
        ) {
          timeAttackStats.bestTime = result.duration;
        }
        if (result.solved) {
          timeAttackStats.completedPuzzles += 1;
        }
      }
    }
  }

  /**
   * Unsubscribe from all real-time leaderboard listeners and connectivity detection.
   * Should be called on component unmount or when cleaning up.
   */
  unsubscribeAll(): void {
    this.unsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from leaderboard:', error);
      }
    });
    this.unsubscribers.clear();

    // Clean up connectivity listener
    if (this.connectivityListener) {
      window.removeEventListener('online', this.connectivityListener);
      this.connectivityListener = null;
    }
  }
}
