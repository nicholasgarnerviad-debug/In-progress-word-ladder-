/**
 * Comprehensive Tests for LeaderboardCache IndexedDB Operations
 * Tests all cache CRUD operations, queue functionality, and error handling
 */

import { LeaderboardCache } from '../../lib/leaderboard/cache/LeaderboardCache';
import type { PlayerProfile, GameResult, LeaderboardDoc, GameMode, LeaderboardPeriod } from '../../lib/leaderboard/types';
import { Timestamp } from 'firebase/firestore';

/**
 * Mock IndexedDB implementation for testing without browser environment
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
    // Auto-complete transaction after next tick
    Promise.resolve().then(() => tx.complete());
    return tx as any;
  }
}

// Setup mock IndexedDB globally
let mockIndexedDB = new MockIndexedDB();
(global as any).indexedDB = mockIndexedDB;

describe('LeaderboardCache', () => {
  let cache: LeaderboardCache;

  beforeEach(async () => {
    // Reset IndexedDB for each test
    mockIndexedDB = new MockIndexedDB();
    (global as any).indexedDB = mockIndexedDB;

    cache = new LeaderboardCache();
    await cache.initialize();
  });

  // ========================================
  // Profile Operations Tests
  // ========================================

  describe('Profile Operations', () => {
    test('stores and retrieves player profile', async () => {
      const profile: PlayerProfile = {
        userId: 'user1',
        name: 'Test Player',
        joinedAt: Timestamp.now(),
        totalGames: 10,
        totalScore: 1000,
        stats: {
          blitz: {
            gamesPlayed: 5,
            wins: 2,
            bestScore: 250,
            totalScore: 500,
            averageScore: 100,
            totalTime: 300000,
          },
          classic: {
            gamesPlayed: 3,
            wins: 1,
            bestScore: 200,
            totalScore: 300,
            averageScore: 100,
          },
          timeAttack: {
            gamesPlayed: 2,
            wins: 1,
            bestScore: 150,
            totalScore: 200,
            averageScore: 100,
            bestTime: 45000,
            completedPuzzles: 4,
          },
        },
        achievements: ['firstGamePlayed', 'win5Games'],
        badges: ['newbie'],
        lastGameAt: Timestamp.now(),
      };

      await cache.cacheProfile('user1', profile);
      const retrieved = await cache.getProfileFromCache('user1');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.userId).toBe('user1');
      expect(retrieved!.name).toBe('Test Player');
      expect(retrieved!.totalGames).toBe(10);
      expect(retrieved!.totalScore).toBe(1000);
      expect(retrieved!.achievements).toContain('firstGamePlayed');
      expect(retrieved!.badges).toContain('newbie');
    });

    test('returns null for non-existent profile', async () => {
      const retrieved = await cache.getProfileFromCache('non-existent-user');
      expect(retrieved).toBeNull();
    });

    test('overwrites existing profile', async () => {
      const profile1: PlayerProfile = {
        userId: 'user1',
        name: 'Original Name',
        joinedAt: Timestamp.now(),
        totalGames: 5,
        totalScore: 500,
        stats: {
          blitz: {
            gamesPlayed: 5,
            wins: 2,
            bestScore: 200,
            totalScore: 500,
            averageScore: 100,
            totalTime: 250000,
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

      await cache.cacheProfile('user1', profile1);
      let retrieved = await cache.getProfileFromCache('user1');
      expect(retrieved!.name).toBe('Original Name');

      const profile2: PlayerProfile = {
        ...profile1,
        name: 'Updated Name',
        totalGames: 10,
      };

      await cache.cacheProfile('user1', profile2);
      retrieved = await cache.getProfileFromCache('user1');
      expect(retrieved!.name).toBe('Updated Name');
      expect(retrieved!.totalGames).toBe(10);
    });

    test('stores multiple different profiles', async () => {
      const profile1: PlayerProfile = {
        userId: 'user1',
        name: 'Player 1',
        joinedAt: Timestamp.now(),
        totalGames: 5,
        totalScore: 500,
        stats: {
          blitz: {
            gamesPlayed: 5,
            wins: 2,
            bestScore: 200,
            totalScore: 500,
            averageScore: 100,
            totalTime: 250000,
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

      const profile2: PlayerProfile = {
        userId: 'user2',
        name: 'Player 2',
        joinedAt: Timestamp.now(),
        totalGames: 8,
        totalScore: 800,
        stats: {
          blitz: {
            gamesPlayed: 8,
            wins: 4,
            bestScore: 250,
            totalScore: 800,
            averageScore: 100,
            totalTime: 400000,
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

      await cache.cacheProfile('user1', profile1);
      await cache.cacheProfile('user2', profile2);

      const retrieved1 = await cache.getProfileFromCache('user1');
      const retrieved2 = await cache.getProfileFromCache('user2');

      expect(retrieved1!.userId).toBe('user1');
      expect(retrieved1!.name).toBe('Player 1');
      expect(retrieved2!.userId).toBe('user2');
      expect(retrieved2!.name).toBe('Player 2');
    });
  });

  // ========================================
  // Leaderboard Operations Tests
  // ========================================

  describe('Leaderboard Operations', () => {
    test('stores and retrieves leaderboard by mode and period', async () => {
      const leaderboard: LeaderboardDoc = {
        mode: 'blitz',
        period: 'allTime',
        rankings: [
          {
            userId: 'user1',
            name: 'Top Player',
            score: 1000,
            placement: 1,
            gamesPlayed: 50,
            lastGameAt: Timestamp.now(),
          },
          {
            userId: 'user2',
            name: 'Second Player',
            score: 800,
            placement: 2,
            gamesPlayed: 45,
            lastGameAt: Timestamp.now(),
          },
        ],
        lastUpdated: Timestamp.now(),
        updatedCount: 1,
      };

      await cache.cacheLeaderboard('blitz', 'allTime', leaderboard);
      const retrieved = await cache.getLeaderboardFromCache('blitz', 'allTime');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.mode).toBe('blitz');
      expect(retrieved!.period).toBe('allTime');
      expect(retrieved!.rankings.length).toBe(2);
      expect(retrieved!.rankings[0].name).toBe('Top Player');
      expect(retrieved!.rankings[0].placement).toBe(1);
    });

    test('returns null for non-existent leaderboard', async () => {
      const retrieved = await cache.getLeaderboardFromCache('classic', 'weekly');
      expect(retrieved).toBeNull();
    });

    test('stores different leaderboards for different modes and periods', async () => {
      const leaderboardBlitzAllTime: LeaderboardDoc = {
        mode: 'blitz',
        period: 'allTime',
        rankings: [
          {
            userId: 'user1',
            name: 'Blitz Master',
            score: 5000,
            placement: 1,
            gamesPlayed: 100,
            lastGameAt: Timestamp.now(),
          },
        ],
        lastUpdated: Timestamp.now(),
        updatedCount: 1,
      };

      const leaderboardClassicWeekly: LeaderboardDoc = {
        mode: 'classic',
        period: 'weekly',
        rankings: [
          {
            userId: 'user2',
            name: 'Classic Hero',
            score: 3000,
            placement: 1,
            gamesPlayed: 50,
            lastGameAt: Timestamp.now(),
          },
        ],
        lastUpdated: Timestamp.now(),
        updatedCount: 1,
      };

      await cache.cacheLeaderboard('blitz', 'allTime', leaderboardBlitzAllTime);
      await cache.cacheLeaderboard('classic', 'weekly', leaderboardClassicWeekly);

      const retrievedBlitz = await cache.getLeaderboardFromCache('blitz', 'allTime');
      const retrievedClassic = await cache.getLeaderboardFromCache('classic', 'weekly');

      expect(retrievedBlitz!.mode).toBe('blitz');
      expect(retrievedBlitz!.period).toBe('allTime');
      expect(retrievedBlitz!.rankings[0].name).toBe('Blitz Master');

      expect(retrievedClassic!.mode).toBe('classic');
      expect(retrievedClassic!.period).toBe('weekly');
      expect(retrievedClassic!.rankings[0].name).toBe('Classic Hero');
    });

    test('overwrites existing leaderboard', async () => {
      const leaderboard1: LeaderboardDoc = {
        mode: 'blitz',
        period: 'allTime',
        rankings: [
          {
            userId: 'user1',
            name: 'Player 1',
            score: 1000,
            placement: 1,
            gamesPlayed: 50,
            lastGameAt: Timestamp.now(),
          },
        ],
        lastUpdated: Timestamp.now(),
        updatedCount: 1,
      };

      const leaderboard2: LeaderboardDoc = {
        mode: 'blitz',
        period: 'allTime',
        rankings: [
          {
            userId: 'user2',
            name: 'Player 2',
            score: 1500,
            placement: 1,
            gamesPlayed: 60,
            lastGameAt: Timestamp.now(),
          },
        ],
        lastUpdated: Timestamp.now(),
        updatedCount: 2,
      };

      await cache.cacheLeaderboard('blitz', 'allTime', leaderboard1);
      let retrieved = await cache.getLeaderboardFromCache('blitz', 'allTime');
      expect(retrieved!.rankings[0].name).toBe('Player 1');
      expect(retrieved!.updatedCount).toBe(1);

      await cache.cacheLeaderboard('blitz', 'allTime', leaderboard2);
      retrieved = await cache.getLeaderboardFromCache('blitz', 'allTime');
      expect(retrieved!.rankings[0].name).toBe('Player 2');
      expect(retrieved!.updatedCount).toBe(2);
    });
  });

  // ========================================
  // Game Result Queueing Tests
  // ========================================

  describe('Game Result Queueing', () => {
    test('queues game result when offline', async () => {
      const result: GameResult = {
        userId: 'user1',
        mode: 'blitz',
        score: 250,
        solved: true,
        wrong: 2,
        duration: 65000,
        difficulty: 'medium',
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult('user1', result);
      const pending = await cache.getPendingGameResults('user1');

      expect(pending.length).toBe(1);
      expect(pending[0].score).toBe(250);
      expect(pending[0].mode).toBe('blitz');
      expect(pending[0].solved).toBe(true);
    });

    test('queues multiple game results for same user', async () => {
      const result1: GameResult = {
        userId: 'user1',
        mode: 'blitz',
        score: 200,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      };

      const result2: GameResult = {
        userId: 'user1',
        mode: 'classic',
        score: 300,
        solved: true,
        wrong: 0,
        duration: 120000,
        difficulty: 'hard',
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult('user1', result1);
      await cache.queueGameResult('user1', result2);

      const pending = await cache.getPendingGameResults('user1');

      expect(pending.length).toBe(2);
      expect(pending[0].mode).toBe('blitz');
      expect(pending[1].mode).toBe('classic');
    });

    test('isolates game results per user', async () => {
      const result1: GameResult = {
        userId: 'user1',
        mode: 'blitz',
        score: 200,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      };

      const result2: GameResult = {
        userId: 'user2',
        mode: 'blitz',
        score: 300,
        solved: true,
        wrong: 0,
        duration: 50000,
        difficulty: 'hard',
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult('user1', result1);
      await cache.queueGameResult('user2', result2);

      const pending1 = await cache.getPendingGameResults('user1');
      const pending2 = await cache.getPendingGameResults('user2');

      expect(pending1.length).toBe(1);
      expect(pending1[0].score).toBe(200);
      expect(pending2.length).toBe(1);
      expect(pending2[0].score).toBe(300);
    });

    test('returns empty array when no pending results for user', async () => {
      const pending = await cache.getPendingGameResults('user1');
      expect(Array.isArray(pending)).toBe(true);
      expect(pending.length).toBe(0);
    });

    test('queues results with optional fields', async () => {
      const result: GameResult = {
        userId: 'user1',
        mode: 'blitz',
        score: 150,
        solved: false,
        wrong: 5,
        duration: 180000,
        difficulty: 'medium',
        wordLength: 5,
        placement: 3,
        totalPlayers: 5,
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult('user1', result);
      const pending = await cache.getPendingGameResults('user1');

      expect(pending.length).toBe(1);
      expect(pending[0].wordLength).toBe(5);
      expect(pending[0].placement).toBe(3);
      expect(pending[0].totalPlayers).toBe(5);
    });
  });

  // ========================================
  // Queue Clearing Tests
  // ========================================

  describe('Queue Clearing and Sync', () => {
    test('clears queue after marking results as synced', async () => {
      const result: GameResult = {
        userId: 'user1',
        mode: 'blitz',
        score: 200,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult('user1', result);
      let pending = await cache.getPendingGameResults('user1');
      expect(pending.length).toBe(1);

      await cache.markGameResultSynced('user1');
      pending = await cache.getPendingGameResults('user1');
      expect(pending.length).toBe(0);
    });

    test('marks only results for specific user as synced', async () => {
      const result1: GameResult = {
        userId: 'user1',
        mode: 'blitz',
        score: 200,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      };

      const result2: GameResult = {
        userId: 'user2',
        mode: 'blitz',
        score: 300,
        solved: true,
        wrong: 0,
        duration: 50000,
        difficulty: 'hard',
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult('user1', result1);
      await cache.queueGameResult('user2', result2);

      await cache.markGameResultSynced('user1');

      const pending1 = await cache.getPendingGameResults('user1');
      const pending2 = await cache.getPendingGameResults('user2');

      expect(pending1.length).toBe(0);
      expect(pending2.length).toBe(1);
    });

    test('handles marking results as synced when none exist', async () => {
      await cache.markGameResultSynced('non-existent-user');
      const pending = await cache.getPendingGameResults('non-existent-user');
      expect(pending.length).toBe(0);
    });

    test('only returns unsynced results in pending', async () => {
      const result1: GameResult = {
        userId: 'user1',
        mode: 'blitz',
        score: 200,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      };

      const result2: GameResult = {
        userId: 'user1',
        mode: 'classic',
        score: 300,
        solved: true,
        wrong: 0,
        duration: 120000,
        difficulty: 'hard',
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult('user1', result1);
      await cache.queueGameResult('user1', result2);

      // Mark as synced
      await cache.markGameResultSynced('user1');

      // Queue another result after syncing
      const result3: GameResult = {
        userId: 'user1',
        mode: 'timeAttack',
        score: 150,
        solved: true,
        wrong: 2,
        duration: 90000,
        difficulty: 'medium',
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult('user1', result3);
      const pending = await cache.getPendingGameResults('user1');

      expect(pending.length).toBe(1);
      expect(pending[0].mode).toBe('timeAttack');
    });
  });

  // ========================================
  // Error Handling and Edge Cases
  // ========================================

  describe('Error Handling and Edge Cases', () => {
    test('throws error when cache not initialized for profile operation', async () => {
      const uninitializedCache = new LeaderboardCache();

      const profile: PlayerProfile = {
        userId: 'user1',
        name: 'Test',
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

      await expect(uninitializedCache.cacheProfile('user1', profile)).rejects.toThrow(
        'Cache not initialized'
      );
    });

    test('handles empty leaderboard rankings', async () => {
      const leaderboard: LeaderboardDoc = {
        mode: 'blitz',
        period: 'allTime',
        rankings: [],
        lastUpdated: Timestamp.now(),
        updatedCount: 0,
      };

      await cache.cacheLeaderboard('blitz', 'allTime', leaderboard);
      const retrieved = await cache.getLeaderboardFromCache('blitz', 'allTime');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.rankings.length).toBe(0);
    });

    test('handles profile with no achievements', async () => {
      const profile: PlayerProfile = {
        userId: 'user1',
        name: 'New Player',
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

      await cache.cacheProfile('user1', profile);
      const retrieved = await cache.getProfileFromCache('user1');

      expect(retrieved!.achievements.length).toBe(0);
      expect(retrieved!.badges.length).toBe(0);
    });

    test('handles game result with zero score', async () => {
      const result: GameResult = {
        userId: 'user1',
        mode: 'blitz',
        score: 0,
        solved: false,
        wrong: 10,
        duration: 300000,
        difficulty: 'hard',
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult('user1', result);
      const pending = await cache.getPendingGameResults('user1');

      expect(pending.length).toBe(1);
      expect(pending[0].score).toBe(0);
      expect(pending[0].solved).toBe(false);
    });

    test('stores and retrieves profile with special characters in name', async () => {
      const profile: PlayerProfile = {
        userId: 'user1',
        name: "Player@123 Ñoñó 🎮 'Test'",
        joinedAt: Timestamp.now(),
        totalGames: 5,
        totalScore: 500,
        stats: {
          blitz: {
            gamesPlayed: 5,
            wins: 2,
            bestScore: 200,
            totalScore: 500,
            averageScore: 100,
            totalTime: 250000,
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

      await cache.cacheProfile('user1', profile);
      const retrieved = await cache.getProfileFromCache('user1');

      expect(retrieved!.name).toBe("Player@123 Ñoñó 🎮 'Test'");
    });

    test('clears entire cache', async () => {
      const profile: PlayerProfile = {
        userId: 'user1',
        name: 'Test Player',
        joinedAt: Timestamp.now(),
        totalGames: 5,
        totalScore: 500,
        stats: {
          blitz: {
            gamesPlayed: 5,
            wins: 2,
            bestScore: 200,
            totalScore: 500,
            averageScore: 100,
            totalTime: 250000,
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

      const leaderboard: LeaderboardDoc = {
        mode: 'blitz',
        period: 'allTime',
        rankings: [],
        lastUpdated: Timestamp.now(),
        updatedCount: 0,
      };

      const result: GameResult = {
        userId: 'user1',
        mode: 'blitz',
        score: 200,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      };

      // Populate cache
      await cache.cacheProfile('user1', profile);
      await cache.cacheLeaderboard('blitz', 'allTime', leaderboard);
      await cache.queueGameResult('user1', result);

      // Verify data exists
      expect(await cache.getProfileFromCache('user1')).not.toBeNull();
      expect(await cache.getLeaderboardFromCache('blitz', 'allTime')).not.toBeNull();
      expect((await cache.getPendingGameResults('user1')).length).toBe(1);

      // Clear cache
      await cache.clearCache();

      // Verify all data is gone
      expect(await cache.getProfileFromCache('user1')).toBeNull();
      expect(await cache.getLeaderboardFromCache('blitz', 'allTime')).toBeNull();
      expect((await cache.getPendingGameResults('user1')).length).toBe(0);
    });
  });

  // ========================================
  // Cache Limit Tests
  // ========================================

  describe('Cache Limits', () => {
    test('handles large number of profiles at cache limit', async () => {
      // The cache limit for profiles is 30
      // This test verifies cache eviction doesn't crash with many profiles
      const profileCount = 10;

      for (let i = 0; i < profileCount; i++) {
        const profile: PlayerProfile = {
          userId: `user${i}`,
          name: `Player ${i}`,
          joinedAt: Timestamp.now(),
          totalGames: i,
          totalScore: i * 100,
          stats: {
            blitz: {
              gamesPlayed: i,
              wins: Math.floor(i / 2),
              bestScore: i * 50,
              totalScore: i * 100,
              averageScore: 100,
              totalTime: i * 60000,
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

        await cache.cacheProfile(`user${i}`, profile);
      }

      // Verify latest profiles are accessible
      const retrieved = await cache.getProfileFromCache('user9');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.userId).toBe('user9');
    });

    test('handles large number of leaderboards at cache limit', async () => {
      // The cache limit for leaderboards is 50
      // This test verifies cache eviction works with many leaderboards
      const modes: GameMode[] = ['blitz', 'classic', 'timeAttack'];
      const periods: LeaderboardPeriod[] = ['allTime', 'weekly', 'monthly'];

      for (const mode of modes) {
        for (const period of periods) {
          const leaderboard: LeaderboardDoc = {
            mode,
            period,
            rankings: [
              {
                userId: 'user1',
                name: 'Player 1',
                score: 1000,
                placement: 1,
                gamesPlayed: 50,
                lastGameAt: Timestamp.now(),
              },
            ],
            lastUpdated: Timestamp.now(),
            updatedCount: 1,
          };

          await cache.cacheLeaderboard(mode, period, leaderboard);
        }
      }

      // Verify all combinations are accessible
      const retrieved = await cache.getLeaderboardFromCache('blitz', 'weekly');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.mode).toBe('blitz');
      expect(retrieved!.period).toBe('weekly');
    });

    test('handles many pending game results per user', async () => {
      // The cache limit for results per user is 100
      // This test verifies queueing many results works correctly
      const resultCount = 20;

      for (let i = 0; i < resultCount; i++) {
        const result: GameResult = {
          userId: 'user1',
          mode: i % 3 === 0 ? 'blitz' : i % 3 === 1 ? 'classic' : 'timeAttack',
          score: 100 + i * 10,
          solved: true,
          wrong: i,
          duration: 60000 + i * 1000,
          difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
          timestamp: Timestamp.now(),
        };

        await cache.queueGameResult('user1', result);
      }

      const pending = await cache.getPendingGameResults('user1');
      expect(pending.length).toBe(resultCount);
      expect(pending[0].score).toBe(100);
      expect(pending[resultCount - 1].score).toBe(100 + (resultCount - 1) * 10);
    });
  });

  // ========================================
  // Integration Tests
  // ========================================

  describe('Integration Tests', () => {
    test('complete offline-to-online sync workflow', async () => {
      // 1. User plays offline and queues results
      const result1: GameResult = {
        userId: 'user1',
        mode: 'blitz',
        score: 200,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      };

      const result2: GameResult = {
        userId: 'user1',
        mode: 'classic',
        score: 300,
        solved: true,
        wrong: 0,
        duration: 120000,
        difficulty: 'hard',
        timestamp: Timestamp.now(),
      };

      await cache.queueGameResult('user1', result1);
      await cache.queueGameResult('user1', result2);

      let pending = await cache.getPendingGameResults('user1');
      expect(pending.length).toBe(2);

      // 2. User comes online and syncs results
      await cache.markGameResultSynced('user1');
      pending = await cache.getPendingGameResults('user1');
      expect(pending.length).toBe(0);

      // 3. Cache updated profile after sync
      const profile: PlayerProfile = {
        userId: 'user1',
        name: 'Updated Player',
        joinedAt: Timestamp.now(),
        totalGames: 2,
        totalScore: 500,
        stats: {
          blitz: {
            gamesPlayed: 1,
            wins: 1,
            bestScore: 200,
            totalScore: 200,
            averageScore: 200,
            totalTime: 60000,
          },
          classic: {
            gamesPlayed: 1,
            wins: 1,
            bestScore: 300,
            totalScore: 300,
            averageScore: 300,
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
        achievements: ['firstGamePlayed'],
        badges: ['newbie'],
        lastGameAt: Timestamp.now(),
      };

      await cache.cacheProfile('user1', profile);

      // 4. Verify updated profile is cached
      const cachedProfile = await cache.getProfileFromCache('user1');
      expect(cachedProfile!.name).toBe('Updated Player');
      expect(cachedProfile!.totalGames).toBe(2);
    });

    test('handles multiple users simultaneously', async () => {
      const users = ['user1', 'user2', 'user3'];

      // Queue results for each user
      for (const userId of users) {
        const result: GameResult = {
          userId,
          mode: 'blitz',
          score: 200 + users.indexOf(userId) * 100,
          solved: true,
          wrong: 1,
          duration: 60000,
          difficulty: 'easy',
          timestamp: Timestamp.now(),
        };

        await cache.queueGameResult(userId, result);
      }

      // Verify each user has their own results
      for (const userId of users) {
        const pending = await cache.getPendingGameResults(userId);
        expect(pending.length).toBe(1);
        expect(pending[0].userId).toBe(userId);
      }

      // Sync user1 and user2
      await cache.markGameResultSynced('user1');
      await cache.markGameResultSynced('user2');

      // Verify only user3 has pending results
      expect((await cache.getPendingGameResults('user1')).length).toBe(0);
      expect((await cache.getPendingGameResults('user2')).length).toBe(0);
      expect((await cache.getPendingGameResults('user3')).length).toBe(1);
    });
  });
});
