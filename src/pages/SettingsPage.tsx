import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Theme, loadTheme, saveTheme, applyTheme } from '../lib/theme';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_KEY = 'wordLadder.difficulty';

function loadDifficulty(): Difficulty {
  try {
    const stored = localStorage.getItem(DIFFICULTY_KEY);
    if (stored === 'easy' || stored === 'medium' || stored === 'hard') {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return 'medium';
}

function saveDifficulty(difficulty: Difficulty): void {
  try {
    localStorage.setItem(DIFFICULTY_KEY, difficulty);
  } catch {
    // localStorage not available
  }
}

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

export const SettingsPage: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(loadTheme());
  const [difficulty, setDifficulty] = useState<Difficulty>(loadDifficulty());
  const currentUserId = getUserId();

  React.useEffect(() => {
    document.title = 'Word Ladder — Settings';
  }, []);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    saveTheme(newTheme);
    applyTheme(newTheme);
  }, []);

  const handleDifficultyChange = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    saveDifficulty(newDifficulty);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Navigation strip with links to Shop, Profile, and Leaderboards */}
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

          {/* Right nav: Shop & Back */}
          <div className="flex items-center gap-2">
            <Link
              to="/settings"
              className="px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
              title="Shop and settings"
            >
              Shop
            </Link>
            <Link
              to="/"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
              aria-label="Back to home"
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
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Header section with title */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center justify-center">
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      {/* Main content */}
      <div className="max-w-md mx-auto px-4">
        {/* Theme section */}
        <section className="py-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-4">
            Theme
          </h2>
          <div className="space-y-3">
            {(['system', 'light', 'dark'] as const).map((themeOption) => (
              <label key={themeOption} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value={themeOption}
                  checked={theme === themeOption}
                  onChange={(e) => handleThemeChange(e.target.value as Theme)}
                  className="w-4 h-4 text-blue-600 accent-blue-600 dark:accent-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
                />
                <span className="ml-3 capitalize text-sm">
                  {themeOption === 'system' ? 'System' : themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Default Difficulty section */}
        <section className="py-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-4">
            Default Difficulty
          </h2>
          <div className="space-y-3">
            {(['easy', 'medium', 'hard'] as const).map((diffOption) => (
              <label key={diffOption} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  value={diffOption}
                  checked={difficulty === diffOption}
                  onChange={(e) => handleDifficultyChange(e.target.value as Difficulty)}
                  className="w-4 h-4 text-blue-600 accent-blue-600 dark:accent-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
                />
                <span className="ml-3 capitalize text-sm">
                  {diffOption.charAt(0).toUpperCase() + diffOption.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
