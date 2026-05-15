import React, { useState, useEffect, useRef } from 'react';
import { WordPuzzle } from '../../../generatePuzzle';
import { PuzzleBoard } from '../../../components/PuzzleBoard';
import { HomeButton } from '../../../components/HomeButton';
import { Clock } from './Clock';
import { getSkipCostSeconds } from '../difficulty';
import { DurationTier } from '../types';
import { useEconomy } from '../../../lib/economy';
import { ConsumableButton } from '../../../components/ConsumableButton';
import { shortestPath } from '../../../wordGraph';

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
  const economy = useEconomy();
  const puzzleBoardRef = useRef<{ applyHint: (index: number) => void }>(null);

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

  const getHintIndex = (): number | null => {
    if (!puzzle) return null;
    // This is a simplified hint calculation - would need access to actual game state
    // For now, just hint the first letter difference
    return 0;
  };

  const handleUseHint = () => {
    const hintCount = economy.getCount('hint');
    if (!puzzle) return;

    const hintIndex = getHintIndex();
    if (hintIndex === null) return;

    if (hintCount > 0) {
      // Use from inventory
      economy.useItem('hint');
    } else {
      // Buy new hints (5-pack for 30 coins)
      if (!economy.buyConsumable('hint', 30, 5)) {
        return; // Not enough coins
      }
    }

    // Apply hint through PuzzleBoard ref
    puzzleBoardRef.current?.applyHint(hintIndex);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Top bar */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HomeButton isGameInProgress={true} />
            <div className="text-sm">
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Solved</p>
              <p className="font-mono font-bold text-lg">{solvedCount}</p>
            </div>
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
              ref={puzzleBoardRef}
              key={puzzleIndex}
              puzzle={puzzle}
              onSolved={onSolved}
              hideScore={true}
            />
          )}
        </div>
      </div>

      {/* Bottom bar - Consumables and Skip button */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-md mx-auto">
          {/* Consumables row (above Skip button) */}
          <div className="flex gap-2 flex-wrap justify-center mb-4">
            <ConsumableButton
              type="hint"
              label="Hint"
              count={economy.getCount('hint')}
              cost={30}
              disabled={false}
              onUse={handleUseHint}
              onBuy={() => {
                economy.buyConsumable('hint', 30, 5);
              }}
            />
            <ConsumableButton
              type="time_extension_15s"
              label="+15s"
              count={economy.getCount('time_extension_15s')}
              cost={40}
              disabled={skipDisabled}
              onUse={() => {
                economy.useItem('time_extension_15s');
              }}
              onBuy={() => {
                economy.buyConsumable('time_extension_15s', 40, 5);
              }}
            />
          </div>

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
