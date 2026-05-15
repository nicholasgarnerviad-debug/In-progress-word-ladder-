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

  it('should return first game achievement when player plays their first game', () => {
    const profileWithFirstGame = {
      ...baseProfile,
      totalGames: 1,
    };
    const result = evaluator.evaluateAchievements(profileWithFirstGame);
    expect(result).toContain('firstGamePlayed');
  });

  it('should not unlock an achievement twice', () => {
    const profileWithAchievement = { ...baseProfile, achievements: ['firstGamePlayed'] };
    const result = evaluator.evaluateAchievements(profileWithAchievement);
    expect(result).not.toContain('firstGamePlayed');
  });

  it('should unlock scoreOver200 achievement when bestScore reaches 200+', () => {
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

  it('should unlock tenGamesBlitz when 10 blitz games played', () => {
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

  it('should unlock multiple achievements in one evaluation', () => {
    const profileWithMultiple = {
      ...baseProfile,
      stats: {
        ...baseProfile.stats,
        blitz: { ...baseProfile.stats.blitz, gamesPlayed: 60, bestScore: 600 },
      },
    };
    const result = evaluator.evaluateAchievements(profileWithMultiple);
    expect(result.length).toBeGreaterThanOrEqual(3); // fiftyGames, scoreOver500, etc.
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
});
