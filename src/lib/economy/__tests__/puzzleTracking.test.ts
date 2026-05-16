import {
  generatePuzzleId,
  loadCompletedPuzzles,
  saveCompletedPuzzles,
  isCompletedPuzzle,
  addCompletedPuzzle,
  type PuzzleMode,
} from '../puzzleTracking';

describe('puzzleTracking', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generatePuzzleId', () => {
    it('generates normalized puzzle IDs', () => {
      const id = generatePuzzleId('classic', 'Cat', 'Dog');
      expect(id).toBe('classic:cat:dog');
    });

    it('generates different IDs for different modes', () => {
      const classicId = generatePuzzleId('classic', 'cat', 'dog');
      const timeAttackId = generatePuzzleId('timeAttack', 'cat', 'dog');
      const blitzId = generatePuzzleId('blitz', 'cat', 'dog');

      expect(classicId).toBe('classic:cat:dog');
      expect(timeAttackId).toBe('timeAttack:cat:dog');
      expect(blitzId).toBe('blitz:cat:dog');
      expect(classicId).not.toBe(timeAttackId);
      expect(timeAttackId).not.toBe(blitzId);
    });

    it('is case-insensitive', () => {
      const id1 = generatePuzzleId('classic', 'CAT', 'DOG');
      const id2 = generatePuzzleId('classic', 'cat', 'dog');
      const id3 = generatePuzzleId('classic', 'CaT', 'DoG');

      expect(id1).toBe(id2);
      expect(id2).toBe(id3);
    });

    it('trims whitespace from words', () => {
      const id1 = generatePuzzleId('classic', '  cat  ', '  dog  ');
      const id2 = generatePuzzleId('classic', 'cat', 'dog');

      expect(id1).toBe(id2);
    });

    it('handles both case and whitespace together', () => {
      const id1 = generatePuzzleId('classic', '  CAT  ', '  DOG  ');
      const id2 = generatePuzzleId('classic', 'cat', 'dog');

      expect(id1).toBe(id2);
    });
  });

  describe('loadCompletedPuzzles', () => {
    it('returns empty Set when nothing is stored', () => {
      const puzzles = loadCompletedPuzzles();
      expect(puzzles).toBeInstanceOf(Set);
      expect(puzzles.size).toBe(0);
    });

    it('loads puzzles from localStorage', () => {
      const testData = ['classic:cat:dog', 'timeAttack:ant:bee'];
      localStorage.setItem('wordLadder-completedPuzzles', JSON.stringify(testData));

      const puzzles = loadCompletedPuzzles();
      expect(puzzles.size).toBe(2);
      expect(puzzles.has('classic:cat:dog')).toBe(true);
      expect(puzzles.has('timeAttack:ant:bee')).toBe(true);
    });

    it('returns empty Set on parse failure', () => {
      localStorage.setItem('wordLadder-completedPuzzles', 'invalid json {]');

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const puzzles = loadCompletedPuzzles();

      expect(puzzles).toBeInstanceOf(Set);
      expect(puzzles.size).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('returns empty Set if stored value is not an array', () => {
      localStorage.setItem('wordLadder-completedPuzzles', JSON.stringify({ invalid: 'data' }));

      const puzzles = loadCompletedPuzzles();
      expect(puzzles).toBeInstanceOf(Set);
      expect(puzzles.size).toBe(0);
    });
  });

  describe('saveCompletedPuzzles', () => {
    it('saves empty Set as empty array', () => {
      const puzzles = new Set<string>();
      saveCompletedPuzzles(puzzles);

      const stored = localStorage.getItem('wordLadder-completedPuzzles');
      expect(stored).toBe(JSON.stringify([]));
    });

    it('saves Set with puzzles as JSON array', () => {
      const puzzles = new Set(['classic:cat:dog', 'timeAttack:ant:bee']);
      saveCompletedPuzzles(puzzles);

      const stored = localStorage.getItem('wordLadder-completedPuzzles');
      const parsed = JSON.parse(stored!);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toContain('classic:cat:dog');
      expect(parsed).toContain('timeAttack:ant:bee');
      expect(parsed.length).toBe(2);
    });

    it('overwrites previous data', () => {
      localStorage.setItem('wordLadder-completedPuzzles', JSON.stringify(['old:puzzle:id']));

      const puzzles = new Set(['new:puzzle:id']);
      saveCompletedPuzzles(puzzles);

      const stored = localStorage.getItem('wordLadder-completedPuzzles');
      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual(['new:puzzle:id']);
      expect(parsed).not.toContain('old:puzzle:id');
    });
  });

  describe('isCompletedPuzzle', () => {
    it('returns false for uncompleted puzzle', () => {
      const result = isCompletedPuzzle('classic', 'cat', 'dog');
      expect(result).toBe(false);
    });

    it('returns true for completed puzzle', () => {
      localStorage.setItem(
        'wordLadder-completedPuzzles',
        JSON.stringify(['classic:cat:dog'])
      );

      const result = isCompletedPuzzle('classic', 'cat', 'dog');
      expect(result).toBe(true);
    });

    it('normalizes input when checking', () => {
      localStorage.setItem(
        'wordLadder-completedPuzzles',
        JSON.stringify(['classic:cat:dog'])
      );

      const result = isCompletedPuzzle('classic', '  CAT  ', '  DOG  ');
      expect(result).toBe(true);
    });

    it('returns false for completed puzzle with different mode', () => {
      localStorage.setItem(
        'wordLadder-completedPuzzles',
        JSON.stringify(['classic:cat:dog'])
      );

      const result = isCompletedPuzzle('timeAttack', 'cat', 'dog');
      expect(result).toBe(false);
    });

    it('returns false for completed puzzle with different word pair', () => {
      localStorage.setItem(
        'wordLadder-completedPuzzles',
        JSON.stringify(['classic:cat:dog'])
      );

      const result = isCompletedPuzzle('classic', 'ant', 'bee');
      expect(result).toBe(false);
    });
  });

  describe('addCompletedPuzzle', () => {
    it('adds a new puzzle to empty storage', () => {
      addCompletedPuzzle('classic', 'cat', 'dog');

      const loaded = loadCompletedPuzzles();
      expect(loaded.size).toBe(1);
      expect(loaded.has('classic:cat:dog')).toBe(true);
    });

    it('adds a new puzzle to existing puzzles', () => {
      localStorage.setItem(
        'wordLadder-completedPuzzles',
        JSON.stringify(['classic:ant:bee'])
      );

      addCompletedPuzzle('classic', 'cat', 'dog');

      const loaded = loadCompletedPuzzles();
      expect(loaded.size).toBe(2);
      expect(loaded.has('classic:ant:bee')).toBe(true);
      expect(loaded.has('classic:cat:dog')).toBe(true);
    });

    it('is idempotent', () => {
      addCompletedPuzzle('classic', 'cat', 'dog');
      addCompletedPuzzle('classic', 'cat', 'dog');
      addCompletedPuzzle('classic', 'cat', 'dog');

      const loaded = loadCompletedPuzzles();
      expect(loaded.size).toBe(1);
      expect(loaded.has('classic:cat:dog')).toBe(true);
    });

    it('persists to localStorage', () => {
      addCompletedPuzzle('classic', 'cat', 'dog');

      const stored = localStorage.getItem('wordLadder-completedPuzzles');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toContain('classic:cat:dog');
    });

    it('normalizes input when adding', () => {
      addCompletedPuzzle('classic', '  CAT  ', '  DOG  ');

      const loaded = loadCompletedPuzzles();
      expect(loaded.has('classic:cat:dog')).toBe(true);
    });

    it('adds multiple puzzles across different modes', () => {
      addCompletedPuzzle('classic', 'cat', 'dog');
      addCompletedPuzzle('timeAttack', 'cat', 'dog');
      addCompletedPuzzle('blitz', 'ant', 'bee');

      const loaded = loadCompletedPuzzles();
      expect(loaded.size).toBe(3);
      expect(loaded.has('classic:cat:dog')).toBe(true);
      expect(loaded.has('timeAttack:cat:dog')).toBe(true);
      expect(loaded.has('blitz:ant:bee')).toBe(true);
    });
  });
});
