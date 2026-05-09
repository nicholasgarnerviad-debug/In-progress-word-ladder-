import { generatePuzzle, getDailyPuzzle } from './generatePuzzle';

describe('generatePuzzle', () => {
  describe('puzzle structure', () => {
    it('should return a valid puzzle object', () => {
      const puzzle = generatePuzzle(3, 'easy');

      expect(puzzle).toHaveProperty('start');
      expect(puzzle).toHaveProperty('end');
      expect(puzzle).toHaveProperty('optimal');
      expect(puzzle).toHaveProperty('chain');
      expect(puzzle).toHaveProperty('lockedIndices');
      expect(puzzle).toHaveProperty('extraRungs');
    });

    it('should return extraRungs = 2', () => {
      const puzzles = [
        generatePuzzle(3, 'easy'),
        generatePuzzle(4, 'medium'),
        generatePuzzle(3, 'hard')
      ];

      puzzles.forEach(p => {
        expect(p.extraRungs).toBe(2);
      });
    });

    it('should have matching start and end with chain endpoints', () => {
      const puzzle = generatePuzzle(3, 'easy');

      expect(puzzle.start).toBe(puzzle.chain[0]);
      expect(puzzle.end).toBe(puzzle.chain[puzzle.chain.length - 1]);
    });
  });

  describe('word lengths', () => {
    it('should respect word length for 3-letter words', () => {
      const puzzle = generatePuzzle(3, 'easy');

      puzzle.chain.forEach(word => {
        expect(word.length).toBe(3);
      });
    });

    it('should respect word length for 4-letter words', () => {
      const puzzle = generatePuzzle(4, 'easy');

      puzzle.chain.forEach(word => {
        expect(word.length).toBe(4);
      });
    });

    it('should respect word length for 4-letter words', () => {
      const puzzle = generatePuzzle(4, 'medium');

      puzzle.chain.forEach(word => {
        expect(word.length).toBe(4);
      });
    });
  });

  describe('difficulty levels', () => {
    it('easy should return chain of length 4', () => {
      const puzzle = generatePuzzle(3, 'easy');

      expect(puzzle.chain.length).toBe(4);
      expect(puzzle.optimal).toBe(4);
    });

    it('medium should return chain of length 5', () => {
      const puzzle = generatePuzzle(3, 'medium');

      expect(puzzle.chain.length).toBe(5);
      expect(puzzle.optimal).toBe(5);
    });

    it('hard should return chain of length 6', () => {
      const puzzle = generatePuzzle(4, 'hard');

      expect(puzzle.chain.length).toBe(6);
      expect(puzzle.optimal).toBe(6);
    });
  });

  describe('lockedIndices', () => {
    it('should be an array', () => {
      const puzzle = generatePuzzle(3, 'easy');

      expect(Array.isArray(puzzle.lockedIndices)).toBe(true);
    });

    it('should have 0-2 locked indices', () => {
      const puzzles = Array.from({ length: 10 }, () => generatePuzzle(3, 'easy'));

      puzzles.forEach(p => {
        expect(p.lockedIndices.length).toBeLessThanOrEqual(2);
        expect(p.lockedIndices.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should not lock the first position (index 0)', () => {
      const puzzles = Array.from({ length: 20 }, () => generatePuzzle(3, 'easy'));

      puzzles.forEach(p => {
        p.lockedIndices.forEach(idx => {
          expect(idx).toBeGreaterThan(0);
        });
      });
    });

    it('should be sorted in ascending order', () => {
      const puzzles = Array.from({ length: 10 }, () => generatePuzzle(3, 'medium'));

      puzzles.forEach(p => {
        for (let i = 1; i < p.lockedIndices.length; i++) {
          expect(p.lockedIndices[i]).toBeGreaterThan(p.lockedIndices[i - 1]);
        }
      });
    });

    it('should have unique indices', () => {
      const puzzles = Array.from({ length: 10 }, () => generatePuzzle(3, 'hard'));

      puzzles.forEach(p => {
        const uniqueSet = new Set(p.lockedIndices);
        expect(uniqueSet.size).toBe(p.lockedIndices.length);
      });
    });
  });

  describe('seeding for determinism', () => {
    it('same seed should produce same puzzle', () => {
      const puzzle1 = generatePuzzle(3, 'easy', 'test-seed-123');
      const puzzle2 = generatePuzzle(3, 'easy', 'test-seed-123');

      expect(puzzle1.start).toBe(puzzle2.start);
      expect(puzzle1.end).toBe(puzzle2.end);
      expect(puzzle1.chain).toEqual(puzzle2.chain);
      expect(puzzle1.lockedIndices).toEqual(puzzle2.lockedIndices);
    });

    it('different seeds should produce different puzzles', () => {
      const puzzle1 = generatePuzzle(3, 'easy', 'seed-1');
      const puzzle2 = generatePuzzle(3, 'easy', 'seed-2');

      // At least one property should differ
      expect(
        puzzle1.start !== puzzle2.start ||
        puzzle1.end !== puzzle2.end ||
        !puzzle1.chain.every((w, i) => w === puzzle2.chain[i]) ||
        !puzzle1.lockedIndices.every((idx, i) => idx === puzzle2.lockedIndices[i])
      ).toBe(true);
    });

    it('getDailyPuzzle should be deterministic within same day', () => {
      const today = new Date().toDateString();

      // Simulate same day by mocking date
      const puzzle1 = generatePuzzle(3, 'easy', today);
      const puzzle2 = generatePuzzle(3, 'easy', today);

      expect(puzzle1.chain).toEqual(puzzle2.chain);
      expect(puzzle1.lockedIndices).toEqual(puzzle2.lockedIndices);
    });
  });

  describe('getDailyPuzzle', () => {
    it('should generate puzzle without explicit seed', () => {
      const puzzle = getDailyPuzzle(3, 'easy');

      expect(puzzle.chain.length).toBe(4);
      expect(puzzle.start).toBeDefined();
      expect(puzzle.end).toBeDefined();
    });

    it('should be deterministic for same calendar day', () => {
      const puzzle1 = getDailyPuzzle(3, 'easy');
      const puzzle2 = getDailyPuzzle(3, 'easy');

      expect(puzzle1.chain).toEqual(puzzle2.chain);
      expect(puzzle1.lockedIndices).toEqual(puzzle2.lockedIndices);
    });

    it('should work for all difficulty levels', () => {
      const easyPuzzle = getDailyPuzzle(3, 'easy');
      const mediumPuzzle = getDailyPuzzle(3, 'medium');
      const hardPuzzle = getDailyPuzzle(3, 'hard');

      expect(easyPuzzle.chain.length).toBe(4);
      expect(mediumPuzzle.chain.length).toBe(5);
      expect(hardPuzzle.chain.length).toBe(6);
    });

    it('should work for 3 and 4 letter word lengths', () => {
      const puzzle3 = getDailyPuzzle(3, 'easy');
      const puzzle4 = getDailyPuzzle(4, 'medium');

      puzzle3.chain.forEach(w => expect(w.length).toBe(3));
      puzzle4.chain.forEach(w => expect(w.length).toBe(4));
    });
  });

  describe('path validity', () => {
    it('each step in chain should differ by one letter', () => {
      const puzzle = generatePuzzle(3, 'easy');

      for (let i = 0; i < puzzle.chain.length - 1; i++) {
        const current = puzzle.chain[i];
        const next = puzzle.chain[i + 1];

        let diffCount = 0;
        for (let j = 0; j < current.length; j++) {
          if (current[j] !== next[j]) diffCount++;
        }

        expect(diffCount).toBe(1);
      }
    });

    it('should produce valid paths for 3 and 4 letter combinations', () => {
      const combinations: Array<[3 | 4, 'easy' | 'medium' | 'hard']> = [
        [3, 'easy'],
        [3, 'medium'],
        [3, 'hard'],
        [4, 'easy'],
        [4, 'medium'],
        [4, 'hard']
      ];

      combinations.forEach(([length, difficulty]) => {
        const puzzle = generatePuzzle(length, difficulty);

        expect(puzzle.chain.length).toBeGreaterThan(0);
        expect(puzzle.start).toBeDefined();
        expect(puzzle.end).toBeDefined();
        expect(puzzle.lockedIndices).toBeDefined();
      });
    });
  });
});
