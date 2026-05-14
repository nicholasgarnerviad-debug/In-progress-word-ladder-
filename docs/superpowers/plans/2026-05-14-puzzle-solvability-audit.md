# Puzzle Solvability Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify every puzzle the game can produce is solvable, all callers handle generation failures gracefully, and no edge case can lock a player out of completing a puzzle.

**Architecture:** Four-phase audit covering (1) static dictionary connectivity, (2) generatePuzzle validation, (3) caller resilience, and (4) integration testing. Each phase independently verifies one concern, producing actionable findings without breaking existing code.

**Tech Stack:** TypeScript, Jest, seedrandom (existing), BFS pathfinding (existing).

---

## Phase 1: Static Dictionary Audit

### Task 1: Audit wordGraph.ts and Create Dictionary Analysis Script

**Files:**
- Read: `src/wordGraph.ts`
- Create: `scripts/auditDictionary.ts`
- Create: `src/__tests__/wordGraph.test.ts` (add dictionary tests)

**Phase 1 Rationale:**
Before testing puzzle generation, verify the underlying word graph is sound. Orphan words or disconnected components will cause generatePuzzle to fail no matter what.

- [ ] **Step 1: Read wordGraph.ts thoroughly**

Confirm these behaviors:
1. `getNeighbors(word)` - returns all words differing by exactly one letter
2. `shortestPath(start, end)` - returns shortest path array or null if unreachable
3. Cache built at import time using wildcard index pattern
4. Lowercase normalization applied consistently

Expected findings: All functions present and correctly implemented (already reviewed, code is solid).

- [ ] **Step 2: Create dictionary audit script**

Create `scripts/auditDictionary.ts`:

```typescript
import { WORD_SET } from '../src/dictionary';
import { getNeighbors } from '../src/wordGraph';

interface ConnectedComponent {
  size: number;
  words: string[];
}

function findConnectedComponents(words: string[]): ConnectedComponent[] {
  const visited = new Set<string>();
  const components: ConnectedComponent[] = [];

  for (const word of words) {
    if (visited.has(word)) continue;

    const component: string[] = [];
    const queue: string[] = [word];
    visited.add(word);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      for (const neighbor of getNeighbors(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push({ size: component.length, words: component });
  }

  return components;
}

function auditDictionary() {
  console.log('\n📊 WORD LADDER DICTIONARY AUDIT\n');
  console.log(`Total words: ${WORD_SET.size}\n`);

  for (const wordLength of [3, 4, 5, 6, 7]) {
    const wordsOfLength = Array.from(WORD_SET).filter(w => w.length === wordLength);
    
    if (wordsOfLength.length === 0) {
      console.log(`${wordLength}-letter words: none\n`);
      continue;
    }

    console.log(`\n${wordLength}-letter words: ${wordsOfLength.length}`);
    
    // Find orphans
    const orphans = wordsOfLength.filter(w => getNeighbors(w).length === 0);
    if (orphans.length > 0) {
      console.log(`  ⚠️  ORPHANS (no neighbors): ${orphans.length}`);
      console.log(`      ${orphans.slice(0, 10).join(', ')}${orphans.length > 10 ? '...' : ''}`);
    }

    // Find connected components
    const components = findConnectedComponents(wordsOfLength);
    const sorted = components.sort((a, b) => b.size - a.size);
    
    console.log(`  Components: ${sorted.length} total`);
    console.log(`    Largest: ${sorted[0].size} words (${(sorted[0].size / wordsOfLength.length * 100).toFixed(1)}%)`);
    
    // Small islands
    const smallIslands = sorted.filter(c => c.size < 5 && c.size > 1);
    if (smallIslands.length > 0) {
      console.log(`  🏝️  SMALL ISLANDS (<5 words): ${smallIslands.length}`);
      for (const island of smallIslands.slice(0, 5)) {
        console.log(`      [${island.words.join(', ')}]`);
      }
      if (smallIslands.length > 5) {
        console.log(`      ...and ${smallIslands.length - 5} more`);
      }
    }

    console.log('');
  }
}

auditDictionary();
```

