// src/lib/leaderboard/cache/LeaderboardCache.ts

import type { PlayerProfile, GameResult, LeaderboardDoc } from '../types';

const DB_NAME = 'wordladder-leaderboard';
const DB_VERSION = 1;
const PROFILES_STORE = 'profiles';
const LEADERBOARDS_STORE = 'leaderboards';
const GAME_RESULTS_STORE = 'game_results';

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
          db.createObjectStore(PROFILES_STORE, { keyPath: 'userId' });
        }
        if (!db.objectStoreNames.contains(LEADERBOARDS_STORE)) {
          db.createObjectStore(LEADERBOARDS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(GAME_RESULTS_STORE)) {
          db.createObjectStore(GAME_RESULTS_STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async cacheProfile(userId: string, profile: PlayerProfile): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    const cached = {
      userId,
      profile,
      cachedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([PROFILES_STORE], 'readwrite');
      const store = tx.objectStore(PROFILES_STORE);
      const request = store.put(cached);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
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
        const cached = request.result;
        resolve(cached ? cached.profile : null);
      };
    });
  }

  async cacheLeaderboard(mode: string, period: string, leaderboard: LeaderboardDoc): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    const id = `${mode}-${period}`;
    const cached = {
      id,
      leaderboard,
      cachedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([LEADERBOARDS_STORE], 'readwrite');
      const store = tx.objectStore(LEADERBOARDS_STORE);
      const request = store.put(cached);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
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
        const cached = request.result;
        resolve(cached ? cached.leaderboard : null);
      };
    });
  }

  async queueGameResult(userId: string, result: GameResult): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    const queuedResult = {
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
        const queued = request.result
          .filter((item: any) => item.userId === userId && !item.synced)
          .map((item: any) => item.result);
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
        const items = request.result.filter((item: any) => item.userId === userId && !item.synced);
        items.forEach((item: any) => {
          item.synced = true;
          store.put(item);
        });
        resolve();
      };
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
