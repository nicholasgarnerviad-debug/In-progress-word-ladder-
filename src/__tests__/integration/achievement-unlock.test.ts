/**
 * Achievement Unlock Integration Tests
 * Tests complete achievement unlock flow from game result through profile update
 */

import { LocalLeaderboardAdapter } from '../../lib/leaderboard/sync/LocalLeaderboardAdapter';
import type { GameResult } from '../../lib/leaderboard/types';
import { Timestamp } from 'firebase/firestore';

describe('Achievement Unlock Flow', () => {
  let adapter: LocalLeaderboardAdapter;

  beforeEach(() => {
    adapter = new LocalLeaderboardAdapter();
  });

  afterEach(() => {
    adapter.reset();
  });

  describe('Grant achievement and update profile', () => {
    test('grants achievement and updates profile', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Achievement Hunter');

      // Record first game
      const result: GameResult = {
        userId,
        mode: 'classic',
        score: 100,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      };

      await adapter.recordGameResult(userId, result);

      // Check achievements
      const profile = await adapter.getPlayerProfile(userId);
      const newAchievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Verify achievement was granted
      expect(newAchievements).toContain('firstGamePlayed');

      // Load profile and verify
      const updatedProfile = await adapter.getPlayerProfile(userId);
      expect(updatedProfile.achievements).toContain('firstGamePlayed');
      expect(updatedProfile.achievements.length).toBeGreaterThan(0);
    });

    test('prevents re-granting same achievement', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'No Duplicate Player');

      // Record first game
      const result: GameResult = {
        userId,
        mode: 'classic',
        score: 100,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      };

      await adapter.recordGameResult(userId, result);

      // Check and grant achievements first time
      const profile1 = await adapter.getPlayerProfile(userId);
      const firstCheck = await adapter.checkAndGrantAchievements(userId, profile1);

      expect(firstCheck).toContain('firstGamePlayed');
      expect(firstCheck.length).toBeGreaterThan(0);

      // Try to earn it again - should not re-grant
      const profile2 = await adapter.getPlayerProfile(userId);
      const secondCheck = await adapter.checkAndGrantAchievements(userId, profile2);

      expect(secondCheck).not.toContain('firstGamePlayed');
      expect(secondCheck.length).toBe(0);

      // Verify profile achievements only has firstGamePlayed once
      const finalProfile = await adapter.getPlayerProfile(userId);
      const firstGameCount = finalProfile.achievements.filter(
        (a) => a === 'firstGamePlayed'
      ).length;
      expect(firstGameCount).toBe(1);
    });

    test('grants achievement after single game result', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Quick Starter');

      const result: GameResult = {
        userId,
        mode: 'blitz',
        score: 150,
        solved: true,
        wrong: 0,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      };

      await adapter.recordGameResult(userId, result);

      const profile = await adapter.getPlayerProfile(userId);
      const newAchievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Should have firstGamePlayed
      expect(newAchievements.length).toBeGreaterThan(0);
      expect(newAchievements).toContain('firstGamePlayed');

      // Profile should be updated
      const updatedProfile = await adapter.getPlayerProfile(userId);
      expect(updatedProfile.achievements.includes('firstGamePlayed')).toBe(true);
    });
  });

  describe('Grant multiple achievements', () => {
    test('grants multiple achievements in one game', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Multi-Achiever');

      // Record game that meets multiple criteria
      const result: GameResult = {
        userId,
        mode: 'classic',
        score: 250,
        solved: true,
        wrong: 0,
        duration: 60000,
        difficulty: 'hard',
        timestamp: Timestamp.now(),
      };

      await adapter.recordGameResult(userId, result);

      // Check achievements
      const profile = await adapter.getPlayerProfile(userId);
      const achievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Should get multiple achievements
      expect(achievements.length).toBeGreaterThan(1);
      expect(achievements).toContain('firstGamePlayed');
      expect(achievements).toContain('scoreOver200');
    });

    test('grants mode-specific achievements', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Blitz Expert');

      // Play blitz game with high score
      const result: GameResult = {
        userId,
        mode: 'blitz',
        score: 150,
        solved: true,
        wrong: 0,
        duration: 60000,
        difficulty: 'hard',
        timestamp: Timestamp.now(),
      };

      await adapter.recordGameResult(userId, result);

      const profile = await adapter.getPlayerProfile(userId);
      const achievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Should have blitz-specific achievement
      expect(achievements).toContain('blitzScore150');
      expect(achievements).toContain('firstGamePlayed');
    });

    test('accumulates achievements across multiple games', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Accumulator');

      // Game 1: First game + high score
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'classic',
        score: 200,
        solved: true,
        wrong: 0,
        duration: 60000,
        difficulty: 'medium',
        timestamp: Timestamp.now(),
      });

      const profile1 = await adapter.getPlayerProfile(userId);
      const achievements1 = await adapter.checkAndGrantAchievements(userId, profile1);
      expect(achievements1).toContain('firstGamePlayed');
      expect(achievements1).toContain('scoreOver200');

      // Games 2-9: Play to reach 10 games
      for (let i = 2; i <= 9; i++) {
        await adapter.recordGameResult(userId, {
          userId,
          mode: 'classic',
          score: 100 + i * 10,
          solved: true,
          wrong: 1,
          duration: 60000,
          difficulty: 'easy',
          timestamp: Timestamp.now(),
        });
      }

      const profile2 = await adapter.getPlayerProfile(userId);
      const achievements2 = await adapter.checkAndGrantAchievements(userId, profile2);

      // Should not contain previously earned achievements
      expect(achievements2).not.toContain('firstGamePlayed');
      expect(achievements2).not.toContain('scoreOver200');

      // Game 10: Reach 10 games in classic
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'classic',
        score: 150,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      });

      const profile3 = await adapter.getPlayerProfile(userId);
      const achievements3 = await adapter.checkAndGrantAchievements(userId, profile3);

      // Should unlock tenGamesClassic
      expect(achievements3).toContain('tenGamesClassic');

      // Profile should have all earned achievements
      const finalProfile = await adapter.getPlayerProfile(userId);
      expect(finalProfile.achievements).toContain('firstGamePlayed');
      expect(finalProfile.achievements).toContain('scoreOver200');
      expect(finalProfile.achievements).toContain('tenGamesClassic');
    });
  });

  describe('Achievement progression', () => {
    test('tracks achievement progress for in-progress achievements', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Progress Tracker');

      // Play games 1-5 in classic mode
      for (let i = 1; i <= 5; i++) {
        await adapter.recordGameResult(userId, {
          userId,
          mode: 'classic',
          score: 100,
          solved: true,
          wrong: 1,
          duration: 60000,
          difficulty: 'easy',
          timestamp: Timestamp.now(),
        });
      }

      let profile = await adapter.getPlayerProfile(userId);
      expect(profile.stats.classic.gamesPlayed).toBe(5);

      // Check achievements - should not have tenGamesClassic yet
      let achievements = await adapter.checkAndGrantAchievements(userId, profile);
      expect(achievements).not.toContain('tenGamesClassic');

      // Play games 6-10
      for (let i = 6; i <= 10; i++) {
        await adapter.recordGameResult(userId, {
          userId,
          mode: 'classic',
          score: 100,
          solved: true,
          wrong: 1,
          duration: 60000,
          difficulty: 'easy',
          timestamp: Timestamp.now(),
        });
      }

      profile = await adapter.getPlayerProfile(userId);
      expect(profile.stats.classic.gamesPlayed).toBe(10);

      // Check achievements - should now have tenGamesClassic
      achievements = await adapter.checkAndGrantAchievements(userId, profile);
      expect(achievements).toContain('tenGamesClassic');
    });

    test('tracks progress toward score thresholds', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Score Climber');

      // Play game with score 150 (under 200 threshold)
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'classic',
        score: 150,
        solved: true,
        wrong: 2,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      });

      let profile = await adapter.getPlayerProfile(userId);
      let achievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Should not have scoreOver200 yet
      expect(achievements).not.toContain('scoreOver200');
      expect(profile.stats.classic.bestScore).toBe(150);

      // Play game with score 250 (exceeds 200 threshold)
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'classic',
        score: 250,
        solved: true,
        wrong: 0,
        duration: 60000,
        difficulty: 'hard',
        timestamp: Timestamp.now(),
      });

      profile = await adapter.getPlayerProfile(userId);
      achievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Should now have scoreOver200
      expect(achievements).toContain('scoreOver200');
      expect(profile.stats.classic.bestScore).toBe(250);
    });

    test('maintains separate progress per game mode', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Multi-Mode Progress');

      // Play 10 blitz games
      for (let i = 1; i <= 10; i++) {
        await adapter.recordGameResult(userId, {
          userId,
          mode: 'blitz',
          score: 100,
          solved: true,
          wrong: 0,
          duration: 60000,
          difficulty: 'easy',
          timestamp: Timestamp.now(),
        });
      }

      let profile = await adapter.getPlayerProfile(userId);
      let achievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Should unlock tenGamesBlitz
      expect(achievements).toContain('tenGamesBlitz');
      expect(profile.stats.blitz.gamesPlayed).toBe(10);

      // Play 5 classic games (not yet at 10)
      for (let i = 1; i <= 5; i++) {
        await adapter.recordGameResult(userId, {
          userId,
          mode: 'classic',
          score: 100,
          solved: true,
          wrong: 0,
          duration: 60000,
          difficulty: 'easy',
          timestamp: Timestamp.now(),
        });
      }

      profile = await adapter.getPlayerProfile(userId);
      achievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Should not have tenGamesClassic yet
      expect(achievements).not.toContain('tenGamesClassic');
      expect(profile.stats.classic.gamesPlayed).toBe(5);

      // Play 5 more classic games
      for (let i = 6; i <= 10; i++) {
        await adapter.recordGameResult(userId, {
          userId,
          mode: 'classic',
          score: 100,
          solved: true,
          wrong: 0,
          duration: 60000,
          difficulty: 'easy',
          timestamp: Timestamp.now(),
        });
      }

      profile = await adapter.getPlayerProfile(userId);
      achievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Should now have tenGamesClassic
      expect(achievements).toContain('tenGamesClassic');
      expect(profile.stats.classic.gamesPlayed).toBe(10);
    });
  });

  describe('Prevent re-granting achievements', () => {
    test('same achievement cannot be granted twice', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'No Dupes');

      // Record first game
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'classic',
        score: 100,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      });

      // First check - grant achievement
      const profile1 = await adapter.getPlayerProfile(userId);
      const firstGrant = await adapter.checkAndGrantAchievements(userId, profile1);
      expect(firstGrant).toContain('firstGamePlayed');

      // Manually verify it was added to profile
      const checkProfile = await adapter.getPlayerProfile(userId);
      expect(checkProfile.achievements).toContain('firstGamePlayed');

      // Second check - should not grant again
      const profile2 = await adapter.getPlayerProfile(userId);
      const secondGrant = await adapter.checkAndGrantAchievements(userId, profile2);
      expect(secondGrant).not.toContain('firstGamePlayed');

      // Profile should still only have it once
      const finalProfile = await adapter.getPlayerProfile(userId);
      const firstGameCount = finalProfile.achievements.filter(
        (a) => a === 'firstGamePlayed'
      ).length;
      expect(firstGameCount).toBe(1);
    });

    test('duplicate check works across multiple achievement types', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Multi-Achievement Dedup');

      // Play game that unlocks multiple achievements
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'classic',
        score: 250,
        solved: true,
        wrong: 0,
        duration: 60000,
        difficulty: 'hard',
        timestamp: Timestamp.now(),
      });

      // First check
      const profile1 = await adapter.getPlayerProfile(userId);
      const firstCheck = await adapter.checkAndGrantAchievements(userId, profile1);
      expect(firstCheck).toContain('firstGamePlayed');
      expect(firstCheck).toContain('scoreOver200');

      const initialCount = firstCheck.length;

      // Second check
      const profile2 = await adapter.getPlayerProfile(userId);
      const secondCheck = await adapter.checkAndGrantAchievements(userId, profile2);

      // Should not grant any duplicate achievements
      expect(secondCheck.length).toBe(0);

      // Profile should have exact achievements from first check, no duplicates
      const finalProfile = await adapter.getPlayerProfile(userId);
      expect(finalProfile.achievements.length).toBe(initialCount);
      expect(finalProfile.achievements).toEqual(expect.arrayContaining(firstCheck));
    });

    test('re-checking after new game does not re-grant old achievements', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'New Game Dedup');

      // Game 1: Unlock firstGamePlayed
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'classic',
        score: 100,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      });

      const profile1 = await adapter.getPlayerProfile(userId);
      const check1 = await adapter.checkAndGrantAchievements(userId, profile1);
      expect(check1).toContain('firstGamePlayed');

      // Game 2: Play another game
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'classic',
        score: 150,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      });

      const profile2 = await adapter.getPlayerProfile(userId);
      const check2 = await adapter.checkAndGrantAchievements(userId, profile2);

      // Should not re-grant firstGamePlayed
      expect(check2).not.toContain('firstGamePlayed');

      // But profile should still have it
      const finalProfile = await adapter.getPlayerProfile(userId);
      expect(finalProfile.achievements).toContain('firstGamePlayed');
    });
  });

  describe('Achievement rarity tiers', () => {
    test('tracks achievement rarity tiers', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Rarity Tracker');

      // Record games progressively to unlock different rarity tiers
      for (let i = 0; i < 10; i++) {
        await adapter.recordGameResult(userId, {
          userId,
          mode: 'classic',
          score: 100 + i * 10,
          solved: true,
          wrong: 1,
          duration: 60000,
          difficulty: 'easy',
          timestamp: Timestamp.now(),
        });
      }

      // Check achievements
      const profile = await adapter.getPlayerProfile(userId);
      const achievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Should have common and rare achievements
      expect(achievements).toContain('firstGamePlayed'); // common
      expect(achievements).toContain('tenGamesClassic'); // rare (common rarity actually, but in common achievement list)
    });

    test('grants common tier achievement on first game', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Common Achiever');

      await adapter.recordGameResult(userId, {
        userId,
        mode: 'blitz',
        score: 100,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        timestamp: Timestamp.now(),
      });

      const profile = await adapter.getPlayerProfile(userId);
      const achievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Common achievement should be granted
      expect(achievements).toContain('firstGamePlayed');
    });

    test('progresses from common to rare achievements', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Tier Progressor');

      // Play 50 games total
      for (let i = 0; i < 50; i++) {
        await adapter.recordGameResult(userId, {
          userId,
          mode: 'classic',
          score: 100,
          solved: true,
          wrong: 1,
          duration: 60000,
          difficulty: 'easy',
          timestamp: Timestamp.now(),
        });
      }

      const profile = await adapter.getPlayerProfile(userId);
      const achievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Should have rare achievement for 50 games
      expect(achievements).toContain('fiftyGames');

      // Should not have legendary yet
      expect(achievements).not.toContain('fiveHundredGames');
    });

    test('unlocks rare achievements after common achievements', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Sequential Unlocker');

      // Play 10 games to unlock common achievement
      for (let i = 0; i < 10; i++) {
        await adapter.recordGameResult(userId, {
          userId,
          mode: 'blitz',
          score: 100,
          solved: true,
          wrong: 1,
          duration: 60000,
          difficulty: 'easy',
          timestamp: Timestamp.now(),
        });
      }

      let profile = await adapter.getPlayerProfile(userId);
      let achievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Should have tenGamesBlitz (common tier)
      expect(achievements).toContain('tenGamesBlitz');

      // Play 40 more games for 50 total
      for (let i = 10; i < 50; i++) {
        await adapter.recordGameResult(userId, {
          userId,
          mode: 'blitz',
          score: 100,
          solved: true,
          wrong: 1,
          duration: 60000,
          difficulty: 'easy',
          timestamp: Timestamp.now(),
        });
      }

      profile = await adapter.getPlayerProfile(userId);
      achievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Should have fiftyGames (rare tier)
      expect(achievements).toContain('fiftyGames');

      // Profile should now have both
      const finalProfile = await adapter.getPlayerProfile(userId);
      expect(finalProfile.achievements).toContain('tenGamesBlitz');
      expect(finalProfile.achievements).toContain('fiftyGames');
    });
  });

  describe('Integration with leaderboard', () => {
    test('achievements granted do not interfere with leaderboard updates', async () => {
      const userId = 'user1';
      adapter.createProfile(userId, 'Leaderboard Player');

      // Subscribe to leaderboard
      const leaderboardUpdates: any[] = [];
      adapter.subscribeToLeaderboard('classic', 'allTime', (lb) => {
        leaderboardUpdates.push(lb);
      });

      // Record game that grants achievement
      await adapter.recordGameResult(userId, {
        userId,
        mode: 'classic',
        score: 250,
        solved: true,
        wrong: 0,
        duration: 60000,
        difficulty: 'hard',
        timestamp: Timestamp.now(),
      });

      // Check achievements
      const profile = await adapter.getPlayerProfile(userId);
      const achievements = await adapter.checkAndGrantAchievements(userId, profile);

      // Both should succeed
      expect(achievements.length).toBeGreaterThan(0);
      expect(leaderboardUpdates.length).toBeGreaterThan(0);

      // Leaderboard should have player
      const leaderboard = leaderboardUpdates[leaderboardUpdates.length - 1];
      expect(leaderboard.rankings[0].userId).toBe(userId);
      expect(leaderboard.rankings[0].score).toBe(250);
    });
  });
});
