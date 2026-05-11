import { useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import { WordPuzzle } from './generatePuzzle';
import { shortestPath } from './wordGraph';
import { WORD_SET } from './dictionary';

export interface GameState {
  history: string[][];
  lives: number;
  currentInput: string[];
  selectedIdx: number;
  phase: 'playing' | 'won' | 'lost';
  lastHintedIndex: number | null;
  lastRevealedWord: string[] | null;
  powerUpsUsed: { hints: number; reveals: number; undos: number };
  failedSubmissions: number;
}

type GameAction =
  | { type: 'PRESS_LETTER'; letter: string }
  | { type: 'DELETE_LETTER' }
  | { type: 'SUBMIT_WORD'; success: boolean }
  | { type: 'APPLY_HINT'; index: number }
  | { type: 'APPLY_REVEAL'; word: string[] }
  | { type: 'CLEAR_HINT' }
  | { type: 'UNDO_STEP' }
  | { type: 'WIN_GAME' }
  | { type: 'LOSE_GAME' }
  | { type: 'RESET_GAME'; puzzle: WordPuzzle };

// WORD_SET now imported from ./dictionary

function countDifferences(word1: string, word2: string): number {
  if (word1.length !== word2.length) return Infinity;
  let count = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) count++;
  }
  return count;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PRESS_LETTER': {
      if (state.phase !== 'playing' || state.currentInput.length >= 10) {
        return state;
      }
      return {
        ...state,
        currentInput: [...state.currentInput, action.letter.toLowerCase()],
        selectedIdx: state.currentInput.length + 1
      };
    }

    case 'DELETE_LETTER': {
      if (state.currentInput.length === 0) return state;
      return {
        ...state,
        currentInput: state.currentInput.slice(0, -1),
        selectedIdx: Math.max(0, state.selectedIdx - 1)
      };
    }

    case 'SUBMIT_WORD': {
      if (state.phase !== 'playing') return state;

      if (action.success) {
        return {
          ...state,
          history: [...state.history, [...state.currentInput]],
          currentInput: [],
          selectedIdx: 0,
          lastHintedIndex: null,
          lastRevealedWord: null
        };
      } else {
        const newLives = state.lives - 1;
        return {
          ...state,
          lives: newLives,
          currentInput: [],
          selectedIdx: 0,
          failedSubmissions: state.failedSubmissions + 1,
          phase: newLives <= 0 ? 'lost' : 'playing'
        };
      }
    }

    case 'APPLY_HINT': {
      if (state.phase !== 'playing') return state;
      return {
        ...state,
        lastHintedIndex: action.index,
        powerUpsUsed: { ...state.powerUpsUsed, hints: state.powerUpsUsed.hints + 1 }
      };
    }

    case 'APPLY_REVEAL': {
      if (state.phase !== 'playing') return state;
      return {
        ...state,
        lastRevealedWord: action.word,
        powerUpsUsed: { ...state.powerUpsUsed, reveals: state.powerUpsUsed.reveals + 1 }
      };
    }

    case 'CLEAR_HINT': {
      return {
        ...state,
        lastHintedIndex: null
      };
    }

    case 'UNDO_STEP': {
      if (state.history.length <= 1) return state;
      return {
        ...state,
        history: state.history.slice(0, -1),
        currentInput: [],
        selectedIdx: 0,
        lastHintedIndex: null,
        lastRevealedWord: null,
        powerUpsUsed: { ...state.powerUpsUsed, undos: state.powerUpsUsed.undos + 1 }
      };
    }

    case 'WIN_GAME': {
      return {
        ...state,
        phase: 'won'
      };
    }

    case 'LOSE_GAME': {
      return {
        ...state,
        phase: 'lost'
      };
    }

    case 'RESET_GAME': {
      return {
        history: [[...action.puzzle.start.split('')]],
        lives: 3,
        currentInput: [],
        selectedIdx: 0,
        lastHintedIndex: null,
        lastRevealedWord: null,
        powerUpsUsed: { hints: 0, reveals: 0, undos: 0 },
        failedSubmissions: 0,
        phase: 'playing'
      };
    }

    default:
      return state;
  }
}

export function useGameState(puzzle: WordPuzzle) {
  const initialState: GameState = {
    history: [[...puzzle.start.split('')]],
    lives: 3,
    currentInput: [],
    selectedIdx: 0,
    lastHintedIndex: null,
    lastRevealedWord: null,
    powerUpsUsed: { hints: 0, reveals: 0, undos: 0 },
    failedSubmissions: 0,
    phase: 'playing'
  };

  const [state, dispatch] = useReducer(gameReducer, initialState);
  const prevPuzzleRef = useRef<string>(puzzle.start);

  useEffect(() => {
    if (puzzle.start !== prevPuzzleRef.current) {
      prevPuzzleRef.current = puzzle.start;
      dispatch({ type: 'RESET_GAME', puzzle });
    }
  }, [puzzle]);

  const pressLetter = useCallback((letter: string) => {
    dispatch({ type: 'PRESS_LETTER', letter });
  }, []);

  const deleteLetter = useCallback(() => {
    dispatch({ type: 'DELETE_LETTER' });
  }, []);

  const submitWord = useCallback(() => {
    const word = state.currentInput.join('');

    if (word.length !== puzzle.start.length) {
      dispatch({ type: 'SUBMIT_WORD', success: false });
      return;
    }

    if (!WORD_SET.has(word)) {
      dispatch({ type: 'SUBMIT_WORD', success: false });
      return;
    }

    const previousWord = state.history[state.history.length - 1].join('');
    if (word === previousWord) {
      dispatch({ type: 'SUBMIT_WORD', success: false });
      return;
    }

    const differences = countDifferences(word, previousWord);
    if (differences !== 1) {
      dispatch({ type: 'SUBMIT_WORD', success: false });
      return;
    }

    dispatch({ type: 'SUBMIT_WORD', success: true });

    if (word === puzzle.end) {
      dispatch({ type: 'WIN_GAME' });
    }
  }, [state, puzzle]);

  const applyHint = useCallback((index: number) => {
    dispatch({ type: 'APPLY_HINT', index });
  }, []);

  const applyReveal = useCallback((word: string[]) => {
    dispatch({ type: 'APPLY_REVEAL', word });
  }, []);

  const clearHint = useCallback(() => {
    dispatch({ type: 'CLEAR_HINT' });
  }, []);

  const undoStep = useCallback(() => {
    if (state.history.length <= 1) return;
    dispatch({ type: 'UNDO_STEP' });
  }, [state.history.length]);

  return {
    state,
    pressLetter,
    deleteLetter,
    submitWord,
    applyHint,
    applyReveal,
    clearHint,
    undoStep
  };
}
