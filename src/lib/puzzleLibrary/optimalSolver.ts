import { shortestPath } from '../../wordGraph';

export function calculateOptimalSolution(startWord: string, endWord: string): string[] {
  try {
    const path = shortestPath(startWord, endWord);
    if (!path || path.length === 0) {
      console.warn(`No path found from ${startWord} to ${endWord}`);
      return [startWord, endWord]; // Fallback
    }
    return path;
  } catch (error) {
    console.error('Error calculating optimal solution:', error);
    return [startWord, endWord]; // Fallback
  }
}

export function getMoveCount(solution: string[]): number {
  // Move count is number of intermediate words (total words - 1)
  return Math.max(0, solution.length - 1);
}

export function compareSolutions(
  userSolution: string[],
  optimalSolution: string[]
): { userMoves: number; optimalMoves: number; difference: number } {
  const userMoves = getMoveCount(userSolution);
  const optimalMoves = getMoveCount(optimalSolution);
  return {
    userMoves,
    optimalMoves,
    difference: userMoves - optimalMoves,
  };
}
