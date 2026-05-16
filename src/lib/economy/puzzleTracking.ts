export type PuzzleMode = 'classic' | 'timeAttack' | 'blitz';

const STORAGE_KEY = 'wordLadder-completedPuzzles';

/**
 * Generates a normalized puzzle ID from mode and word pair
 * Format: "mode:startWord:endWord" (lowercase, trimmed)
 */
export function generatePuzzleId(
  mode: PuzzleMode,
  startWord: string,
  endWord: string
): string {
  const normalizedStart = startWord.toLowerCase().trim();
  const normalizedEnd = endWord.toLowerCase().trim();
  return `${mode}:${normalizedStart}:${normalizedEnd}`;
}

/**
 * Loads completed puzzle IDs from localStorage
 * Returns empty Set if not found or parse fails
 */
export function loadCompletedPuzzles(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return new Set();
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed);
  } catch (error) {
    console.error('Failed to parse completed puzzles from localStorage:', error);
    return new Set();
  }
}

/**
 * Saves completed puzzle IDs to localStorage
 */
export function saveCompletedPuzzles(puzzles: Set<string>): void {
  const puzzleArray = Array.from(puzzles);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzleArray));
}

/**
 * Checks if a puzzle has been completed
 */
export function isCompletedPuzzle(
  mode: PuzzleMode,
  startWord: string,
  endWord: string
): boolean {
  const puzzleId = generatePuzzleId(mode, startWord, endWord);
  const completed = loadCompletedPuzzles();
  return completed.has(puzzleId);
}

/**
 * Marks a puzzle as completed and saves to localStorage
 */
export function addCompletedPuzzle(
  mode: PuzzleMode,
  startWord: string,
  endWord: string
): void {
  const puzzleId = generatePuzzleId(mode, startWord, endWord);
  const completed = loadCompletedPuzzles();
  completed.add(puzzleId);
  saveCompletedPuzzles(completed);
}
