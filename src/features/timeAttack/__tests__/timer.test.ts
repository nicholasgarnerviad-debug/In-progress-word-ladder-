import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../timer';

describe('useTimer', () => {
  let performanceNow = 1000;
  let rafCallbacks: Map<number, FrameRequestCallback>;
  let rafId = 0;

  beforeEach(() => {
    performanceNow = 1000;
    rafId = 0;
    rafCallbacks = new Map();

    jest.useFakeTimers();

    // Mock performance.now()
    jest.spyOn(performance, 'now').mockImplementation(() => performanceNow);

    // Mock requestAnimationFrame to store callbacks for manual triggering
    jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
      const id = ++rafId;
      rafCallbacks.set(id, callback);
      return id;
    });

    jest.spyOn(global, 'cancelAnimationFrame').mockImplementation((id) => {
      rafCallbacks.delete(id);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // Helper to manually trigger all pending RAF callbacks with current performanceNow
  const triggerRAF = () => {
    const callbacks = Array.from(rafCallbacks.values());
    callbacks.forEach(cb => cb(performanceNow));
  };

  // Helper to advance time and trigger RAF callbacks
  const advanceTimeAndRAF = (ms: number) => {
    performanceNow += ms;
    triggerRAF();
  };

  describe('initial state', () => {
    it('starts in non-running state when autoStart is false or undefined', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isExpired).toBe(false);
      expect(result.current.remainingMs).toBe(5000);
    });
  });

  describe('start and running', () => {
    it('calls start() sets isRunning to true', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(true);
    });

    it('decreases remainingMs as performance.now() advances', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.start();
      });

      const initialRemaining = result.current.remainingMs;

      // Simulate 1000ms passing
      act(() => {
        advanceTimeAndRAF(1000);
      });

      expect(result.current.remainingMs).toBeLessThan(initialRemaining);
      expect(result.current.remainingMs).toBeCloseTo(4000, 0);
    });

    it('is a no-op if start() called when already running', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.start();
      });

      const firstRemaining = result.current.remainingMs;

      // Advance time
      act(() => {
        advanceTimeAndRAF(500);
      });

      const secondRemaining = result.current.remainingMs;

      // Call start again
      act(() => {
        result.current.start();
      });

      // Should still be decreasing (no reset)
      act(() => {
        advanceTimeAndRAF(500);
      });

      expect(result.current.remainingMs).toBeLessThan(secondRemaining);
    });
  });

  describe('pause and resume', () => {
    it('pause() stops time accumulation', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        advanceTimeAndRAF(1000);
      });

      const afterFirstAdvance = result.current.remainingMs;

      act(() => {
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);

      // Advance time while paused
      act(() => {
        advanceTimeAndRAF(1000);
      });

      // Should not have advanced further
      expect(result.current.remainingMs).toBe(afterFirstAdvance);
    });

    it('resume() continues from pause point without losing time', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        advanceTimeAndRAF(1000);
      });

      const beforePause = result.current.remainingMs;

      act(() => {
        result.current.pause();
      });

      act(() => {
        advanceTimeAndRAF(2000); // This time should not count
      });

      act(() => {
        result.current.resume();
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.remainingMs).toBe(beforePause);

      act(() => {
        advanceTimeAndRAF(500);
      });

      expect(result.current.remainingMs).toBeCloseTo(beforePause - 500, 0);
    });

    it('pause() is a no-op if not running', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);
    });

    it('resume() is a no-op if not paused', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.resume();
      });

      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('adjustTime', () => {
    it('adjustTime(+5000) increases remainingMs by 5000', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 10000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        advanceTimeAndRAF(2000);
      });

      const beforeAdjust = result.current.remainingMs;

      act(() => {
        result.current.adjustTime(5000);
      });

      // Need to advance RAF to see the update
      act(() => {
        advanceTimeAndRAF(0);
      });

      expect(result.current.remainingMs).toBeCloseTo(beforeAdjust + 5000, 0);
    });

    it('adjustTime(-5000) decreases remainingMs by 5000', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 10000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        advanceTimeAndRAF(1000);
      });

      const beforeAdjust = result.current.remainingMs;

      act(() => {
        result.current.adjustTime(-5000);
      });

      // Need to advance RAF to see the update
      act(() => {
        advanceTimeAndRAF(0);
      });

      expect(result.current.remainingMs).toBeCloseTo(beforeAdjust - 5000, 0);
    });

    it('adjustTime driving remainingMs below zero triggers expiration on next RAF tick', () => {
      const onExpire = jest.fn();
      const { result } = renderHook(() =>
        useTimer({ initialMs: 5000, onExpire })
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        advanceTimeAndRAF(3000);
      });

      expect(onExpire).not.toHaveBeenCalled();

      act(() => {
        result.current.adjustTime(-3000); // Drives it negative
      });

      act(() => {
        advanceTimeAndRAF(0); // Next RAF tick
      });

      expect(result.current.isExpired).toBe(true);
      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('adjustTime does not fire onExpire synchronously', () => {
      const onExpire = jest.fn();
      const { result } = renderHook(() =>
        useTimer({ initialMs: 5000, onExpire })
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        advanceTimeAndRAF(4000);
      });

      act(() => {
        result.current.adjustTime(-5000); // Drives negative
      });

      // Should not have fired yet
      expect(onExpire).not.toHaveBeenCalled();
    });
  });
});
