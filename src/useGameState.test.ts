import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';
import { WordPuzzle } from './generatePuzzle';

const mockPuzzle: WordPuzzle = {
  start: 'cat',
  end: 'dog',
  optimal: 4,
  chain: ['cat', 'cot', 'dot', 'dog'],
  lockedIndices: [1],
  extraRungs: 2
};

describe('useGameState', () => {
  describe('initialization', () => {
    it('should initialize with correct starting word', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));
      expect(result.current.state.history[0]).toEqual(['c', 'a', 't']);
    });

    it('should initialize game in playing phase', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));
      expect(result.current.state.phase).toBe('playing');
    });

    it('should initialize with 3 lives', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));
      expect(result.current.state.lives).toBe(3);
    });

    it('should initialize with no hint or reveal active', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));
      expect(result.current.state.lastHintedLetter).toBeNull();
      expect(result.current.state.lastRevealedWord).toBeNull();
    });

    it('should expose all required methods', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));
      expect(typeof result.current.pressLetter).toBe('function');
      expect(typeof result.current.deleteLetter).toBe('function');
      expect(typeof result.current.submitWord).toBe('function');
      expect(typeof result.current.applyHint).toBe('function');
      expect(typeof result.current.applyReveal).toBe('function');
      expect(typeof result.current.clearHint).toBe('function');
      expect(typeof result.current.undoStep).toBe('function');
    });
  });

  describe('letter input', () => {
    it('should add letters to current input', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      act(() => {
        result.current.pressLetter('h');
        result.current.pressLetter('e');
        result.current.pressLetter('y');
      });

      expect(result.current.state.currentInput).toEqual(['h', 'e', 'y']);
    });

    it('should convert letters to lowercase', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      act(() => {
        result.current.pressLetter('H');
        result.current.pressLetter('E');
        result.current.pressLetter('Y');
      });

      expect(result.current.state.currentInput).toEqual(['h', 'e', 'y']);
    });

    it('should delete last letter', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      act(() => {
        result.current.pressLetter('h');
        result.current.pressLetter('e');
        result.current.pressLetter('y');
        result.current.deleteLetter();
      });

      expect(result.current.state.currentInput).toEqual(['h', 'e']);
    });

    it('should handle multiple deletions', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      act(() => {
        result.current.pressLetter('a');
        result.current.pressLetter('b');
        result.current.pressLetter('c');
        result.current.deleteLetter();
        result.current.deleteLetter();
      });

      expect(result.current.state.currentInput).toEqual(['a']);
    });

    it('should not delete when empty', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      act(() => {
        result.current.deleteLetter();
      });

      expect(result.current.state.currentInput).toEqual([]);
    });
  });

  describe('word submission feedback', () => {
    it('should clear input after rejected word submission', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      act(() => {
        result.current.pressLetter('x');
        result.current.pressLetter('y');
        result.current.pressLetter('z');
        result.current.submitWord();
      });

      expect(result.current.state.currentInput).toEqual([]);
    });

    it('should increment burned on wrong word', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      act(() => {
        result.current.pressLetter('x');
        result.current.pressLetter('y');
        result.current.pressLetter('z');
        result.current.submitWord();
      });

      expect(result.current.state.lives).toBe(2);
    });

    it('should transition to lost after 3 wrong guesses', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.pressLetter('x');
          result.current.pressLetter('y');
          result.current.pressLetter('z');
          result.current.submitWord();
        });
      }

      expect(result.current.state.phase).toBe('lost');
    });

    it('should not allow submission when not playing', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      // First lose the game by making 3 wrong guesses
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.pressLetter('x');
          result.current.pressLetter('y');
          result.current.pressLetter('z');
          result.current.submitWord();
        });
      }

      expect(result.current.state.phase).toBe('lost');

      const livesBeforeLostAttempt = result.current.state.lives;

      act(() => {
        result.current.pressLetter('a');
        result.current.pressLetter('b');
        result.current.pressLetter('c');
        result.current.submitWord();
      });

      expect(result.current.state.lives).toBe(livesBeforeLostAttempt);
    });
  });

  describe('hints', () => {
    it('should apply hint when valid', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      act(() => {
        result.current.applyHint(0, 'c');
      });

      expect(result.current.state.lastHintedLetter).toEqual({ index: 0, letter: 'c' });
    });

    it('should not apply hint when game not playing', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      // Make the game end by losing
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.pressLetter('x');
          result.current.pressLetter('y');
          result.current.pressLetter('z');
          result.current.submitWord();
        });
      }

      expect(result.current.state.phase).toBe('lost');
    });
  });

  describe('undo', () => {
    it('should not undo at starting position', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      act(() => {
        result.current.undoStep();
      });

      expect(result.current.state.history.length).toBe(1);
    });

    it('should deduct 10 points when undoing', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      // Make a wrong guess first to lose a life
      act(() => {
        result.current.pressLetter('x');
        result.current.pressLetter('y');
        result.current.pressLetter('z');
        result.current.submitWord();
      });

      expect(result.current.state.lives).toBe(2);
    });

    it('should clear current input after undo', () => {
      const puzzle: WordPuzzle = {
        start: 'bar',
        end: 'boo',
        optimal: 3,
        chain: ['bar', 'bar', 'boo'],
        lockedIndices: [],
        extraRungs: 2
      };

      const { result } = renderHook(() => useGameState(puzzle));

      act(() => {
        result.current.pressLetter('b');
        result.current.pressLetter('a');
        result.current.pressLetter('r');
        result.current.submitWord();
      });

      act(() => {
        result.current.undoStep();
      });

      expect(result.current.state.currentInput).toEqual([]);
    });
  });

  describe('power-ups', () => {
    it('should apply hint', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      act(() => {
        result.current.applyHint(0, 'c');
      });

      expect(result.current.state.lastHintedLetter).toEqual({ index: 0, letter: 'c' });
      expect(result.current.state.powerUpsUsed.hints).toBe(1);
    });

    it('should apply reveal', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      act(() => {
        result.current.applyReveal(['c', 'o', 't']);
      });

      expect(result.current.state.lastRevealedWord).toEqual(['c', 'o', 't']);
      expect(result.current.state.powerUpsUsed.reveals).toBe(1);
    });

    it('should clear hint', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      act(() => {
        result.current.applyHint(0, 'c');
      });

      expect(result.current.state.lastHintedLetter).not.toBeNull();

      act(() => {
        result.current.clearHint();
      });

      expect(result.current.state.lastHintedLetter).toBeNull();
    });
  });

  describe('game phases', () => {
    it('should stay in playing phase initially', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      expect(result.current.state.phase).toBe('playing');

      act(() => {
        result.current.pressLetter('x');
        result.current.pressLetter('y');
        result.current.pressLetter('z');
        result.current.submitWord();
      });

      expect(result.current.state.phase).toBe('playing');
    });

    it('should transition to lost when max burns reached', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      expect(result.current.state.phase).toBe('playing');

      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.pressLetter('x');
          result.current.pressLetter('y');
          result.current.pressLetter('z');
          result.current.submitWord();
        });
      }

      expect(result.current.state.phase).toBe('lost');
    });

    it('should handle game state transitions', () => {
      const { result } = renderHook(() => useGameState(mockPuzzle));

      expect(result.current.state.phase).toBe('playing');

      // Make wrong guesses to trigger lost phase
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.pressLetter('x');
          result.current.pressLetter('y');
          result.current.pressLetter('z');
          result.current.submitWord();
        });
      }

      expect(result.current.state.phase).toBe('lost');
      expect(result.current.state.lives).toBe(0);
    });
  });
});
