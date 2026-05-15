// src/lib/leaderboard/cache/LeaderboardCache.ts

import type { PlayerProfile, GameResult, LeaderboardDoc } from '../types';

const DB_NAME = 'wordladder-leaderboard';
const DB_VERSION = 1;
const PROFILES_STORE = 'profiles';
const LEADERBOARDS_STORE = 'leaderboards';
const GAME_RESULTS_STORE = 'game_results';

// Cache size limits to prevent IndexedDB quota exhaustion
const CACHE_LIMITS = {
  GAME_RESULTS_PER_USER: 100,  // Keep last 100 game results per user
  MAX_PROFILES: 30,             // Keep last 30 cached profiles
  MAX_LEADERBOARDS: 50,         // Keep last 50 cached leaderboards
} as const;

/**
 * Wrapper object structure for cached player profiles.
 * Contains the profile data along with cache metadata.
 */
interface CachedProfile {
  userId: string;
  profile: PlayerProfile;
  cachedAt: number;
}

/**
 * Wrapper object structure for cached leaderboards.
 * Contains the leaderboard data along with cache metadata.
 */
interface CachedLeaderboard {
  id: string;
  leaderboard: LeaderboardDoc;
  cachedAt: number;
}

/**
 * Wrapper object structure for queued game results.
 * Stores game results pending sync with synced status flag.
 */
interface QueuedGameResult {
  userId: string;
  result: GameResult;
  queuedAt: number;
  synced: boolean;
}

