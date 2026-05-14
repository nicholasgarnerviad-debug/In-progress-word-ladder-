import React, { useCallback } from 'react';
import { PuzzleBoard } from '../../../components/PuzzleBoard';
import { BlitzLeaderboard } from './BlitzLeaderboard';
import { useBlitzTimer } from '../useBlitzTimer';
import { useBlitzRoom } from '../useBlitzRoom';
import { useBlitzGame } from '../useBlitzGame';
import { formatBlitzTime } from '../utils';

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
  const totalPuzzles = (room.room as any)?.puzzles?.length ?? 0;
  const currentPuzzleNum = game.currentPuzzleIndex + 1;

  // Handle puzzle solved
  const handlePuzzleSolved = useCallback(async () => {
    await game.reportSolved({ wrongAttempts: 0, hintsUsed: 0 });
  }, [game]);

  // Handle wrong guess
  const handleWrongGuess = useCallback(() => {
    // Feedback only - puzzle board handles wrong guesses
  }, []);

  // Handle skip puzzle
  const handleSkipPuzzle = useCallback(async () => {
    await game.reportFailed({ wrongAttempts: 0, hintsUsed: 0 });
  }, [game]);

  // Handle forfeit
  const handleForfeit = useCallback(async () => {
    await room.endGame();
    onGameEnd?.();
  }, [room, onGameEnd]);

  if (!room.room || !me || !game.currentPuzzle) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400">Loading game...</p>
      </div>
    );
  }

  const formattedTime = formatBlitzTime(timer.remainingMs);
  const timerIsWarning = timer.remainingMs < 10000;

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col">
      {/* Top: Timer */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 text-center">
        <p
          className={`
            text-5xl font-bold font-mono tracking-wider
            transition-colors duration-200
            ${
              timerIsWarning
                ? 'text-red-600 dark:text-red-500'
                : 'text-gray-800 dark:text-gray-100'
            }
          `}
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
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
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
                onWrongGuess={handleWrongGuess}
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
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3 justify-center">
        <button
          onClick={handleSkipPuzzle}
          disabled={timer.isExpired}
          className="
            px-6 py-2 rounded-lg font-semibold
            bg-yellow-500 hover:bg-yellow-600 text-white
            dark:bg-yellow-600 dark:hover:bg-yellow-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          Skip Puzzle
        </button>
        <button
          onClick={handleForfeit}
          className="
            px-6 py-2 rounded-lg font-semibold
            bg-red-500 hover:bg-red-600 text-white
            dark:bg-red-600 dark:hover:bg-red-700
            transition-colors
          "
        >
          Forfeit Game
        </button>
      </div>
    </div>
  );
};
