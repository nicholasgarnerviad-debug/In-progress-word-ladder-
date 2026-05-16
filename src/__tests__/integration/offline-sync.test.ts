/**
 * Offline Sync Integration Tests
 * Verifies complete workflow: offline play -> online sync -> leaderboard & profile updates
 */

import { LocalLeaderboardAdapter } from '../../lib/leaderboard/sync/LocalLeaderboardAdapter';
import { LeaderboardCache } from '../../lib/leaderboard/cache/LeaderboardCache';
import type { PlayerProfile, GameResult } from '../../lib/leaderboard/types';
import { Timestamp } from 'firebase/firestore';

/**
 * Mock IndexedDB implementation for testing
 * Provides in-memory storage that mimics IndexedDB behavior
 */
class MockIndexedDB {
  private databases = new Map<string, MockDatabase>();

  open(name: string, version: number): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      if (!this.databases.has(name)) {
        const db = new MockDatabase(name);
        this.databases.set(name, db);
        request.result = db;
        if (request.onupgradeneeded) {
          request.onupgradeneeded({ target: request } as any);
        }
      } else {
        request.result = this.databases.get(name)!;
      }
      if (request.onsuccess) {
        request.onsuccess({ target: request } as any);
      }
    }, 0);
    return request;
  }
}

class MockIDBRequest {
  result: any;
  error: any;
  onsuccess: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onupgradeneeded: ((event: any) => void) | null = null;
}

class MockObjectStore {
  private data = new Map<any, any>();
  private indices = new Map<string, Map<any, any>>();

  constructor(private keyPath: string) {}

  put(value: any): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      const key = (value as any)[this.keyPath];
      this.data.set(key, value);
      request.result = key;
      if (request.onsuccess) {
        request.onsuccess({ target: request } as any);
      }
    }, 0);
    return request;
  }

  add(value: any): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      const key = this.data.size + 1;
      (value as any).id = key;
      this.data.set(key, value);
      request.result = key;
      if (request.onsuccess) {
        request.onsuccess({ target: request } as any);
      }
    }, 0);
    return request;
  }

  get(key: any): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request.result = this.data.get(key) || undefined;
      if (request.onsuccess) {
        request.onsuccess({ target: request } as any);
      }
    }, 0);
    return request;
  }

  getAll(): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request.result = Array.from(this.data.values());
      if (request.onsuccess) {
        request.onsuccess({ target: request } as any);
      }
    }, 0);
    return request;
  }

  delete(key: any): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      this.data.delete(key);
      if (request.onsuccess) {
        request.onsuccess({ target: request } as any);
      }
    }, 0);
    return request;
  }

  clear(): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      this.data.clear();
      if (request.onsuccess) {
        request.onsuccess({ target: request } as any);
      }
    }, 0);
    return request;
  }

  createIndex(name: string, keyPath: string, options?: any): any {
    this.indices.set(name, new Map());
    return {
      name,
      keyPath,
      getAll: () => {
        const request = new MockIDBRequest();
        setTimeout(() => {
          request.result = Array.from(this.data.values());
          if (request.onsuccess) {
            request.onsuccess({ target: request } as any);
          }
        }, 0);
        return request;
      },
    };
  }

  index(name: string): any {
    return {
      name,
      getAll: (value?: any) => {
        const request = new MockIDBRequest();
        setTimeout(() => {
          const results = Array.from(this.data.values()).filter((item) => {
            if (value === undefined) return true;
            return (item as any).userId === value;
          });
          request.result = results;
          if (request.onsuccess) {
            request.onsuccess({ target: request } as any);
          }
        }, 0);
        return request;
      },
    };
  }
}

class MockTransaction {
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(private stores: Map<string, MockObjectStore>) {}

  objectStore(name: string): MockObjectStore {
    if (!this.stores.has(name)) {
      this.stores.set(name, new MockObjectStore(name));
    }
    return this.stores.get(name)!;
  }

  complete() {
    if (this.oncomplete) {
      this.oncomplete();
    }
  }
}

class MockDOMStringList {
  private items: string[] = [];

  add(name: string) {
    if (!this.items.includes(name)) {
      this.items.push(name);
    }
  }

  contains(name: string): boolean {
    return this.items.includes(name);
  }

  item(index: number): string | null {
    return this.items[index] || null;
  }

  get length(): number {
    return this.items.length;
  }
}

