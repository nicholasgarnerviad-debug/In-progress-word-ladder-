import { renderHook, act } from '@testing-library/react';
import { useBlitzTimer } from '../useBlitzTimer';

describe('useBlitzTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers('modern');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('startTimestamp null', () => {
    it('returns full duration, not running', () => {
      const { result } = renderHook(() =>
        useBlitzTimer({ startTimestamp: null, durationSeconds: 60 })
      );

      expect(result.current.remainingMs).toBe(60000);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isExpired).toBe(false);
    });
  });

  describe('startTimestamp in future', () => {
    it('returns full duration, not running', () => {
      const futureTime = Date.now() + 10000;

      const { result } = renderHook(() =>
        useBlitzTimer({ startTimestamp: futureTime, durationSeconds: 60 })
      );

      expect(result.current.remainingMs).toBe(60000);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isExpired).toBe(false);
    });
  });

  describe('startTimestamp in past', () => {
    it('returns reduced remaining time and is running', () => {
      const now = Date.now();
      const startTime = now - 10000; // Started 10 seconds ago

      jest.setSystemTime(now);

      const { result } = renderHook(() =>
        useBlitzTimer({ startTimestamp: startTime, durationSeconds: 60 })
      );

      // 60 seconds total - 10 seconds elapsed = 50 seconds = 50000ms
      expect(result.current.remainingMs).toBe(50000);
      expect(result.current.isRunning).toBe(true);
      expect(result.current.isExpired).toBe(false);
    });
  });

  describe('remainingMs decreases as time advances', () => {
    it('updates remainingMs on subsequent RAF frames', () => {
      const now = Date.now();
      const startTime = now - 5000; // Started 5 seconds ago

      jest.setSystemTime(now);

      const { result } = renderHook(() =>
        useBlitzTimer({ startTimestamp: startTime, durationSeconds: 60 })
      );

      expect(result.current.remainingMs).toBe(55000);

      // Advance time by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Allow small timing variance from RAF frame scheduling
      expect(result.current.remainingMs).toBeLessThanOrEqual(50050);
      expect(result.current.remainingMs).toBeGreaterThanOrEqual(49950);

      // Advance time by another 10 seconds
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.remainingMs).toBeLessThanOrEqual(40050);
      expect(result.current.remainingMs).toBeGreaterThanOrEqual(39950);
    });
  });

  describe('onExpire callback', () => {
    it('fires exactly once when timer reaches zero', () => {
      const now = Date.now();
      const startTime = now - 55000; // 55 seconds elapsed out of 60
      const onExpire = jest.fn();

      jest.setSystemTime(now);

      const { result } = renderHook(() =>
        useBlitzTimer({ startTimestamp: startTime, durationSeconds: 60, onExpire })
      );

      expect(result.current.remainingMs).toBe(5000);
      expect(result.current.isRunning).toBe(true);

      // Advance time to expiry
      act(() => {
        jest.advanceTimersByTime(5100);
      });

      expect(result.current.remainingMs).toBe(0);
      expect(result.current.isExpired).toBe(true);
      expect(result.current.isRunning).toBe(false);
      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('does not fire onExpire again on subsequent updates', () => {
      const now = Date.now();
      const startTime = now - 55000;
      const onExpire = jest.fn();

      jest.setSystemTime(now);

      const { result } = renderHook(() =>
        useBlitzTimer({ startTimestamp: startTime, durationSeconds: 60, onExpire })
      );

      // Advance to expiry
      act(() => {
        jest.advanceTimersByTime(5100);
      });

      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(result.current.isExpired).toBe(true);

      // Advance time further
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // onExpire should still have been called only once
      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(result.current.remainingMs).toBe(0);
      expect(result.current.isExpired).toBe(true);
    });
  });

  describe('startTimestamp changes', () => {
    it('resets expired state and restarts timer', () => {
      const now = Date.now();
      const startTime1 = now - 55000;
      const onExpire = jest.fn();

      jest.setSystemTime(now);

      const { result, rerender } = renderHook(
        ({ startTimestamp, durationSeconds }) =>
          useBlitzTimer({ startTimestamp, durationSeconds, onExpire }),
        {
          initialProps: { startTimestamp: startTime1, durationSeconds: 60 },
        }
      );

      // Advance to expiry
      act(() => {
        jest.advanceTimersByTime(5100);
      });

      expect(result.current.isExpired).toBe(true);
      expect(onExpire).toHaveBeenCalledTimes(1);

      // Change startTimestamp to a new timer (in the future relative to current time)
      const currentTime = Date.now();
      const startTime2 = currentTime + 1000; // New timer hasn't started yet
      act(() => {
        rerender({ startTimestamp: startTime2, durationSeconds: 60 });
      });

      // Should reset to full duration and not running
      expect(result.current.remainingMs).toBe(60000);
      expect(result.current.isExpired).toBe(false);
      expect(result.current.isRunning).toBe(false);

      // onExpire should not have been called again
      expect(onExpire).toHaveBeenCalledTimes(1);
    });
  });

  describe('durationSeconds changes', () => {
    it('resets timer state', () => {
      const now = Date.now();
      const startTime = now - 10000;

      jest.setSystemTime(now);

      const { result, rerender } = renderHook(
        ({ durationSeconds }) =>
          useBlitzTimer({ startTimestamp: startTime, durationSeconds }),
        {
          initialProps: { durationSeconds: 60 },
        }
      );

      expect(result.current.remainingMs).toBe(50000);

      // Change duration
      act(() => {
        rerender({ durationSeconds: 30 });
      });

      // Should recompute: 30 seconds - 10 seconds elapsed = 20 seconds
      expect(result.current.remainingMs).toBe(20000);
    });
  });

  describe('cleanup', () => {
    it('cancels RAF on unmount', () => {
      const now = Date.now();
      const startTime = now - 5000;

      jest.setSystemTime(now);

      const { unmount } = renderHook(() =>
        useBlitzTimer({ startTimestamp: startTime, durationSeconds: 60 })
      );

      const rafSpy = jest.spyOn(global, 'cancelAnimationFrame');

      unmount();

      expect(rafSpy).toHaveBeenCalled();
      rafSpy.mockRestore();
    });

    it('cancels RAF when startTimestamp changes', () => {
      const now = Date.now();
      const startTime1 = now - 5000;

      jest.setSystemTime(now);

      type TimerProps = { startTimestamp: number | null };

      const { rerender } = renderHook(
        ({ startTimestamp }: TimerProps) =>
          useBlitzTimer({ startTimestamp, durationSeconds: 60 }),
        {
          initialProps: { startTimestamp: startTime1 } as TimerProps,
        }
      );

      const rafSpy = jest.spyOn(global, 'cancelAnimationFrame');

      // Change to null (stops timer)
      act(() => {
        rerender({ startTimestamp: null } as TimerProps);
      });

      expect(rafSpy).toHaveBeenCalled();
      rafSpy.mockRestore();
    });
  });

  describe('tab backgrounding simulation', () => {
    it('catches up on next visible frame when backgrounded', () => {
      const now = Date.now();
      const startTime = now - 10000; // 10 seconds elapsed out of 60

      jest.setSystemTime(now);

      const { result } = renderHook(() =>
        useBlitzTimer({ startTimestamp: startTime, durationSeconds: 60 })
      );

      expect(result.current.remainingMs).toBe(50000);

      // Simulate backgrounding: advance time significantly without RAF frames
      // (In real browser, RAF won't fire while tab is hidden, but system time still advances)
      act(() => {
        jest.advanceTimersByTime(20000);
      });

      // On next RAF frame (next visible), should derive correct time from timestamps
      expect(result.current.remainingMs).toBe(30000);
    });
  });

  describe('edge cases', () => {
    it('handles startTimestamp at exactly the current time', () => {
      const now = Date.now();

      jest.setSystemTime(now);

      const { result } = renderHook(() =>
        useBlitzTimer({ startTimestamp: now, durationSeconds: 60 })
      );

      expect(result.current.remainingMs).toBe(60000);
      expect(result.current.isRunning).toBe(true);
    });

    it('clamps remainingMs to 0 (never negative)', () => {
      const now = Date.now();
      const startTime = now - 65000; // 65 seconds elapsed out of 60 (should be expired)

      jest.setSystemTime(now);

      const { result } = renderHook(() =>
        useBlitzTimer({ startTimestamp: startTime, durationSeconds: 60 })
      );

      expect(result.current.remainingMs).toBe(0);
      expect(result.current.isExpired).toBe(true);
    });

    it('handles very small durations', () => {
      const now = Date.now();
      const startTime = now - 500; // 500ms elapsed

      jest.setSystemTime(now);

      const { result } = renderHook(() =>
        useBlitzTimer({ startTimestamp: startTime, durationSeconds: 1 })
      );

      expect(result.current.remainingMs).toBe(500);
      expect(result.current.isRunning).toBe(true);
    });

    it('handles zero onExpire callback (undefined)', () => {
      const now = Date.now();
      const startTime = now - 55000;

      jest.setSystemTime(now);

      const { result } = renderHook(() =>
        useBlitzTimer({ startTimestamp: startTime, durationSeconds: 60 })
      );

      // Should not throw when advancing to expiry without onExpire defined
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(5100);
        });
      }).not.toThrow();

      expect(result.current.isExpired).toBe(true);
    });
  });
});
