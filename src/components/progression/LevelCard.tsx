import React from 'react';
import { useEconomy } from '../../lib/economy/useEconomy';
import { xpToNextLevel, xpProgressInLevel } from '../../lib/economy/levels';
import { getNextRewardLevel, getLevelReward } from '../../lib/economy/levelRewards';

export const LevelCard: React.FC = () => {
  const { xp, level } = useEconomy();

  const currentLevel = level;
  const totalXp = xp;
  const xpNeededForNext = xpToNextLevel(totalXp);
  const progressPercent = Math.round(xpProgressInLevel(totalXp) * 100);
  const nextRewardLevel = getNextRewardLevel(currentLevel);
  const nextReward = nextRewardLevel ? getLevelReward(nextRewardLevel) : null;

  return (
    <div className="rounded-lg bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 shadow-md">
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">{currentLevel}</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Current Level</p>
      </div>

      <div className="mb-4">
        <div
          role="progressbar"
          aria-valuenow={totalXp}
          aria-valuemin={0}
          aria-valuemax={totalXp + xpNeededForNext}
          className="h-4 w-full rounded-full bg-blue-200 dark:bg-blue-800 overflow-hidden"
        >
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          {totalXp} / {totalXp + xpNeededForNext} XP
        </p>
      </div>

      <div className="text-center mb-6">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {progressPercent}% to Level {currentLevel + 1}
        </p>
      </div>

      {nextReward && (
        <div className="rounded-md bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
            Next Reward
          </p>
          <p className="text-sm text-gray-900 dark:text-gray-100">
            Level {nextRewardLevel}: {nextReward.description}
          </p>
        </div>
      )}
    </div>
  );
};
