import React, { useEffect, useState, useRef } from 'react';
import { useTimeAttack } from '../useTimeAttack';
import { SetupScreen } from '../components/SetupScreen';
import { PlayScreen } from '../components/PlayScreen';
import { EndScreen } from '../components/EndScreen';
import { useEconomy } from '../../../lib/economy/useEconomy';
import { useLevelUpQueue } from '../../../components/economy/LevelUpProvider';

const XP_BASE_PER_SOLVE = 5;
const XP_PER_SECOND_REMAINING = 1;
const XP_SECOND_BONUS_CAP = 30;
const TIME_ATTACK_DURATION = 180;
const SURVIVAL_MODE_XP_MULTIPLIER = 1.5;
const CLASSIC_MODE_XP_MULTIPLIER = 1.0;

function calculateSolveXp(params: {
  baseXp?: number;
  secondsRemaining: number;
  isSurvivalMode: boolean;
}): number {
  const { baseXp = XP_BASE_PER_SOLVE, secondsRemaining, isSurvivalMode } = params;

  const timeBonus = Math.min(
    XP_PER_SECOND_REMAINING * secondsRemaining,
    XP_SECOND_BONUS_CAP
  );

  let xpAmount = baseXp + timeBonus;
  const multiplier = isSurvivalMode ? SURVIVAL_MODE_XP_MULTIPLIER : CLASSIC_MODE_XP_MULTIPLIER;
  xpAmount = Math.floor(xpAmount * multiplier);

  return xpAmount;
}

export const TimeAttackPage: React.FC = () => {
  const state = useTimeAttack();
  const { earnCoins, addXp } = useEconomy();
  const { push: pushLevelUpRewards } = useLevelUpQueue();
  const xpAwardedRef = useRef(false);
  const lastSolvedCountRef = useRef(0);
  const [cumulativeXp, setCumulativeXp] = useState(0);

  useEffect(() => {
    document.title = 'Time Attack — Word Ladder';
  }, []);

  // Per-solve XP award
  useEffect(() => {
    if (state.phase === 'playing' && state.solvedCount > lastSolvedCountRef.current) {
      const isSurvivalMode = state.mode === 'survival';
      const secondsRemaining = Math.max(0, state.timeRemainingMs / 1000);
      const solveXp = calculateSolveXp({
        secondsRemaining,
        isSurvivalMode,
      });

      setCumulativeXp(prev => prev + solveXp);
      lastSolvedCountRef.current = state.solvedCount;
    }
  }, [state.solvedCount, state.timeRemainingMs, state.mode, state.phase]);

  // Run-end XP award
  useEffect(() => {
    if (state.phase === 'ended' && !xpAwardedRef.current && cumulativeXp > 0) {
      const result = addXp(cumulativeXp, 'time_attack_run');

      if (result.leveledUp) {
        pushLevelUpRewards(result.rewards);
      }

      xpAwardedRef.current = true;
    }
  }, [state.phase, cumulativeXp, addXp, pushLevelUpRewards]);

  // Reset on new run or when run ends
  useEffect(() => {
    if (state.phase === 'playing') {
      // Reset when starting a new run
      if (lastSolvedCountRef.current > 0) {
        setCumulativeXp(0);
        lastSolvedCountRef.current = 0;
        xpAwardedRef.current = false;
      }
    }
  }, [state.phase]);

  return (
    <>
      {(state.phase === 'idle' || state.phase === 'setup') && (
        <SetupScreen
          mode={state.mode}
          tier={state.tier}
          onChooseMode={state.chooseMode}
          onChooseTier={state.chooseTier}
          onStartRun={state.startRun}
          onReset={state.reset}
        />
      )}

      {state.phase === 'playing' && (
        <PlayScreen
          puzzle={state.currentPuzzle}
          puzzleIndex={state.currentPuzzleIndex}
          remainingMs={state.timeRemainingMs}
          isTimeRewardFlashing={state.isTimeRewardFlashing}
          solvedCount={state.solvedCount}
          currentStreak={state.currentStreak}
          tier={state.tier!}
          onSolved={state.reportSolved}
          onSkip={state.skipPuzzle}
          freeSkipsRemaining={state.freeSkipsRemaining}
        />
      )}

      {state.phase === 'ended' && (
        <EndScreen
          mode={state.mode!}
          tier={state.tier!}
          solvedCount={state.solvedCount}
          longestStreak={state.longestStreak}
          timeRemainingMs={state.timeRemainingMs}
          averageSolveMs={
            state.solveTimings.length > 0
              ? Math.round(state.solveTimings.reduce((a, b) => a + b, 0) / state.solveTimings.length)
              : null
          }
          bestDifficulty={state.bestDifficulty}
          previousBestAtRunEnd={state.previousBestAtRunEnd}
          cumulativeXp={cumulativeXp}
          onPlayAgain={state.playAgain}
          onBackToHome={state.reset}
        />
      )}
    </>
  );
};
