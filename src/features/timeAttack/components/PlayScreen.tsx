import React, { useState, useEffect, useRef } from 'react';
import { WordPuzzle } from '../../../generatePuzzle';
import { PuzzleBoard } from '../../../components/PuzzleBoard';
import { HomeButton } from '../../../components/HomeButton';
import { getSkipCostSeconds } from '../difficulty';
import { DurationTier } from '../types';
import { useEconomy } from '../../../lib/economy';
import { ConsumableButton } from '../../../components/ConsumableButton';
import { shortestPath } from '../../../wordGraph';

// Memoized timer display component that only updates on timer ticks
const TimerDisplay = React.memo(
  ({ remainingMs, isFlashing = false }: { remainingMs: number; isFlashing?: boolean }) => {
    const totalSeconds = Math.max(0, remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const tenths = Math.floor((totalSeconds * 10) % 10);

    const isLowTime = totalSeconds < 10;
    const isVeryLowTime = totalSeconds < 5;

    let displayText: string;
    if (totalSeconds >= 10) {
      displayText = `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
    } else {
      displayText = `${seconds}.${tenths}`;
    }

    const animationClass = isVeryLowTime ? 'animate-pulse' : isLowTime ? 'animate-pulse' : '';
    const pulseStyle = isVeryLowTime
      ? { animationDuration: '0.5s' }
      : isLowTime
        ? { animationDuration: '1s' }
        : {};

    return (
      <>
        <style>{`
          @keyframes clock-flash {
            0%, 100% { color: inherit; }
            50% { color: rgb(34, 197, 94); }
          }
          .clock-flashing {
            animation: clock-flash 0.6s ease-out;
          }
        `}</style>
        <div
          className={`font-mono text-5xl font-bold text-center transition-colors ${
            isFlashing
              ? 'clock-flashing'
              : isLowTime
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-gray-100'
          } ${animationClass}`}
          style={pulseStyle}
        >
          {displayText}
        </div>
      </>
    );
  }
);

TimerDisplay.displayName = 'TimerDisplay';

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
  onAddTime: () => void;
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
  onAddTime,
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
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
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
            <TimerDisplay remainingMs={remainingMs} isFlashing={isTimeRewardFlashing} />
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
          <div className="flex gap-4 flex-wrap justify-center mb-4">
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
                onAddTime();
              }}
              onBuy={() => {
                economy.buyConsumable('time_extension_15s', 40, 5);
              }}
            />
            <ConsumableButton
              type="reveal_next_word"
              label="Reveal"
              count={economy.getCount('reveal_next_word')}
              cost={60}
              disabled={false}
              onUse={() => {
                if (!puzzle) return;
                const nextWord = puzzle.chain[1];
                economy.useItem('reveal_next_word');
                puzzleBoardRef.current?.applyReveal(nextWord.split(''));
              }}
              onBuy={() => {
                economy.buyConsumable('reveal_next_word', 60, 3);
              }}
            />
          </div>

          <button
            onClick={handleSkip}
            disabled={skipDisabled}
            className={`w-full py-3 px-4 min-h-[48px] rounded-lg font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none ${
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
