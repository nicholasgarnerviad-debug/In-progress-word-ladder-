// src/components/leaderboard/LeaderboardScreen.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LeaderboardDoc, GameMode, LeaderboardPeriod } from '../../lib/leaderboard/types';
import { FirebaseLeaderboardAdapter } from '../../lib/leaderboard/sync/FirebaseLeaderboardAdapter';

const adapter = new FirebaseLeaderboardAdapter();

export const LeaderboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<GameMode>('blitz');
  const [period, setPeriod] = useState<LeaderboardPeriod>('allTime');
  const [leaderboard, setLeaderboard] = useState<LeaderboardDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let unsubscribe: (() => void) | null = null;

    adapter.initialize().then(() => {
      unsubscribe = adapter.subscribeToLeaderboard(mode, period, (lb) => {
        setLeaderboard(lb);
        setLoading(false);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [mode, period]);

  const handleRowClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen w-full max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">Leaderboards</h1>

        {/* Mode Filter */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Game Mode</h2>
          <div className="flex flex-wrap gap-2">
            {(['blitz', 'classic', 'timeAttack'] as GameMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === m
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1).replace(/([A-Z])/g, ' $1')}
              </button>
            ))}
          </div>
        </div>

        {/* Period Filter */}
        <div>
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Time Period</h2>
          <div className="flex flex-wrap gap-2">
            {(['allTime', 'weekly', 'monthly'] as LeaderboardPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === p
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rankings Content */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Loading leaderboard...</p>
        </div>
      ) : leaderboard && leaderboard.rankings.length > 0 ? (
        <>
          {/* Mobile: Card Layout */}
          <div className="md:hidden space-y-3">
            {leaderboard.rankings.map((entry) => (
              <button
                key={entry.userId}
                onClick={() => handleRowClick(entry.userId)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 cursor-pointer transition-colors text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {entry.placement}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white truncate">{entry.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{entry.gamesPlayed} {entry.gamesPlayed === 1 ? 'game' : 'games'}</div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-lg font-bold text-blue-500 dark:text-blue-400">{entry.score}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Player</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Games</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.rankings.map((entry) => (
                  <tr
                    key={entry.userId}
                    onClick={() => handleRowClick(entry.userId)}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 text-white font-bold text-sm">
                        {entry.placement}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">{entry.name}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-gray-600 dark:text-gray-400">{entry.gamesPlayed}</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-blue-500 dark:text-blue-400">{entry.score}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No leaderboard data available</p>
        </div>
      )}
    </div>
  );
};
