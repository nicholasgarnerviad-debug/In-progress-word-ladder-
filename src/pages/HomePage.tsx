import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ModeTile } from '../components/ModeTile';
import { WalletStrip } from '../components/economy/WalletStrip';
import { StatsStrip } from '../components/StatsStrip';

/**
 * Get or create a user ID for profile/leaderboard links.
 * Uses a persistent localStorage ID since no auth system is present yet.
 */
function getUserId(): string {
  const STORAGE_KEY = 'wordladder-user-id';
  let userId = localStorage.getItem(STORAGE_KEY);

  if (!userId) {
    // Generate a new user ID (UUID v4)
    userId = 'user-' + Math.random().toString(36).substring(2, 15) +
             Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEY, userId);
  }

  return userId;
}

export const HomePage: React.FC = () => {
  useEffect(() => {
    document.title = 'Word Ladder';
  }, []);

  const currentUserId = getUserId();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header strip with navigation links */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {/* Left nav: Profile & Leaderboards */}
          <div className="flex items-center gap-2">
            <Link
              to={`/profile/${currentUserId}`}
              className="px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
              title="View your profile"
            >
              Profile
            </Link>
            <Link
              to="/leaderboards"
              className="px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
              title="View leaderboards"
            >
              Leaderboards
            </Link>
          </div>

          {/* Right nav: Shop & Settings */}
          <div className="flex items-center gap-2">
            <Link
              to="/settings"
              className="px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
              title="Shop and settings"
            >
              Shop
            </Link>
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
        </div>
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

        {/* Wallet strip */}
        <div className="mb-4">
          <WalletStrip />
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
            name="Blitz"
            description="Race against others. Real-time competitive mode."
            to="/blitz"
          />
          <ModeTile
            name="Time Attack"
            description="Race the clock. Max puzzles in 90 seconds."
            to="/play/time-attack"
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
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pb-8">
          v0.1 — In Progress
        </div>
      </div>
    </div>
  );
};
