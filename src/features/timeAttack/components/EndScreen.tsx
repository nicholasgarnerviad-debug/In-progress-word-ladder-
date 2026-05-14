import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TimeAttackMode, DurationTier, Difficulty } from '../types';

export type EndScreenProps = {
  mode: TimeAttackMode;
  tier: DurationTier;
  solvedCount: number;
  longestStreak: number;
  timeRemainingMs: number; // For sprint: tier * 1000 - timeRemaining
  averageSolveMs: number | null;
  bestDifficulty: Difficulty | null;
  previousBestAtRunEnd: { solved: number; longestStreak: number; achievedAt: string } | null;
  onPlayAgain: () => void;
  onBackToHome: () => void;
};

const formatMs = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getDurationLabel = (mode: TimeAttackMode, tier: DurationTier): string => {
  if (mode === 'sprint') {
    return `${tier}s`;
  } else {
    const labels: Record<DurationTier, string> = { 60: 'Short (45s base)', 90: 'Medium (75s base)', 120: 'Long (120s base)' };
    return labels[tier] || `${tier}s`;
  }
};

const computeElapsedTime = (mode: TimeAttackMode, tier: DurationTier, timeRemainingMs: number): string => {
  if (mode === 'sprint') {
    // Sprint: tier is total time, timeRemainingMs is what's left, so elapsed = tier*1000 - timeRemaining
    const elapsedMs = tier * 1000 - timeRemainingMs;
    return formatMs(Math.max(0, elapsedMs));
  } else {
    // Survival: timeRemainingMs is actual remaining time, so elapsed = initial - remaining
    // We'd need initial base time, but for simplicity, we show what stats.ts calculates
    // This will be passed from parent as calculated in endRun
    return formatMs(timeRemainingMs);
  }
};

export const EndScreen: React.FC<EndScreenProps> = ({
  mode,
  tier,
  solvedCount,
  longestStreak,
  timeRemainingMs,
  averageSolveMs,
  bestDifficulty,
  previousBestAtRunEnd,
  onPlayAgain,
  onBackToHome,
}) => {
  const navigate = useNavigate();

  const isPersonalBest = previousBestAtRunEnd === null || solvedCount > previousBestAtRunEnd.solved;
  const isFirstRun = previousBestAtRunEnd === null;

  const handleBackToHome = () => {
    onBackToHome();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header strip */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center px-4">
        <button
          onClick={handleBackToHome}
          className="text-2xl leading-none hover:opacity-60 transition-opacity"
          aria-label="Back to home"
        >
          ←
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center py-8 px-4 gap-6">
        {/* Achievement badge */}
        {isFirstRun && (
          <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-semibold">
            First Run!
          </div>
        )}
        {isPersonalBest && !isFirstRun && (
          <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-sm font-semibold">
            New Personal Best!
          </div>
        )}

        {/* Centerpiece: large number */}
        <div className="text-center">
          <div className="text-7xl font-bold font-mono tabular-nums">{solvedCount}</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Puzzles Solved</p>
        </div>

        {/* Mode + tier badge */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {mode === 'sprint' ? 'Sprint' : 'Survival'} • {getDurationLabel(mode, tier)}
          </p>
        </div>

        {/* Secondary stats card */}
        <div className="w-full max-w-sm border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Longest Streak</span>
            <span className="font-mono font-semibold text-lg">{longestStreak}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Time</span>
            <span className="font-mono font-semibold text-lg">{computeElapsedTime(mode, tier, timeRemainingMs)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Avg Solve</span>
            <span className="font-mono font-semibold text-lg">
              {averageSolveMs !== null ? formatMs(averageSolveMs) : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Best Difficulty</span>
            <span className="font-mono font-semibold text-lg">
              {bestDifficulty ? bestDifficulty.charAt(0).toUpperCase() + bestDifficulty.slice(1) : '—'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 px-4 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold transition-colors hover:bg-gray-800 dark:hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            Play Again
          </button>
          <button
            onClick={handleBackToHome}
            className="w-full py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};
