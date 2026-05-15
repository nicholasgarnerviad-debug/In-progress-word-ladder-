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
    adapter.initialize().then(() => {
      const unsubscribe = adapter.subscribeToLeaderboard(mode, period, (lb) => {
        setLeaderboard(lb);
        setLoading(false);
      });
      return () => unsubscribe();
    });
  }, [mode, period]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Leaderboards</h1>

          {/* Mode Filter */}
          <div className="flex gap-2 mb-4">
            {(['blitz', 'classic', 'timeAttack'] as GameMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded ${
                  mode === m
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Period Filter */}
          <div className="flex gap-2">
            {(['allTime', 'weekly', 'monthly'] as LeaderboardPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded ${
                  period === p
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Rankings */}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : leaderboard ? (
          <div className="space-y-2">
            {leaderboard.rankings.map((entry) => (
              <div
                key={entry.userId}
                onClick={() => navigate(`/profile/${entry.userId}`)}
                className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                      {entry.placement}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{entry.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{entry.gamesPlayed} games</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-500">{entry.score}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">No data available</div>
        )}
      </div>
    </div>
  );
};