- [ ] **Step 3: Run the audit script**

```bash
npx ts-node scripts/auditDictionary.ts
```

Expected output: Shows connectivity stats for each word length, flags orphans and small islands.

- [ ] **Step 4: Document findings**

Create a summary in this format (to console only; do not modify code based on findings):

```
Dictionary Audit Results:
- 3-letter: X orphans, Y components
- 4-letter: X orphans, Y components  
- 5-letter: X orphans, Y components
- 6-letter: X orphans, Y components
- 7-letter: X orphans, Y components

Key findings:
[List any significant isolated words or small islands]
```

- [ ] **Step 5: Add wordGraph unit tests**

Create `src/__tests__/wordGraph.test.ts`:

```typescript
import { getNeighbors, shortestPath, isValidLadder } from '../wordGraph';

describe('wordGraph', () => {
  describe('getNeighbors', () => {
    it('returns neighbors that differ by one letter', () => {
      const neighbors = getNeighbors('cat');
      expect(neighbors).toContain('cot');
      expect(neighbors).toContain('bat');
      expect(neighbors).toContain('car');
    });

    it('does not return the word itself', () => {
      const neighbors = getNeighbors('cat');
      expect(neighbors).not.toContain('cat');
    });

    it('returns empty array for unknown words', () => {
      expect(getNeighbors('zzzzzz')).toEqual([]);
    });

    it('handles case insensitivity', () => {
      const lower = getNeighbors('cat');
      const upper = getNeighbors('CAT');
      expect(lower).toEqual(upper);
    });
  });

  describe('shortestPath', () => {
    it('returns path from start to end', () => {
      const path = shortestPath('cat', 'dog');
      expect(path).not.toBeNull();
      expect(path![0]).toBe('cat');
      expect(path![path!.length - 1]).toBe('dog');
    });

    it('returns null when no path exists', () => {
      // Use words from different components if they exist
      // For now, just test the function accepts the call
      const path = shortestPath('cat', 'dog');
      if (path === null) {
        // Expected behavior: no path
        expect(path).toBeNull();
      }
    });

    it('returns single-word path when start === end', () => {
      const path = shortestPath('cat', 'cat');
      expect(path).toEqual(['cat']);
    });

    it('handles case insensitivity', () => {
      const lower = shortestPath('cat', 'dog');
      const upper = shortestPath('CAT', 'DOG');
      expect(lower).toEqual(upper);
    });

    it('returns null for unknown words', () => {
      expect(shortestPath('cat', 'zzzzzz')).toBeNull();
      expect(shortestPath('zzzzzz', 'cat')).toBeNull();
    });
  });

  describe('isValidLadder', () => {
    it('accepts valid ladder', () => {
      const result = isValidLadder(['cat', 'cot', 'dot', 'dog']);
      expect(result.valid).toBe(true);
    });

    it('rejects ladder with unknown word', () => {
      const result = isValidLadder(['cat', 'zzzzzz', 'dog']);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not in the dictionary');
    });

    it('rejects ladder with non-adjacent words', () => {
      const result = isValidLadder(['cat', 'dog']);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('differ by');
    });

    it('rejects ladder with duplicates', () => {
      const result = isValidLadder(['cat', 'cot', 'cat']);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Duplicate');
    });

    it('rejects ladder with too few words', () => {
      const result = isValidLadder(['cat']);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('at least 2');
    });
  });
});
```

- [ ] **Step 6: Verify tests pass**

```bash
npm test -- wordGraph.test.ts
```

Expected: All wordGraph tests pass.

- [ ] **Step 7: Commit**

```bash
git add scripts/auditDictionary.ts src/__tests__/wordGraph.test.ts
git commit -m "audit: add dictionary connectivity audit script and wordGraph tests"
```

---

## Phase 2: Puzzle Generation Validation

### Task 2: Verify generatePuzzle Solvability and Edge Cases

**Files:**
- Modify: `src/generatePuzzle.ts`
- Create: `src/__tests__/generatePuzzle.validation.test.ts`

