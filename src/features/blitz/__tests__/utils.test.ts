import {
  generateRoomCode,
  isValidRoomCode,
  generateBlitzPuzzleBatch,
  formatTime,
  generateSessionSeed,
} from '../utils';

describe('generateRoomCode', () => {
  it('generates 6-character codes', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
    }
  });

  it('uses only alphanumeric characters', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).toMatch(/^[A-Z2-9]{6}$/);
    }
  });

  it('excludes ambiguous characters (0, O, 1, I, L)', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).not.toMatch(/[0O1IL]/);
    }
  });
});

describe('isValidRoomCode', () => {
  it('validates correct room codes', () => {
    expect(isValidRoomCode('ABCDE2')).toBe(true);
    expect(isValidRoomCode('ABC9EF')).toBe(true);
    expect(isValidRoomCode('ZZZZZZ')).toBe(true);
  });

  it('rejects codes with ambiguous characters', () => {
    expect(isValidRoomCode('ABC0DE')).toBe(false);
    expect(isValidRoomCode('ABCODE')).toBe(false);
    expect(isValidRoomCode('ABC1DE')).toBe(false);
    expect(isValidRoomCode('ABCIDE')).toBe(false);
    expect(isValidRoomCode('ABCLDE')).toBe(false);
  });

  it('rejects codes with wrong length', () => {
    expect(isValidRoomCode('ABCDE')).toBe(false);
    expect(isValidRoomCode('ABCDEF1')).toBe(false);
  });

  it('rejects codes with invalid characters', () => {
    expect(isValidRoomCode('ABC@EF')).toBe(false);
    expect(isValidRoomCode('ABC EF')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isValidRoomCode('abcdef')).toBe(true);
    expect(isValidRoomCode('AbCdEf')).toBe(true);
  });

  it('trims whitespace', () => {
    expect(isValidRoomCode('  ABCDEF  ')).toBe(true);
    expect(isValidRoomCode('\tABCDEF\n')).toBe(true);
  });
});

describe('generateBlitzPuzzleBatch', () => {
  it('generates the requested count', () => {
    const puzzles = generateBlitzPuzzleBatch(4, 'easy', 'test-seed', 3);
    expect(puzzles).toHaveLength(3);
  });

  it('is deterministic with the same seed', () => {
    const seed = 'deterministic-test';
    const batch1 = generateBlitzPuzzleBatch(5, 'medium', seed, 5);
    const batch2 = generateBlitzPuzzleBatch(5, 'medium', seed, 5);
    expect(batch1).toEqual(batch2);
  });

  it('produces different results with different seeds', () => {
    const batch1 = generateBlitzPuzzleBatch(6, 'hard', 'seed-1', 5);
    const batch2 = generateBlitzPuzzleBatch(6, 'hard', 'seed-2', 5);
    expect(batch1).not.toEqual(batch2);
  });

  it('handles all word lengths', () => {
    const lengths: (4 | 5 | 6)[] = [4, 5, 6];
    for (const length of lengths) {
      const puzzles = generateBlitzPuzzleBatch(length, 'easy', 'seed', 2);
      expect(puzzles).toHaveLength(2);
      for (const puzzle of puzzles) {
        expect(puzzle.length).toBe(length);
      }
    }
  });

  it('handles all difficulties', () => {
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    for (const difficulty of difficulties) {
      const puzzles = generateBlitzPuzzleBatch(5, difficulty, 'seed', 2);
      expect(puzzles).toHaveLength(2);
    }
  });
});

describe('formatTime', () => {
  it('formats times >= 10s as M:SS.t', () => {
    expect(formatTime(10000)).toBe('0:10.0');
    expect(formatTime(60000)).toBe('1:00.0');
    expect(formatTime(90500)).toBe('1:30.5');
    expect(formatTime(9999)).toBe('9.9');
  });

  it('formats times < 10s as S.t', () => {
    expect(formatTime(0)).toBe('0.0');
    expect(formatTime(999)).toBe('0.9');
    expect(formatTime(1000)).toBe('1.0');
  });

  it('handles edge cases', () => {
    expect(formatTime(5000)).toBe('5.0');
    expect(formatTime(9500)).toBe('9.5');
  });

  it('returns 0.0 for negative times', () => {
    expect(formatTime(-500)).toBe('0.0');
    expect(formatTime(-1000)).toBe('0.0');
  });
});

describe('generateSessionSeed', () => {
  it('generates different seeds on each call', () => {
    const seed1 = generateSessionSeed();
    const seed2 = generateSessionSeed();
    expect(seed1).not.toBe(seed2);
  });

  it('has timestamp_random format', () => {
    const seed = generateSessionSeed();
    expect(seed).toMatch(/^\d+_[A-Za-z0-9]{5}$/);
  });

  it('contains alphanumeric characters in random part', () => {
    for (let i = 0; i < 10; i++) {
      const seed = generateSessionSeed();
      const randomPart = seed.split('_')[1];
      expect(randomPart).toMatch(/^[A-Za-z0-9]{5}$/);
    }
  });
});
