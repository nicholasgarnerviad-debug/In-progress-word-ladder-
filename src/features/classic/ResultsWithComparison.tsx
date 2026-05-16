// src/features/classic/ResultsWithComparison.tsx

import React from 'react';
import { compareSolutions } from '../../lib/puzzleLibrary/optimalSolver';
import type { Puzzle } from '../../lib/puzzleLibrary/types';

/**
 * Props for the ResultsWithComparison component
 */
interface ResultsWithComparisonProps {
  /** The puzzle that was just completed */
  puzzle: Puzzle;
  /** The solution path provided by the user (array of words) */
  userSolution: string[];
  /** Callback function to advance to the next puzzle */
  onNextPuzzle: () => void;
}

export const ResultsWithComparison: React.FC<ResultsWithComparisonProps> = ({
  puzzle,
  userSolution,
  onNextPuzzle,
}) => {
  // Validate user solution
  if (!userSolution?.length) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col p-4">
        <div className="max-w-2xl mx-auto w-full">
          <div
            className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="text-red-900 dark:text-red-200">
              Error: Invalid solution provided. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Extract and validate optimal solution
  const optimalSolution = puzzle.optimalSolution;
  if (!optimalSolution) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col p-4">
        <div className="max-w-2xl mx-auto w-full">
          <div
            className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="text-red-900 dark:text-red-200">
              Error: Missing optimal solution. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const comparison = compareSolutions(userSolution, optimalSolution);
  const isOptimal = comparison.difference === 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col p-4">
      <section className="max-w-2xl mx-auto w-full" aria-label="Puzzle results and solution comparison">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Puzzle Complete!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isOptimal ? '✅ Perfect Solution!' : `+${comparison.difference} moves over optimal`}
          </p>
        </div>

        {/* Solution Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          {/* User Solution */}
          <section aria-labelledby="user-solution-heading">
            <h3 id="user-solution-heading" className="font-bold text-lg mb-3">Your Solution ({comparison.userMoves} moves)</h3>
            <ol className="space-y-2 list-none">
              {userSolution.map((word, idx) => (
                <li
                  key={idx}
                  className={`p-2 rounded ${
                    idx === 0 || idx === userSolution.length - 1
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200'
                      : 'bg-white dark:bg-gray-700'
                  }`}
                >
                  {word.toUpperCase()}
                  {idx < userSolution.length - 1 && <span className="text-gray-500 ml-2">→</span>}
                </li>
              ))}
            </ol>
          </section>

          {/* Optimal Solution */}
          <section aria-labelledby="optimal-solution-heading">
            <h3 id="optimal-solution-heading" className="font-bold text-lg mb-3">Optimal ({comparison.optimalMoves} moves)</h3>
            <ol className="space-y-2 list-none">
              {optimalSolution.map((word, idx) => (
                <li
                  key={idx}
                  className={`p-2 rounded ${
                    idx === 0 || idx === optimalSolution.length - 1
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-200'
                      : 'bg-white dark:bg-gray-700'
                  }`}
                >
                  {word.toUpperCase()}
                  {idx < optimalSolution.length - 1 && <span className="text-gray-500 ml-2">→</span>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Stats */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-8">
          <p className="text-center text-sm">
            You completed the puzzle in <span className="font-bold">{comparison.userMoves}</span> moves.
            {comparison.difference > 0 && (
              <> The optimal path is <span className="font-bold">{comparison.optimalMoves}</span> moves.</>
            )}
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={onNextPuzzle}
            aria-label="Continue to next puzzle"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            Next Puzzle
          </button>
          <button
            aria-label="View puzzle library"
            className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-semibold"
          >
            View Library
          </button>
        </div>
      </section>
    </div>
  );
};