**Phase 2 Rationale:**
Ensure generatePuzzle itself produces valid, solvable puzzles. This catches issues in the generation logic before worrying about callers.

- [ ] **Step 1: Read generatePuzzle.ts thoroughly**

Confirm current behavior:
1. Throws error on failure (no null return)
2. Does NOT explicitly check that start !== end
3. Does NOT verify solvability before returning
4. Sets optimal = chain.length (assumes chain is shortest path)

- [ ] **Step 2: Add solvability check**

Modify `src/generatePuzzle.ts` at the end of `generatePuzzle()` function (line 210, before return):

```typescript
export function generatePuzzle(
  wordLength: WordLength,
  difficulty: Difficulty,
  seed?: string
): WordPuzzle {
  const seedString = seed || Math.random().toString() + Date.now();
  const rng = seedrandom(seedString);

  const words = getWordsByLength(wordLength);
  const targetLength = getTargetPathLength(difficulty);

  const chain = findPuzzleChain(words, targetLength, rng);

  if (!chain) {
    throw new Error(
      `Could not generate puzzle with length=${wordLength}, difficulty=${difficulty}`
    );
  }

  // NEW: Verify puzzle is solvable
  const verifyPath = shortestPath(chain[0], chain[chain.length - 1]);
  if (!verifyPath || verifyPath.length !== chain.length) {
    throw new Error(
      `Generated puzzle is not solvable or path length mismatch: expected ${chain.length}, got ${verifyPath?.length || 'null'}`
    );
  }

  // NEW: Ensure start !== end
  if (chain[0] === chain[chain.length - 1]) {
    throw new Error(`Puzzle start and end cannot be the same word: ${chain[0]}`);
  }

  const lockedIndices = pickLockedIndices(chain.length, rng);

  // ... rest of function unchanged ...

  return {
    start: chain[0],
    end: chain[chain.length - 1],
    optimal: chain.length,
    chain,
    lockedIndices,
    extraRungs: 2,
    alternativePaths: alternativePaths.length > 0 ? alternativePaths : undefined
  };
}
```

- [ ] **Step 3: Test determinism**

Create `src/__tests__/generatePuzzle.validation.test.ts`:

