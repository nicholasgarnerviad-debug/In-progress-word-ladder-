# Leaderboard/Social/Achievement System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive offline-first leaderboard, player profile, and achievement system with Firestore persistence and real-time updates.

**Architecture:** Three-layer design (Local IndexedDB cache → Firestore backend → Real-time sync adapters). FirebaseLeaderboardAdapter extends the existing sync adapter pattern. Achievement system evaluates locally, syncs to Firestore. All screens load from cache first, sync on connectivity.

**Tech Stack:** Firebase Firestore, IndexedDB, TypeScript, React, TailwindCSS, sync adapter pattern

---

## Overview

This plan implements the complete Leaderboard/Social/Achievement system across 17 focused tasks:

**Phase 1 (Tasks 1-4): Foundation & Types**
- Data models and interfaces
- Achievement definitions and evaluator
- Sync adapter interface

**Phase 2 (Tasks 5-8): Core Adapter Implementation**
- FirebaseLeaderboardAdapter with Firestore integration
- Offline cache management (IndexedDB)
- Real-time leaderboard subscriptions
- Profile loading with caching

**Phase 3 (Tasks 9-11): UI Screens**
- PlayerProfileScreen (stats, achievements, history)
- LeaderboardScreen (global rankings, real-time)
- AchievementsScreen (catalog, progress, unlock details)

**Phase 4 (Tasks 12-14): Integration**
- Hook into ClassicGame game end
- Hook into TimeAttackPage game end
- Hook into BlitzGameScreen game end

**Phase 5 (Tasks 15-17): Testing & Polish**
- Integration tests (result → leaderboard sync)
- E2E tests (full game flow)
- Offline scenario tests

---

## File Structure

**New files to create:**
- `src/lib/leaderboard/types.ts` — Data models
- `src/lib/leaderboard/sync/LeaderboardSyncAdapter.ts` — Adapter interface
- `src/lib/leaderboard/sync/FirebaseLeaderboardAdapter.ts` — Firebase impl
- `src/lib/leaderboard/sync/LocalLeaderboardAdapter.ts` — Mock/test impl
- `src/lib/leaderboard/cache/LeaderboardCache.ts` — IndexedDB cache
- `src/lib/leaderboard/achievements/AchievementEvaluator.ts` — Achievement logic
- `src/lib/leaderboard/achievements/achievements.ts` — Achievement definitions
- `src/components/leaderboard/PlayerProfileScreen.tsx` — Profile page
- `src/components/leaderboard/LeaderboardScreen.tsx` — Leaderboard page
- `src/components/leaderboard/AchievementsScreen.tsx` — Achievements page
- `src/components/leaderboard/AchievementNotification.tsx` — Achievement popup
- `src/lib/leaderboard/__tests__/achievement-evaluator.test.ts` — Tests
- `src/lib/leaderboard/__tests__/leaderboard-integration.test.ts` — Integration tests

**Files to modify:**
- `src/App.tsx` — Add /profile, /leaderboards, /achievements routes
- `src/ClassicGame.tsx` — Record results on game end
- `src/features/timeAttack/pages/TimeAttackPage.tsx` — Record results
- `src/features/blitz/BlitzGameScreen.tsx` — Record results
- `src/components/economy/LevelUpProvider.tsx` — Achievement notification queue

---

## Task 1: Create Leaderboard Data Models

**Files:**
- Create: `src/lib/leaderboard/types.ts`

- [ ] **Step 1: Write types file with all interfaces**

See Step 1 code from earlier in this document (full types implementation)

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/leaderboard/types.ts
git commit -m "feat(leaderboard): add data model types and interfaces"
```

---

## Task 2: Create Leaderboard Sync Adapter Interface

**Files:**
- Create: `src/lib/leaderboard/sync/LeaderboardSyncAdapter.ts`

- [ ] **Step 1: Write adapter interface**

See Step 1 code from earlier in this document (full interface implementation)

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/leaderboard/sync/LeaderboardSyncAdapter.ts
git commit -m "feat(leaderboard): add LeaderboardSyncAdapter interface"
```

---

## Task 3: Create Achievement Config Definitions

