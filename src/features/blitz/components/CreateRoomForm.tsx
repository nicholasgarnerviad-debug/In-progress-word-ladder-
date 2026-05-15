import React, { useState } from 'react';
import { FormInput } from './FormInput';
import { Card } from './Card';
import { BUTTON_STYLES, RESPONSIVE } from '../theme';
import type { BlitzRoomSettings, BlitzDifficulty, BlitzWordLength } from '../types';

export type CreateRoomFormProps = {
  isLoading: boolean;
  error: string | null;
  onCreateRoom: (displayName: string, settings: BlitzRoomSettings) => Promise<void>;
  onCancel: () => void;
};

export const CreateRoomForm: React.FC<CreateRoomFormProps> = ({
  isLoading,
  error,
  onCreateRoom,
  onCancel,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [difficulty, setDifficulty] = useState<BlitzDifficulty>('easy');
  const [wordLength, setWordLength] = useState<BlitzWordLength>(4);
  const [puzzleCount, setPuzzleCount] = useState(10);

  const isFormValid = displayName.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const settings: BlitzRoomSettings = {
      durationMs: timerSeconds * 1000,
      difficulty,
      wordLength,
      puzzleCount,
      timerTier: 'tier1', // Default tier, could be derived from duration
    };

    try {
      await onCreateRoom(displayName.trim(), settings);
      setDisplayName('');
      setTimerSeconds(60);
      setDifficulty('easy');
      setWordLength(4);
      setPuzzleCount(10);
    } catch (err) {
      // Error is handled by parent component
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header strip */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center px-4">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none -ml-2"
          aria-label="Back"
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
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">Create Room</h1>
        <div className="w-12" />
      </div>

      {/* Main content */}
      <div className={`${RESPONSIVE.mobileContainer} ${RESPONSIVE.tabletContainer} ${RESPONSIVE.desktopContainer} max-w-md mx-auto pt-6 pb-8`}>
        {/* Error display */}
        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 font-medium"
          >
            {error}
          </div>
        )}

        <Card title="Create New Room" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name */}
            <FormInput
              label="Display Name"
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your name"
              helperText="This is how other players will see you"
              error={displayName.length === 0 && isLoading ? 'Name is required' : undefined}
            />

            {/* Timer Slider */}
            <div>
              <label
                htmlFor="timer"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3"
              >
                Timer Duration: <span className="font-bold text-yellow-600 dark:text-yellow-400">{timerSeconds}s</span>
              </label>
              <input
                id="timer"
                type="range"
                min="30"
                max="300"
                value={timerSeconds}
                onChange={(e) => setTimerSeconds(parseInt(e.target.value, 10))}
                disabled={isLoading}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-600 dark:accent-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex justify-between">
                <span>30s</span>
                <span>300s</span>
              </div>
            </div>

            {/* Difficulty Select */}
            <div>
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                Difficulty
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as BlitzDifficulty)}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-offset-gray-950"
              >
                <option value="easy">Easy - Easier word paths</option>
                <option value="medium">Medium - Balanced difficulty</option>
                <option value="hard">Hard - Challenging paths</option>
              </select>
            </div>

            {/* Word Length Select */}
            <div>
              <label
                htmlFor="wordLength"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                Word Length
              </label>
              <select
                id="wordLength"
                value={wordLength}
                onChange={(e) => setWordLength(parseInt(e.target.value, 10) as BlitzWordLength)}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-offset-gray-950"
              >
                <option value="4">4 letters</option>
                <option value="5">5 letters</option>
                <option value="6">6 letters</option>
              </select>
            </div>

            {/* Puzzle Count Input */}
            <FormInput
              label="Number of Puzzles"
              type="number"
              id="puzzleCount"
              min="5"
              max="20"
              value={puzzleCount}
              onChange={(e) => setPuzzleCount(Math.max(5, Math.min(20, parseInt(e.target.value, 10))))}
              disabled={isLoading}
              helperText="Between 5 and 20 puzzles"
            />

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 -mx-6 px-6 py-6">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className={`${BUTTON_STYLES.ghost} flex-1`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className={`${BUTTON_STYLES.primary} flex-1 active:animate-buttonPress`}
              >
                {isLoading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
