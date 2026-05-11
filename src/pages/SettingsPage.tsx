import React, { useState, useEffect } from 'react';
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

export const SettingsPage: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(loadTheme());
  const [difficulty, setDifficulty] = useState<Difficulty>(loadDifficulty());

  React.useEffect(() => {
    document.title = 'Word Ladder — Settings';
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    saveTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    saveDifficulty(newDifficulty);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header strip */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
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
        <h1 className="text-lg font-semibold">Settings</h1>
        <div className="w-10" />
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
