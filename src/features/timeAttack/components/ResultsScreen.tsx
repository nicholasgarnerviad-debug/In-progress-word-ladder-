import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TimeAttackMode, DurationTier, Difficulty } from '../types';
import { getBest, loadStats } from '../stats';

export type ResultsScreenProps = {
  mode: TimeAttackMode;
  tier: DurationTier;
  solvedCount: number;
  longestStreak: number;
  timeTakenMs: number;
  averageSolveMs: number | null;
  bestDifficulty: Difficulty | null;
  onPlayAgain: () => void;
  onBackToHome: () => void;
};

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  mode,
  tier,
  solvedCount,
  longestStreak,
  timeTakenMs,
  averageSolveMs,
  bestDifficulty,
  onPlayAgain,
  onBackToHome,
}) => {
  const navigate = useNavigate();
  const stats = loadStats();
  const personalBest = getBest(stats, mode, tier);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (duration: DurationTier): string => {
    if (mode === 'sprint') {
      return `${duration}s`;
    } else {
      const labels = { 60: 'Short', 90: 'Medium', 120: 'Long' };
      return labels[duration];
    }
  };

  const handlePlayAgain = () => {
    onPlayAgain();
  };

  const handleBackToHome = () => {
    onBackToHome();
    navigate('/');
  };

  const isBestRun = !personalBest || solvedCount > personalBest.solved;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header strip */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center justify-center px-4">
        <h1 className="text-xl font-bold">Run Complete</h1>
      </div>

      {/* Main content */}
      <div className="max-w-md mx-auto px-4">
        {/* Best run indicator */}
        {isBestRun && (
          <div className="pt-6 pb-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4 text-center">
              <p className="text-green-700 dark:text-green-300 font-bold">🎉 New Personal Best!</p>
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div className="py-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Solved</p>
              <p className="text-3xl font-bold font-mono">{solvedCount}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Streak</p>
              <p className="text-3xl font-bold font-mono">{longestStreak}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Time</p>
              <p className="text-lg font-bold font-mono">{formatTime(timeTakenMs)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Avg</p>
              <p className="text-lg font-bold font-mono">
                {averageSolveMs !== null ? `${Math.round(averageSolveMs / 1000)}s` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Mode/tier and personal best */}
        <div className="py-4 space-y-3">
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Mode & Duration</p>
            <div className="flex items-center justify-between">
              <p className="font-bold capitalize">{mode}</p>
              <p className="font-bold text-gray-600 dark:text-gray-400">{formatDuration(tier)}</p>
            </div>
          </div>

          {personalBest && (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Personal Best</p>
              <p className="font-bold">{personalBest.solved} solved</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="py-6 space-y-3">
          <button
            onClick={handlePlayAgain}
            className="w-full py-3 px-4 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold transition-colors hover:bg-gray-800 dark:hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            Play Again
          </button>
          <button
            onClick={handleBackToHome}
            className="w-full py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
