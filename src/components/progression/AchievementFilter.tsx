import React from 'react';

export type FilterType = 'all' | 'earned' | 'locked';

export interface AchievementFilterProps {
  active: FilterType;
  onChange: (filter: FilterType) => void;
}

export const AchievementFilter: React.FC<AchievementFilterProps> = ({ active, onChange }) => {
  const tabs: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Earned', value: 'earned' },
    { label: 'Locked', value: 'locked' }
  ];

  return (
    <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            active === tab.value
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 border-b-2'
              : 'border-transparent text-gray-600 dark:text-gray-400'
          } hover:text-gray-900 dark:hover:text-gray-300`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
