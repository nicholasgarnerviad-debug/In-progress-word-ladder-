import React, { useMemo } from 'react';
import { RANK_MEDALS, SHADOWS } from '../theme';
import type { BlitzPlayer, PlayerId } from '../types';

export type BlitzLeaderboardProps = {
  /** List of players to display */
  players: BlitzPlayer[];
  /** ID of current player (to highlight their row) */
  currentPlayerId: PlayerId;
};

/**
 * Displays a leaderboard of Blitz players sorted by score.
 *
 * Features:
 * - Sorted by sessionScore descending
 * - Rank numbers (1, 2, 3...)
 * - Player name, score, puzzles solved
 * - Highlights current player's row
 * - Compact sidebar layout (~300px max width)
 */
export const BlitzLeaderboard: React.FC<BlitzLeaderboardProps> = ({
  players,
  currentPlayerId,
}) => {
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score);
  }, [players]);

  // Helper to get medal for rank (1st, 2nd, 3rd)
  const getMedal = (rank: number) => {
    if (rank === 1) return RANK_MEDALS['1'];
    if (rank === 2) return RANK_MEDALS['2'];
    if (rank === 3) return RANK_MEDALS['3'];
    return null;
  };

  return (
    <div className={`w-80 max-w-sm bg-white dark:bg-gray-800 rounded-lg ${SHADOWS.lg} p-4 space-y-2`}>
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <span>🏆</span>
        Leaderboard
      </h2>

      {sortedPlayers.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
          No players
        </p>
      ) : (
        <div className="space-y-1">
          {sortedPlayers.map((player, index) => {
            const rank = index + 1;
            const isCurrentPlayer = player.id === currentPlayerId;
            const medal = getMedal(rank);

            return (
              <div
                key={player.id}
                data-testid={`leaderboard-row-${player.id}`}
                className={`
                  flex items-center justify-between gap-2 px-3 py-2 rounded
                  transition-all duration-200 animate-slideInRight
                  ${
                    isCurrentPlayer
                      ? 'bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-300 shadow-sm'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                role="listitem"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl font-bold text-gray-700 dark:text-gray-300 w-8 text-center">
                    {medal || `${rank}.`}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                    {player.name}
                    {isCurrentPlayer && <span className="text-xs text-yellow-600 dark:text-yellow-300 ml-1">(You)</span>}
                  </span>
                </div>

                <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                  <div className="text-right" aria-label={`${player.name} score: ${player.score}`}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Score</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                      {player.score}
                    </p>
                  </div>
                  <div className="text-right" aria-label={`${player.name} solved: ${player.solved}`}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Solved</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                      {player.solved}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