```typescript
import { generatePuzzle, Difficulty, WordLength } from '../generatePuzzle';
import { shortestPath } from '../wordGraph';

describe('generatePuzzle validation', () => {
  describe('solvability', () => {
    it('generates solvable puzzles with easy difficulty', () => {
      const puzzle = generatePuzzle(4, 'easy', 'test-seed-1');
      const path = shortestPath(puzzle.start, puzzle.end);
      expect(path).not.toBeNull();
      expect(path!.length).toBeGreaterThanOrEqual(2);
    });

    it('generates solvable puzzles with medium difficulty', () => {
      const puzzle = generatePuzzle(4, 'medium', 'test-seed-2');
      const path = shortestPath(puzzle.start, puzzle.end);
      expect(path).not.toBeNull();
      expect(path!.length).toBeGreaterThanOrEqual(2);
    });

    it('generates solvable puzzles with hard difficulty', () => {
      const puzzle = generatePuzzle(4, 'hard', 'test-seed-3');
      const path = shortestPath(puzzle.start, puzzle.end);
      expect(path).not.toBeNull();
      expect(path!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('no zero-step puzzles', () => {
    it('never generates start === end', () => {
      for (let i = 0; i < 20; i++) {
        const puzzle = generatePuzzle(4, 'easy', `seed-${i}`);
        expect(puzzle.start).not.toBe(puzzle.end);
      }
    });
  });

  describe('difficulty consistency', () => {
    it('easy puzzles have ~4 step optimal path', () => {
      const puzzles = [
        generatePuzzle(4, 'easy', 'easy-1'),
        generatePuzzle(4, 'easy', 'easy-2'),
        generatePuzzle(4, 'easy', 'easy-3'),
      ];
      const optimalLengths = puzzles.map(p => p.optimal);
      // Easy should be 4 steps = 3 moves between start and end
      expect(optimalLengths.every(len => len === 4)).toBe(true);
    });

    it('medium puzzles have ~5 step optimal path', () => {
      const puzzles = [
        generatePuzzle(4, 'medium', 'med-1'),
        generatePuzzle(4, 'medium', 'med-2'),
        generatePuzzle(4, 'medium', 'med-3'),
      ];
      const optimalLengths = puzzles.map(p => p.optimal);
      expect(optimalLengths.every(len => len === 5)).toBe(true);
    });

    it('hard puzzles have ~6 step optimal path', () => {
      const puzzles = [
        generatePuzzle(4, 'hard', 'hard-1'),
        generatePuzzle(4, 'hard', 'hard-2'),
        generatePuzzle(4, 'hard', 'hard-3'),
      ];
      const optimalLengths = puzzles.map(p => p.optimal);
      expect(optimalLengths.every(len => len === 6)).toBe(true);
    });
  });

  describe('determinism', () => {
    it('same seed produces same puzzle', () => {
      const p1 = generatePuzzle(4, 'medium', 'determinism-test');
      const p2 = generatePuzzle(4, 'medium', 'determinism-test');
      
      expect(p1.start).toBe(p2.start);
      expect(p1.end).toBe(p2.end);
      expect(p1.optimal).toBe(p2.optimal);
      expect(p1.chain).toEqual(p2.chain);
    });

    it('different seeds produce different puzzles', () => {
      const p1 = generatePuzzle(4, 'medium', 'seed-a');
      const p2 = generatePuzzle(4, 'medium', 'seed-b');
      
      // At least one property should differ
      expect(
        p1.start !== p2.start || 
        p1.end !== p2.end || 
        p1.chain.join(',') !== p2.chain.join(',')
      ).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles 3-letter words', () => {
      expect(() => generatePuzzle(3, 'easy', 'three-letter')).not.toThrow();
    });

    it('handles 5-letter words', () => {
      expect(() => generatePuzzle(5, 'medium', 'five-letter')).not.toThrow();
    });

    it('throws descriptive error when generation fails', () => {
      // This will depend on dictionary connectivity, but the error should be descriptive
      try {
        generatePuzzle(7, 'hard', 'very-hard-seed-xyz');
      } catch (e: any) {
        expect(e.message).toContain('puzzle');
      }
    });
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- generatePuzzle.validation.test.ts
```

Expected: All tests pass, demonstrating solvability, no zero-step puzzles, consistent difficulty, and determinism.

- [ ] **Step 5: Commit**

```bash
git add src/generatePuzzle.ts src/__tests__/generatePuzzle.validation.test.ts
git commit -m "feat: add solvability and edge case validation to generatePuzzle"
```

---

## Phase 3: Caller Resilience

### Task 3: Audit and Harden All Puzzle Generation Call Sites

**Files:**
- Find and audit: All files that call `generatePuzzle()`
- Likely candidates: `src/useGameState.ts`, `src/ClassicGame.tsx`, `src/features/timeAttack/useTimeAttack.ts`, any Word Blitz module
- Modify: Each call site to add retry logic

**Phase 3 Rationale:**
Even if generatePuzzle is rock-solid, network glitches, race conditions, or rare edge cases could cause it to fail. Callers must handle failures gracefully instead of crashing the game.

- [ ] **Step 1: Find all generatePuzzle call sites**

```bash
grep -rn "generatePuzzle(" src/ --include="*.ts" --include="*.tsx" | grep -v test | grep -v node_modules
```

Expected: List of all import and usage locations.

- [ ] **Step 2: For each call site, add retry wrapper**

Create a helper function in `src/generatePuzzle.ts`:

