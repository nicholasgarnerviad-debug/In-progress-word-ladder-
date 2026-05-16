// src/features/classic/PuzzleLibraryBrowser.tsx

import React, { useState } from 'react';
import { useLibraryProgress } from '../../lib/puzzleLibrary/useLibraryProgress';
import { HomeButton } from '../../components/HomeButton';
import type { Puzzle } from '../../lib/puzzleLibrary/types';

interface PuzzleLibraryBrowserProps {
  onSelectPuzzle?: (puzzle: Puzzle) => void;
  onClose?: () => void;
}

export const PuzzleLibraryBrowser: React.FC<PuzzleLibraryBrowserProps> = ({
  onSelectPuzzle,
  onClose,
}) => {
  const library = useLibraryProgress();
  const [activeTab, setActiveTab] = useState(3); // 3-7 letters

  if (library.loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading library...</p>
      </div>
    );
  }

  const categoryPuzzles = Array.from(library.puzzles.values()).filter(
    p => p.wordLength === activeTab
  );
  const category = library.categories.get(activeTab);
  const completed = categoryPuzzles.filter(p => p.completed).length;
  const total = categoryPuzzles.length || 10;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      <HomeButton isGameInProgress={false} />

      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Puzzle Library</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse completed puzzles</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-4">
        <div className="max-w-2xl mx-auto flex gap-4 overflow-x-auto">
          {[3, 4, 5, 6, 7].map(len => (
            <button
              key={len}
              onClick={() => setActiveTab(len)}
              className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === len
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {len}-Letter
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          {category && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold">Progress</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {completed} / {total}
                </p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(completed / total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Puzzles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryPuzzles.map(puzzle => (
              <div
                key={puzzle.id}
                onClick={() => {
                  if (puzzle.completed && onSelectPuzzle) {
                    onSelectPuzzle(puzzle);
                  }
                }}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  puzzle.completed
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">
                    {puzzle.startWord.toUpperCase()} → {puzzle.endWord.toUpperCase()}
                  </span>
                  {puzzle.completed && <span className="text-green-600">✓</span>}
                </div>
                {puzzle.completed && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Your: {puzzle.moveCount} | Optimal: {puzzle.optimalMoveCount}
                  </div>
                )}
              </div>
            ))}
          </div>

          {categoryPuzzles.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No puzzles yet in {activeTab}-letter category
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
