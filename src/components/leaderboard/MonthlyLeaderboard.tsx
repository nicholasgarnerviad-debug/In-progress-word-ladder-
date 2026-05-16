// src/components/leaderboard/MonthlyLeaderboard.tsx

import React, { useMemo } from 'react';
import type { LeaderboardEntry } from '../../lib/leaderboard/types';

export interface MonthlyLeaderboardProps {
  players?: LeaderboardEntry[];
  currentUserId?: string;
  month?: Date;
  onPlayerClick?: (userId: string) => void;
}

/**
 * MonthlyLeaderboard Component
 * Displays the top 10 players by coins earned this calendar month,
 * with the current player's rank highlighted.
 */
export const MonthlyLeaderboard: React.FC<MonthlyLeaderboardProps> = ({
  players = [],
  currentUserId,
  month = new Date(),
  onPlayerClick,
}) => {
  const monthStr = useMemo(
    () => month.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    [month]
  );

  const nextMonth = useMemo(() => {
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    return next.toLocaleString('en-US', { month: 'long', day: 'numeric' });
  }, [month]);

  const topPlayers = useMemo(() => players.slice(0, 10), [players]);

  const getMedal = (rank: number): string => {
    const medals = ['🥇', '🥈', '🥉'];
    return medals[rank] || '';
  };

  const currentPlayerRank = useMemo(
    () => players.findIndex((p) => p.userId === currentUserId) + 1,
    [players, currentUserId]
  );

  const currentPlayerScore = useMemo(
    () => players.find((p) => p.userId === currentUserId)?.score,
    [players, currentUserId]
  );

  const handleRowClick = (userId: string) => {
    if (onPlayerClick) {
      onPlayerClick(userId);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
        {monthStr} Leaderboard
      </h2>

      {/* Reset info */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Resets on {nextMonth}
      </p>

      {/* Empty state */}
      {topPlayers.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-400 dark:text-gray-500">No data yet for this month</p>
        </div>
      ) : (
        <>
          {/* Rankings list - Mobile optimized, desktop responsive */}
          <div className="space-y-2 mb-6">
            {topPlayers.map((player, index) => {
              const isCurrentPlayer = player.userId === currentUserId;
              return (
                <div
                  key={player.userId}
                  onClick={() => handleRowClick(player.userId)}
                  className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors ${
                    isCurrentPlayer
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleRowClick(player.userId);
                    }
                  }}
                >
                  {/* Rank Badge */}
                  <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-600 text-white font-bold text-sm">
                    {index + 1}
                  </span>

                  {/* Medal Icon */}
                  {getMedal(index) && (
                    <span className="text-2xl" aria-label={`Rank ${index + 1} medal`}>
                      {getMedal(index)}
                    </span>
                  )}

                  {/* Player Name */}
                  <span className="flex-1 font-medium text-gray-800 dark:text-gray-100 truncate">
                    {player.name}
                  </span>

                  {/* Coins/Score */}
                  <span className="flex-shrink-0 font-bold text-blue-600 dark:text-blue-400">
                    {player.score}
                    <span className="text-sm ml-1 font-normal">coins</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current Player Section */}
          {currentPlayerRank > 0 && (
            <div
              className={`mt-6 p-4 rounded-lg border-2 ${
                currentPlayerRank <= 10
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
              }`}
            >
              <p className="text-center text-sm font-medium">
                {currentPlayerRank <= 10 ? (
                  <span className="text-green-700 dark:text-green-400">
                    You're ranked #{currentPlayerRank} with {currentPlayerScore} coins! 🎉
                  </span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">
                    Your rank: #{currentPlayerRank}
                    <br />
                    You've earned {currentPlayerScore} coins this month
                  </span>
                )}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MonthlyLeaderboard;
