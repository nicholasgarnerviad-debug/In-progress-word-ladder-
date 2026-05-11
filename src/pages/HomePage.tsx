import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ModeTile } from '../components/ModeTile';
import { StatsStrip } from '../components/StatsStrip';

export const HomePage: React.FC = () => {
  useEffect(() => {
    document.title = 'Word Ladder';
  }, []);
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header strip */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
        <div />
        <Link
          to="/settings"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
          aria-label="Settings"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-600 dark:text-gray-400"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24M1 12h6m6 0h6m-17.78 7.78l4.24-4.24m2.12-2.12l4.24-4.24" />
          </svg>
        </Link>
      </div>

      {/* Main content */}
      <div className="max-w-md mx-auto px-4">
        {/* Title block */}
        <div className="pt-12 pb-8 text-center">
          <h1 className="text-4xl font-bold tracking-wide mb-2">WORD LADDER</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Climb the rungs. One letter at a time.
          </p>
        </div>

        {/* Stats strip */}
        <div className="mb-8">
          <StatsStrip />
        </div>

        {/* Mode tiles */}
        <div className="space-y-3 mb-12">
          <ModeTile
            name="Classic"
            description="Find the shortest path between two words."
            to="/play/classic"
          />
          <ModeTile
            name="Daily Puzzle"
            description="One puzzle. Everyone plays the same one."
            comingSoon
          />
          <ModeTile
            name="Endless"
            description="Solve as many as you can in a row."
            comingSoon
          />
          <ModeTile
            name="Time Attack"
            description="Race the clock. Max puzzles in 90 seconds."
            comingSoon
          />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pb-8">
          v0.1 — In Progress
        </div>
      </div>
    </div>
  );
};
