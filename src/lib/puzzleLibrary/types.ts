// src/lib/puzzleLibrary/types.ts

export interface Puzzle {
  id: string;                  // "{startWord}_{endWord}"
  wordLength: number;          // 3-7
  startWord: string;
  endWord: string;
  category: number;            // 0=3-letter, 1=4-letter, ... 5=7-letter
  completed: boolean;
  userSolution?: string[];     // Words played
  optimalSolution?: string[];  // Shortest path
  moveCount?: number;          // Length of userSolution - 1
  optimalMoveCount?: number;   // Length of optimalSolution - 1
  completedAt?: number;        // Timestamp
}

export interface Category {
  wordLength: number;          // 3-7, serves as ID
  totalPuzzles: number;        // Always 10
  completedCount: number;
  lastPlayedIndex: number;     // For resume
  unlockedAt?: number;
}

export interface LibraryProgress {
  id: "global";
  currentWordLength: number;   // 3-7
  totalCompleted: number;
  lastPlayedAt: number;
}

export type PuzzleLibraryError =
  | "DB_INIT_FAILED"
  | "INVALID_PUZZLE"
  | "CATEGORY_LOCKED"
  | "NO_UNSOLVED_PUZZLES";
