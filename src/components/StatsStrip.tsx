import React, { useMemo } from 'react';
import { loadStats } from '../lib/stats';

export const StatsStrip: React.FC = () => {
  const stats = useMemo(() => loadStats(), []);

  const winPercentage = stats.played === 0 ? 0 : Math.round((stats.won / stats.played) * 100);

  const statItems = [
    { label: 'Played', value: stats.played },
    { label: 'Win %', value: `${winPercentage}%` },
    { label: 'Streak', value: stats.currentStreak },
    { label: 'Max', value: stats.maxStreak },
  ];

  return (
    <div className="w-full border-t border-b border-gray-200 dark:border-gray-800">
      <div className="flex h-16">
        {statItems.map((item, idx) => (
          <div
            key={item.label}
            className={`flex-1 flex flex-col items-center justify-center py-4 ${
              idx < statItems.length - 1 ? 'border-r border-gray-200 dark:border-gray-800' : ''
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {item.value}
            </div>
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mt-1">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
