import React from 'react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
  reward: {
    xp: number;
    coins: number;
  };
  criteria: string;
  isEarned: boolean;
  earnedDate?: string;
}

export interface AchievementCardProps {
  achievement: Achievement;
}

const rarityColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  common: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    darkBg: 'dark:bg-gray-700',
    darkText: 'dark:text-gray-200'
  },
  rare: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    darkBg: 'dark:bg-blue-700',
    darkText: 'dark:text-blue-200'
  },
  legendary: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    darkBg: 'dark:bg-yellow-700',
    darkText: 'dark:text-yellow-200'
  }
};

const getCriteriaText = (criteria: string): string => {
  return criteria;
};

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const rarityColor = rarityColors[achievement.rarity];

  return (
    <div className={`rounded-lg border-2 p-4 shadow-md transition-all ${
      achievement.isEarned
        ? 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      {/* Header with Icon and Title */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="text-4xl">{achievement.icon}</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">{achievement.title}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{achievement.description}</p>
          </div>
        </div>
        {achievement.isEarned && (
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-400 dark:bg-green-500 text-white font-bold text-sm">
            ✓
          </div>
        )}
      </div>

      {/* Rarity Badge */}
      <div className="mb-3">
        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${rarityColor.bg} ${rarityColor.text} ${rarityColor.darkBg} ${rarityColor.darkText}`}>
          {achievement.rarity}
        </span>
      </div>

      {/* Reward Info */}
      <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">
        <p>Reward: <span className="font-semibold">+{achievement.reward.xp} xp</span> + <span className="font-semibold">+{achievement.reward.coins} coins</span></p>
      </div>

      {/* Criteria or Earned Date */}
      {!achievement.isEarned ? (
        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
          Unlock: {getCriteriaText(achievement.criteria)}
        </p>
      ) : (
        <p className="text-xs text-green-600 dark:text-green-400">
          Earned on {achievement.earnedDate}
        </p>
      )}
    </div>
  );
};
