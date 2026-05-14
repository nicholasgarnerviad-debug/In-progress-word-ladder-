import React, { useState } from 'react';
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
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none -ml-2"
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
      <div className="max-w-md mx-auto px-4 pt-6 pb-8">
        {/* Error display */}
        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your name"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
            />
          </div>

          {/* Timer Slider */}
          <div>
            <label
              htmlFor="timer"
              className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
            >
              Timer: {timerSeconds}s
            </label>
            <input
              id="timer"
              type="range"
              min="30"
              max="300"
              value={timerSeconds}
              onChange={(e) => setTimerSeconds(parseInt(e.target.value, 10))}
              disabled={isLoading}
              className="w-full"
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
              className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
            >
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as BlitzDifficulty)}
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Word Length Select */}
          <div>
            <label
              htmlFor="wordLength"
              className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
            >
              Word Length
            </label>
            <select
              id="wordLength"
              value={wordLength}
              onChange={(e) => setWordLength(parseInt(e.target.value, 10) as BlitzWordLength)}
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
            >
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </div>

          {/* Puzzle Count Input */}
          <div>
            <label
              htmlFor="puzzleCount"
              className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
            >
              Number of Puzzles
            </label>
            <input
              id="puzzleCount"
              type="number"
              min="5"
              max="20"
              value={puzzleCount}
              onChange={(e) => setPuzzleCount(parseInt(e.target.value, 10))}
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-lg border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 disabled:border-gray-300 dark:disabled:border-gray-700 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="flex-1 py-3 px-4 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold transition-colors hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
            >
              {isLoading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
