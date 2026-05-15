/**
 * Custom hook for recording game results and evaluating achievements.
 *
 * Consolidates the game-end flow across all three game modes (Classic, Time Attack, Blitz).
 * Handles:
 * - Creating GameResult objects with Firestore timestamps
 * - Recording results to the leaderboard adapter
 * - Evaluating and granting achievements
 */

import { useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { FirebaseLeaderboardAdapter } from '../lib/leaderboard/sync/FirebaseLeaderboardAdapter';
import type { GameResult, GameMode, Difficulty } from '../lib/leaderboard/types';

export const useGameResult = (userId: string) => {
  const recordResult = useCallback(
    async (
      mode: GameMode,
      score: number,
      solved: boolean,
      wrong: number,
      duration: number,
      difficulty?: Difficulty,
      wordLength?: number,
      roomCode?: string,
      placement?: number,
      totalPlayers?: number
    ) => {
      const adapter = new FirebaseLeaderboardAdapter();
      await adapter.initialize();

      const result: GameResult = {
        userId,
        mode,
        score,
        solved,
        wrong,
        duration,
        difficulty,
        wordLength,
        timestamp: Timestamp.now(),
      };

      // Add optional multiplayer fields only if provided
      if (placement !== undefined) {
        result.placement = placement;
      }
      if (totalPlayers !== undefined) {
        result.totalPlayers = totalPlayers;
      }

      // Record to leaderboard adapter
      await adapter.recordGameResult(userId, result);

      // Evaluate achievements
      const newAchievements = await adapter.checkAndGrantAchievements(userId);

      return { result, newAchievements };
    },
    [userId]
  );

  return { recordResult };
};
