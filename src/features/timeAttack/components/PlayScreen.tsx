import React, { useState, useEffect } from 'react';
import { WordPuzzle } from '../../../generatePuzzle';
import { PuzzleBoard } from '../../../components/PuzzleBoard';
import { Clock } from './Clock';
import { getSkipCostSeconds } from '../difficulty';
import { DurationTier } from '../types';

export type PlayScreenProps = {
  puzzle: WordPuzzle | null;
  puzzleIndex: number;
  remainingMs: number;
  isTimeRewardFlashing: boolean;
  solvedCount: number;
  currentStreak: number;
  tier: DurationTier;
  onSolved: () => void;
  onSkip: () => void;
  freeSkipsRemaining: number;
};

export const PlayScreen: React.FC<PlayScreenProps> = ({
  puzzle,
  puzzleIndex,
  remainingMs,
  isTimeRewardFlashing,
  solvedCount,
  currentStreak,
  tier,
  onSolved,
  onSkip,
  freeSkipsRemaining,
}) => {
  const [skipDisabled, setSkipDisabled] = useState(false);
  const [showLoadingPlaceholder, setShowLoadingPlaceholder] = useState(false);

  useEffect(() => {
    if (puzzle === null) {
      setShowLoadingPlaceholder(true);
      const timer = setTimeout(() => {
        setShowLoadingPlaceholder(false);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setShowLoadingPlaceholder(false);
    }
  }, [puzzle]);

  const handleSkip = () => {
    setSkipDisabled(true);
    onSkip();
    const timer = setTimeout(() => {
      setSkipDisabled(false);
    }, 200);
    return () => clearTimeout(timer);
  };

  const getSkipLabel = (): string => {
    if (freeSkipsRemaining > 0) {
      return freeSkipsRemaining === 1 ? 'Skip (1 free)' : 'Skip (2 free)';
    }
    const cost = getSkipCostSeconds(tier, 0);
    return `Skip (-${cost}s)`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Top bar */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="text-sm">
            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Solved</p>
            <p className="font-mono font-bold text-lg">{solvedCount}</p>
          </div>

          <div className="flex-1 flex justify-center">
            <Clock remainingMs={remainingMs} isFlashing={isTimeRewardFlashing} />
          </div>

          <div className="text-sm text-right">
            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Streak</p>
            <p className="font-mono font-bold text-lg">{currentStreak}</p>
          </div>
        </div>
      </div>

      {/* Puzzle area */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="max-w-md w-full">
          {showLoadingPlaceholder || puzzle === null ? (
            <div className="h-20 flex items-center justify-center">
              <p className="text-gray-400 dark:text-gray-500 text-sm">Loading next…</p>
            </div>
          ) : (
            <PuzzleBoard
              key={puzzleIndex}
              puzzle={puzzle}
              onSolved={onSolved}
              hideScore={true}
            />
          )}
        </div>
      </div>

      {/* Bottom bar - Skip button */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSkip}
            disabled={skipDisabled}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none ${
              skipDisabled
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
            aria-label="Skip current puzzle"
          >
            {getSkipLabel()}
          </button>
        </div>
      </div>
    </div>
  );
};
