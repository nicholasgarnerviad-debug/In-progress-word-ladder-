// src/components/leaderboard/AchievementsScreen.tsx

import React, { useEffect, useState } from 'react';
import type { AchievementConfig, AchievementRarity } from '../../lib/leaderboard/types';
import { FirebaseLeaderboardAdapter } from '../../lib/leaderboard/sync/FirebaseLeaderboardAdapter';

const adapter = new FirebaseLeaderboardAdapter();

// Rarity color coding - mobile-first responsive with dark mode variants
const rarityColors: Record<AchievementRarity, { card: string; badge: string }> = {
  common: {
    card: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
    badge: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100',
  },
  rare: {
    card: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
    badge: 'bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100',
  },
  legendary: {
    card: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
    badge: 'bg-yellow-200 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100',
  },
};

// Memoized achievement card component
const AchievementCard = React.memo(
  ({ achievement, isEarned }: { achievement: AchievementConfig; isEarned: boolean }) => {
    const colors = rarityColors[achievement.rarity];

    return (
      <div
        className={`p-4 sm:p-6 border rounded-lg transition-all duration-200 ${colors.card} ${
          isEarned
            ? 'border-opacity-100 shadow-md hover:shadow-lg'
            : 'border-opacity-50 opacity-75 hover:opacity-90'
        }`}
      >
        {/* Icon */}
        <div className="text-4xl sm:text-5xl mb-3">{achievement.icon}</div>

        {/* Title */}
        <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-2">
          {achievement.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
          {achievement.description}
        </p>

        {/* Rarity Badge and Status */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase ${colors.badge}`}>
            {achievement.rarity}
          </span>
          {isEarned && (
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              ✓ Earned
            </span>
          )}
        </div>
      </div>
    );
  }
);
AchievementCard.displayName = 'AchievementCard';

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
    <div className="min-h-screen w-full max-w-4xl mx-auto px-4 py-8 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Achievements</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
          {earnedAchievements.length} of {achievements.length} unlocked
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'earned', 'locked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded capitalize text-sm sm:text-base transition-colors duration-200 ${
                filter === f
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading achievements...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No achievements to display. {filter !== 'all' && 'Try adjusting filters.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((ach) => (
            <AchievementCard
              key={ach.id}
              achievement={ach}
              isEarned={earnedAchievements.includes(ach.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AchievementsScreen;
