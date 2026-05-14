import { useCallback, useEffect, useReducer, useRef } from 'react';
import { DurationTier, TimeAttackMode, Phase, Difficulty, RunSummary } from './types';
import type { WordPuzzle as Puzzle } from '../../generatePuzzle';
import { getDifficultyForIndex, getSkipCostSeconds, getTimeRewardSeconds, getSurvivalBaseSeconds, FREE_SKIPS_PER_RUN } from './difficulty';
import { loadStats, saveStats, recordRun } from './stats';
import { useTimer } from './timer';
import { generatePuzzle } from '../../generatePuzzle';

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

  currentPuzzle: Puzzle | null;
  currentPuzzleIndex: number;
  currentDifficulty: Difficulty | null;

  bestDifficulty: Difficulty | null;
  runStartedAt: number | null;
  solveTimings: number[];
  lastSolveStartedAt: number | null;
};

export type TimeAttackActions = {
  chooseMode: (mode: TimeAttackMode) => void;
  chooseTier: (tier: DurationTier) => void;
  backToModeSelect: () => void;
  startRun: () => void;
  reportSolved: () => void;
  skipPuzzle: () => void;
  endRun: () => void;
  playAgain: () => void;
  reset: () => void;
};

type ReducerAction =
  | { type: 'CHOOSE_MODE'; mode: TimeAttackMode }
  | { type: 'CHOOSE_TIER'; tier: DurationTier }
  | { type: 'BACK_TO_MODE_SELECT' }
  | { type: 'START_RUN'; initialTimerMs: number; firstPuzzle: Puzzle }
  | { type: 'REPORT_SOLVED'; currentTime: number; puzzle: Puzzle; nextIndex: number }
  | { type: 'SKIP_PUZZLE'; puzzle: Puzzle; nextIndex: number }
  | { type: 'END_RUN'; currentTime: number }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'PLAY_AGAIN' }
  | { type: 'RESET' }
  | { type: 'SET_TIME_REWARD_FLASH' }
  | { type: 'CLEAR_FLASH_TIMEOUT' };

const initialState: TimeAttackState = {
  phase: 'idle',
  mode: null,
  tier: null,
  timeRemainingMs: 0,
  isTimeRewardFlashing: false,
  solvedCount: 0,
  currentStreak: 0,
  longestStreak: 0,
  freeSkipsRemaining: FREE_SKIPS_PER_RUN,
  currentPuzzle: null,
  currentPuzzleIndex: 0,
  currentDifficulty: null,
  bestDifficulty: null,
  runStartedAt: null,
  solveTimings: [],
  lastSolveStartedAt: null,
};

