import React, { useCallback } from 'react';
import { PuzzleBoard } from '../../../components/PuzzleBoard';
import { BlitzLeaderboard } from './BlitzLeaderboard';
import { useBlitzTimer } from '../useBlitzTimer';
import { useBlitzRoom } from '../useBlitzRoom';
import { useBlitzGame } from '../useBlitzGame';
import { formatBlitzTime } from '../utils';
import { BLITZ_ACCENT, BUTTON_STYLES, TIMER_STYLES, RESPONSIVE } from '../theme';
import { WalletStrip } from '../../../components/economy/WalletStrip';
import { HomeButton } from '../../../components/navigation/HomeButton';
import { SettingsButton } from '../../../components/navigation/SettingsButton';

export type BlitzGameScreenProps = {
  /** Optional callback when game ends */
  onGameEnd?: () => void;
};

/**
 * Main game screen for Blitz mode.
 *
 * Layout:
 * - Top: Large countdown timer (MM:SS, red when < 10s)
 * - Left (main): PuzzleBoard component
 * - Right (sidebar): BlitzLeaderboard
 * - Bottom: Skip Puzzle and Forfeit Game buttons
 * - Responsive: Stacks vertically on mobile
 */
export const BlitzGameScreen: React.FC<BlitzGameScreenProps> = ({ onGameEnd }) => {
  const room = useBlitzRoom();

  // Validate required room functions are available
  if (!room.postPuzzleResult || !room.updateMyState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
            Configuration Error
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to initialize game.
          </p>
        </div>
      </div>
    );
  }

  const game = useBlitzGame({
    room: room.room,
    me: room.me,
    postPuzzleResult: room.postPuzzleResult,
    updateMyState: room.updateMyState,
  });

  // Timer hook: derive start timestamp from room meta
  const startTimestamp = room.room?.meta.startedAt ?? null;
  const durationSeconds = (room.room?.meta.durationMs ?? 60000) / 1000;

  const timer = useBlitzTimer({
    startTimestamp,
    durationSeconds,
    onExpire: async () => {
      await room.endGame();
      onGameEnd?.();
    },
  });

  // Current player info
  const me = room.me;
  const totalPuzzles = room.room?.puzzles?.length ?? 0;
  const currentPuzzleNum = game.currentPuzzleIndex + 1;

  // Handle puzzle solved
  const handlePuzzleSolved = useCallback(async () => {
    await game.reportSolved({ wrongAttempts: 0, hintsUsed: 0 });
  }, [game]);

  // Handle skip puzzle
  const handleSkipPuzzle = useCallback(async () => {
    await game.reportFailed({ wrongAttempts: 0, hintsUsed: 0 });
  }, [game]);

  // Handle forfeit
  const handleForfeit = useCallback(async () => {
    await room.endGame();
    onGameEnd?.();
  }, [room, onGameEnd]);

  // Error state
  if (room.error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
            Game Error
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            {room.error.message}
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!room.room || !me || !game.currentPuzzle) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400">Loading game...</p>
      </div>
    );
  }

  const formattedTime = formatBlitzTime(timer.remainingMs);
  const timerIsWarning = timer.remainingMs < 10000;
  const timerIsCritical = timer.remainingMs < 5000;

  return (
    <>
      <HomeButton />
      <SettingsButton />
      <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col">
        <div className="fixed top-4 left-4 z-50 pr-4 max-w-xs">
          <WalletStrip compact={true} />
        </div>
      {/* Top: Timer */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 text-center shadow-sm">
        <p
          className={`
            text-5xl font-bold font-mono tracking-wider
            transition-all duration-150
            ${
              timerIsCritical
                ? `${TIMER_STYLES.critical}`
                : timerIsWarning
                  ? `${TIMER_STYLES.warning}`
                  : `${TIMER_STYLES.normal}`
            }
          `}
          role="status"
          aria-live="polite"
          aria-label={`Time remaining: ${formattedTime}`}
        >
          {formattedTime}
        </p>
      </div>

      {/* Main content: Puzzle board + Leaderboard */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left: Main puzzle board section */}
          <div className="lg:col-span-2 flex flex-col">
            {/* Player name and puzzle progress */}
            <div className="mb-4">
              <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
                {me.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Puzzle {currentPuzzleNum}/{totalPuzzles}
              </p>
            </div>

            {/* Puzzle board */}
            <div className="flex-1 overflow-auto">
              <PuzzleBoard
                puzzle={game.currentPuzzle}
                onSolved={handlePuzzleSolved}
                hideScore={true}
                disabled={timer.isExpired}
              />
            </div>
          </div>

          {/* Right: Leaderboard sidebar */}
          <div className="lg:col-span-1">
            {room.room.players && (
              <BlitzLeaderboard
                players={Array.from(room.room.players.values())}
                currentPlayerId={me.id}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Action buttons */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-4 justify-center shadow-md">
        <button
          onClick={handleSkipPuzzle}
          disabled={timer.isExpired}
          className={`
            ${BUTTON_STYLES.primary}
            min-h-[48px] min-w-[48px] px-4 py-3
            active:animate-buttonPress
          `}
          aria-label="Skip current puzzle"
        >
          Skip Puzzle
        </button>
        <button
          onClick={handleForfeit}
          className={`
            ${BUTTON_STYLES.danger}
            min-h-[48px] min-w-[48px] px-4 py-3
            active:animate-buttonPress
          `}
          aria-label="Forfeit the game"
        >
          Forfeit Game
        </button>
      </div>
      </div>
    </>
  );
};
