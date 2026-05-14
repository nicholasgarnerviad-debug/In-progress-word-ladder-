import { useState, useRef, useEffect, useCallback } from 'react';
import { computeBlitzPuzzleScore } from './scoring';
import type { BlitzRoom, BlitzPlayer, BlitzPhase, BlitzPuzzleResult } from './types';
import type { WordPuzzle } from '../../generatePuzzle';

/**
 * Input props for useBlitzGame hook
 */
export type UseBlitzGameInput = {
  room: BlitzRoom | null;
  me: BlitzPlayer | null;
  postPuzzleResult: (result: BlitzPuzzleResult) => Promise<void>;
  updateMyState: (
    patch: Partial<{
      currentPuzzleIndex: number;
      puzzlesSolved: number;
      sessionScore: number;
      isFinished: boolean;
      lastActivity: number;
    }>
  ) => Promise<void>;
};

/**
 * State returned by useBlitzGame hook
 */
export type UseBlitzGameState = {
  currentPuzzle: WordPuzzle | null;
  currentPuzzleIndex: number;
  puzzlesSolved: number;
  sessionScore: number;
  isFinished: boolean;
  phase: BlitzPhase;
  isSolveFlashing: boolean;
  lastEarnedScore: number;
};

/**
 * Actions provided by useBlitzGame hook
 */
export type UseBlitzGameActions = {
  reportSolved: (meta: { wrongAttempts: number; hintsUsed: number }) => Promise<void>;
  reportFailed: (meta: { wrongAttempts: number; hintsUsed: number }) => Promise<void>;
};

/**
 * React hook for managing local game state during a Blitz game session.
 * Tracks current puzzle, score computation, and solve flash overlay.
 */
export function useBlitzGame(input: UseBlitzGameInput): UseBlitzGameState & UseBlitzGameActions {
  const { room, me, postPuzzleResult, updateMyState } = input;

  // Local state for UI feedback
  const [isSolveFlashing, setIsSolveFlashing] = useState(false);
  const [lastEarnedScore, setLastEarnedScore] = useState(0);

  // Refs for cleanup and timing
  const flashTimeoutRef = useRef<number | null>(null);
  const puzzleStartedAtRef = useRef<number>(Date.now());

  // Derive state from inputs
  const phase: BlitzPhase = room?.currentPhase ?? 'idle';
  const currentPuzzleIndex = room?.currentPuzzleIndex ?? 0;
  const puzzlesSolved = me?.solved ?? 0;
  const sessionScore = me?.score ?? 0;
  const isFinished = (me?.solvedAt ?? null) !== null;

  // Get current puzzle - null if finished, out of bounds, or no room/me
  let currentPuzzle: WordPuzzle | null = null;
  const puzzlesArray = (room as any)?.puzzles ?? [];
  if (me && room && !isFinished && currentPuzzleIndex < puzzlesArray.length) {
    currentPuzzle = puzzlesArray[currentPuzzleIndex];
  }

  /**
   * Track when puzzle changes - reset timer
   */
  useEffect(() => {
    puzzleStartedAtRef.current = Date.now();
  }, [currentPuzzleIndex]);

  /**
   * Report puzzle solved
   */
  const reportSolved = useCallback(
    async (meta: { wrongAttempts: number; hintsUsed: number }): Promise<void> => {
      if (!currentPuzzle || !me || !room) {
        return;
      }

      const timeOnPuzzleMs = Date.now() - puzzleStartedAtRef.current;

      // Compute score
      const score = computeBlitzPuzzleScore({
        solved: true,
        solveTime: timeOnPuzzleMs,
        wrong: meta.wrongAttempts,
        hints: meta.hintsUsed,
        wordLength: room.meta.wordLength,
        difficulty: room.meta.difficulty,
      });

      // Flash overlay
      setIsSolveFlashing(true);
      setLastEarnedScore(score);

      // Clear any pending flash timeout
      if (flashTimeoutRef.current !== null) {
        clearTimeout(flashTimeoutRef.current);
      }

      // Schedule flash clear
      flashTimeoutRef.current = window.setTimeout(() => {
        setIsSolveFlashing(false);
        flashTimeoutRef.current = null;
      }, 600);

      // Post result to server
      await postPuzzleResult({
        solved: true,
        solveTime: timeOnPuzzleMs,
        wrong: meta.wrongAttempts,
        hints: meta.hintsUsed,
        score,
      });

      // Update local state
      const nextIndex = currentPuzzleIndex + 1;
      const isGameFinished = nextIndex >= (room as any).puzzles?.length;

      await updateMyState({
        currentPuzzleIndex: nextIndex,
        puzzlesSolved: puzzlesSolved + 1,
        sessionScore: sessionScore + score,
        isFinished: isGameFinished,
        lastActivity: Date.now(),
      });
    },
    [currentPuzzle, me, room, currentPuzzleIndex, puzzlesSolved, sessionScore, postPuzzleResult, updateMyState]
  );

  /**
   * Report puzzle failed
   */
  const reportFailed = useCallback(
    async (meta: { wrongAttempts: number; hintsUsed: number }): Promise<void> => {
      if (!currentPuzzle || !me || !room) {
        return;
      }

      const timeOnPuzzleMs = Date.now() - puzzleStartedAtRef.current;

      // Post result to server (no score)
      await postPuzzleResult({
        solved: false,
        solveTime: null,
        wrong: meta.wrongAttempts,
        hints: meta.hintsUsed,
        score: 0,
      });

      // Update local state (advance puzzle without crediting solve or score)
      const nextIndex = currentPuzzleIndex + 1;
      const isGameFinished = nextIndex >= (room as any).puzzles?.length;

      await updateMyState({
        currentPuzzleIndex: nextIndex,
        isFinished: isGameFinished,
        lastActivity: Date.now(),
      });
    },
    [currentPuzzle, me, room, currentPuzzleIndex, postPuzzleResult, updateMyState]
  );

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current !== null) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    currentPuzzle,
    currentPuzzleIndex,
    puzzlesSolved,
    sessionScore,
    isFinished,
    phase,
    isSolveFlashing,
    lastEarnedScore,
    // Actions
    reportSolved,
    reportFailed,
  };
}
