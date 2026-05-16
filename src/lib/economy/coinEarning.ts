export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Calculate coins earned from completing a Classic puzzle
 * @param difficulty Puzzle difficulty level
 * @returns Coins earned
 */
export function calculateClassicCoins(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 5;
    case 'medium':
      return 10;
    case 'hard':
      return 15;
    default:
      throw new Error(`Invalid difficulty: ${difficulty}`);
  }
}

/**
 * Calculate coins earned from Time Attack mode
 * @param puzzlesSolved Number of unique puzzles solved in this session
 * @returns Coins earned
 */
export function calculateTimeAttackCoins(puzzlesSolved: number): number {
  if (puzzlesSolved < 0) {
    throw new Error('Puzzles solved cannot be negative');
  }
  return puzzlesSolved * 8;
}

/**
 * Calculate coins earned from Blitz mode based on placement
 * @param placement Player's placement in the game (1-4)
 * @returns Coins earned (base 10 + placement bonus)
 */
export function calculateBlitzCoins(placement: number): number {
  if (!Number.isInteger(placement) || placement < 1 || placement > 4) {
    throw new Error('Placement must be 1-4');
  }

  const BASE = 10;
  const placementBonuses: Record<number, number> = {
    1: 40,
    2: 30,
    3: 15,
    4: 0,
  };

  return BASE + placementBonuses[placement];
}
