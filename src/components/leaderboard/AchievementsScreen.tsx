// src/components/leaderboard/AchievementsScreen.tsx

import React, { useEffect, useState } from 'react';
import type { AchievementConfig } from '../../lib/leaderboard/types';
import { FirebaseLeaderboardAdapter } from '../../lib/leaderboard/sync/FirebaseLeaderboardAdapter';

const adapter = new FirebaseLeaderboardAdapter();

export const AchievementsScreen: React.FC<{ earnedAchievements: string[] }> = ({ earnedAchievements }) => {
  const [achievements, setAchievements] = useState<AchievementConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  useEffect(() => {
    adapter.initialize().then(async () => {
      try {
        const achs = await adapter.getAchievements();
        setAchievements(achs);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const filtered = achievements.filter((ach) => {
    if (filter === 'earned') return earnedAchievements.includes(ach.id);
    if (filter === 'locked') return !earnedAchievements.includes(ach.id);
    return true;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Achievements</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {earnedAchievements.length} of {achievements.length} unlocked
          </p>

          {/* Filters */}
          <div className="flex gap-2">
            {(['all', 'earned', 'locked'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded capitalize ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((ach) => {
              const earned = earnedAchievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`p-4 border rounded-lg transition ${
                    earned
                      ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                  }`}
                >
                  <div className="text-4xl mb-2">{ach.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{ach.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ach.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold uppercase ${
                      ach.rarity === 'legendary' ? 'text-purple-600' :
                      ach.rarity === 'rare' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {ach.rarity}
                    </span>
                    {earned && <span className="text-sm text-yellow-600 dark:text-yellow-400">✓ Unlocked</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
