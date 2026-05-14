import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../timer';

describe('useTimer', () => {
  let performanceNow: number;

  beforeEach(() => {
    performanceNow = 1000;
    jest.useFakeTimers();

    // Mock performance.now()
    jest.spyOn(performance, 'now').mockImplementation(() => performanceNow);

    // Mock requestAnimationFrame to fire when timers advance
    let rafId = 0;
    const rafCallbacks = new Map<number, FrameRequestCallback>();

    jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
      const id = ++rafId;
      rafCallbacks.set(id, callback);
      // Schedule the callback to fire after current synchronous code
      setTimeout(() => {
        if (rafCallbacks.has(id)) {
          callback(performanceNow);
        }
      }, 0);
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

  describe('initial state', () => {
    it('starts in non-running state when autoStart is false or undefined', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isExpired).toBe(false);
      expect(result.current.remainingMs).toBe(5000);
    });
  });
});
