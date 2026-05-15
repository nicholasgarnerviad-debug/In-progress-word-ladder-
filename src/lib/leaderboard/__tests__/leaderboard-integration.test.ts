import { LocalLeaderboardAdapter } from '../sync/LocalLeaderboardAdapter';
import type { GameResult } from '../types';
import { Timestamp } from 'firebase/firestore';

describe('Leaderboard Integration', () => {
  let adapter: LocalLeaderboardAdapter;

  beforeEach(() => {
    adapter = new LocalLeaderboardAdapter();
    adapter.reset();
  });

  it('should record game result and update profile stats', async () => {
    const profile = adapter.createProfile('user1', 'Player 1');
    expect(profile.stats.blitz.gamesPlayed).toBe(0);

    const result: GameResult = {
      userId: 'user1',
      mode: 'blitz',
      score: 250,
      solved: true,
      wrong: 1,
      duration: 60000,
      difficulty: 'hard',
      timestamp: Timestamp.now(),
    };

    await adapter.recordGameResult('user1', result);

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
      solved: true,
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

    let leaderboard: any = null;
    adapter.subscribeToLeaderboard('blitz', 'allTime', (lb) => {
      leaderboard = lb;
    });

    const result1: GameResult = {
      userId: 'user1',
      mode: 'blitz',
      score: 300,
      solved: true,
      wrong: 0,
      duration: 50000,
      difficulty: 'hard',
      timestamp: Timestamp.now(),
    };

    await adapter.recordGameResult('user1', result1);

    expect(leaderboard).not.toBeNull();
    expect(leaderboard.rankings.length).toBeGreaterThan(0);
    expect(leaderboard.rankings[0].userId).toBe('user1');
  });
});