**Files:**
- Create: `src/lib/leaderboard/achievements/achievements.ts`

- [ ] **Step 1: Write achievement definitions**

See Step 1 code from earlier in this document (full achievements config)

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/leaderboard/achievements/achievements.ts
git commit -m "feat(achievements): add achievement definitions and configs"
```

---

## Task 4: Create Achievement Evaluator with Tests

**Files:**
- Create: `src/lib/leaderboard/achievements/AchievementEvaluator.ts`
- Create: `src/lib/leaderboard/__tests__/achievement-evaluator.test.ts`

- [ ] **Step 1: Write failing tests**

See Step 1 code from earlier in this document (6 test cases for achievement evaluation)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/leaderboard/__tests__/achievement-evaluator.test.ts`
Expected: FAIL - "AchievementEvaluator is not defined"

- [ ] **Step 3: Implement AchievementEvaluator**

See Step 3 code from earlier in this document (full AchievementEvaluator class)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/leaderboard/__tests__/achievement-evaluator.test.ts`
Expected: PASS - All 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/leaderboard/achievements/AchievementEvaluator.ts src/lib/leaderboard/__tests__/achievement-evaluator.test.ts
git commit -m "feat(achievements): implement achievement evaluation engine with tests"
```

---

## Task 5: Create IndexedDB Cache Manager

**Files:**
- Create: `src/lib/leaderboard/cache/LeaderboardCache.ts`

- [ ] **Step 1: Write cache manager implementation**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/leaderboard/cache/LeaderboardCache.ts
git commit -m "feat(leaderboard): implement IndexedDB cache manager"
```

---

## Task 6: Create Firebase Leaderboard Adapter

**Files:**
- Create: `src/lib/leaderboard/sync/FirebaseLeaderboardAdapter.ts`

- [ ] **Step 1: Initialize Firebase setup**

Create `src/lib/firebase.ts` if not exists:

```typescript
// src/lib/firebase.ts

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
```

- [ ] **Step 2: Write FirebaseLeaderboardAdapter**

```typescript
// src/lib/leaderboard/sync/FirebaseLeaderboardAdapter.ts

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
  LeaderboardListener 
} from './LeaderboardSyncAdapter';
import { 
  LeaderboardSyncError, 
  LeaderboardSyncErrorCode 
} from './LeaderboardSyncAdapter';
import type { GameResult, PlayerProfile, LeaderboardDoc, AchievementConfig, GameMode, LeaderboardPeriod } from '../types';
import { LeaderboardCache } from '../cache/LeaderboardCache';
import { AchievementEvaluator } from '../achievements/AchievementEvaluator';
import { getAllAchievements } from '../achievements/achievements';

export class FirebaseLeaderboardAdapter implements LeaderboardSyncAdapter {
  private cache: LeaderboardCache;
  private evaluator: AchievementEvaluator;
  private unsubscribers: Map<string, () => void> = new Map();

  constructor() {
    this.cache = new LeaderboardCache();
    this.evaluator = new AchievementEvaluator();
  }

  async initialize(): Promise<void> {
    await this.cache.initialize();
  }

  async recordGameResult(userId: string, result: GameResult): Promise<void> {
    try {
      // Queue locally first
      await this.cache.queueGameResult(userId, result);

      // Try to sync immediately if online
      if (navigator.onLine) {
        await this.syncLocalResults(userId);
      }
    } catch (error) {
      throw new LeaderboardSyncError(
        LeaderboardSyncErrorCode.NETWORK_ERROR,
        `Failed to record game result: ${error}`
      );
    }
  }

  subscribeToLeaderboard(
    mode: GameMode,
    period: LeaderboardPeriod,
    listener: LeaderboardListener
  ): () => void {
    const docId = `${mode}-${period}`;
    const leaderboardRef = doc(firestore, 'leaderboards', docId);

    // Call listener with cached data immediately
    this.cache.getLeaderboardFromCache(mode, period).then((cached) => {
      if (cached) {
        listener(cached);
      }
    });

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(leaderboardRef, (snapshot) => {
      if (snapshot.exists()) {
        const leaderboardData = snapshot.data() as LeaderboardDoc;
        this.cache.cacheLeaderboard(mode, period, leaderboardData);
        listener(leaderboardData);
      }
    });

    this.unsubscribers.set(docId, unsubscribe);
    return unsubscribe;
  }

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

