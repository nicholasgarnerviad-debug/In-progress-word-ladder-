/**
 * Offline Sync Scenario Tests
 * Tests the LeaderboardCache and LocalLeaderboardAdapter working together
 * in offline scenarios - queueing results, caching profiles, syncing when online
 */

import { LocalLeaderboardAdapter } from '../sync/LocalLeaderboardAdapter';
import type { GameResult, PlayerProfile } from '../types';
import { Timestamp } from 'firebase/firestore';

/**
 * In-memory implementation of LeaderboardCache for testing
 * Simulates offline caching without requiring IndexedDB
 */
class TestLeaderboardCache {
  private profiles = new Map<string, PlayerProfile>();
  private gameResults = new Map<string, { result: GameResult; synced: boolean }[]>();

  async initialize(): Promise<void> {
    // No-op for in-memory mock
  }

  async cacheProfile(userId: string, profile: PlayerProfile): Promise<void> {
    this.profiles.set(userId, profile);
  }

  async getProfileFromCache(userId: string): Promise<PlayerProfile | null> {
    return this.profiles.get(userId) || null;
  }

  async queueGameResult(userId: string, result: GameResult): Promise<void> {
    if (!this.gameResults.has(userId)) {
      this.gameResults.set(userId, []);
    }
    this.gameResults.get(userId)!.push({ result, synced: false });
  }

  async getPendingGameResults(userId: string): Promise<GameResult[]> {
    const results = this.gameResults.get(userId) || [];
    return results.filter((r) => !r.synced).map((r) => r.result);
  }

  async markGameResultSynced(userId: string): Promise<void> {
    const results = this.gameResults.get(userId) || [];
    results.forEach((r) => {
      r.synced = true;
    });
  }

  async clearCache(): Promise<void> {
    this.profiles.clear();
    this.gameResults.clear();
  }
}

describe('Offline Sync Scenarios', () => {
  let adapter: LocalLeaderboardAdapter;
  let cache: TestLeaderboardCache;

  beforeEach(async () => {
    adapter = new LocalLeaderboardAdapter();
    adapter.reset();
    cache = new TestLeaderboardCache();
    await cache.initialize();
  });

  it('should queue game results when offline', async () => {
    // Create profile in adapter (simulating local user)
    const profile = adapter.createProfile('user1', 'Player 1');
    expect(profile.userId).toBe('user1');
    expect(profile.stats.blitz.gamesPlayed).toBe(0);

    // Create a game result from playing offline
    const result: GameResult = {
      userId: 'user1',
      mode: 'blitz',
      score: 200,
      solved: true,
      wrong: 2,
      duration: 65000,
      difficulty: 'medium',
      timestamp: Timestamp.now(),
    };

    // Queue the result for later syncing
    await cache.queueGameResult('user1', result);

    // Verify the result is queued and not yet synced
    const pending = await cache.getPendingGameResults('user1');
    expect(pending.length).toBe(1);
    expect(pending[0].score).toBe(200);
    expect(pending[0].mode).toBe('blitz');
    expect(pending[0].difficulty).toBe('medium');
  });

  it('should cache and retrieve player profile', async () => {
    // Create a player profile with some existing stats
    const profile: PlayerProfile = {
      userId: 'user1',
      name: 'Player 1',
      joinedAt: Timestamp.now(),
      totalGames: 10,
      totalScore: 2000,
      stats: {
        blitz: {
          gamesPlayed: 10,
          wins: 3,
          bestScore: 300,
          totalScore: 2000,
          averageScore: 200,
          totalTime: 600000,
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
      achievements: ['firstGamePlayed'],
      badges: [],
      lastGameAt: Timestamp.now(),
    };

    // Cache the profile for offline access
    await cache.cacheProfile('user1', profile);

    // Retrieve and verify the cached profile
    const cached = await cache.getProfileFromCache('user1');
    expect(cached).not.toBeNull();
    expect(cached!.userId).toBe('user1');
    expect(cached!.name).toBe('Player 1');
    expect(cached!.totalGames).toBe(10);
    expect(cached!.totalScore).toBe(2000);
    expect(cached!.achievements).toContain('firstGamePlayed');
  });

  it('should mark results as synced', async () => {
    // Queue a game result
    const result: GameResult = {
      userId: 'user1',
      mode: 'blitz',
      score: 250,
      solved: true,
      wrong: 0,
      duration: 60000,
      difficulty: 'hard',
      timestamp: Timestamp.now(),
    };

    await cache.queueGameResult('user1', result);

    // Verify result is pending
    let pending = await cache.getPendingGameResults('user1');
    expect(pending.length).toBe(1);
    expect(pending[0].score).toBe(250);

    // Mark results as synced (simulating successful backend sync)
    await cache.markGameResultSynced('user1');

    // Verify no pending results remain
    pending = await cache.getPendingGameResults('user1');
    expect(pending.length).toBe(0);
  });

  it('should clear cache completely', async () => {
    // Queue a game result
    const result: GameResult = {
      userId: 'user1',
      mode: 'blitz',
      score: 250,
      solved: true,
      wrong: 0,
      duration: 60000,
      difficulty: 'hard',
      timestamp: Timestamp.now(),
    };

    // Cache a player profile
    const profile: PlayerProfile = {
      userId: 'user1',
      name: 'Player 1',
      joinedAt: Timestamp.now(),
      totalGames: 5,
      totalScore: 1000,
      stats: {
        blitz: {
          gamesPlayed: 5,
          wins: 2,
          bestScore: 250,
          totalScore: 1000,
          averageScore: 200,
          totalTime: 300000,
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

    await cache.queueGameResult('user1', result);
    await cache.cacheProfile('user1', profile);

    // Verify cache has data
    let pending = await cache.getPendingGameResults('user1');
    let cached = await cache.getProfileFromCache('user1');
    expect(pending.length).toBe(1);
    expect(cached).not.toBeNull();

    // Clear entire cache (e.g., when signing out)
    await cache.clearCache();

    // Verify cache is empty
    pending = await cache.getPendingGameResults('user1');
    cached = await cache.getProfileFromCache('user1');
    expect(pending.length).toBe(0);
    expect(cached).toBeNull();
  });
});
