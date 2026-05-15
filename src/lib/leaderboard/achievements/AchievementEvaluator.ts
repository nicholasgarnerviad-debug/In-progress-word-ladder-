import type { PlayerProfile } from '../types';
import { getAllAchievements } from './achievements';

export class AchievementEvaluator {
  /**
   * Evaluate which achievements a player should unlock based on their profile.
   * Returns array of newly-unlocked achievement IDs (not previously earned).
   */
  evaluateAchievements(profile: PlayerProfile): string[] {
    const allAchievements = getAllAchievements();
    const newlyUnlocked: string[] = [];

    for (const achievement of allAchievements) {
      // Skip if already earned
      if (profile.achievements.includes(achievement.id)) {
        continue;
      }

      // Check if criteria are met
      if (this.meetsCriteria(profile, achievement)) {
        newlyUnlocked.push(achievement.id);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Check if player meets the criteria for a specific achievement.
   */
  private meetsCriteria(profile: PlayerProfile, achievement: any): boolean {
    const { criteria } = achievement;

    switch (criteria.type) {
      case 'gameCount':
        return this.checkGameCount(profile, criteria);
      case 'scoreThreshold':
        return this.checkScoreThreshold(profile, criteria);
      case 'perfectGame':
        // This requires checking the latest game result, not just profile
        // For now, return false (will be enhanced in future)
        return false;
      case 'winStreak':
        // This requires tracking consecutive wins, not available in profile alone
        return false;
      case 'custom':
        // Custom criteria handled per-achievement
        return this.checkCustomCriteria(profile, achievement);
      default:
        return false;
    }
  }

  private checkGameCount(profile: PlayerProfile, criteria: any): boolean {
    const { value, mode } = criteria;

    if (mode) {
      // Mode-specific game count check
      const modeStats = profile.stats[mode as keyof typeof profile.stats];
      return (modeStats as any)?.gamesPlayed >= value;
    }

    // Any mode game count
    return profile.totalGames >= value;
  }

  private checkScoreThreshold(profile: PlayerProfile, criteria: any): boolean {
    const { value, mode } = criteria;

    if (mode) {
      // Mode-specific best score check
      const modeStats = profile.stats[mode as keyof typeof profile.stats];
      return (modeStats as any)?.bestScore >= value;
    }

    // Check if any mode's best score exceeds threshold
    const modeStats = Object.values(profile.stats);
    return modeStats.some((stats: any) => stats.bestScore >= value);
  }

  private checkCustomCriteria(profile: PlayerProfile, achievement: any): boolean {
    // Handle custom criteria as needed
    // For now, return false for custom criteria
    return false;
  }
}
