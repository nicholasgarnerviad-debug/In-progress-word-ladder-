import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../timer';

describe('useTimer hook', () => {
  let currentTime = 0;

  beforeEach(() => {
    jest.useFakeTimers();
    currentTime = 0;

    // Mock performance.now to return fake timer value
    jest.spyOn(performance, 'now').mockImplementation(() => currentTime);

    // Mock RAF (no-op for simplified tests)
    jest.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => {
      return 1 as unknown as number;
    });

    jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('initial state', () => {
    it('starts in non-running, non-expired state when autoStart is false', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 10000 }));

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isExpired).toBe(false);
      expect(result.current.remainingMs).toBe(10000);
    });

    it('starts in running state when autoStart is true', () => {
      const { result } = renderHook(() =>
        useTimer({ initialMs: 10000, autoStart: true })
      );

      expect(result.current.isRunning).toBe(true);
      expect(result.current.isExpired).toBe(false);
      expect(result.current.remainingMs).toBe(10000);
    });
  });

  describe('start', () => {
    it('marks timer as running after start', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.isExpired).toBe(false);
    });

    it('is a no-op if start is called twice', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 10000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.start(); // second call should not do anything
      });

      expect(result.current.isRunning).toBe(true); // still running
    });
  });

  describe('adjustTime', () => {
    it('increases remainingMs with positive delta', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 10000 }));

      act(() => {
        result.current.adjustTime(5000);
      });

      expect(result.current.remainingMs).toBe(15000);
    });

    it('decreases remainingMs with negative delta', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 10000 }));

      act(() => {
        result.current.adjustTime(-3000);
      });

      expect(result.current.remainingMs).toBe(7000);
    });

    it('clamps remainingMs to >= 0', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.adjustTime(-10000);
      });

      expect(result.current.remainingMs).toBe(0);
    });

    it('works while not running', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 8000 }));

      expect(result.current.remainingMs).toBe(8000);

      act(() => {
        result.current.adjustTime(2000);
      });

      expect(result.current.remainingMs).toBe(10000);
    });

    it('works while running', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 8000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.adjustTime(3000);
      });

      expect(result.current.remainingMs).toBeCloseTo(11000, 0);
    });
  });

  describe('pause and resume', () => {
    it('pause marks timer as not running', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 10000 }));

      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(true);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);
    });

    it('pause is a no-op if not running', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      expect(result.current.isRunning).toBe(false);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.remainingMs).toBe(5000);
    });

    it('resume marks timer as running', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 10000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);

      act(() => {
        result.current.resume();
      });

      expect(result.current.isRunning).toBe(true);
    });

    it('resume is a no-op if not paused', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.resume(); // not paused, should be no-op
      });

      expect(result.current.isRunning).toBe(true);
    });
  });

  describe('reset', () => {
    it('resets to initial state', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.adjustTime(1000);
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.remainingMs).toBe(6000);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isExpired).toBe(false);
      expect(result.current.remainingMs).toBe(5000);
    });

    it('accepts new initialMs', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.reset(10000);
      });

      expect(result.current.remainingMs).toBe(10000);
      expect(result.current.isRunning).toBe(false);
    });

    it('clears adjustments', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.adjustTime(3000);
      });

      expect(result.current.remainingMs).toBe(8000);

      act(() => {
        result.current.reset();
      });

      expect(result.current.remainingMs).toBe(5000);
    });

    it('clears running state', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('exports and type safety', () => {
    it('returns TimerState with correct types', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      expect(typeof result.current.isRunning).toBe('boolean');
      expect(typeof result.current.isExpired).toBe('boolean');
      expect(typeof result.current.remainingMs).toBe('number');
    });

    it('returns TimerControls with all methods', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      expect(typeof result.current.start).toBe('function');
      expect(typeof result.current.pause).toBe('function');
      expect(typeof result.current.resume).toBe('function');
      expect(typeof result.current.adjustTime).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });
});
