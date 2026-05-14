import { computeBlitzPuzzleScore, computeBlitzPuzzleScoreIfSolved, type ComputeScoreInput } from '../scoring';

describe('computeBlitzPuzzleScore', () => {
  const baseInput: ComputeScoreInput = {
    solved: true,
    solveTime: 5000,
    wrong: 0,
    hints: 0,
    wordLength: 5,
    difficulty: 'medium',
  };

  it('returns 0 if not solved', () => {
    const input: ComputeScoreInput = { ...baseInput, solved: false, solveTime: null };
    expect(computeBlitzPuzzleScore(input)).toBe(0);
  });

  it('returns base score for par time with no penalties', () => {
    // Par time for 5-letter, medium = 8000ms
    // Solving at 8000ms (par): 100 - 0 - 0 + 0 = 100
    const input: ComputeScoreInput = { ...baseInput, solveTime: 8000 };
    expect(computeBlitzPuzzleScore(input)).toBe(100);
  });

  it('adds speed bonus for solving under par time', () => {
    // Par time for 5-letter, medium = 8000ms
    // Solving at 3000ms: 100 - 0 - 0 + (5 * 5) = 125
    // (8000 - 3000) / 1000 = 5 seconds under par * 5 = 25 points
    const input: ComputeScoreInput = { ...baseInput, solveTime: 3000 };
    expect(computeBlitzPuzzleScore(input)).toBe(125);
  });

  it('penalizes wrong guesses at 40 points each', () => {
    // Par time for 5-letter, medium = 8000ms
    // Solving at 8000ms with 2 wrong: 100 - (2 * 40) - 0 + 0 = 20
    const input: ComputeScoreInput = { ...baseInput, solveTime: 8000, wrong: 2 };
    expect(computeBlitzPuzzleScore(input)).toBe(20);
  });

  it('penalizes hints at 50 points each', () => {
    // Par time for 5-letter, medium = 8000ms
    // Solving at 8000ms with 1 hint: 100 - 0 - 50 + 0 = 50
    const input: ComputeScoreInput = { ...baseInput, solveTime: 8000, hints: 1 };
    expect(computeBlitzPuzzleScore(input)).toBe(50);
  });

  it('applies combined penalties and bonuses', () => {
    // Par time for 5-letter, medium = 8000ms
    // Solving at 3000ms with 1 wrong, 1 hint:
    // 100 - 40 - 50 + (5 * 5) = 100 - 40 - 50 + 25 = 35
    const input: ComputeScoreInput = {
      ...baseInput,
      solveTime: 3000,
      wrong: 1,
      hints: 1,
    };
    expect(computeBlitzPuzzleScore(input)).toBe(35);
  });

  it('enforces minimum score of 10', () => {
    // Par time for 5-letter, medium = 8000ms
    // Solving at 8000ms with 3 wrong: 100 - 120 = -20 -> 10
    const input: ComputeScoreInput = { ...baseInput, solveTime: 8000, wrong: 3 };
    expect(computeBlitzPuzzleScore(input)).toBe(10);
  });

  it('handles different word lengths and difficulties', () => {
    // 4-letter easy: par = 3000ms
    // Solving at 3000ms: 100
    const input4Easy: ComputeScoreInput = {
      ...baseInput,
      wordLength: 4,
      difficulty: 'easy',
      solveTime: 3000,
    };
    expect(computeBlitzPuzzleScore(input4Easy)).toBe(100);

    // 6-letter hard: par = 18000ms
    // Solving at 18000ms: 100
    const input6Hard: ComputeScoreInput = {
      ...baseInput,
      wordLength: 6,
      difficulty: 'hard',
      solveTime: 18000,
    };
    expect(computeBlitzPuzzleScore(input6Hard)).toBe(100);
  });

  it('calculates speed bonus correctly', () => {
    // Par time for 5-letter, medium = 8000ms
    // Solving at 5000ms: (8000 - 5000) / 1000 = 3 seconds under par * 5 = 15
    // Score: 100 - 0 - 0 + 15 = 115
    const input: ComputeScoreInput = { ...baseInput, solveTime: 5000 };
    expect(computeBlitzPuzzleScore(input)).toBe(115);
  });
});

describe('computeBlitzPuzzleScoreIfSolved', () => {
  const baseInput: ComputeScoreInput = {
    solved: true,
    solveTime: 8000,
    wrong: 0,
    hints: 0,
    wordLength: 5,
    difficulty: 'medium',
  };

  it('returns 0 if not solved', () => {
    const input: ComputeScoreInput = { ...baseInput, solved: false, solveTime: null };
    expect(computeBlitzPuzzleScoreIfSolved(input)).toBe(0);
  });

  it('returns full score if solved', () => {
    const input: ComputeScoreInput = { ...baseInput, solved: true };
    expect(computeBlitzPuzzleScoreIfSolved(input)).toBe(100);
  });

  it('applies penalties and bonuses when solved', () => {
    const input: ComputeScoreInput = {
      ...baseInput,
      solved: true,
      solveTime: 5000,
      wrong: 1,
      hints: 1,
    };
    // 100 - 40 - 50 + 15 = 25
    expect(computeBlitzPuzzleScoreIfSolved(input)).toBe(25);
  });
});
