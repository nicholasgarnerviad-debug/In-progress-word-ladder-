import React from 'react';
import type { AchievementConfig, AchievementRarity } from '../../lib/leaderboard/types';

export interface AchievementModalProps {
  achievement: AchievementConfig;
  isEarned: boolean;
  earnedDate?: number;
  onClose: () => void;
}

const rarityColors: Record<AchievementRarity, { badge: string; text: string }> = {
  common: {
    badge: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100',
    text: 'text-gray-900 dark:text-gray-100',
  },
  rare: {
    badge: 'bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100',
    text: 'text-blue-900 dark:text-blue-100',
  },
  legendary: {
    badge: 'bg-yellow-200 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100',
    text: 'text-yellow-900 dark:text-yellow-100',
  },
};

function getCriteriaText(criteria: AchievementConfig['criteria']): string {
  const { type, value } = criteria;

  switch (type) {
    case 'gameCount':
      return `Play ${value} game${value !== 1 ? 's' : ''}`;
    case 'scoreThreshold':
      return `Reach a score of ${value}`;
    case 'winStreak':
      return `Achieve a ${value}-game win streak`;
    case 'timeLimit':
      return `Complete a puzzle in under ${value}ms`;
    default:
      return `Complete ${value} ${type}`;
  }
}

export const AchievementModal: React.FC<AchievementModalProps> = ({
  achievement,
  isEarned,
  earnedDate,
  onClose,
}) => {
  const colors = rarityColors[achievement.rarity];

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="modal-backdrop"
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Achievement</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="text-6xl">{achievement.icon}</div>
            </div>

            {/* Title and Rarity */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {achievement.title}
              </h3>
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-full uppercase ${colors.badge}`}
              >
                {achievement.rarity}
              </span>
            </div>

            {/* Description */}
            <p className="text-center text-gray-600 dark:text-gray-400">
              {achievement.description}
            </p>

            {/* Status Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              {isEarned ? (
                <div>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-lg">✓</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      Unlocked
                    </span>
                  </div>
                  {earnedDate && (
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                      Earned on {new Date(earnedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Locked
                  </p>
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    {getCriteriaText(achievement.criteria)}
                  </p>
                </div>
              )}
            </div>

            {/* Rewards Section */}
            {achievement.reward && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Rewards
                </p>
                <div className="flex justify-center gap-8">
                  {achievement.reward.xp && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        <span>+</span>
                        <span>{achievement.reward.xp}</span>
                      </div>
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">
                        XP
                      </div>
                    </div>
                  )}
                  {achievement.reward.coins && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                        <span>+</span>
                        <span>{achievement.reward.coins}</span>
                      </div>
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">
                        Coins
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