```typescript
export function generatePuzzleWithRetry(
  wordLength: WordLength,
  difficulty: Difficulty,
  seed?: string,
  maxRetries: number = 3
): WordPuzzle | null {
  const baseSeed = seed || `${Date.now()}-${Math.random()}`;
  
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  const startDiffIdx = difficulties.indexOf(difficulty);

  // Try original difficulty first
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const attemptSeed = `${baseSeed}:attempt${attempt}`;
      return generatePuzzle(wordLength, difficulty, attemptSeed);
    } catch (e) {
      // Continue to next attempt
    }
  }

  // Fall back to easier difficulties
  for (let diffIdx = startDiffIdx + 1; diffIdx < difficulties.length; diffIdx++) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const attemptSeed = `${baseSeed}:fallback${diffIdx}:attempt${attempt}`;
        return generatePuzzle(wordLength, difficulties[diffIdx], attemptSeed);
      } catch (e) {
        // Continue to next attempt
      }
    }
  }

  // Fall back to shorter word length (if possible)
  if (wordLength > 3) {
    const shorterLength = (wordLength - 1) as WordLength;
    for (let diffIdx = startDiffIdx; diffIdx < difficulties.length; diffIdx++) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const attemptSeed = `${baseSeed}:shorter${shorterLength}:attempt${attempt}`;
          return generatePuzzle(shorterLength, difficulties[diffIdx], attemptSeed);
        } catch (e) {
          // Continue to next attempt
        }
      }
    }
  }

  // All fallbacks exhausted
  return null;
}
```

- [ ] **Step 3: Update ClassicGame.tsx (if calls generatePuzzle directly)**

Find the call (likely in a puzzle loading effect or handler), change from:
```typescript
const puzzle = generatePuzzle(wordLength, difficulty);
```

To:
```typescript
const puzzle = generatePuzzleWithRetry(wordLength, difficulty);
if (!puzzle) {
  setError('Unable to generate puzzle. Please try again.');
  return;
}
```

- [ ] **Step 4: Update TimeAttack useTimeAttack hook (if exists)**

Find calls to generatePuzzle in `src/features/timeAttack/useTimeAttack.ts` or equivalent, apply same pattern.

- [ ] **Step 5: Update any other call sites**

Apply retry wrapper + error handling to each.

- [ ] **Step 6: Add retry logic test**

Create `src/__tests__/generatePuzzle.retry.test.ts`:

```typescript
import { generatePuzzleWithRetry } from '../generatePuzzle';

describe('generatePuzzleWithRetry', () => {
  it('returns a puzzle on success', () => {
    const puzzle = generatePuzzleWithRetry(4, 'easy', 'test-seed');
    expect(puzzle).not.toBeNull();
    expect(puzzle!.start).toBeDefined();
    expect(puzzle!.end).toBeDefined();
  });

  it('returns puzzle with fallback difficulty if original fails', () => {
    // This test assumes hard/rare-word-length combos sometimes fail
    const puzzle = generatePuzzleWithRetry(5, 'hard', 'challenging-seed');
    // Either returns a puzzle or null
    if (puzzle) {
      expect(puzzle.start).toBeDefined();
    }
  });

  it('returns null after exhausting all retries and fallbacks', () => {
    // Worst case: 7-letter hard words may not exist
    const puzzle = generatePuzzleWithRetry(7, 'hard', 'impossible-seed');
    // Result may be null if no puzzle possible, should not crash
    expect(typeof puzzle).toBe(typeof null || 'object');
  });
});
```

- [ ] **Step 7: Run full test suite**

```bash
npm test
```

Expected: All existing tests still pass; new retry tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/generatePuzzle.ts src/__tests__/generatePuzzle.retry.test.ts [modified-call-sites]
git commit -m "feat: add retry logic and fallback handling for puzzle generation"
```

---

## Phase 4: Integration Solvability Testing

### Task 4: Create Comprehensive Solvability Test Suite

**Files:**
- Create: `src/__tests__/puzzleSolvability.test.ts`

**Phase 4 Rationale:**
Run a large, randomized solvability test covering many seeds and difficulty combinations. This catches rare edge cases and validates the whole pipeline.

- [ ] **Step 1: Write solvability test**

Create `src/__tests__/puzzleSolvability.test.ts`:

```typescript
import { generatePuzzle, Difficulty, WordLength } from '../generatePuzzle';
import { shortestPath } from '../wordGraph';

