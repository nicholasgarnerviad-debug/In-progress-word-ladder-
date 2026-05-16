import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LevelCard } from '../components/progression/LevelCard';
import { AchievementList } from '../components/progression/AchievementList';

export const ProgressionPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Your Progression - Word Ladder';
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header with back button */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <Link
            to="/"
            className="px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
            title="Back to home"
          >
            ← Home
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-md mx-auto px-4">
        {/* Page title */}
        <div className="pt-12 pb-8 text-center">
          <h1 className="text-4xl font-bold tracking-wide">Your Progression</h1>
        </div>

        {/* Level Card */}
        <div className="mb-8">
          <LevelCard />
        </div>

        {/* Achievements section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Achievements</h2>
          <AchievementList />
        </div>
      </div>
    </div>
  );
};
