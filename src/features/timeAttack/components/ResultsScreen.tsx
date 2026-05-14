import React from 'react';
import { TimeAttackMode, DurationTier, Difficulty } from '../types';

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
  const timeTakenSeconds = Math.round(timeTakenMs / 1000);

  return (
    <div className="results-screen">
      <h1>Run Complete</h1>
      <div className="results">
        <div className="result-row">
          <span className="label">Mode:</span>
          <span className="value">{mode === 'sprint' ? 'Sprint' : 'Survival'} ({tier}s)</span>
        </div>
        <div className="result-row">
          <span className="label">Solved:</span>
          <span className="value">{solvedCount}</span>
        </div>
        <div className="result-row">
          <span className="label">Longest Streak:</span>
          <span className="value">{longestStreak}</span>
        </div>
        <div className="result-row">
          <span className="label">Time Taken:</span>
          <span className="value">{timeTakenSeconds}s</span>
        </div>
        {averageSolveMs !== null && (
          <div className="result-row">
            <span className="label">Average Solve Time:</span>
            <span className="value">{averageSolveMs}ms</span>
          </div>
        )}
        {bestDifficulty && (
          <div className="result-row">
            <span className="label">Best Difficulty:</span>
            <span className="value">{bestDifficulty}</span>
          </div>
        )}
      </div>
      <div className="actions">
        <button onClick={onPlayAgain}>Play Again</button>
        <button onClick={onBackToHome}>Back to Home</button>
      </div>
    </div>
  );
};
