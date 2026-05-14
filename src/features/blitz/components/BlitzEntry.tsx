import React from 'react';

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
      {/* Header strip */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center px-4">
        <h1 className="flex-1 text-center text-xl font-bold">Blitz</h1>
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
        <div className="space-y-3">
          <button
            onClick={onCreateRoom}
            disabled={isLoading}
            className="w-full py-4 px-4 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold transition-colors hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            Create Room
          </button>

          <button
            onClick={onJoinRoom}
            disabled={isLoading}
            className="w-full py-4 px-4 rounded-lg border-2 border-black dark:border-white text-black dark:text-white font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 disabled:border-gray-400 dark:disabled:border-gray-600 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};