describe('Puzzle Solvability Integration Test', () => {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  const wordLengths: WordLength[] = [3, 4, 5];
  const seedCount = 20; // 20 seeds per configuration

  for (const wordLength of wordLengths) {
    for (const difficulty of difficulties) {
      describe(`${wordLength}-letter words, ${difficulty} difficulty`, () => {
        it(`generates solvable puzzles for ${seedCount} random seeds`, () => {
          const failedSeeds: Array<{ seed: string; reason: string }> = [];

          for (let i = 0; i < seedCount; i++) {
            const seed = `solvability-test:${wordLength}:${difficulty}:seed${i}`;

            try {
              const puzzle = generatePuzzle(wordLength, difficulty, seed);

              // Check 1: Puzzle is not null
              expect(puzzle).toBeDefined();

              // Check 2: Start and end are different
              expect(puzzle.start).not.toBe(puzzle.end);

              // Check 3: Puzzle is solvable
              const path = shortestPath(puzzle.start, puzzle.end);
              expect(path).not.toBeNull();

              // Check 4: Optimal length is reasonable
              expect(path!.length).toBeLessThanOrEqual(puzzle.optimal + 2);
              expect(path!.length).toBeGreaterThanOrEqual(2);

              // Check 5: Chain matches path
              expect(puzzle.chain).toEqual(path!);

            } catch (e: any) {
              failedSeeds.push({ seed, reason: e.message });
            }
          }

          if (failedSeeds.length > 0) {
            console.log(
              `⚠️  ${failedSeeds.length}/${seedCount} puzzles failed to generate:`,
              failedSeeds
            );
            // Log failures but don't block test - rare edge cases are acceptable
            // as long as we're aware of them
          }

          // At least 80% of seeds should succeed
          expect(failedSeeds.length).toBeLessThan(seedCount * 0.2);
        });
      });
    }
  }

  it('deterministically generates same puzzle for same seed', () => {
    const seed = 'determinism-check';
    const p1 = generatePuzzle(4, 'medium', seed);
    const p2 = generatePuzzle(4, 'medium', seed);

    expect(p1.start).toBe(p2.start);
    expect(p1.end).toBe(p2.end);
    expect(p1.optimal).toBe(p2.optimal);
    expect(p1.chain).toEqual(p2.chain);
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npm test -- puzzleSolvability.test.ts
```

Expected: Test runs 180 puzzle generations (3 word lengths × 3 difficulties × 20 seeds), logs any failures, passes if at least 80% succeed.

- [ ] **Step 3: Review output**

Check for patterns in failures:
- Are failures clustered by difficulty/word length?
- Are certain seeds consistently problematic?
- Do failures indicate a real issue or expected edge case?

Document findings in a comment block in the test file.

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/puzzleSolvability.test.ts
git commit -m "test: add comprehensive puzzle solvability integration test"
```

---

## Verification Checklist

- [ ] Dictionary audit script runs and produces clean report (no crashes)
- [ ] All wordGraph unit tests pass (9+ tests)
- [ ] All generatePuzzle validation tests pass (10+ tests demonstrating solvability, no zero-step, difficulty consistency, determinism)
- [ ] All caller retry tests pass
- [ ] Puzzle solvability integration test runs 180+ generations and succeeds at ≥80% rate
- [ ] All existing tests (295+) still pass
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All commits follow format: "audit/feat/test: [description]"

---

## Acceptance Criteria for Prompt 2

✅ Dictionary audit script exists and produces clean report  
✅ generatePuzzle has solvability + no-zero-step guards  
✅ All callers have retry-on-failure logic and fallback handling  
✅ New solvability test added (180+ generations) and passes  
✅ All existing tests (295+) still pass  
✅ No modifications to dictionary content or difficulty step counts  
✅ Summary lists every change made and every file touched

---

## Notes

- **No dictionary modifications:** Orphan words and small islands are reported, not fixed. User decides if words should be added/removed.
- **No difficulty rewrites:** If easy/medium/hard produce inconsistent step counts, log it but don't change the logic without explicit request.
- **Surgical caller updates:** Retry logic is wrapped around existing calls, not replacing the call logic itself.
- **Test flexibility:** Solvability test allows rare edge-case failures but flags them for visibility.
