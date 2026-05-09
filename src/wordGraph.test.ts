import { getNeighbors, shortestPath } from './wordGraph';

describe('wordGraph', () => {
  describe('getNeighbors', () => {
    it('should return neighbors for a valid word', () => {
      const neighbors = getNeighbors('cat');
      expect(neighbors.length).toBeGreaterThan(0);
      expect(neighbors).toContain('bat');
      expect(neighbors).toContain('hat');
      expect(neighbors).toContain('mat');
    });

    it('should be case-insensitive', () => {
      const lowerNeighbors = getNeighbors('cat');
      const upperNeighbors = getNeighbors('CAT');
      expect(upperNeighbors).toEqual(lowerNeighbors);
    });

    it('should return empty array for invalid word', () => {
      const neighbors = getNeighbors('xyz');
      expect(neighbors).toEqual([]);
    });

    it('should return empty array for word outside 3-5 letter range', () => {
      expect(getNeighbors('ab')).toEqual([]);
      expect(getNeighbors('toolongword')).toEqual([]);
    });
  });

  describe('shortestPath', () => {
    it('should find path from CAT to DOG', () => {
      const path = shortestPath('cat', 'dog');
      expect(path).not.toBeNull();
      expect(path).toHaveLength(4); // CAT → COT → DOT → DOG (or similar)
      expect(path![0]).toBe('cat');
      expect(path![path!.length - 1]).toBe('dog');
    });

    it('should verify path is valid (each step differs by one letter)', () => {
      const path = shortestPath('cat', 'dog');
      expect(path).not.toBeNull();

      for (let i = 0; i < path!.length - 1; i++) {
        const current = path![i];
        const next = path![i + 1];
        let diffCount = 0;

        for (let j = 0; j < current.length; j++) {
          if (current[j] !== next[j]) diffCount++;
        }

        expect(diffCount).toBe(1);
      }
    });

    it('should return null for unreachable words', () => {
      // This test depends on the actual word list; using a made-up word
      const path = shortestPath('cat', 'zzz');
      expect(path).toBeNull();
    });

    it('should return single-element array when start equals end', () => {
      const path = shortestPath('cat', 'cat');
      expect(path).toEqual(['cat']);
    });

    it('should handle case-insensitive input', () => {
      const pathLower = shortestPath('cat', 'dog');
      const pathUpper = shortestPath('CAT', 'DOG');
      const pathMixed = shortestPath('CaT', 'DoG');

      expect(pathUpper).toEqual(pathLower);
      expect(pathMixed).toEqual(pathLower);
    });

    it('should return null for invalid start word', () => {
      const path = shortestPath('xyz', 'dog');
      expect(path).toBeNull();
    });

    it('should return null for invalid end word', () => {
      const path = shortestPath('cat', 'xyz');
      expect(path).toBeNull();
    });

    it('should find path between 3-letter words', () => {
      const path = shortestPath('run', 'sun');
      expect(path).not.toBeNull();
      expect(path![0]).toBe('run');
      expect(path![path!.length - 1]).toBe('sun');
    });

    it('should find path between 4-letter words', () => {
      const path = shortestPath('that', 'this');
      expect(path).not.toBeNull();
      expect(path![0]).toBe('that');
      expect(path![path!.length - 1]).toBe('this');
    });
  });
});
