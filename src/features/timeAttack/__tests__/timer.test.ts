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
});