export class LeaderboardCache {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(PROFILES_STORE)) {
          const profileStore = db.createObjectStore(PROFILES_STORE, { keyPath: 'userId' });
          // Index for efficient queries by userId (improves cache lookup performance)
          profileStore.createIndex('userIdIndex', 'userId', { unique: true });
          // Index for cache eviction based on access time
          profileStore.createIndex('cachedAtIndex', 'cachedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(LEADERBOARDS_STORE)) {
          const leaderboardStore = db.createObjectStore(LEADERBOARDS_STORE, { keyPath: 'id' });
          // Index for querying by mode for fast leaderboard lookups
          leaderboardStore.createIndex('modeIndex', 'leaderboard.mode', { unique: false });
          // Index for cache eviction based on access time
          leaderboardStore.createIndex('cachedAtIndex', 'cachedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(GAME_RESULTS_STORE)) {
          const gameStore = db.createObjectStore(GAME_RESULTS_STORE, { keyPath: 'id', autoIncrement: true });
          // Index for efficient filtering of results by userId (required for offline queueing)
          gameStore.createIndex('userId', 'userId', { unique: false });
          // Index for cache eviction based on queueing time
          gameStore.createIndex('queuedAtIndex', 'queuedAt', { unique: false });
        }
      };
    });
  }

  async cacheProfile(userId: string, profile: PlayerProfile): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    const cached: CachedProfile = {
      userId,
      profile,
      cachedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([PROFILES_STORE], 'readwrite');
      const store = tx.objectStore(PROFILES_STORE);
      const request = store.put(cached);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Enforce cache size limit after successful insert
        this.enforceProfilesCacheLimit(tx, store).catch((error) => {
          console.error('Error enforcing profiles cache limit:', error);
        });
        resolve();
      };
    });
  }

  /**
   * Enforces the maximum number of cached profiles by removing oldest entries.
   * Keeps only the CACHE_LIMITS.MAX_PROFILES most recently accessed profiles.
   */
  private async enforceProfilesCacheLimit(
    tx: IDBTransaction,
    store: IDBObjectStore
  ): Promise<void> {
    return new Promise((resolve) => {
      const index = store.index('cachedAtIndex');
      const getAllRequest = index.getAll();

      getAllRequest.onsuccess = () => {
        const profiles = getAllRequest.result as CachedProfile[];
        if (profiles.length > CACHE_LIMITS.MAX_PROFILES) {
          // Remove oldest profiles to maintain size limit
          const toDelete = profiles
            .sort((a, b) => a.cachedAt - b.cachedAt)
            .slice(0, profiles.length - CACHE_LIMITS.MAX_PROFILES);

          toDelete.forEach((profile) => {
            store.delete(profile.userId);
          });
        }
        resolve();
      };

      getAllRequest.onerror = () => resolve();
    });
  }

  async getProfileFromCache(userId: string): Promise<PlayerProfile | null> {
    if (!this.db) throw new Error('Cache not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([PROFILES_STORE], 'readonly');
      const store = tx.objectStore(PROFILES_STORE);
      const request = store.get(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cached = request.result as CachedProfile | undefined;
        resolve(cached ? cached.profile : null);
      };
    });
  }

  async cacheLeaderboard(mode: string, period: string, leaderboard: LeaderboardDoc): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    const id = `${mode}-${period}`;
    const cached: CachedLeaderboard = {
      id,
      leaderboard,
      cachedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([LEADERBOARDS_STORE], 'readwrite');
      const store = tx.objectStore(LEADERBOARDS_STORE);
      const request = store.put(cached);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Enforce cache size limit after successful insert
        this.enforceLeaderboardsCacheLimit(tx, store).catch((error) => {
          console.error('Error enforcing leaderboards cache limit:', error);
        });
        resolve();
      };
    });
  }

  /**
   * Enforces the maximum number of cached leaderboards by removing oldest entries.
   * Keeps only the CACHE_LIMITS.MAX_LEADERBOARDS most recently accessed leaderboards.
   */
  private async enforceLeaderboardsCacheLimit(
    tx: IDBTransaction,
    store: IDBObjectStore
  ): Promise<void> {
    return new Promise((resolve) => {
      const index = store.index('cachedAtIndex');
      const getAllRequest = index.getAll();

      getAllRequest.onsuccess = () => {
        const leaderboards = getAllRequest.result as CachedLeaderboard[];
        if (leaderboards.length > CACHE_LIMITS.MAX_LEADERBOARDS) {
          // Remove oldest leaderboards to maintain size limit
          const toDelete = leaderboards
            .sort((a, b) => a.cachedAt - b.cachedAt)
            .slice(0, leaderboards.length - CACHE_LIMITS.MAX_LEADERBOARDS);

          toDelete.forEach((leaderboard) => {
            store.delete(leaderboard.id);
          });
        }
        resolve();
      };

      getAllRequest.onerror = () => resolve();
    });
  }

  async getLeaderboardFromCache(mode: string, period: string): Promise<LeaderboardDoc | null> {
    if (!this.db) throw new Error('Cache not initialized');

    const id = `${mode}-${period}`;
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([LEADERBOARDS_STORE], 'readonly');
      const store = tx.objectStore(LEADERBOARDS_STORE);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cached = request.result as CachedLeaderboard | undefined;
        resolve(cached ? cached.leaderboard : null);
      };
    });
  }

  /**
   * Queue a game result for syncing to the backend.
   * Stores a wrapper object: { userId, result, queuedAt, synced: false }
   * Results are fetched by userId and filtered by synced status.
   */
  async queueGameResult(userId: string, result: GameResult): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    const queuedResult: QueuedGameResult = {
      userId,
      result,
      queuedAt: Date.now(),
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([GAME_RESULTS_STORE], 'readwrite');
      const store = tx.objectStore(GAME_RESULTS_STORE);
      const request = store.add(queuedResult);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getPendingGameResults(userId: string): Promise<GameResult[]> {
    if (!this.db) throw new Error('Cache not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([GAME_RESULTS_STORE], 'readonly');
      const store = tx.objectStore(GAME_RESULTS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const queued = (request.result as QueuedGameResult[])
          .filter((item) => item.userId === userId && !item.synced)
          .map((item) => item.result);
        resolve(queued);
      };
    });
  }

  async markGameResultSynced(userId: string): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([GAME_RESULTS_STORE], 'readwrite');
      const store = tx.objectStore(GAME_RESULTS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const items = (request.result as QueuedGameResult[])
          .filter((item) => item.userId === userId && !item.synced);
        items.forEach((item) => {
          item.synced = true;
          store.put(item);  // Queue the put
        });
      };

      // Wait for transaction to complete before resolving
      tx.oncomplete = () => {
        // Enforce cache size limit after marking results as synced
        this.enforceGameResultsCacheLimit(userId).catch((error) => {
          console.error('Error enforcing game results cache limit:', error);
        });
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Enforces the maximum number of cached game results per user.
   * Keeps only the CACHE_LIMITS.GAME_RESULTS_PER_USER most recent results per user,
   * removing oldest synced results first, then oldest unsynced results.
   */
  private async enforceGameResultsCacheLimit(userId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const tx = this.db!.transaction([GAME_RESULTS_STORE], 'readwrite');
      const store = tx.objectStore(GAME_RESULTS_STORE);
      const index = store.index('userId');
      const userResultsRequest = index.getAll(userId);

      userResultsRequest.onsuccess = () => {
        const userResults = userResultsRequest.result as QueuedGameResult[];

        if (userResults.length > CACHE_LIMITS.GAME_RESULTS_PER_USER) {
          // Sort by synced status (synced first) then by queue time (oldest first)
          const toDelete = userResults
            .sort((a, b) => {
              // Remove synced results first, then oldest results
              if (a.synced === b.synced) {
                return a.queuedAt - b.queuedAt;
              }
              return a.synced ? -1 : 1;
            })
            .slice(0, userResults.length - CACHE_LIMITS.GAME_RESULTS_PER_USER);

          toDelete.forEach((result) => {
            // Find the id from the original request to delete by key
            const idToDelete = userResults.find(
              (r) => r.userId === result.userId && r.queuedAt === result.queuedAt && r.synced === result.synced
            );
            if (idToDelete) {
              store.delete((idToDelete as any).id);
            }
          });
        }
        resolve();
      };

      userResultsRequest.onerror = () => resolve();
    });
  }

  async clearCache(): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([PROFILES_STORE, LEADERBOARDS_STORE, GAME_RESULTS_STORE], 'readwrite');

      tx.objectStore(PROFILES_STORE).clear();
      tx.objectStore(LEADERBOARDS_STORE).clear();
      tx.objectStore(GAME_RESULTS_STORE).clear();

      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();
    });
  }
}
