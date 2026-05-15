import React from 'react';
import { BLITZ_ACCENT } from '../theme';

export type BlitzEntryProps = {
  isLoading: boolean;
  error: string | null;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
};

export const BlitzEntry: React.FC<BlitzEntryProps> = ({
  isLoading,
  error,
  onCreateRoom,
  onJoinRoom,
}) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header strip with Blitz branding */}
      <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 bg-gradient-to-r from-white to-yellow-50 dark:from-gray-950 dark:to-gray-900">
        <h1 className={`flex-1 text-center text-2xl font-bold tracking-wider flex items-center justify-center gap-2`}>
          <span>⚡</span>
          <span>WORD BLITZ</span>
        </h1>
      </div>

      {/* Main content */}
      <div className="max-w-md mx-auto px-4 pt-8 pb-8">
        <h2 className="text-2xl font-bold mb-8 text-center">Get Started</h2>

        {/* Error display */}
        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200"
          >
            {error}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" />
            <span>Loading...</span>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-4">
          <button
            onClick={onCreateRoom}
            disabled={isLoading}
            className="w-full py-4 px-4 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold transition-all hover:bg-gray-800 dark:hover:bg-gray-100 hover:shadow-lg hover:scale-105 active:scale-95 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
            aria-busy={isLoading}
          >
            Create Room
          </button>

          <button
            onClick={onJoinRoom}
            disabled={isLoading}
            className="w-full py-4 px-4 rounded-lg border-2 border-black dark:border-white text-black dark:text-white font-bold transition-all hover:bg-gray-50 dark:hover:bg-gray-900 hover:shadow-lg hover:scale-105 active:scale-95 disabled:border-gray-400 dark:disabled:border-gray-600 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
            aria-busy={isLoading}
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};
