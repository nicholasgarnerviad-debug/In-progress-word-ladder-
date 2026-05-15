import { AchievementEvaluator } from '../achievements/AchievementEvaluator';
import type { PlayerProfile } from '../types';

// Mock Timestamp since Firebase isn't installed in test environment
const mockTimestamp = {
  now: () => ({
    toMillis: () => Date.now(),
  }),
};

describe('AchievementEvaluator', () => {
  let evaluator: AchievementEvaluator;
  let baseProfile: PlayerProfile;

  beforeEach(() => {
    evaluator = new AchievementEvaluator();
    baseProfile = {
      userId: 'test-user',
      name: 'Test Player',
      joinedAt: mockTimestamp.now() as any,
      totalGames: 0,
      totalScore: 0,
      stats: {
        blitz: { gamesPlayed: 0, wins: 0, bestScore: 0, totalScore: 0, averageScore: 0, totalTime: 0 },
        classic: { gamesPlayed: 0, wins: 0, bestScore: 0, totalScore: 0, averageScore: 0 },
        timeAttack: { gamesPlayed: 0, wins: 0, bestScore: 0, totalScore: 0, averageScore: 0, bestTime: 0, completedPuzzles: 0 },
      },
      achievements: [],
      badges: [],
      lastGameAt: mockTimestamp.now() as any,
    };
  });

  describe('Common Achievements', () => {
    describe('firstGamePlayed', () => {
      it('should unlock First Steps achievement when player plays their first game', () => {
        const profileWithFirstGame = {
          ...baseProfile,
          totalGames: 1,
        };
        const result = evaluator.evaluateAchievements(profileWithFirstGame);
        expect(result).toContain('firstGamePlayed');
      });

      it('should not unlock first game achievement if already earned', () => {
        const profileWithAchievement = { ...baseProfile, achievements: ['firstGamePlayed'] };
        const result = evaluator.evaluateAchievements(profileWithAchievement);
        expect(result).not.toContain('firstGamePlayed');
      });

      it('should not unlock first game achievement with 0 games', () => {
        const result = evaluator.evaluateAchievements(baseProfile);
        expect(result).not.toContain('firstGamePlayed');
      });
    });

    describe('scoreOver200', () => {
      it('should unlock Rising Star achievement when score reaches 200', () => {
        const profileWithScore = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, bestScore: 200 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWithScore);
        expect(result).toContain('scoreOver200');
      });

      it('should unlock scoreOver200 achievement when bestScore exceeds 200', () => {
        const profileWithScore = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, bestScore: 250 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWithScore);
        expect(result).toContain('scoreOver200');
      });

      it('should not unlock scoreOver200 with exactly 199 score (boundary test)', () => {
        const profileWithScore = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, bestScore: 199 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWithScore);
        expect(result).not.toContain('scoreOver200');
      });

      it('should unlock scoreOver200 from any mode', () => {
        const profileWithClassicScore = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            classic: { ...baseProfile.stats.classic, bestScore: 300 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWithClassicScore);
        expect(result).toContain('scoreOver200');
      });

      it('should not unlock scoreOver200 twice', () => {
        const profileWithScore = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, bestScore: 250 },
          },
          achievements: ['scoreOver200'],
        };
        const result = evaluator.evaluateAchievements(profileWithScore);
        expect(result).not.toContain('scoreOver200');
      });
    });

    describe('tenGamesBlitz', () => {
      it('should unlock Blitz Master achievement when 10 blitz games played', () => {
        const profileWith10Games = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, gamesPlayed: 10 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWith10Games);
        expect(result).toContain('tenGamesBlitz');
      });

      it('should unlock tenGamesBlitz when more than 10 blitz games played', () => {
        const profileWith15Games = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, gamesPlayed: 15 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWith15Games);
        expect(result).toContain('tenGamesBlitz');
      });

      it('should not unlock tenGamesBlitz with exactly 9 games (boundary test)', () => {
        const profileWith9Games = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, gamesPlayed: 9 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWith9Games);
        expect(result).not.toContain('tenGamesBlitz');
      });

      it('should not unlock tenGamesBlitz if already earned', () => {
        const profileWith10Games = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, gamesPlayed: 10 },
          },
          achievements: ['tenGamesBlitz'],
        };
        const result = evaluator.evaluateAchievements(profileWith10Games);
        expect(result).not.toContain('tenGamesBlitz');
      });
    });

    describe('tenGamesClassic', () => {
      it('should unlock Classic Player achievement when 10 classic games played', () => {
        const profileWith10Games = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            classic: { ...baseProfile.stats.classic, gamesPlayed: 10 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWith10Games);
        expect(result).toContain('tenGamesClassic');
      });

      it('should not unlock tenGamesClassic with exactly 9 games (boundary test)', () => {
        const profileWith9Games = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            classic: { ...baseProfile.stats.classic, gamesPlayed: 9 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWith9Games);
        expect(result).not.toContain('tenGamesClassic');
      });
    });

    describe('tenGamesTimeAttack', () => {
      it('should unlock Time Challenger achievement when 10 Time Attack games played', () => {
        const profileWith10Games = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            timeAttack: { ...baseProfile.stats.timeAttack, gamesPlayed: 10 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWith10Games);
        expect(result).toContain('tenGamesTimeAttack');
      });

      it('should not unlock tenGamesTimeAttack with exactly 9 games (boundary test)', () => {
        const profileWith9Games = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            timeAttack: { ...baseProfile.stats.timeAttack, gamesPlayed: 9 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWith9Games);
        expect(result).not.toContain('tenGamesTimeAttack');
      });
    });
  });

  describe('Rare Achievements', () => {
    describe('fiftyGames', () => {
      it('should unlock Dedicated Player achievement when 50 games played across all modes', () => {
        const profileWith50Games = {
          ...baseProfile,
          totalGames: 50,
        };
        const result = evaluator.evaluateAchievements(profileWith50Games);
        expect(result).toContain('fiftyGames');
      });

      it('should unlock fiftyGames at exactly 50 games (boundary test)', () => {
        const profileWith50Games = {
          ...baseProfile,
          totalGames: 50,
        };
        const result = evaluator.evaluateAchievements(profileWith50Games);
        expect(result).toContain('fiftyGames');
      });

      it('should not unlock fiftyGames with exactly 49 games (boundary test)', () => {
        const profileWith49Games = {
          ...baseProfile,
          totalGames: 49,
        };
        const result = evaluator.evaluateAchievements(profileWith49Games);
        expect(result).not.toContain('fiftyGames');
      });

      it('should unlock fiftyGames across multiple modes combined', () => {
        const profileWithCrossMode = {
          ...baseProfile,
          totalGames: 50,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, gamesPlayed: 20 },
            classic: { ...baseProfile.stats.classic, gamesPlayed: 20 },
            timeAttack: { ...baseProfile.stats.timeAttack, gamesPlayed: 10 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWithCrossMode);
        expect(result).toContain('fiftyGames');
      });

      it('should not unlock fiftyGames if already earned', () => {
        const profileWith50Games = {
          ...baseProfile,
          totalGames: 50,
          achievements: ['fiftyGames'],
        };
        const result = evaluator.evaluateAchievements(profileWith50Games);
        expect(result).not.toContain('fiftyGames');
      });
    });

    describe('scoreOver500', () => {
      it('should unlock Elite Scorer achievement when score reaches 500', () => {
        const profileWithScore = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, bestScore: 500 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWithScore);
        expect(result).toContain('scoreOver500');
      });

      it('should unlock scoreOver500 when score exceeds 500', () => {
        const profileWithScore = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            classic: { ...baseProfile.stats.classic, bestScore: 750 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWithScore);
        expect(result).toContain('scoreOver500');
      });

      it('should not unlock scoreOver500 with exactly 499 score (boundary test)', () => {
        const profileWithScore = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, bestScore: 499 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWithScore);
        expect(result).not.toContain('scoreOver500');
      });

      it('should not unlock scoreOver500 if already earned', () => {
        const profileWithScore = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, bestScore: 600 },
          },
          achievements: ['scoreOver500'],
        };
        const result = evaluator.evaluateAchievements(profileWithScore);
        expect(result).not.toContain('scoreOver500');
      });
    });

    describe('perfectGame', () => {
      it('should not unlock perfectGame without game result context', () => {
        // This achievement requires game result data, not just profile data
        const result = evaluator.evaluateAchievements(baseProfile);
        expect(result).not.toContain('perfectGame');
      });

      it('should not unlock perfectGame in current implementation', () => {
        // The evaluator currently returns false for perfectGame as it requires additional context
        const profileWithPerfectStats = {
          ...baseProfile,
          totalGames: 1,
        };
        const result = evaluator.evaluateAchievements(profileWithPerfectStats);
        expect(result).not.toContain('perfectGame');
      });
    });

    describe('winStreak5', () => {
      it('should not unlock winStreak5 without win streak tracking', () => {
        // This achievement requires win streak tracking not available in current profile structure
        const result = evaluator.evaluateAchievements(baseProfile);
        expect(result).not.toContain('winStreak5');
      });

      it('should not unlock winStreak5 in current implementation', () => {
        // The evaluator currently returns false for winStreak as it requires additional context
        const profileWithWins = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, wins: 5 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWithWins);
        expect(result).not.toContain('winStreak5');
      });
    });
  });

  describe('Legendary Achievements', () => {
    describe('fiveHundredGames', () => {
      it('should unlock Legend achievement when 500 games played', () => {
        const profileWith500Games = {
          ...baseProfile,
          totalGames: 500,
        };
        const result = evaluator.evaluateAchievements(profileWith500Games);
        expect(result).toContain('fiveHundredGames');
      });

      it('should not unlock fiveHundredGames with exactly 499 games (boundary test)', () => {
        const profileWith499Games = {
          ...baseProfile,
          totalGames: 499,
        };
        const result = evaluator.evaluateAchievements(profileWith499Games);
        expect(result).not.toContain('fiveHundredGames');
      });

      it('should not unlock fiveHundredGames if already earned', () => {
        const profileWith500Games = {
          ...baseProfile,
          totalGames: 500,
          achievements: ['fiveHundredGames'],
        };
        const result = evaluator.evaluateAchievements(profileWith500Games);
        expect(result).not.toContain('fiveHundredGames');
      });
    });

    describe('scoreOver1000', () => {
      it('should unlock Ultimate Master achievement when score reaches 1000', () => {
        const profileWithScore = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, bestScore: 1000 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWithScore);
        expect(result).toContain('scoreOver1000');
      });

      it('should unlock scoreOver1000 when score exceeds 1000', () => {
        const profileWithScore = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            classic: { ...baseProfile.stats.classic, bestScore: 1500 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWithScore);
        expect(result).toContain('scoreOver1000');
      });

      it('should not unlock scoreOver1000 with exactly 999 score (boundary test)', () => {
        const profileWithScore = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, bestScore: 999 },
          },
        };
        const result = evaluator.evaluateAchievements(profileWithScore);
        expect(result).not.toContain('scoreOver1000');
      });

      it('should not unlock scoreOver1000 if already earned', () => {
        const profileWithScore = {
          ...baseProfile,
          stats: {
            ...baseProfile.stats,
            blitz: { ...baseProfile.stats.blitz, bestScore: 1200 },
          },
          achievements: ['scoreOver1000'],
        };
        const result = evaluator.evaluateAchievements(profileWithScore);
        expect(result).not.toContain('scoreOver1000');
      });
    });
  });

  describe('Edge Cases and Multiple Achievements', () => {
    it('should unlock multiple achievements in one evaluation', () => {
      const profileWithMultiple = {
        ...baseProfile,
        totalGames: 60,
        stats: {
          ...baseProfile.stats,
          blitz: { ...baseProfile.stats.blitz, gamesPlayed: 60, bestScore: 600 },
        },
      };
      const result = evaluator.evaluateAchievements(profileWithMultiple);
      expect(result.length).toBeGreaterThanOrEqual(3); // fiftyGames, scoreOver500, tenGamesBlitz, etc.
      expect(result).toContain('fiftyGames');
      expect(result).toContain('scoreOver500');
      expect(result).toContain('tenGamesBlitz');
    });

    it('should not unlock achievements for scores or counts that do not meet criteria', () => {
      const profileWithPartialStats = {
        ...baseProfile,
        stats: {
          ...baseProfile.stats,
          blitz: { ...baseProfile.stats.blitz, gamesPlayed: 5, bestScore: 100 },
        },
      };
      const result = evaluator.evaluateAchievements(profileWithPartialStats);
      expect(result).not.toContain('scoreOver200');
      expect(result).not.toContain('tenGamesBlitz');
    });

    it('should handle profile with all achievements already earned', () => {
      const completedProfile = {
        ...baseProfile,
        totalGames: 500,
        stats: {
          blitz: { gamesPlayed: 100, wins: 50, bestScore: 1200, totalScore: 50000, averageScore: 500, totalTime: 300000 },
          classic: { gamesPlayed: 200, wins: 100, bestScore: 1200, totalScore: 100000, averageScore: 500 },
          timeAttack: { gamesPlayed: 200, wins: 100, bestScore: 1200, totalScore: 100000, averageScore: 500, bestTime: 30000, completedPuzzles: 200 },
        },
        achievements: [
          'firstGamePlayed',
          'tenGamesBlitz',
          'tenGamesClassic',
          'tenGamesTimeAttack',
          'scoreOver200',
          'fiftyGames',
          'scoreOver500',
          'fiveHundredGames',
          'scoreOver1000',
        ],
      };
      const result = evaluator.evaluateAchievements(completedProfile);
      // Should still not unlock perfectGame and winStreak5 as they're not fully implemented
      expect(result).not.toContain('firstGamePlayed');
      expect(result).not.toContain('tenGamesBlitz');
      expect(result).not.toContain('scoreOver1000');
    });

    it('should allow score thresholds to be reached from any game mode', () => {
      const profileWithTimeAttackScore = {
        ...baseProfile,
        stats: {
          ...baseProfile.stats,
          timeAttack: { ...baseProfile.stats.timeAttack, bestScore: 600 },
        },
      };
      const result = evaluator.evaluateAchievements(profileWithTimeAttackScore);
      expect(result).toContain('scoreOver500');
    });

    it('should unlock consecutive score threshold achievements', () => {
      const profileWithHighScore = {
        ...baseProfile,
        stats: {
          ...baseProfile.stats,
          blitz: { ...baseProfile.stats.blitz, bestScore: 1500 },
        },
      };
      const result = evaluator.evaluateAchievements(profileWithHighScore);
      expect(result).toContain('scoreOver200');
      expect(result).toContain('scoreOver500');
      expect(result).toContain('scoreOver1000');
    });
  });
});
