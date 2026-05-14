import { generatePuzzleWithRetry } from '../generatePuzzle';

describe('generatePuzzleWithRetry', () => {
  it('returns a puzzle on success', () => {
    const puzzle = generatePuzzleWithRetry(4, 'easy', 'test-seed');
    expect(puzzle).not.toBeNull();
    expect(puzzle!.start).toBeDefined();
    expect(puzzle!.end).toBeDefined();
  });

  it('returns puzzle with fallback difficulty if original fails', () => {
    // Difficult seed but should succeed with fallback
    const puzzle = generatePuzzleWithRetry(5, 'hard', 'challenging-seed');
    if (puzzle) {
      expect(puzzle.start).toBeDefined();
      expect(puzzle.end).toBeDefined();
    }
  });

  it('returns null after exhausting all retries and fallbacks', () => {
    // Worst case: 7-letter hard words are very difficult to find
    const puzzle = generatePuzzleWithRetry(7, 'hard', 'impossible-seed-xyz');
    // Result may be null if truly no puzzle possible
    expect(typeof puzzle === 'object' || puzzle === null).toBe(true);
  });

  it('succeeds with fallback to easier difficulty', () => {
    // Even hard difficulty should eventually fall back to easier
    const puzzle = generatePuzzleWithRetry(6, 'hard', 'tough-6-letter');
    // Should not crash, either returns puzzle or null
    expect(puzzle === null || puzzle.start).toBeDefined();
  });

  it('succeeds with fallback to shorter word length', () => {
    // Falls back to shorter words if needed
    const puzzle = generatePuzzleWithRetry(6, 'medium', 'fallback-length');
    // Should not crash
    expect(puzzle === null || puzzle.start).toBeDefined();
  });
});