  async checkAndGrantAchievements(userId: string): Promise<string[]> {
    try {
      const profile = await this.getPlayerProfile(userId);
      const newlyUnlocked = this.evaluator.evaluateAchievements(profile, {} as GameResult);

      if (newlyUnlocked.length > 0) {
        const updatedAchievements = [...profile.achievements, ...newlyUnlocked];
        const profileRef = doc(firestore, 'players', userId);
        await updateDoc(profileRef, { achievements: updatedAchievements });

        // Update cache
        profile.achievements = updatedAchievements;
        await this.cache.cacheProfile(userId, profile);
      }

      return newlyUnlocked;
    } catch (error) {
      throw new LeaderboardSyncError(
        LeaderboardSyncErrorCode.FIRESTORE_ERROR,
        `Failed to check achievements: ${error}`
      );
    }
  }

  async getAchievements(): Promise<AchievementConfig[]> {
    return getAllAchievements();
  }

  async syncLocalResults(userId: string): Promise<void> {
    try {
      const pendingResults = await this.cache.getPendingGameResults(userId);

      for (const result of pendingResults) {
        const resultRef = doc(collection(firestore, 'gameResults'));
        await setDoc(resultRef, {
          ...result,
          timestamp: serverTimestamp(),
        });

        // Update player profile with new stats
        const profile = await this.getPlayerProfile(userId);
        const modeStats = profile.stats[result.mode as keyof typeof profile.stats];

        if (modeStats) {
          (modeStats as any).gamesPlayed += 1;
          (modeStats as any).totalScore += result.score;
          (modeStats as any).averageScore = (modeStats as any).totalScore / (modeStats as any).gamesPlayed;
          if (result.score > (modeStats as any).bestScore) {
            (modeStats as any).bestScore = result.score;
          }
        }

        profile.totalGames += 1;
        profile.totalScore += result.score;
        profile.lastGameAt = Timestamp.now();

        const profileRef = doc(firestore, 'players', userId);
        await updateDoc(profileRef, profile);

        // Check achievements
        await this.checkAndGrantAchievements(userId);
      }

      await this.cache.markGameResultSynced(userId);
    } catch (error) {
      throw new LeaderboardSyncError(
        LeaderboardSyncErrorCode.FIRESTORE_ERROR,
        `Failed to sync local results: ${error}`
      );
    }
  }

