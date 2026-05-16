import React, { useState } from 'react';
import { AchievementCard, Achievement } from './AchievementCard';
import { AchievementFilter, FilterType } from './AchievementFilter';

// TODO: Replace with actual data fetching from API
const mockAchievements: Achievement[] = [
  {
    id: 'firstGame',
    title: 'First Steps',
    description: 'Complete your first puzzle',
    icon: '🎮',
    rarity: 'common',
    reward: {
      xp: 10,
      coins: 25
    },
    criteria: 'Complete 1 puzzle',
    isEarned: true,
    earnedDate: '2026-05-10'
  },
  {
    id: 'tenGamesBlitz',
    title: 'Blitz Master',
    description: 'Complete 10 blitz puzzles',
    icon: '⚡',
    rarity: 'rare',
    reward: {
      xp: 50,
      coins: 100
    },
    criteria: 'Complete 10 blitz puzzles',
    isEarned: false,
    earnedDate: undefined
  }
];

export const AchievementList: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');

  // Load achievements (currently using mock data)
  const achievements = mockAchievements;

  // Filter achievements based on active filter
  const filteredAchievements = achievements.filter((achievement) => {
    if (filter === 'earned') {
      return achievement.isEarned;
    }
    if (filter === 'locked') {
      return !achievement.isEarned;
    }
    // 'all' filter
    return true;
  });

  return (
    <div className="space-y-4">
      <AchievementFilter active={filter} onChange={setFilter} />

      {filteredAchievements.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No achievements found for this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  );
};
