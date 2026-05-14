import React, { useEffect } from 'react';
import { useTimeAttack } from '../useTimeAttack';
import { SetupScreen } from '../components/SetupScreen';
import { PlayScreen } from '../components/PlayScreen';
import { EndScreen } from '../components/EndScreen';

export const TimeAttackPage: React.FC = () => {
  const state = useTimeAttack();

  useEffect(() => {
    document.title = 'Time Attack — Word Ladder';
  }, []);

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
          onPlayAgain={state.playAgain}
          onBackToHome={state.reset}
        />
      )}
    </>
  );
};
