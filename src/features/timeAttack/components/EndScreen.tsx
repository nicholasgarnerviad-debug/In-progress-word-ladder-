import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TimeAttackMode, DurationTier, Difficulty } from '../types';
import { useEconomy } from '../../../lib/economy';

// XP multiplier for each difficulty in Time Attack mode
const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = { easy: 1.0, medium: 1.5, hard: 2.0 };

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
  const validMs = Math.max(0, ms);
  const totalSeconds = Math.floor(validMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getDurationLabel = (mode: TimeAttackMode, tier: DurationTier): string => {
  if (mode === 'sprint') {
    return `${tier}s`;
  } else {
    // Survival tiers: 60=Short(45s), 90=Medium(75s), 120=Long(120s)
    // Tier values are SHORT_DURATION constants; base times are determined by difficulty config
    const labels: Record<DurationTier, string> = { 60: 'Short (45s base)', 90: 'Medium (75s base)', 120: 'Long (120s base)' };
    return labels[tier] || `${tier}s`;
  }
};

const computeElapsedTime = (mode: TimeAttackMode, tier: DurationTier, timeRemainingMs: number): string => {
  if (mode === 'sprint') {
    // Sprint: tier is total time in seconds, timeRemainingMs is what's left on the timer
    // Elapsed time = total tier duration - remaining time
    const elapsedMs = tier * 1000 - timeRemainingMs;
    return formatMs(elapsedMs);
  } else {
    // Survival: timeRemainingMs represents elapsed time (computed by parent as current time - runStartedAt)
    // Parent is responsible for calculating actual elapsed duration and passing it here
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
  const economy = useEconomy();
  const [rewardAwarded, setRewardAwarded] = useState(false);
  const [awardedXp, setAwardedXp] = useState(0);

  const isPersonalBest = previousBestAtRunEnd === null || solvedCount > previousBestAtRunEnd.solved;
  const isFirstRun = previousBestAtRunEnd === null;

  // Award reward on mount (only once)
  useEffect(() => {
    if (rewardAwarded) return;

    const baseCoins = solvedCount * 20;
    const personalBestBonus = isPersonalBest && !isFirstRun ? 50 : 0;
    const totalCoins = baseCoins + personalBestBonus;

    // Calculate XP with difficulty multiplier
    // Award XP scaled by performance: solving more puzzles = more XP
    // Difficulty multiplier rewards pushing into harder difficulties
    const multiplier = DIFFICULTY_MULTIPLIERS[bestDifficulty ?? 'easy'];
    const totalXp = Math.round(solvedCount * 10 * multiplier);

    // Award coins for solving puzzles, plus bonus for personal best
    if (solvedCount > 0) {
      economy.earnCoins(solvedCount * 20, 'time_attack_solve');
    }
    if (isPersonalBest && !isFirstRun) {
      economy.earnCoins(50, 'time_attack_personal_best');
    }
    // Award XP for time attack run
    economy.addXp(totalXp, 'time_attack_run');
    setAwardedXp(totalXp);
    setRewardAwarded(true);
  }, [solvedCount, bestDifficulty, previousBestAtRunEnd, economy, rewardAwarded]);

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
          className="text-2xl leading-none hover:opacity-60 transition-opacity focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
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
          <div className="text-8xl font-bold font-mono tabular-nums">{solvedCount}</div>
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
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Best Difficulty</span>
            <span className="font-mono font-semibold text-lg">
              {bestDifficulty ? bestDifficulty.charAt(0).toUpperCase() + bestDifficulty.slice(1) : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Coins Earned</span>
            <span className="font-mono font-semibold text-lg">
              +{Math.round(solvedCount * 20 + (isPersonalBest && !isFirstRun ? 50 : 0))}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-600 dark:text-gray-400">XP Earned</span>
            <span className="font-mono font-semibold text-lg">
              +{awardedXp}
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