function timeAttackReducer(state: TimeAttackState, action: ReducerAction): TimeAttackState {
  switch (action.type) {
    case 'CHOOSE_MODE':
      return {
        ...state,
        phase: 'setup',
        mode: action.mode,
      };

    case 'CHOOSE_TIER':
      return {
        ...state,
        tier: action.tier,
      };

    case 'BACK_TO_MODE_SELECT':
      return {
        ...state,
        phase: 'idle',
        mode: null,
        tier: null,
      };

    case 'START_RUN':
      return {
        ...state,
        phase: 'playing',
        currentPuzzleIndex: 0,
        currentPuzzle: action.firstPuzzle,
        currentDifficulty: getDifficultyForIndex(0).difficulty,
        runStartedAt: performance.now(),
        lastSolveStartedAt: performance.now(),
        solvedCount: 0,
        currentStreak: 0,
        longestStreak: 0,
        freeSkipsRemaining: FREE_SKIPS_PER_RUN,
        solveTimings: [],
        bestDifficulty: null,
        timeRemainingMs: action.initialTimerMs,
      };

    case 'REPORT_SOLVED': {
      const timeTaken = action.currentTime - state.lastSolveStartedAt!;
      const newTimings = [...state.solveTimings, timeTaken];
      const newStreak = state.currentStreak + 1;
      const newLongestStreak = Math.max(state.longestStreak, newStreak);
      const config = getDifficultyForIndex(action.nextIndex);
      const newBestDifficulty = state.bestDifficulty
        ? (config.difficulty > state.bestDifficulty ? config.difficulty : state.bestDifficulty)
        : config.difficulty;

      return {
        ...state,
        solvedCount: state.solvedCount + 1,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        solveTimings: newTimings,
        currentPuzzleIndex: action.nextIndex,
        currentPuzzle: action.puzzle,
        currentDifficulty: config.difficulty,
        bestDifficulty: newBestDifficulty,
        lastSolveStartedAt: action.currentTime,
      };
    }

    case 'SKIP_PUZZLE':
      return {
        ...state,
        currentStreak: 0,
        currentPuzzleIndex: action.nextIndex,
        currentPuzzle: action.puzzle,
        currentDifficulty: getDifficultyForIndex(action.nextIndex).difficulty,
        lastSolveStartedAt: performance.now(),
        freeSkipsRemaining: Math.max(0, state.freeSkipsRemaining - 1),
      };

    case 'SET_TIME_REWARD_FLASH':
      return {
        ...state,
        isTimeRewardFlashing: true,
      };

    case 'CLEAR_FLASH_TIMEOUT':
      return {
        ...state,
        isTimeRewardFlashing: false,
      };

    case 'END_RUN':
    case 'TIMER_EXPIRED':
      return {
        ...state,
        phase: 'ended',
      };

    case 'PLAY_AGAIN':
      return {
        ...state,
        phase: 'setup',
        solvedCount: 0,
        currentStreak: 0,
        longestStreak: 0,
        freeSkipsRemaining: FREE_SKIPS_PER_RUN,
        currentPuzzle: null,
        currentPuzzleIndex: 0,
        currentDifficulty: null,
        bestDifficulty: null,
        runStartedAt: null,
        solveTimings: [],
        lastSolveStartedAt: null,
        timeRemainingMs: 0,
        isTimeRewardFlashing: false,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function useTimeAttack(): TimeAttackState & TimeAttackActions {
  const [state, dispatch] = useReducer(timeAttackReducer, initialState);
  const flashTimeoutRef = useRef<number | null>(null);

  const timer = useTimer({
    initialMs: 0,
    onExpire: () => dispatch({ type: 'TIMER_EXPIRED' }),
  });

  const generateNextPuzzle = useCallback(
    (index: number, runStartedAt: number): Puzzle | null => {
      const config = getDifficultyForIndex(index);
      let puzzle: Puzzle | null = null;
      let retryCount = 0;

      while (!puzzle && retryCount < 3) {
        try {
          const seed = `${runStartedAt}:${index}${retryCount > 0 ? `:retry${retryCount}` : ''}`;
          puzzle = generatePuzzle(config.wordLength, config.difficulty, seed);
        } catch {
          retryCount++;
        }
      }

      return puzzle;
    },
    []
  );

  const chooseMode = useCallback((mode: TimeAttackMode) => {
    dispatch({ type: 'CHOOSE_MODE', mode });
  }, []);

  const chooseTier = useCallback((tier: DurationTier) => {
    dispatch({ type: 'CHOOSE_TIER', tier });
  }, []);

  const backToModeSelect = useCallback(() => {
    dispatch({ type: 'BACK_TO_MODE_SELECT' });
  }, []);

  const startRun = useCallback(() => {
    if (state.phase !== 'setup' || !state.mode || !state.tier) {
      return;
    }

    const initialMs = state.mode === 'sprint'
      ? state.tier * 1000
      : getSurvivalBaseSeconds(state.tier) * 1000;

    const runStartedAt = performance.now();
    const firstPuzzle = generateNextPuzzle(0, runStartedAt);

    if (firstPuzzle) {
      dispatch({ type: 'START_RUN', initialTimerMs: initialMs, firstPuzzle });
      timer.reset(initialMs);
      timer.start();
    }
  }, [state.phase, state.mode, state.tier, generateNextPuzzle, timer]);

  const reportSolved = useCallback(() => {
    if (state.phase !== 'playing' || !state.currentPuzzle) {
      return;
    }

    const currentTime = performance.now();
    const nextIndex = state.currentPuzzleIndex + 1;
    const nextPuzzle = generateNextPuzzle(nextIndex, state.runStartedAt!);

    if (nextPuzzle) {
      dispatch({ type: 'REPORT_SOLVED', currentTime, puzzle: nextPuzzle, nextIndex });

      if (state.mode === 'survival' && state.currentDifficulty) {
        const reward = getTimeRewardSeconds(state.currentDifficulty) * 1000;
        timer.adjustTime(reward);

        if (flashTimeoutRef.current) {
          clearTimeout(flashTimeoutRef.current);
        }

        dispatch({ type: 'SET_TIME_REWARD_FLASH' });
        flashTimeoutRef.current = window.setTimeout(
          () => dispatch({ type: 'CLEAR_FLASH_TIMEOUT' }),
          600
        );
      }
    }
  }, [state, generateNextPuzzle, timer]);

  const skipPuzzle = useCallback(() => {
    if (state.phase !== 'playing' || !state.mode || !state.tier) {
      return;
    }

    const nextIndex = state.currentPuzzleIndex + 1;
    const nextPuzzle = generateNextPuzzle(nextIndex, state.runStartedAt!);

    if (nextPuzzle) {
      if (state.freeSkipsRemaining > 0) {
        dispatch({ type: 'SKIP_PUZZLE', puzzle: nextPuzzle, nextIndex });
      } else {
        const penalty = getSkipCostSeconds(state.tier, 0) * 1000;
        timer.adjustTime(-penalty);
        dispatch({ type: 'SKIP_PUZZLE', puzzle: nextPuzzle, nextIndex });
      }
    }
  }, [state, generateNextPuzzle, timer]);

  const endRun = useCallback(() => {
    if (state.phase !== 'playing') {
      return;
    }

    const currentTime = performance.now();
    timer.pause();

    dispatch({ type: 'END_RUN', currentTime });

    const timeTakenMs = state.runStartedAt ? (currentTime - state.runStartedAt) : 0;
    const summary: RunSummary = {
      mode: state.mode!,
      tier: state.tier!,
      solvedCount: state.solvedCount,
      longestStreak: state.longestStreak,
      timeTakenMs,
      bestDifficulty: state.bestDifficulty,
      averageSolveMs: state.solveTimings.length > 0
        ? Math.round(state.solveTimings.reduce((a, b) => a + b, 0) / state.solveTimings.length)
        : null,
    };

    const stats = loadStats();
    const updatedStats = recordRun(stats, summary);
    saveStats(updatedStats);
  }, [state, timer]);

  const playAgain = useCallback(() => {
    dispatch({ type: 'PLAY_AGAIN' });
  }, []);

  const reset = useCallback(() => {
    timer.reset();
    dispatch({ type: 'RESET' });
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
  }, [timer]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    timeRemainingMs: timer.remainingMs,
    chooseMode,
    chooseTier,
    backToModeSelect,
    startRun,
    reportSolved,
    skipPuzzle,
    endRun,
    playAgain,
    reset,
  };
}
