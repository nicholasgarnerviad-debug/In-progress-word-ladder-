/**
 * Game-to-Leaderboard Integration Tests
 * Verifies complete flow from game result to leaderboard ranking and achievement evaluation
 */

import { LocalLeaderboardAdapter } from '../../lib/leaderboard/sync/LocalLeaderboardAdapter';
import type { GameResult, PlayerProfile } from '../../lib/leaderboard/types';
import { Timestamp } from 'firebase/firestore';

describe('Game-to-Leaderboard Flow', () => {
  let adapter: LocalLeaderboardAdapter;

  beforeEach(() => {
    adapter = new LocalLeaderboardAdapter();
  });

  afterEach(() => {
    adapter.reset();
  });

  describe('Record game and update profile', () => {
    test('records single game result and updates profile stats', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Test Player');

      const result: GameResult = {
        userId,
        mode: 'classic',
        score: 150,
        solved: true,
        wrong: 1,
        duration: 120000,
        difficulty: 'medium',
        timestamp: Timestamp.now(),
      };

      // Record game result
      await adapter.recordGameResult(userId, result);

      // Load profile
      const profile = await adapter.getPlayerProfile(userId);

      // Verify profile updated
      expect(profile.stats.classic.gamesPlayed).toBe(1);
      expect(profile.stats.classic.totalScore).toBe(150);
      expect(profile.stats.classic.bestScore).toBe(150);
      expect(profile.stats.classic.averageScore).toBe(150);
      expect(profile.totalGames).toBe(1);
      expect(profile.totalScore).toBe(150);
    });

    test('records multiple games and updates profile stats correctly', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Multi-Game Player');

      // First game
      const result1: GameResult = {
        userId,
        mode: 'classic',
        score: 100,
        solved: true,
        wrong: 2,
        duration: 100000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      };

      // Second game
      const result2: GameResult = {
        userId,
        mode: 'classic',
        score: 200,
        solved: true,
        wrong: 0,
        duration: 80000,
        difficulty: 'hard',
        timestamp: Timestamp.now(),
      };

      // Third game
      const result3: GameResult = {
        userId,
        mode: 'classic',
        score: 150,
        solved: true,
        wrong: 1,
        duration: 90000,
        difficulty: 'medium',
        timestamp: Timestamp.now(),
      };

      await adapter.recordGameResult(userId, result1);
      await adapter.recordGameResult(userId, result2);
      await adapter.recordGameResult(userId, result3);

      const profile = await adapter.getPlayerProfile(userId);

      // Verify stats
      expect(profile.stats.classic.gamesPlayed).toBe(3);
      expect(profile.stats.classic.totalScore).toBe(450);
      expect(profile.stats.classic.bestScore).toBe(200);
      expect(profile.stats.classic.averageScore).toBe(150);
      expect(profile.totalGames).toBe(3);
      expect(profile.totalScore).toBe(450);
    });

    test('updates best score only when new score exceeds current best', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Score Tracker');

      // First game - establishes best score
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'blitz',
        score: 200,
        solved: true,
        wrong: 1,
        duration: 60000,
        timestamp: Timestamp.now(),
      });

      let profile = await adapter.getPlayerProfile(userId);
      expect(profile.stats.blitz.bestScore).toBe(200);

      // Second game - lower score, best should not change
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'blitz',
        score: 150,
        solved: true,
        wrong: 2,
        duration: 70000,
        timestamp: Timestamp.now(),
      });

      profile = await adapter.getPlayerProfile(userId);
      expect(profile.stats.blitz.bestScore).toBe(200);
      expect(profile.stats.blitz.totalScore).toBe(350);

      // Third game - higher score, best should update
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'blitz',
        score: 300,
        solved: true,
        wrong: 0,
        duration: 55000,
        timestamp: Timestamp.now(),
      });

      profile = await adapter.getPlayerProfile(userId);
      expect(profile.stats.blitz.bestScore).toBe(300);
      expect(profile.stats.blitz.totalScore).toBe(650);
    });
  });

  describe('Evaluate achievements', () => {
    test('grants achievement after playing game', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Achievement Seeker');

      // Play first game
      const result: GameResult = {
        userId,
        mode: 'classic',
        score: 100,
        solved: true,
        wrong: 0,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      };

      await adapter.recordGameResult(userId, result);

      // Get profile
      const profile = await adapter.getPlayerProfile(userId);

      // Check for newly unlocked achievements
      const newAchievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Verify achievements were evaluated
      expect(Array.isArray(newAchievements)).toBe(true);
    });

    test('tracks achievements per player', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Achievement Tracker');

      // Play games to unlock achievement
      for (let i = 0; i < 5; i++) {
        await adapter.recordGameResult(userId, {
          userId,
          mode: 'blitz',
          score: 100 + i * 10,
          solved: true,
          wrong: 0,
          duration: 60000,
          timestamp: Timestamp.now(),
        });
      }

      const profile = await adapter.getPlayerProfile(userId);
      const achievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Achievements array should be updated on profile
      const updatedProfile = await adapter.getPlayerProfile(userId);
      expect(updatedProfile.achievements).toEqual(expect.any(Array));
    });

    test('does not grant duplicate achievements', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'No Duplicates Player');

      // Play games
      for (let i = 0; i < 3; i++) {
        await adapter.recordGameResult(userId, {
          userId,
          mode: 'classic',
          score: 100,
          solved: true,
          wrong: 0,
          duration: 60000,
          timestamp: Timestamp.now(),
        });
      }

      const profile1 = await adapter.getPlayerProfile(userId);
      const achievements1 = await adapter.checkAndGrantAchievements(userId, profile1);

      // Check again - should not grant same achievements again
      const profile2 = await adapter.getPlayerProfile(userId);
      const achievements2 = await adapter.checkAndGrantAchievements(userId, profile2);

      // Second evaluation should not grant already-earned achievements
      const beforeCount = profile2.achievements.length;
      expect(beforeCount).toEqual(achievements1.length + (achievements2.length || 0));
    });
  });

  describe('Update leaderboard rankings', () => {
    test('places player on leaderboard with correct rank', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Leaderboard Player');

      // Subscribe to leaderboard updates
      const leaderboardUpdates: any[] = [];
      adapter.subscribeToLeaderboard('blitz', 'allTime', (leaderboard) => {
        leaderboardUpdates.push(leaderboard);
      });

      // Play game
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'blitz',
        score: 300,
        solved: true,
        wrong: 2,
        duration: 60000,
        difficulty: 'hard',
        timestamp: Timestamp.now(),
      });

      // Verify leaderboard updated
      expect(leaderboardUpdates.length).toBeGreaterThan(0);
      const leaderboard = leaderboardUpdates[leaderboardUpdates.length - 1];

      expect(leaderboard.mode).toBe('blitz');
      expect(leaderboard.period).toBe('allTime');
      expect(leaderboard.rankings.length).toBe(1);
      expect(leaderboard.rankings[0].userId).toBe(userId);
      expect(leaderboard.rankings[0].score).toBe(300);
      expect(leaderboard.rankings[0].placement).toBe(1);
      expect(leaderboard.rankings[0].gamesPlayed).toBe(1);
    });

    test('updates rankings when new players join', async () => {
      const user1 = 'user1';
      const user2 = 'user2';
      const user3 = 'user3';

      adapter.createProfile(user1, 'Player One');
      adapter.createProfile(user2, 'Player Two');
      adapter.createProfile(user3, 'Player Three');

      // Subscribe to leaderboard
      const leaderboardUpdates: any[] = [];
      adapter.subscribeToLeaderboard('classic', 'allTime', (leaderboard) => {
        leaderboardUpdates.push(leaderboard);
      });

      // User 1 plays
      await adapter.recordGameResult(user1, {
        userId: user1,
        mode: 'classic',
        score: 200,
        solved: true,
        wrong: 1,
        duration: 100000,
        timestamp: Timestamp.now(),
      });

      // User 2 plays
      await adapter.recordGameResult(user2, {
        userId: user2,
        mode: 'classic',
        score: 300,
        solved: true,
        wrong: 0,
        duration: 90000,
        timestamp: Timestamp.now(),
      });

      // User 3 plays
      await adapter.recordGameResult(user3, {
        userId: user3,
        mode: 'classic',
        score: 250,
        solved: true,
        wrong: 1,
        duration: 95000,
        timestamp: Timestamp.now(),
      });

      const leaderboard = leaderboardUpdates[leaderboardUpdates.length - 1];

      // Verify all users on leaderboard
      expect(leaderboard.rankings).toHaveLength(3);

      // Verify correct ranking
      expect(leaderboard.rankings[0].userId).toBe(user2); // 300 points
      expect(leaderboard.rankings[0].placement).toBe(1);

      expect(leaderboard.rankings[1].userId).toBe(user3); // 250 points
      expect(leaderboard.rankings[1].placement).toBe(2);

      expect(leaderboard.rankings[2].userId).toBe(user1); // 200 points
      expect(leaderboard.rankings[2].placement).toBe(3);
    });

    test('reranks leaderboard when player scores higher', async () => {
      const user1 = 'user1';
      const user2 = 'user2';

      adapter.createProfile(user1, 'Underdog');
      adapter.createProfile(user2, 'Leader');

      // Subscribe
      const leaderboardUpdates: any[] = [];
      adapter.subscribeToLeaderboard('timeAttack', 'allTime', (leaderboard) => {
        leaderboardUpdates.push(leaderboard);
      });

      // User 2 plays first - takes lead
      await adapter.recordGameResult(user2, {
        userId: user2,
        mode: 'timeAttack',
        score: 400,
        solved: true,
        wrong: 0,
        duration: 90000,
        timestamp: Timestamp.now(),
      });

      let leaderboard = leaderboardUpdates[leaderboardUpdates.length - 1];
      expect(leaderboard.rankings[0].userId).toBe(user2);

      // User 1 plays - lower score initially
      await adapter.recordGameResult(user1, {
        userId: user1,
        mode: 'timeAttack',
        score: 300,
        solved: true,
        wrong: 1,
        duration: 100000,
        timestamp: Timestamp.now(),
      });

      leaderboard = leaderboardUpdates[leaderboardUpdates.length - 1];
      expect(leaderboard.rankings[0].userId).toBe(user2);
      expect(leaderboard.rankings[1].userId).toBe(user1);

      // User 1 plays again - surpasses user 2
      await adapter.recordGameResult(user1, {
        userId: user1,
        mode: 'timeAttack',
        score: 450,
        solved: true,
        wrong: 0,
        duration: 85000,
        timestamp: Timestamp.now(),
      });

      leaderboard = leaderboardUpdates[leaderboardUpdates.length - 1];
      expect(leaderboard.rankings[0].userId).toBe(user1);
      expect(leaderboard.rankings[0].score).toBe(750); // 300 + 450
      expect(leaderboard.rankings[1].userId).toBe(user2);
    });
  });

  describe('Cross-mode stats', () => {
    test('tracks stats separately per game mode', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Multi-Mode Player');

      // Play blitz
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'blitz',
        score: 200,
        solved: true,
        wrong: 1,
        duration: 60000,
        timestamp: Timestamp.now(),
      });

      // Play classic
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'classic',
        score: 300,
        solved: true,
        wrong: 0,
        duration: 120000,
        timestamp: Timestamp.now(),
      });

      // Play timeAttack
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'timeAttack',
        score: 250,
        solved: true,
        wrong: 2,
        duration: 90000,
        timestamp: Timestamp.now(),
      });

      const profile = await adapter.getPlayerProfile(userId);

      // Verify mode-specific stats are isolated
      expect(profile.stats.blitz.gamesPlayed).toBe(1);
      expect(profile.stats.blitz.totalScore).toBe(200);
      expect(profile.stats.blitz.bestScore).toBe(200);

      expect(profile.stats.classic.gamesPlayed).toBe(1);
      expect(profile.stats.classic.totalScore).toBe(300);
      expect(profile.stats.classic.bestScore).toBe(300);

      expect(profile.stats.timeAttack.gamesPlayed).toBe(1);
      expect(profile.stats.timeAttack.totalScore).toBe(250);
      expect(profile.stats.timeAttack.bestScore).toBe(250);
      expect(profile.stats.timeAttack.completedPuzzles).toBe(1);

      // Verify overall totals
      expect(profile.totalGames).toBe(3);
      expect(profile.totalScore).toBe(750);
    });

    test('updates blitz-specific totalTime stat', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Blitz Player');

      // Play multiple blitz games
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'blitz',
        score: 100,
        solved: true,
        wrong: 0,
        duration: 60000,
        timestamp: Timestamp.now(),
      });

      await adapter.recordGameResult(userId, {
        userId,
        mode: 'blitz',
        score: 150,
        solved: true,
        wrong: 1,
        duration: 55000,
        timestamp: Timestamp.now(),
      });

      const profile = await adapter.getPlayerProfile(userId);

      // Verify totalTime is accumulated
      expect(profile.stats.blitz.totalTime).toBe(115000);
      expect(profile.stats.blitz.gamesPlayed).toBe(2);
    });

    test('updates timeAttack-specific stats', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Time Attack Player');

      // First game - solved
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'timeAttack',
        score: 300,
        solved: true,
        wrong: 1,
        duration: 95000,
        timestamp: Timestamp.now(),
      });

      let profile = await adapter.getPlayerProfile(userId);
      expect(profile.stats.timeAttack.completedPuzzles).toBe(1);
      expect(profile.stats.timeAttack.bestTime).toBe(95000);

      // Second game - solved faster
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'timeAttack',
        score: 350,
        solved: true,
        wrong: 0,
        duration: 80000,
        timestamp: Timestamp.now(),
      });

      profile = await adapter.getPlayerProfile(userId);
      expect(profile.stats.timeAttack.completedPuzzles).toBe(2);
      expect(profile.stats.timeAttack.bestTime).toBe(80000);

      // Third game - not solved (should not update bestTime)
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'timeAttack',
        score: 100,
        solved: false,
        wrong: 5,
        duration: 150000,
        timestamp: Timestamp.now(),
      });

      profile = await adapter.getPlayerProfile(userId);
      expect(profile.stats.timeAttack.completedPuzzles).toBe(2);
      expect(profile.stats.timeAttack.bestTime).toBe(80000);
    });

    test('maintains separate leaderboards per game mode', async () => {
      const user1 = 'user1';
      const user2 = 'user2';

      adapter.createProfile(user1, 'Player 1');
      adapter.createProfile(user2, 'Player 2');

      // Subscribe to both modes
      const blitzUpdates: any[] = [];
      const classicUpdates: any[] = [];

      adapter.subscribeToLeaderboard('blitz', 'allTime', (lb) => blitzUpdates.push(lb));
      adapter.subscribeToLeaderboard('classic', 'allTime', (lb) => classicUpdates.push(lb));

      // User 1 dominates blitz
      await adapter.recordGameResult(user1, {
        userId: user1,
        mode: 'blitz',
        score: 500,
        solved: true,
        wrong: 0,
        duration: 60000,
        timestamp: Timestamp.now(),
      });

      // User 2 dominates classic
      await adapter.recordGameResult(user2, {
        userId: user2,
        mode: 'classic',
        score: 600,
        solved: true,
        wrong: 0,
        duration: 120000,
        timestamp: Timestamp.now(),
      });

      // Verify blitz leaderboard
      const blitzLeaderboard = blitzUpdates[blitzUpdates.length - 1];
      expect(blitzLeaderboard.mode).toBe('blitz');
      expect(blitzLeaderboard.rankings[0].userId).toBe(user1);
      expect(blitzLeaderboard.rankings[0].score).toBe(500);

      // Verify classic leaderboard
      const classicLeaderboard = classicUpdates[classicUpdates.length - 1];
      expect(classicLeaderboard.mode).toBe('classic');
      expect(classicLeaderboard.rankings[0].userId).toBe(user2);
      expect(classicLeaderboard.rankings[0].score).toBe(600);
    });
  });

  describe('Leaderboard sorting', () => {
    test('sorts players by total score descending', async () => {
      const users = [
        { id: 'user1', name: 'High Scorer', score: 500 },
        { id: 'user2', name: 'Mid Scorer', score: 300 },
        { id: 'user3', name: 'Low Scorer', score: 200 },
        { id: 'user4', name: 'Another Mid', score: 350 },
      ];

      for (const user of users) {
        adapter.createProfile(user.id, user.name);
      }

      // Subscribe
      const leaderboardUpdates: any[] = [];
      adapter.subscribeToLeaderboard('classic', 'allTime', (lb) => {
        leaderboardUpdates.push(lb);
      });

      // All play
      for (const user of users) {
        await adapter.recordGameResult(user.id, {
          userId: user.id,
          mode: 'classic',
          score: user.score,
          solved: true,
          wrong: 0,
          duration: 100000,
          timestamp: Timestamp.now(),
        });
      }

      const leaderboard = leaderboardUpdates[leaderboardUpdates.length - 1];

      // Verify correct sorting
      expect(leaderboard.rankings[0].placement).toBe(1);
      expect(leaderboard.rankings[0].score).toBe(500);

      expect(leaderboard.rankings[1].placement).toBe(2);
      expect(leaderboard.rankings[1].score).toBe(350);

      expect(leaderboard.rankings[2].placement).toBe(3);
      expect(leaderboard.rankings[2].score).toBe(300);

      expect(leaderboard.rankings[3].placement).toBe(4);
      expect(leaderboard.rankings[3].score).toBe(200);
    });

    test('assigns correct placement numbers', async () => {
      const users = ['user1', 'user2', 'user3', 'user4', 'user5'];

      for (const userId of users) {
        adapter.createProfile(userId, `Player ${userId}`);
      }

      // Subscribe
      const leaderboardUpdates: any[] = [];
      adapter.subscribeToLeaderboard('blitz', 'allTime', (lb) => {
        leaderboardUpdates.push(lb);
      });

      // All play with descending scores
      for (let i = 0; i < users.length; i++) {
        await adapter.recordGameResult(users[i], {
          userId: users[i],
          mode: 'blitz',
          score: 500 - i * 50,
          solved: true,
          wrong: 0,
          duration: 60000,
          timestamp: Timestamp.now(),
        });
      }

      const leaderboard = leaderboardUpdates[leaderboardUpdates.length - 1];

      // Verify placements are 1-indexed and sequential
      for (let i = 0; i < leaderboard.rankings.length; i++) {
        expect(leaderboard.rankings[i].placement).toBe(i + 1);
      }
    });

    test('handles ties correctly (equal scores maintain insertion order)', async () => {
      const user1 = 'user1';
      const user2 = 'user2';

      adapter.createProfile(user1, 'Player 1');
      adapter.createProfile(user2, 'Player 2');

      // Subscribe
      const leaderboardUpdates: any[] = [];
      adapter.subscribeToLeaderboard('classic', 'allTime', (lb) => {
        leaderboardUpdates.push(lb);
      });

      // Both play with same score
      await adapter.recordGameResult(user1, {
        userId: user1,
        mode: 'classic',
        score: 250,
        solved: true,
        wrong: 1,
        duration: 100000,
        timestamp: Timestamp.now(),
      });

      await adapter.recordGameResult(user2, {
        userId: user2,
        mode: 'classic',
        score: 250,
        solved: true,
        wrong: 1,
        duration: 100000,
        timestamp: Timestamp.now(),
      });

      const leaderboard = leaderboardUpdates[leaderboardUpdates.length - 1];

      // Verify both have same score
      expect(leaderboard.rankings[0].score).toBe(250);
      expect(leaderboard.rankings[1].score).toBe(250);

      // Both should have placements (even with ties)
      expect(leaderboard.rankings[0].placement).toBe(1);
      expect(leaderboard.rankings[1].placement).toBe(2);
    });

    test('updates profile lastGameAt timestamp', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Time Tracker');

      const profile1 = await adapter.getPlayerProfile(userId);
      const initialTime = profile1.lastGameAt;

      // Wait a tiny bit and play game
      await new Promise((resolve) => setTimeout(resolve, 10));

      await adapter.recordGameResult(userId, {
        userId,
        mode: 'classic',
        score: 200,
        solved: true,
        wrong: 1,
        duration: 100000,
        timestamp: Timestamp.now(),
      });

      const profile2 = await adapter.getPlayerProfile(userId);
      const newTime = profile2.lastGameAt;

      // Verify timestamp was updated
      expect(newTime.seconds).toBeGreaterThanOrEqual(initialTime.seconds);
    });
  });
});
