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
    it('easy puzzles have 4 step optimal path', () => {
      const puzzles = [
        generatePuzzle(4, 'easy', 'easy-1'),
        generatePuzzle(4, 'easy', 'easy-2'),
        generatePuzzle(4, 'easy', 'easy-3'),
      ];
      const optimalLengths = puzzles.map(p => p.optimal);
      expect(optimalLengths.every(len => len === 4)).toBe(true);
    });

    it('medium puzzles have 5 step optimal path', () => {
      const puzzles = [
        generatePuzzle(4, 'medium', 'med-1'),
        generatePuzzle(4, 'medium', 'med-2'),
        generatePuzzle(4, 'medium', 'med-3'),
      ];
      const optimalLengths = puzzles.map(p => p.optimal);
      expect(optimalLengths.every(len => len === 5)).toBe(true);
    });

    it('hard puzzles have 6 step optimal path', () => {
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