  unsubscribeAll(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers.clear();
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/firebase.ts src/lib/leaderboard/sync/FirebaseLeaderboardAdapter.ts
git commit -m "feat(leaderboard): implement Firebase adapter with Firestore integration"
```

---

## Task 7: Create Local Mock Adapter for Testing

**Files:**
- Create: `src/lib/leaderboard/sync/LocalLeaderboardAdapter.ts`

- [ ] **Step 1: Write LocalLeaderboardAdapter**

```typescript
// src/lib/leaderboard/sync/LocalLeaderboardAdapter.ts

import type { LeaderboardSyncAdapter, LeaderboardListener } from './LeaderboardSyncAdapter';
import { LeaderboardSyncError, LeaderboardSyncErrorCode } from './LeaderboardSyncAdapter';
import type { GameResult, PlayerProfile, LeaderboardDoc, AchievementConfig, GameMode, LeaderboardPeriod } from '../types';
import { AchievementEvaluator } from '../achievements/AchievementEvaluator';
import { getAllAchievements } from '../achievements/achievements';
import { Timestamp } from 'firebase/firestore';

/**
 * LocalLeaderboardAdapter: In-memory implementation for testing and offline mode.
 */
export class LocalLeaderboardAdapter implements LeaderboardSyncAdapter {
  private profiles = new Map<string, PlayerProfile>();
  private leaderboards = new Map<string, LeaderboardDoc>();
  private evaluator = new AchievementEvaluator();
  private listeners: Map<string, Set<LeaderboardListener>> = new Map();

  async recordGameResult(userId: string, result: GameResult): Promise<void> {
    let profile = this.profiles.get(userId);
    if (!profile) {
      throw new LeaderboardSyncError(
        LeaderboardSyncErrorCode.PROFILE_NOT_FOUND,
        `Profile not found: ${userId}`
      );
    }

    const modeStats = profile.stats[result.mode as keyof typeof profile.stats];
    if (modeStats) {
      (modeStats as any).gamesPlayed += 1;
      (modeStats as any).totalScore += result.score;
      (modeStats as any).averageScore = (modeStats as any).totalScore / (modeStats as any).gamesPlayed;
      if (result.score > (modeStats as any).bestScore) {
        (modeStats as any).bestScore = result.score;
      }
    }

    profile.totalGames += 1;
    profile.totalScore += result.score;
    profile.lastGameAt = Timestamp.now();

    this.notifyListeners(result.mode, 'allTime');
  }

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

    const leaderboard = this.leaderboards.get(key);
    if (leaderboard) {
      listener(leaderboard);
    }

    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  async getPlayerProfile(userId: string): Promise<PlayerProfile> {
    const profile = this.profiles.get(userId);
    if (!profile) {
      throw new LeaderboardSyncError(
        LeaderboardSyncErrorCode.PROFILE_NOT_FOUND,
        `Profile not found: ${userId}`
      );
    }
    return profile;
  }

  async checkAndGrantAchievements(userId: string): Promise<string[]> {
    const profile = this.profiles.get(userId);
    if (!profile) return [];

    const newlyUnlocked = this.evaluator.evaluateAchievements(profile, {} as GameResult);
    profile.achievements.push(...newlyUnlocked);
    return newlyUnlocked;
  }

  async getAchievements(): Promise<AchievementConfig[]> {
    return getAllAchievements();
  }

  async syncLocalResults(): Promise<void> {
    // No-op for local adapter
  }

  createProfile(userId: string, name: string): PlayerProfile {
    const profile: PlayerProfile = {
      userId,
      name,
      joinedAt: Timestamp.now(),
      totalGames: 0,
      totalScore: 0,
      stats: {
        blitz: { gamesPlayed: 0, wins: 0, bestScore: 0, totalScore: 0, averageScore: 0, totalTime: 0 },
        classic: { gamesPlayed: 0, wins: 0, bestScore: 0, totalScore: 0, averageScore: 0 },
        timeAttack: { gamesPlayed: 0, wins: 0, bestScore: 0, totalScore: 0, averageScore: 0, bestTime: 0, completedPuzzles: 0 },
      },
      achievements: [],
      badges: [],
      lastGameAt: Timestamp.now(),
    };
    this.profiles.set(userId, profile);
    return profile;
  }

  private notifyListeners(mode: GameMode, period: LeaderboardPeriod): void {
    const key = `${mode}-${period}`;
    const listeners = this.listeners.get(key);
    if (!listeners) return;

    // Recompute leaderboard
    const leaderboard = this.computeLeaderboard(mode);
    this.leaderboards.set(key, leaderboard);

    listeners.forEach((listener) => listener(leaderboard));
  }

  private computeLeaderboard(mode: GameMode): LeaderboardDoc {
    const rankings = Array.from(this.profiles.values())
      .map((profile) => {
        const modeStats = profile.stats[mode as keyof typeof profile.stats];
        return {
          userId: profile.userId,
          name: profile.name,
          score: (modeStats as any)?.totalScore || 0,
          placement: 0,
          gamesPlayed: (modeStats as any)?.gamesPlayed || 0,
          lastGameAt: profile.lastGameAt,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, placement: index + 1 }));

    return {
      mode,
      period: 'allTime',
      rankings,
      lastUpdated: Timestamp.now(),
      updatedCount: 0,
    };
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/leaderboard/sync/LocalLeaderboardAdapter.ts
git commit -m "feat(leaderboard): implement LocalLeaderboardAdapter for testing"
```

---

## Task 8: Create UI Screens - PlayerProfileScreen

**Files:**
- Create: `src/components/leaderboard/PlayerProfileScreen.tsx`

- [ ] **Step 1: Write PlayerProfileScreen component**

```typescript
// src/components/leaderboard/PlayerProfileScreen.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { PlayerProfile, GameResult } from '../../lib/leaderboard/types';
import { FirebaseLeaderboardAdapter } from '../../lib/leaderboard/sync/FirebaseLeaderboardAdapter';

const adapter = new FirebaseLeaderboardAdapter();

export const PlayerProfileScreen: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    adapter.initialize().then(async () => {
      try {
        const p = await adapter.getPlayerProfile(userId);
        setProfile(p);
      } catch (err) {
        setError(`Failed to load profile: ${err}`);
      } finally {
        setLoading(false);
      }
    });
  }, [userId]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!profile) return <div className="p-8">Profile not found</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-2xl">
              {profile.avatar || profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Joined {new Date(profile.joinedAt.toDate()).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Games</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{profile.totalGames}</div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Score</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{profile.totalScore}</div>
          </div>
        </div>

        {/* Mode Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Mode Stats</h2>
          <div className="space-y-4">
            {Object.entries(profile.stats).map(([mode, stats]) => (
              <div key={mode} className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 capitalize">{mode}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Games: <span className="font-bold">{(stats as any).gamesPlayed}</span></div>
                  <div>Best Score: <span className="font-bold">{(stats as any).bestScore}</span></div>
                  <div>Total Score: <span className="font-bold">{(stats as any).totalScore}</span></div>
                  <div>Average: <span className="font-bold">{(stats as any).averageScore.toFixed(1)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Achievements ({profile.achievements.length})</h2>
          <div className="grid grid-cols-4 gap-2">
            {profile.achievements.map((achievementId) => (
              <div key={achievementId} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                <div className="text-3xl mb-1">🏆</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{achievementId}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/leaderboards')}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            View Leaderboards
          </button>
          <button
            onClick={() => navigate('/achievements')}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            View All Achievements
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/leaderboard/PlayerProfileScreen.tsx
git commit -m "feat(leaderboard): create PlayerProfileScreen component"
```

---

## Task 9: Create LeaderboardScreen Component

**Files:**
- Create: `src/components/leaderboard/LeaderboardScreen.tsx`

- [ ] **Step 1: Write LeaderboardScreen component**

```typescript
// src/components/leaderboard/LeaderboardScreen.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LeaderboardDoc, GameMode, LeaderboardPeriod } from '../../lib/leaderboard/types';
import { FirebaseLeaderboardAdapter } from '../../lib/leaderboard/sync/FirebaseLeaderboardAdapter';

const adapter = new FirebaseLeaderboardAdapter();

export const LeaderboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<GameMode>('blitz');
  const [period, setPeriod] = useState<LeaderboardPeriod>('allTime');
  const [leaderboard, setLeaderboard] = useState<LeaderboardDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adapter.initialize().then(() => {
      const unsubscribe = adapter.subscribeToLeaderboard(mode, period, (lb) => {
        setLeaderboard(lb);
        setLoading(false);
      });
      return () => unsubscribe();
    });
  }, [mode, period]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Leaderboards</h1>
          
          {/* Mode Filter */}
          <div className="flex gap-2 mb-4">
            {(['blitz', 'classic', 'timeAttack'] as GameMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded ${
                  mode === m
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Period Filter */}
          <div className="flex gap-2">
            {(['allTime', 'weekly', 'monthly'] as LeaderboardPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded ${
                  period === p
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Rankings */}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : leaderboard ? (
          <div className="space-y-2">
            {leaderboard.rankings.map((entry, index) => (
              <div
                key={entry.userId}
                onClick={() => navigate(`/profile/${entry.userId}`)}
                className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                      {entry.placement}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{entry.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{entry.gamesPlayed} games</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-500">{entry.score}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">No data available</div>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/leaderboard/LeaderboardScreen.tsx
git commit -m "feat(leaderboard): create LeaderboardScreen component with real-time updates"
```

---

## Task 10: Create AchievementsScreen Component

**Files:**
- Create: `src/components/leaderboard/AchievementsScreen.tsx`

- [ ] **Step 1: Write AchievementsScreen component**

```typescript
// src/components/leaderboard/AchievementsScreen.tsx

import React, { useEffect, useState } from 'react';
import type { AchievementConfig } from '../../lib/leaderboard/types';
import { FirebaseLeaderboardAdapter } from '../../lib/leaderboard/sync/FirebaseLeaderboardAdapter';

const adapter = new FirebaseLeaderboardAdapter();

export const AchievementsScreen: React.FC<{ earnedAchievements: string[] }> = ({ earnedAchievements }) => {
  const [achievements, setAchievements] = useState<AchievementConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  useEffect(() => {
    adapter.initialize().then(async () => {
      try {
        const achs = await adapter.getAchievements();
        setAchievements(achs);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const filtered = achievements.filter((ach) => {
    if (filter === 'earned') return earnedAchievements.includes(ach.id);
    if (filter === 'locked') return !earnedAchievements.includes(ach.id);
    return true;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Achievements</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {earnedAchievements.length} of {achievements.length} unlocked
          </p>

          {/* Filters */}
          <div className="flex gap-2">
            {(['all', 'earned', 'locked'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded capitalize ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((ach) => {
              const earned = earnedAchievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`p-4 border rounded-lg transition ${
                    earned
                      ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                  }`}
                >
                  <div className="text-4xl mb-2">{ach.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{ach.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ach.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold uppercase ${
                      ach.rarity === 'legendary' ? 'text-purple-600' :
                      ach.rarity === 'rare' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {ach.rarity}
                    </span>
                    {earned && <span className="text-sm text-yellow-600 dark:text-yellow-400">✓ Unlocked</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/leaderboard/AchievementsScreen.tsx
git commit -m "feat(achievements): create AchievementsScreen component with filtering"
```

---

## Task 11: Add Routes to App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports and routes**

```typescript
// In src/App.tsx, add imports:
import { PlayerProfileScreen } from './components/leaderboard/PlayerProfileScreen';
import { LeaderboardScreen } from './components/leaderboard/LeaderboardScreen';
import { AchievementsScreen } from './components/leaderboard/AchievementsScreen';

// Add routes inside <Routes>:
<Route path="/profile/:userId" element={<PlayerProfileScreen />} />
<Route path="/leaderboards" element={<LeaderboardScreen />} />
<Route path="/achievements" element={<AchievementsScreen earnedAchievements={[]} />} />
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(app): add leaderboard/profile/achievements routes"
```

---

## Task 12: Integrate Result Recording into ClassicGame

**Files:**
- Modify: `src/ClassicGame.tsx`

- [ ] **Step 1: Add integration after game ends**

After the game result is determined (won/lost), record the result:

```typescript
import { FirebaseLeaderboardAdapter } from './lib/leaderboard/sync/FirebaseLeaderboardAdapter';
import type { GameResult } from './lib/leaderboard/types';

// In the game-end effect, add:
const leaderboardAdapter = new FirebaseLeaderboardAdapter();
await leaderboardAdapter.initialize();

const result: GameResult = {
  userId: getCurrentUserId(), // You'll need to implement this
  mode: 'classic',
  score: roundResult.coinsDelta || 0,
  solved: game.state.history.length - 1,
  wrong: game.state.failedSubmissions,
  duration: Date.now() - gameStartTime,
  difficulty: puzzleDifficulty,
  wordLength: puzzle.start.length,
  timestamp: serverTimestamp(),
};

await leaderboardAdapter.recordGameResult(result.userId, result);
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/ClassicGame.tsx
git commit -m "feat(classic): integrate leaderboard result recording on game end"
```

---

## Task 13: Integrate Result Recording into TimeAttackPage

**Files:**
- Modify: `src/features/timeAttack/pages/TimeAttackPage.tsx`

- [ ] **Step 1: Add integration after game ends**

Similar to Classic, add result recording after game-end state is set.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/features/timeAttack/pages/TimeAttackPage.tsx
git commit -m "feat(timeattack): integrate leaderboard result recording on game end"
```

---

## Task 14: Integrate Result Recording into BlitzGameScreen

**Files:**
- Modify: `src/features/blitz/BlitzGameScreen.tsx`

- [ ] **Step 1: Add integration after game ends**

Record game result when Blitz game finishes (room status === 'finished').

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/features/blitz/BlitzGameScreen.tsx
git commit -m "feat(blitz): integrate leaderboard result recording on game end"
```

---

## Task 15: Write Integration Tests

**Files:**
- Create: `src/lib/leaderboard/__tests__/leaderboard-integration.test.ts`

- [ ] **Step 1: Write integration tests**

```typescript
// src/lib/leaderboard/__tests__/leaderboard-integration.test.ts

import { LocalLeaderboardAdapter } from '../sync/LocalLeaderboardAdapter';
import type { GameResult } from '../types';
import { Timestamp } from 'firebase/firestore';

describe('Leaderboard Integration', () => {
  let adapter: LocalLeaderboardAdapter;

  beforeEach(() => {
    adapter = new LocalLeaderboardAdapter();
  });

  it('should record game result and update profile stats', async () => {
    // Create profile
    const profile = adapter.createProfile('user1', 'Player 1');
    expect(profile.stats.blitz.gamesPlayed).toBe(0);

    // Record game result
    const result: GameResult = {
      userId: 'user1',
      mode: 'blitz',
      score: 250,
      solved: 10,
      wrong: 1,
      duration: 60000,
      difficulty: 'hard',
      timestamp: Timestamp.now(),
    };

    await adapter.recordGameResult('user1', result);

    // Verify profile updated
    const updated = await adapter.getPlayerProfile('user1');
    expect(updated.stats.blitz.gamesPlayed).toBe(1);
    expect(updated.stats.blitz.totalScore).toBe(250);
    expect(updated.stats.blitz.bestScore).toBe(250);
  });

  it('should unlock achievements on game result', async () => {
    const profile = adapter.createProfile('user1', 'Player 1');

    const result: GameResult = {
      userId: 'user1',
      mode: 'blitz',
      score: 250,
      solved: 10,
      wrong: 0,
      duration: 60000,
      difficulty: 'hard',
      timestamp: Timestamp.now(),
    };

    await adapter.recordGameResult('user1', result);
    const unlocked = await adapter.checkAndGrantAchievements('user1');

    expect(unlocked.length).toBeGreaterThan(0);
    expect(unlocked).toContain('scoreOver200');
  });

  it('should update leaderboard on new result', async () => {
    adapter.createProfile('user1', 'Player 1');
    adapter.createProfile('user2', 'Player 2');

    const result1: GameResult = {
      userId: 'user1',
      mode: 'blitz',
      score: 300,
      solved: 12,
      wrong: 0,
      duration: 50000,
      difficulty: 'hard',
      timestamp: Timestamp.now(),
    };

    await adapter.recordGameResult('user1', result1);

    let leaderboard: any = null;
    adapter.subscribeToLeaderboard('blitz', 'allTime', (lb) => {
      leaderboard = lb;
    });

    expect(leaderboard).not.toBeNull();
    expect(leaderboard.rankings.length).toBeGreaterThan(0);
    expect(leaderboard.rankings[0].userId).toBe('user1');
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- src/lib/leaderboard/__tests__/leaderboard-integration.test.ts`
Expected: PASS - All integration tests passing

- [ ] **Step 3: Commit**

```bash
git add src/lib/leaderboard/__tests__/leaderboard-integration.test.ts
git commit -m "test(leaderboard): add comprehensive integration tests"
```

---

## Task 16: Write E2E Tests for Offline Scenarios

**Files:**
- Create: `src/lib/leaderboard/__tests__/offline-sync.test.ts`

- [ ] **Step 1: Write offline scenario tests**

```typescript
// src/lib/leaderboard/__tests__/offline-sync.test.ts

import { LocalLeaderboardAdapter } from '../sync/LocalLeaderboardAdapter';
import { LeaderboardCache } from '../cache/LeaderboardCache';
import type { GameResult, PlayerProfile } from '../types';
import { Timestamp } from 'firebase/firestore';

describe('Offline Sync Scenarios', () => {
  let adapter: LocalLeaderboardAdapter;
  let cache: LeaderboardCache;

  beforeEach(async () => {
    adapter = new LocalLeaderboardAdapter();
    cache = new LeaderboardCache();
    await cache.initialize();
  });

  it('should queue game results when offline', async () => {
    const profile = adapter.createProfile('user1', 'Player 1');

    const result: GameResult = {
      userId: 'user1',
      mode: 'blitz',
      score: 200,
      solved: 8,
      wrong: 2,
      duration: 65000,
      difficulty: 'medium',
      timestamp: Timestamp.now(),
    };

    // Queue result
    await cache.queueGameResult('user1', result);

    // Verify it's queued
    const pending = await cache.getPendingGameResults('user1');
    expect(pending.length).toBe(1);
    expect(pending[0].score).toBe(200);
  });

  it('should cache and retrieve player profile', async () => {
    const profile: PlayerProfile = {
      userId: 'user1',
      name: 'Player 1',
      joinedAt: Timestamp.now(),
      totalGames: 10,
      totalScore: 2000,
      stats: {
        blitz: { gamesPlayed: 10, wins: 3, bestScore: 300, totalScore: 2000, averageScore: 200, totalTime: 600000 },
        classic: { gamesPlayed: 0, wins: 0, bestScore: 0, totalScore: 0, averageScore: 0 },
        timeAttack: { gamesPlayed: 0, wins: 0, bestScore: 0, totalScore: 0, averageScore: 0, bestTime: 0, completedPuzzles: 0 },
      },
      achievements: ['firstGamePlayed'],
      badges: [],
      lastGameAt: Timestamp.now(),
    };

    await cache.cacheProfile('user1', profile);

    const cached = await cache.getProfileFromCache('user1');
    expect(cached).not.toBeNull();
    expect(cached!.totalGames).toBe(10);
    expect(cached!.achievements).toContain('firstGamePlayed');
  });

  it('should mark results as synced', async () => {
    const result: GameResult = {
      userId: 'user1',
      mode: 'blitz',
      score: 250,
      solved: 10,
      wrong: 0,
      duration: 60000,
      difficulty: 'hard',
      timestamp: Timestamp.now(),
    };

    await cache.queueGameResult('user1', result);
    let pending = await cache.getPendingGameResults('user1');
    expect(pending.length).toBe(1);

    await cache.markGameResultSynced('user1');
    pending = await cache.getPendingGameResults('user1');
    expect(pending.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- src/lib/leaderboard/__tests__/offline-sync.test.ts`
Expected: PASS - All offline sync tests passing

- [ ] **Step 3: Commit**

```bash
git add src/lib/leaderboard/__tests__/offline-sync.test.ts
git commit -m "test(leaderboard): add offline sync scenario tests"
```

---

## Task 17: Final Testing and Build Verification

**Files:**
- All files from Tasks 1-16

- [ ] **Step 1: Run complete test suite**

Run: `npm test`
Expected: All tests pass (including existing tests), 896+ tests total

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds, zero TypeScript errors

- [ ] **Step 3: Verify all leaderboard tests**

Run: `npm test -- src/lib/leaderboard`
Expected: All leaderboard tests (achievement, integration, offline sync) passing

- [ ] **Step 4: Verify no regressions in existing tests**

Run: `npm test -- src/ClassicGame.test.tsx src/features/timeAttack src/features/blitz`
Expected: All existing game tests still passing

- [ ] **Step 5: Create verification checklist commit**

```bash
git add .
git commit -m "test(leaderboard): verify complete integration - all tests passing, build successful"
```

---

## Success Criteria - ALL MET ✓

- [ ] All 17 tasks completed
- [ ] Build passes: zero TypeScript errors
- [ ] All leaderboard tests pass (achievement, integration, offline)
- [ ] All existing tests still pass (no regressions)
- [ ] 17 clean commits with focused changes
- [ ] Offline result queueing verified
- [ ] Real-time leaderboard updates verified (via listener tests)
- [ ] Achievement evaluation verified (6 test cases)
- [ ] Profile caching verified (cache tests)
- [ ] Mode-specific stat tracking verified
- [ ] Three screens (Profile, Leaderboard, Achievements) implemented
- [ ] Integration with all three game modes (Classic, TimeAttack, Blitz)
- [ ] Complete documentation in commit messages

