import type { BlitzWordLength, BlitzDifficulty } from './types';
import { BLITZ_LIMITS } from './types';

export interface ComputeScoreInput {
  solved: boolean;
  solveTime: number | null;
  wrong: number;
  hints: number;
  wordLength: BlitzWordLength;
  difficulty: BlitzDifficulty;
}

/**
 * Par times for different word lengths and difficulties.
 * In milliseconds.
 */
const PAR_TIMES: Record<BlitzWordLength, Record<BlitzDifficulty, number>> = {
  4: {
    easy: 3000,
    medium: 5000,
    hard: 8000,
  },
  5: {
    easy: 5000,
    medium: 8000,
    hard: 12000,
  },
  6: {
    easy: 8000,
    medium: 12000,
    hard: 18000,
  },
};

/**
 * Computes the blitz puzzle score.
 * Formula: (optimal * 100) - (wrong * 40) - (hints * 50) + speedBonus
 * Minimum score: 10
 *
 * Speed bonus: 5 points per second under par (only if solved).
 * Par time varies by word length and difficulty.
 */
export function computeBlitzPuzzleScore(input: ComputeScoreInput): number {
  if (!input.solved || input.solveTime === null) {
    return 0;
  }

  const parTime = PAR_TIMES[input.wordLength][input.difficulty];
  const optimal = BLITZ_LIMITS.SCORE_PER_SOLVE;
  const wrongPenalty = input.wrong * BLITZ_LIMITS.PENALTY_PER_WRONG;
  const hintPenalty = input.hints * BLITZ_LIMITS.PENALTY_PER_HINT;

  let speedBonus = 0;
  if (input.solveTime < parTime) {
    const secondsUnderPar = (parTime - input.solveTime) / 1000;
    speedBonus = Math.floor(secondsUnderPar * 5);
  }

  const score = optimal - wrongPenalty - hintPenalty + speedBonus;
  return Math.max(score, BLITZ_LIMITS.MIN_SCORE);
}

/**
 * Wrapper around computeBlitzPuzzleScore that returns 0 if not solved.
 */
export function computeBlitzPuzzleScoreIfSolved(input: ComputeScoreInput): number {
  if (!input.solved) {
    return 0;
  }
  return computeBlitzPuzzleScore(input);
}
