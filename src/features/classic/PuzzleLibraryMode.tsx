// src/features/classic/PuzzleLibraryMode.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useEconomy } from '../../lib/economy';
import { useLibraryProgress } from '../../lib/puzzleLibrary/useLibraryProgress';
import * as queries from '../../lib/puzzleLibrary/queries';
import { calculateOptimalSolution } from '../../lib/puzzleLibrary/optimalSolver';
import { PuzzleBoard } from '../../components/PuzzleBoard';
import { HomeButton } from '../../components/HomeButton';
import { ResultsWithComparison } from './ResultsWithComparison';
import type { WordPuzzle } from '../../generatePuzzle';
import type { Puzzle } from '../../lib/puzzleLibrary/types';

export const PuzzleLibraryMode: React.FC = () => {
  const economy = useEconomy();
  const library = useLibraryProgress();
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [displayPuzzle, setDisplayPuzzle] = useState<WordPuzzle | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [userSolution, setUserSolution] = useState<string[]>([]);
  const puzzleBoardRef = useRef<{ applyHint: (index: number) => void }>(null);

  const currentCategory = library.progress?.currentWordLength ?? 3;

  // Load next unsolved puzzle when library loads or category changes
  useEffect(() => {
    if (!library.loading && currentPuzzle === null) {
      loadNextPuzzle();
    }
  }, [library.loading]);

  const loadNextPuzzle = async () => {
    try {
      const unsolved = await queries.getUnsolvedInCategory(currentCategory);
      if (unsolved.length === 0) {
        // All puzzles in category complete
        return;
      }

      // Pick random from unsolved
      const puzzle = unsolved[Math.floor(Math.random() * unsolved.length)];
      setCurrentPuzzle(puzzle);

      // Convert to WordPuzzle format for PuzzleBoard
      const wordPuzzle: WordPuzzle = {
        start: puzzle.startWord,
        end: puzzle.endWord,
        chain: [], // Not used in library mode
      };
      setDisplayPuzzle(wordPuzzle);
      setShowResults(false);
      setUserSolution([]);
    } catch (error) {
      console.error('Failed to load next puzzle:', error);
    }
  };

  const handlePuzzleSolved = async () => {
    if (!currentPuzzle || !displayPuzzle) return;

    // Calculate optimal solution
    const optimalSolution = calculateOptimalSolution(
      currentPuzzle.startWord,
      currentPuzzle.endWord
    );

    // Get user's solution (from PuzzleBoard game state)
    // For now, we'll store a placeholder - this will be updated when integrating PuzzleBoard
    const userSol = [currentPuzzle.startWord, currentPuzzle.endWord]; // Placeholder

    // Update puzzle in library
    const updatedPuzzle: Puzzle = {
      ...currentPuzzle,
      completed: true,
      userSolution: userSol,
      optimalSolution,
      moveCount: userSol.length - 1,
      optimalMoveCount: optimalSolution.length - 1,
      completedAt: Date.now(),
    };

    await library.savePuzzle(updatedPuzzle);
    setUserSolution(userSol);

    // Award coins
    economy.addCoins(50); // TODO: Adjust reward formula

    // Show results
    setShowResults(true);
  };

  const handleNextPuzzle = async () => {
    setCurrentPuzzle(null);
    setDisplayPuzzle(null);
    await loadNextPuzzle();
  };

  if (library.loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading Puzzle Library...</p>
      </div>
    );
  }

  if (showResults && currentPuzzle && displayPuzzle) {
    return (
      <ResultsWithComparison
        puzzle={currentPuzzle}
        userSolution={userSolution}
        onNextPuzzle={handleNextPuzzle}
        currentCategory={currentCategory}
      />
    );
  }

  if (!displayPuzzle) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {currentCategory}-Letter Category Complete!
          </p>
          <button
            onClick={handleNextPuzzle}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Load Next Puzzle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <HomeButton isGameInProgress={true} />

      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentCategory}-Letter Category
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Puzzle {currentCategory - 2 + 1} of 10
          </p>
        </div>
      </div>

      {/* Puzzle Area */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="max-w-md w-full">
          <PuzzleBoard
            ref={puzzleBoardRef}
            puzzle={displayPuzzle}
            onSolved={handlePuzzleSolved}
            hideScore={true}
          />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleNextPuzzle}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            Skip to Next Puzzle
          </button>
        </div>
      </div>
    </div>
  );
};
