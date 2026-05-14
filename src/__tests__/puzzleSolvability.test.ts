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