class MockDatabase {
  objectStoreNames = new MockDOMStringList();
  private stores = new Map<string, MockObjectStore>();

  constructor(public name: string) {}

  createObjectStore(name: string, options?: any): MockObjectStore {
    const keyPath = options?.keyPath || 'id';
    const store = new MockObjectStore(keyPath);
    this.stores.set(name, store);
    this.objectStoreNames.add(name);
    return store;
  }

  transaction(storeNames: string[], mode: string): MockTransaction {
    const stores = new Map<string, MockObjectStore>();
    for (const name of storeNames) {
      if (this.stores.has(name)) {
        stores.set(name, this.stores.get(name)!);
      }
    }
    const tx = new MockTransaction(stores);
    Promise.resolve().then(() => tx.complete());
    return tx as any;
  }
}

let mockIndexedDB = new MockIndexedDB();
(global as any).indexedDB = mockIndexedDB;

describe('Offline Sync Integration', () => {
  let adapter: LocalLeaderboardAdapter;
  let cache: LeaderboardCache;

  beforeEach(async () => {
    mockIndexedDB = new MockIndexedDB();
    (global as any).indexedDB = mockIndexedDB;

    adapter = new LocalLeaderboardAdapter();
    cache = new LeaderboardCache();
    await cache.initialize();
  });

  afterEach(() => {
    adapter.reset();
  });

  describe('Offline Play to Online Sync', () => {
    test('queues and syncs single game result when coming online', async () => {
      const userId = 'user1';

      // Step 1: Setup user profile
      adapter.createProfile(userId, 'Test Player');

      // Step 2: Play game offline - store result in cache
      const result: GameResult = {
        userId,
        mode: 'classic',
        score: 250,
        solved: true,
        wrong: 1,
        duration: 120000,
        timestamp: Timestamp.now(),
      };
      await cache.queueGameResult(userId, result);

      // Step 3: Verify result queued
      let pending = await cache.getPendingGameResults(userId);
      expect(pending).toHaveLength(1);
      expect(pending[0].score).toBe(250);
      expect(pending[0].mode).toBe('classic');

      // Step 4: Simulate coming online - sync results to adapter
      await adapter.recordGameResult(userId, result);

      // Step 5: Mark as synced in cache
      await cache.markGameResultSynced(userId);

      // Step 6: Verify queue cleared
      pending = await cache.getPendingGameResults(userId);
      expect(pending).toHaveLength(0);

      // Step 7: Verify profile updated on adapter
      const profile = await adapter.getPlayerProfile(userId);
      expect(profile.stats.classic.gamesPlayed).toBe(1);
      expect(profile.stats.classic.totalScore).toBe(250);
      expect(profile.stats.classic.bestScore).toBe(250);
    });

    test('syncs multiple game results in sequence', async () => {
      const userId = 'user1';

      // Setup
      adapter.createProfile(userId, 'Multi-Game Player');

      // Queue multiple results offline
      const result1: GameResult = {
        userId,
        mode: 'blitz',
        score: 200,
        solved: true,
        wrong: 2,
        duration: 60000,
        timestamp: Timestamp.now(),
      };

      const result2: GameResult = {
        userId,
        mode: 'blitz',
        score: 300,
        solved: true,
        wrong: 1,
        duration: 65000,
        timestamp: Timestamp.now(),
      };

      const result3: GameResult = {
        userId,
        mode: 'classic',
        score: 180,
        solved: false,
        wrong: 5,
        duration: 180000,
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult(userId, result1);
      await cache.queueGameResult(userId, result2);
      await cache.queueGameResult(userId, result3);

      // Verify all queued
      let pending = await cache.getPendingGameResults(userId);
      expect(pending).toHaveLength(3);

      // Sync all results
      await adapter.recordGameResult(userId, result1);
      await adapter.recordGameResult(userId, result2);
      await adapter.recordGameResult(userId, result3);

      // Mark all as synced
      await cache.markGameResultSynced(userId);

      // Verify queue cleared
      pending = await cache.getPendingGameResults(userId);
      expect(pending).toHaveLength(0);

      // Verify stats updated correctly
      const profile = await adapter.getPlayerProfile(userId);
      expect(profile.stats.blitz.gamesPlayed).toBe(2);
      expect(profile.stats.blitz.totalScore).toBe(500);
      expect(profile.stats.blitz.bestScore).toBe(300);
      expect(profile.stats.classic.gamesPlayed).toBe(1);
      expect(profile.stats.classic.totalScore).toBe(180);
    });
  });

  describe('Profile Stats Updates After Sync', () => {
    test('updates profile stats after syncing game results', async () => {
      const userId = 'user1';
      const userName = 'Stats Tracker';

      // Setup initial profile
      const initialProfile = adapter.createProfile(userId, userName);
      expect(initialProfile.stats.blitz.gamesPlayed).toBe(0);
      expect(initialProfile.stats.blitz.totalScore).toBe(0);

      // Queue game results
      const result1: GameResult = {
        userId,
        mode: 'blitz',
        score: 100,
        solved: true,
        wrong: 1,
        duration: 60000,
        timestamp: Timestamp.now(),
      };

      const result2: GameResult = {
        userId,
        mode: 'blitz',
        score: 150,
        solved: true,
        wrong: 0,
        duration: 55000,
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult(userId, result1);
      await cache.queueGameResult(userId, result2);

      // Sync
      await adapter.recordGameResult(userId, result1);
      await adapter.recordGameResult(userId, result2);

      // Verify stats updated
      const updatedProfile = await adapter.getPlayerProfile(userId);
      expect(updatedProfile.stats.blitz.gamesPlayed).toBe(2);
      expect(updatedProfile.stats.blitz.totalScore).toBe(250);
      expect(updatedProfile.stats.blitz.averageScore).toBe(125);
      expect(updatedProfile.stats.blitz.bestScore).toBe(150);
      expect(updatedProfile.totalGames).toBe(2);
      expect(updatedProfile.totalScore).toBe(250);
    });

    test('updates leaderboard after sync', async () => {
      const userId = 'user1';

      // Setup
      adapter.createProfile(userId, 'Leaderboard Player');

      // Subscribe to leaderboard updates
      const leaderboardUpdates: any[] = [];
      const unsubscribe = adapter.subscribeToLeaderboard('classic', 'allTime', (leaderboard) => {
        leaderboardUpdates.push(leaderboard);
      });

      // Play game offline and sync
      const result: GameResult = {
        userId,
        mode: 'classic',
        score: 500,
        solved: true,
        wrong: 0,
        duration: 120000,
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult(userId, result);
      await adapter.recordGameResult(userId, result);

      // Verify leaderboard was updated
      expect(leaderboardUpdates.length).toBeGreaterThan(0);
      const leaderboard = leaderboardUpdates[leaderboardUpdates.length - 1];
      expect(leaderboard.mode).toBe('classic');
      expect(leaderboard.period).toBe('allTime');
      expect(leaderboard.rankings.length).toBeGreaterThan(0);

      const userEntry = leaderboard.rankings.find((entry: any) => entry.userId === userId);
      expect(userEntry).toBeDefined();
      expect(userEntry.score).toBe(500);
      expect(userEntry.placement).toBe(1);

      unsubscribe();
    });

    test('caches updated profile in IndexedDB', async () => {
      const userId = 'user1';

      // Setup and play
      adapter.createProfile(userId, 'Cache Test Player');

      const result: GameResult = {
        userId,
        mode: 'timeAttack',
        score: 300,
        solved: true,
        wrong: 1,
        duration: 90000,
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult(userId, result);
      await adapter.recordGameResult(userId, result);

      // Get updated profile from adapter
      const profile = await adapter.getPlayerProfile(userId);

      // Cache it
      await cache.cacheProfile(userId, profile);

      // Retrieve from cache
      const cachedProfile = await cache.getProfileFromCache(userId);
      expect(cachedProfile).not.toBeNull();
      expect(cachedProfile!.stats.timeAttack.gamesPlayed).toBe(1);
      expect(cachedProfile!.stats.timeAttack.totalScore).toBe(300);
      expect(cachedProfile!.stats.timeAttack.completedPuzzles).toBe(1);
    });
  });

  describe('Multi-User Offline Scenarios', () => {
    test('handles multiple users offline simultaneously', async () => {
      // Setup two users
      const user1 = 'user1';
      const user2 = 'user2';

      adapter.createProfile(user1, 'Player One');
      adapter.createProfile(user2, 'Player Two');

      // User 1 plays
      const result1: GameResult = {
        userId: user1,
        mode: 'blitz',
        score: 150,
        solved: true,
        wrong: 2,
        duration: 70000,
        timestamp: Timestamp.now(),
      };

      // User 2 plays
      const result2: GameResult = {
        userId: user2,
        mode: 'blitz',
        score: 175,
        solved: true,
        wrong: 1,
        duration: 65000,
        timestamp: Timestamp.now(),
      };

      // Both queue results
      await cache.queueGameResult(user1, result1);
      await cache.queueGameResult(user2, result2);

      // Both have pending results
      const pending1 = await cache.getPendingGameResults(user1);
      const pending2 = await cache.getPendingGameResults(user2);

      expect(pending1).toHaveLength(1);
      expect(pending2).toHaveLength(1);

      // Verify isolation
      expect(pending1[0].userId).toBe(user1);
      expect(pending2[0].userId).toBe(user2);
      expect(pending1[0].score).toBe(150);
      expect(pending2[0].score).toBe(175);

      // Both come online - sync
      await adapter.recordGameResult(user1, result1);
      await adapter.recordGameResult(user2, result2);

      // Mark both as synced
      await cache.markGameResultSynced(user1);
      await cache.markGameResultSynced(user2);

      // Verify both queues cleared
      const stillPending1 = await cache.getPendingGameResults(user1);
      const stillPending2 = await cache.getPendingGameResults(user2);

      expect(stillPending1).toHaveLength(0);
      expect(stillPending2).toHaveLength(0);

      // Verify both profiles updated independently
      const profile1 = await adapter.getPlayerProfile(user1);
      const profile2 = await adapter.getPlayerProfile(user2);

      expect(profile1.stats.blitz.totalScore).toBe(150);
      expect(profile2.stats.blitz.totalScore).toBe(175);
    });

    test('supports selective sync - only one user comes online', async () => {
      const user1 = 'user1';
      const user2 = 'user2';
      const user3 = 'user3';

      adapter.createProfile(user1, 'Player One');
      adapter.createProfile(user2, 'Player Two');
      adapter.createProfile(user3, 'Player Three');

      // All three queue results
      for (const [userId, score] of [
        [user1, 100],
        [user2, 200],
        [user3, 300],
      ]) {
        const result: GameResult = {
          userId: userId as string,
          mode: 'classic',
          score: score as number,
          solved: true,
          wrong: 0,
          duration: 100000,
          timestamp: Timestamp.now(),
        };
        await cache.queueGameResult(userId as string, result);
      }

      // Only user1 and user2 come online
      const result1 = (await cache.getPendingGameResults(user1))[0];
      const result2 = (await cache.getPendingGameResults(user2))[0];

      await adapter.recordGameResult(user1, result1);
      await adapter.recordGameResult(user2, result2);

      // Only sync user1
      await cache.markGameResultSynced(user1);

      // Verify user1 cleared, user2 and user3 still pending
      expect((await cache.getPendingGameResults(user1)).length).toBe(0);
      expect((await cache.getPendingGameResults(user2)).length).toBe(1);
      expect((await cache.getPendingGameResults(user3)).length).toBe(1);

      // User2 and User3 come online
      await cache.markGameResultSynced(user2);
      const result3 = (await cache.getPendingGameResults(user3))[0];
      await adapter.recordGameResult(user3, result3);
      await cache.markGameResultSynced(user3);

      // All cleared
      expect((await cache.getPendingGameResults(user1)).length).toBe(0);
      expect((await cache.getPendingGameResults(user2)).length).toBe(0);
      expect((await cache.getPendingGameResults(user3)).length).toBe(0);
    });

    test('maintains correct stats for multiple users in leaderboard', async () => {
      const user1 = 'user1';
      const user2 = 'user2';
      const user3 = 'user3';

      adapter.createProfile(user1, 'High Scorer');
      adapter.createProfile(user2, 'Mid Scorer');
      adapter.createProfile(user3, 'Low Scorer');

      // Subscribe to leaderboard
      const leaderboardUpdates: any[] = [];
      adapter.subscribeToLeaderboard('blitz', 'allTime', (leaderboard) => {
        leaderboardUpdates.push(leaderboard);
      });

      // All play
      const scores = [
        { user: user1, score: 500 },
        { user: user2, score: 300 },
        { user: user3, score: 200 },
      ];

      for (const { user, score } of scores) {
        const result: GameResult = {
          userId: user,
          mode: 'blitz',
          score,
          solved: true,
          wrong: 0,
          duration: 60000,
          timestamp: Timestamp.now(),
        };
        await adapter.recordGameResult(user, result);
      }

      // Verify leaderboard ranking
      const leaderboard = leaderboardUpdates[leaderboardUpdates.length - 1];
      expect(leaderboard.rankings).toHaveLength(3);

      // Verify correct ordering: highest score first
      expect(leaderboard.rankings[0].userId).toBe(user1);
      expect(leaderboard.rankings[0].placement).toBe(1);
      expect(leaderboard.rankings[0].score).toBe(500);

      expect(leaderboard.rankings[1].userId).toBe(user2);
      expect(leaderboard.rankings[1].placement).toBe(2);
      expect(leaderboard.rankings[1].score).toBe(300);

      expect(leaderboard.rankings[2].userId).toBe(user3);
      expect(leaderboard.rankings[2].placement).toBe(3);
      expect(leaderboard.rankings[2].score).toBe(200);
    });
  });

  describe('Cache and Adapter Integration', () => {
    test('complete end-to-end offline sync workflow', async () => {
      const userId = 'user1';

      // 1. Setup profile
      adapter.createProfile(userId, 'End-to-End Test Player');

      // 2. Play offline - queue multiple games
      const games = [
        {
          userId,
          mode: 'blitz' as const,
          score: 250,
          solved: true,
          wrong: 1,
          duration: 60000,
        },
        {
          userId,
          mode: 'classic' as const,
          score: 300,
          solved: true,
          wrong: 0,
          duration: 120000,
        },
        {
          userId,
          mode: 'timeAttack' as const,
          score: 400,
          solved: true,
          wrong: 2,
          duration: 90000,
        },
      ];

      for (const game of games) {
        await cache.queueGameResult(userId, {
          ...game,
          timestamp: Timestamp.now(),
        });
      }

      // 3. Verify all queued
      let pending = await cache.getPendingGameResults(userId);
      expect(pending).toHaveLength(3);

      // 4. Come online - sync to adapter
      for (const game of games) {
        await adapter.recordGameResult(userId, {
          ...game,
          timestamp: Timestamp.now(),
        });
      }

      // 5. Mark all as synced
      await cache.markGameResultSynced(userId);

      // 6. Verify queue cleared
      pending = await cache.getPendingGameResults(userId);
      expect(pending).toHaveLength(0);

      // 7. Get updated profile
      const profile = await adapter.getPlayerProfile(userId);

      // 8. Cache the profile
      await cache.cacheProfile(userId, profile);

      // 9. Retrieve and verify cached profile
      const cachedProfile = await cache.getProfileFromCache(userId);
      expect(cachedProfile).not.toBeNull();
      expect(cachedProfile!.totalGames).toBe(3);
      expect(cachedProfile!.totalScore).toBe(950);
      expect(cachedProfile!.stats.blitz.gamesPlayed).toBe(1);
      expect(cachedProfile!.stats.classic.gamesPlayed).toBe(1);
      expect(cachedProfile!.stats.timeAttack.gamesPlayed).toBe(1);
      expect(cachedProfile!.stats.timeAttack.completedPuzzles).toBe(1);
    });

    test('handles offline sync failure recovery', async () => {
      const userId = 'user1';

      // Setup
      adapter.createProfile(userId, 'Recovery Test Player');

      // Queue results
      const result: GameResult = {
        userId,
        mode: 'blitz',
        score: 200,
        solved: true,
        wrong: 1,
        duration: 60000,
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult(userId, result);

      // Verify still pending
      let pending = await cache.getPendingGameResults(userId);
      expect(pending).toHaveLength(1);

      // Simulate offline condition - don't sync yet
      // Result remains in queue for later retry

      // Verify still pending (as if sync attempt was deferred)
      pending = await cache.getPendingGameResults(userId);
      expect(pending).toHaveLength(1);

      // Later: come online and retry sync succeeds
      await adapter.recordGameResult(userId, result);

      // Now mark as synced
      await cache.markGameResultSynced(userId);

      // Queue cleared
      pending = await cache.getPendingGameResults(userId);
      expect(pending).toHaveLength(0);

      // Stats updated
      const profile = await adapter.getPlayerProfile(userId);
      expect(profile.stats.blitz.gamesPlayed).toBe(1);
    });
  });
});
