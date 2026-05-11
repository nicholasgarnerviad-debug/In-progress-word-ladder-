import { WORD_SET } from './dictionary';

// Build adjacency list cache at import time
const adjacencyCache = new Map<string, string[]>();

function buildCache(): void {
  const words = Array.from(WORD_SET);

  // Phase 1: Build wildcard index (O(n×m))
  const wildcardIndex = new Map<string, string[]>();
  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const key = word.slice(0, i) + '_' + word.slice(i + 1);
      if (!wildcardIndex.has(key)) {
        wildcardIndex.set(key, []);
      }
      wildcardIndex.get(key)!.push(word);
    }
  }

  // Phase 2: Build adjacency from wildcard keys (O(n×m))
  for (const word of words) {
    const neighborSet = new Set<string>();
    for (let i = 0; i < word.length; i++) {
      const key = word.slice(0, i) + '_' + word.slice(i + 1);
      for (const candidate of wildcardIndex.get(key) ?? []) {
        if (candidate !== word) {
          neighborSet.add(candidate);
        }
      }
    }
    adjacencyCache.set(word, Array.from(neighborSet));
  }

  // Dev-mode orphan logging
  if (process.env.NODE_ENV === 'development') {
    const orphans = words.filter(w => (adjacencyCache.get(w) ?? []).length === 0);
    if (orphans.length > 0) {
      console.warn(`[wordGraph] ${orphans.length} orphans:`, orphans.slice(0, 20));
    }
  }
}

buildCache();

export function getNeighbors(word: string): string[] {
  const normalized = word.toLowerCase();
  if (!WORD_SET.has(normalized)) return [];
  return adjacencyCache.get(normalized) || [];
}

export function shortestPath(start: string, end: string): string[] | null {
  const startNorm = start.toLowerCase();
  const endNorm = end.toLowerCase();

  // Validate inputs
  if (!WORD_SET.has(startNorm) || !WORD_SET.has(endNorm)) return null;
  if (startNorm === endNorm) return [startNorm];

  // BFS to find shortest path
  const queue: [string, string[]][] = [[startNorm, [startNorm]]];
  const visited = new Set<string>([startNorm]);

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;

    for (const neighbor of adjacencyCache.get(current) || []) {
      if (neighbor === endNorm) {
        return [...path, endNorm];
      }

      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }

  return null;
}

export function findAllShortestPaths(start: string, end: string, limit: number = 10): string[][] {
  const startNorm = start.toLowerCase();
  const endNorm = end.toLowerCase();

  if (!WORD_SET.has(startNorm) || !WORD_SET.has(endNorm)) return [];
  if (startNorm === endNorm) return [[startNorm]];

  // First, find the shortest distance
  const distances = new Map<string, number>();
  const queue: string[] = [startNorm];
  distances.set(startNorm, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = distances.get(current)!;

    for (const neighbor of adjacencyCache.get(current) || []) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, currentDist + 1);
        queue.push(neighbor);
      }
    }
  }

  if (!distances.has(endNorm)) return [];
  const shortestDist = distances.get(endNorm)!;

  // Now collect all shortest paths using DFS
  const paths: string[][] = [];

  function dfs(current: string, path: string[]): void {
    if (paths.length >= limit) return;
    if (current === endNorm) {
      paths.push([...path]);
      return;
    }

    const currentDist = distances.get(current)!;
    for (const neighbor of adjacencyCache.get(current) || []) {
      const neighborDist = distances.get(neighbor);
      if (neighborDist === currentDist + 1) {
        path.push(neighbor);
        dfs(neighbor, path);
        path.pop();
      }
    }
  }

  dfs(startNorm, [startNorm]);
  return paths;
}

export function findPathsUpToLength(start: string, end: string, maxLength: number, limit: number = 20): string[][] {
  const startNorm = start.toLowerCase();
  const endNorm = end.toLowerCase();

  if (!WORD_SET.has(startNorm) || !WORD_SET.has(endNorm)) return [];
  if (startNorm === endNorm) return [[startNorm]];
  if (maxLength < 2) return [];

  const paths: string[][] = [];

  function dfs(current: string, path: string[], visited: Set<string>): void {
    if (paths.length >= limit) return;
    if (path.length >= maxLength) return;

    if (current === endNorm) {
      paths.push([...path]);
      return;
    }

    for (const neighbor of adjacencyCache.get(current) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        path.push(neighbor);
        dfs(neighbor, path, visited);
        path.pop();
        visited.delete(neighbor);
      }
    }
  }

  const initialVisited = new Set<string>([startNorm]);
  dfs(startNorm, [startNorm], initialVisited);
  return paths;
}

export interface LadderValidationResult {
  valid: boolean;
  reason?: string;
}

export function isValidLadder(wordsList: string[]): LadderValidationResult {
  if (wordsList.length < 2) {
    return { valid: false, reason: 'Ladder must have at least 2 words' };
  }

  const normalized = wordsList.map(w => w.toLowerCase());

  // Check all words exist in dictionary
  for (const word of normalized) {
    if (!WORD_SET.has(word)) {
      return { valid: false, reason: `"${word}" is not in the dictionary` };
    }
  }

  // Check for duplicates
  const seen = new Set<string>();
  for (const word of normalized) {
    if (seen.has(word)) {
      return { valid: false, reason: `Duplicate word: "${word}"` };
    }
    seen.add(word);
  }

  // Check that consecutive words differ by exactly one letter
  for (let i = 0; i < normalized.length - 1; i++) {
    const word1 = normalized[i];
    const word2 = normalized[i + 1];

    if (word1.length !== word2.length) {
      return { valid: false, reason: `Words must have same length: "${word1}" (${word1.length}) and "${word2}" (${word2.length})` };
    }

    let diffCount = 0;
    for (let j = 0; j < word1.length; j++) {
      if (word1[j] !== word2[j]) {
        diffCount++;
      }
    }

    if (diffCount !== 1) {
      return { valid: false, reason: `"${word1}" and "${word2}" differ by ${diffCount} letters (must be 1)` };
    }
  }

  return { valid: true };
}

export interface PathComparisonResult {
  steps: number;
  overPar: number;
  isOptimal: boolean;
}

export function comparePathToOptimal(playerPath: string[], optimalLength: number): PathComparisonResult {
  const steps = playerPath.length;
  const overPar = Math.max(0, steps - optimalLength);
  const isOptimal = steps === optimalLength;

  return {
    steps,
    overPar,
    isOptimal,
  };
}
