import { useReducer, useCallback, useEffect, useRef } from 'react';
import { generatePuzzle } from '../../generatePuzzle';
import { useTimer } from './timer';
import { loadStats, recordRun, saveStats } from './stats';
import { getDifficultyForIndex, getSkipCostSeconds, getTimeRewardSeconds, getSurvivalBaseSeconds } from './difficulty';
import { TimeAttackMode, DurationTier, Difficulty, Phase, RunSummary } from './types';

export type TimeAttackState = {
  phase: Phase;
  mode: TimeAttackMode | null;
  tier: DurationTier | null;
  timeRemainingMs: number;
  isTimeRewardFlashing: boolean;
  solvedCount: number;
  currentStreak: number;
  longestStreak: number;
  freeSkipsRemaining: number;
  currentPuzzle: ReturnType<typeof generatePuzzle> | null;
  currentPuzzleIndex: number;
  currentDifficulty: Difficulty | null;
  bestDifficulty: Difficulty | null;
  runStartedAt: number | null;
  solveTimings: number[];
  lastSolveStartedAt: number | null;
};

export type TimeAttackActions =
  | { type: 'chooseMode'; mode: TimeAttackMode }
  | { type: 'chooseTier'; tier: DurationTier }
  | { type: 'backToModeSelect' }
  | { type: 'startRun' }
  | { type: 'reportSolved' }
  | { type: 'skipPuzzle' }
  | { type: 'endRun' }
  | { type: 'playAgain' }
  | { type: 'reset' }
  | { type: 'updateTimeRemaining'; timeRemainingMs: number }
  | { type: 'stopTimeRewardFlash' };

function getInitialState(): TimeAttackState {
  return {
    phase: 'idle',
    mode: null,
    tier: null,
    timeRemainingMs: 0,
    isTimeRewardFlashing: false,
    solvedCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    freeSkipsRemaining: 2,
    currentPuzzle: null,
    currentPuzzleIndex: 0,
    currentDifficulty: null,
    bestDifficulty: null,
    runStartedAt: null,
    solveTimings: [],
    lastSolveStartedAt: null,
  };
}

function gameReducer(state: TimeAttackState, action: TimeAttackActions): TimeAttackState {
  switch (action.type) {
    case 'chooseMode': {
      if (state.phase === 'idle') {
        return {
          ...state,
          mode: action.mode,
          phase: state.tier !== null ? 'setup' : 'idle',
        };
      }
      return state;
    }

    case 'chooseTier': {
      if (state.phase === 'idle' || state.phase === 'setup') {
        return {
          ...state,
          tier: action.tier,
          phase: state.mode !== null ? 'setup' : state.phase,
        };
      }
      return state;
    }

    case 'backToModeSelect': {
      if (state.phase === 'setup') {
        return {
          ...state,
          phase: 'idle',
          mode: null,
          tier: null,
        };
      }
      return state;
    }

    case 'startRun': {
      if (state.phase !== 'setup' || !state.mode || !state.tier) {
        return state;
      }

      const now = performance.now();
      const firstDifficulty = getDifficultyForIndex(0);
      let puzzle = null;
      let attempts = 0;

      try {
        puzzle = generatePuzzle(firstDifficulty.wordLength, firstDifficulty.difficulty, `${now}:0`);
      } catch {
        while (!puzzle && attempts < 3) {
          attempts++;
          try {
            puzzle = generatePuzzle(firstDifficulty.wordLength, firstDifficulty.difficulty, `${now}:0:retry${attempts}`);
          } catch {
            // Continue retrying
          }
        }
      }

      if (!puzzle) {
        return state;
      }

      const initialTime = state.mode === 'sprint'
        ? state.tier * 1000
        : getSurvivalBaseSeconds(state.tier) * 1000;

      return {
        ...state,
        phase: 'playing',
        currentPuzzle: puzzle,
        currentPuzzleIndex: 0,
        currentDifficulty: firstDifficulty.difficulty,
        bestDifficulty: firstDifficulty.difficulty,
        runStartedAt: now,
        solvedCount: 0,
        currentStreak: 0,
        longestStreak: 0,
        freeSkipsRemaining: 2,
        timeRemainingMs: initialTime,
        solveTimings: [],
        lastSolveStartedAt: now,
      };
    }

    case 'reportSolved': {
      if (state.phase !== 'playing' || !state.currentPuzzle || !state.runStartedAt || !state.lastSolveStartedAt || !state.currentDifficulty) {
        return state;
      }

      const solveTimeMs = performance.now() - state.lastSolveStartedAt;
      const newSolveTimings = [...state.solveTimings, solveTimeMs];
      const newStreak = state.currentStreak + 1;
      const newLongestStreak = Math.max(state.longestStreak, newStreak);
      const newSolvedCount = state.solvedCount + 1;
      const nextIndex = state.currentPuzzleIndex + 1;
      const nextDifficulty = getDifficultyForIndex(nextIndex);

      let nextPuzzle = null;
      let attempts = 0;

      try {
        nextPuzzle = generatePuzzle(nextDifficulty.wordLength, nextDifficulty.difficulty, `${state.runStartedAt}:${nextIndex}`);
      } catch {
        while (!nextPuzzle && attempts < 3) {
          attempts++;
          try {
            nextPuzzle = generatePuzzle(nextDifficulty.wordLength, nextDifficulty.difficulty, `${state.runStartedAt}:${nextIndex}:retry${attempts}`);
          } catch {
            // Continue retrying
          }
        }
      }

      if (!nextPuzzle) {
        return state;
      }

      const newBestDifficulty = nextDifficulty.difficulty;
      let newTimeRemaining = state.timeRemainingMs;

      if (state.mode === 'survival') {
        const reward = getTimeRewardSeconds(state.currentDifficulty) * 1000;
        newTimeRemaining += reward;
      }

      return {
        ...state,
        solvedCount: newSolvedCount,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        currentPuzzle: nextPuzzle,
        currentPuzzleIndex: nextIndex,
        currentDifficulty: nextDifficulty.difficulty,
        bestDifficulty: newBestDifficulty,
        solveTimings: newSolveTimings,
        lastSolveStartedAt: performance.now(),
        timeRemainingMs: newTimeRemaining,
        isTimeRewardFlashing: state.mode === 'survival',
      };
    }

    case 'skipPuzzle': {
      if (state.phase !== 'playing' || !state.currentPuzzle || !state.runStartedAt || !state.currentDifficulty) {
        return state;
      }

      const newStreak = 0;
      const nextIndex = state.currentPuzzleIndex + 1;
      const nextDifficulty = getDifficultyForIndex(nextIndex);

      let nextPuzzle = null;
      let attempts = 0;

      try {
        nextPuzzle = generatePuzzle(nextDifficulty.wordLength, nextDifficulty.difficulty, `${state.runStartedAt}:${nextIndex}`);
      } catch {
        while (!nextPuzzle && attempts < 3) {
          attempts++;
          try {
            nextPuzzle = generatePuzzle(nextDifficulty.wordLength, nextDifficulty.difficulty, `${state.runStartedAt}:${nextIndex}:retry${attempts}`);
          } catch {
            // Continue retrying
          }
        }
      }

      if (!nextPuzzle) {
        return state;
      }

      let skipCost = 0;
      let newFreeSkips = state.freeSkipsRemaining;

      if (state.freeSkipsRemaining > 0) {
        newFreeSkips = state.freeSkipsRemaining - 1;
      } else if (state.tier) {
        skipCost = getSkipCostSeconds(state.tier, 0) * 1000;
      }

      const newTimeRemaining = Math.max(0, state.timeRemainingMs - skipCost);

      return {
        ...state,
        currentStreak: newStreak,
        currentPuzzle: nextPuzzle,
        currentPuzzleIndex: nextIndex,
        currentDifficulty: nextDifficulty.difficulty,
        freeSkipsRemaining: newFreeSkips,
        timeRemainingMs: newTimeRemaining,
        lastSolveStartedAt: performance.now(),
      };
    }

    case 'endRun': {
      if (state.phase !== 'playing' || !state.mode || !state.tier || !state.runStartedAt || !state.currentDifficulty) {
        return state;
      }

      const timeTakenMs = performance.now() - state.runStartedAt;
      const averageSolveMs = state.solveTimings.length > 0
        ? state.solveTimings.reduce((a, b) => a + b, 0) / state.solveTimings.length
        : 0;

      const summary: RunSummary = {
        mode: state.mode,
        tier: state.tier,
        solvedCount: state.solvedCount,
        longestStreak: state.longestStreak,
        timeTakenMs,
        bestDifficulty: state.bestDifficulty,
        averageSolveMs,
      };

      const stats = loadStats();
      const newStats = recordRun(stats, summary);
      saveStats(newStats);

      return {
        ...state,
        phase: 'ended',
      };
    }

    case 'playAgain': {
      if (state.phase !== 'ended' || !state.mode || !state.tier) {
        return state;
      }

      return {
        ...getInitialState(),
        mode: state.mode,
        tier: state.tier,
        phase: 'setup',
      };
    }

    case 'reset': {
      return getInitialState();
    }

    case 'updateTimeRemaining': {
      return {
        ...state,
        timeRemainingMs: action.timeRemainingMs,
      };
    }

    case 'stopTimeRewardFlash': {
      return {
        ...state,
        isTimeRewardFlashing: false,
      };
    }

    default:
      return state;
  }
}

export function useTimeAttack() {
  const [state, dispatch] = useReducer(gameReducer, getInitialState());

  const timerOptions = {
    initialMs: state.timeRemainingMs,
    autoStart: false,
    onExpire: () => {
      dispatch({ type: 'endRun' });
    },
  };

  const timer = useTimer(timerOptions);

  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.isTimeRewardFlashing) {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      flashTimeoutRef.current = setTimeout(() => {
        dispatch({ type: 'stopTimeRewardFlash' });
      }, 500);
    }
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, [state.isTimeRewardFlashing]);

  useEffect(() => {
    dispatch({ type: 'updateTimeRemaining', timeRemainingMs: timer.remainingMs });
  }, [timer.remainingMs]);

  useEffect(() => {
    if (state.phase === 'playing' && !timer.isRunning) {
      timer.start();
    }
  }, [state.phase, timer]);

  const chooseMode = useCallback((mode: TimeAttackMode) => {
    dispatch({ type: 'chooseMode', mode });
  }, []);

  const chooseTier = useCallback((tier: DurationTier) => {
    dispatch({ type: 'chooseTier', tier });
  }, []);

  const backToModeSelect = useCallback(() => {
    dispatch({ type: 'backToModeSelect' });
  }, []);

  const startRun = useCallback(() => {
    dispatch({ type: 'startRun' });
  }, []);

  const reportSolved = useCallback(() => {
    dispatch({ type: 'reportSolved' });
  }, []);

  const skipPuzzle = useCallback(() => {
    dispatch({ type: 'skipPuzzle' });
  }, []);

  const endRun = useCallback(() => {
    dispatch({ type: 'endRun' });
  }, []);

  const playAgain = useCallback(() => {
    dispatch({ type: 'playAgain' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
  }, []);

  return {
    state,
    actions: {
      chooseMode,
      chooseTier,
      backToModeSelect,
      startRun,
      reportSolved,
      skipPuzzle,
      endRun,
      playAgain,
      reset,
    },
  };
}
