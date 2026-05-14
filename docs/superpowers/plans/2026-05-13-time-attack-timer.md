# Time Attack Timer Hook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a drift-free, RAF-driven timer hook for Time Attack runs with pause/resume, adjustments, and expiration handling.

**Architecture:** The hook uses `performance.now()` timestamps to eliminate drift, maintains internal state via `useRef` for pause intervals and adjustments, drives updates via `requestAnimationFrame`, and naturally pauses when the tab is backgrounded (RAF stops firing). React state holds the public timer state (isRunning, isExpired, remainingMs).

**Tech Stack:** React hooks, Jest with fake timers, `performance.now()`, `requestAnimationFrame`

---

## File Structure

**Create:**
- `src/features/timeAttack/timer.ts` — Hook implementation with types and logic
- `src/features/timeAttack/__tests__/timer.test.ts` — Comprehensive Jest tests with mocked timers

---

## Task 1: Set up types and test infrastructure

**Files:**
- Create: `src/features/timeAttack/timer.ts`
- Create: `src/features/timeAttack/__tests__/timer.test.ts`

- [ ] **Step 1: Create timer.ts with type definitions**

Create `src/features/timeAttack/timer.ts`:

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerState = {
  isRunning: boolean;
  isExpired: boolean;
  remainingMs: number;
};

export type TimerControls = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  adjustTime: (deltaMs: number) => void;
  reset: (newInitialMs?: number) => void;
};

export type UseTimerOptions = {
  initialMs: number;
  onExpire?: () => void;
  autoStart?: boolean;
};

export function useTimer(options: UseTimerOptions): TimerState & TimerControls {
  // Implementation will follow
  throw new Error('Not yet implemented');
}
```

- [ ] **Step 2: Create timer.test.ts with test setup and helpers**

Create `src/features/timeAttack/__tests__/timer.test.ts`:

```typescript
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
      jest.setTimeout(() => {
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
```

- [ ] **Step 3: Commit**

```bash
git add src/features/timeAttack/timer.ts src/features/timeAttack/__tests__/timer.test.ts
git commit -m "test: add timer hook type definitions and test setup"
```

---

## Task 2: Implement initial state and start() functionality

**Files:**
- Modify: `src/features/timeAttack/timer.ts`
- Modify: `src/features/timeAttack/__tests__/timer.test.ts`

- [ ] **Step 1: Add test for start() and time decrease**

Add to `timer.test.ts` after the "initial state" describe block:

```typescript
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
        performanceNow += 1000;
        jest.advanceTimersByTime(0); // Trigger RAF
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
        performanceNow += 500;
        jest.advanceTimersByTime(0);
      });

      const secondRemaining = result.current.remainingMs;

      // Call start again
      act(() => {
        result.current.start();
      });

      // Should still be decreasing (no reset)
      act(() => {
        performanceNow += 500;
        jest.advanceTimersByTime(0);
      });

      expect(result.current.remainingMs).toBeLessThan(secondRemaining);
    });
  });
```

- [ ] **Step 2: Implement useTimer hook with initial state and start()**

Replace the `useTimer` function in `timer.ts` with:

```typescript
export function useTimer(options: UseTimerOptions): TimerState & TimerControls {
  const [state, setState] = useState<TimerState>({
    isRunning: false,
    isExpired: false,
    remainingMs: options.initialMs,
  });

  const internalState = useRef({
    initialMs: options.initialMs,
    startedAt: null as number | null,
    pausedAt: null as number | null,
    totalPausedMs: 0,
    adjustmentMs: 0,
    rafId: null as number | null,
    hasExpired: false,
  });

  const onExpireRef = useRef(options.onExpire);

  useEffect(() => {
    onExpireRef.current = options.onExpire;
  }, [options.onExpire]);

  const updateState = useCallback(() => {
    const now = performance.now();
    const internal = internalState.current;

    if (!internal.startedAt) {
      return;
    }

    let elapsed = (now - internal.startedAt) - internal.totalPausedMs;
    if (internal.pausedAt !== null) {
      elapsed -= (now - internal.pausedAt);
    }

    const remainingMs = internal.initialMs - elapsed + internal.adjustmentMs;
    const isExpired = remainingMs <= 0;

    setState({
      isRunning: !isExpired,
      isExpired,
      remainingMs: Math.max(0, remainingMs),
    });

    if (isExpired && !internal.hasExpired) {
      internal.hasExpired = true;
      onExpireRef.current?.();
    }

    if (!isExpired) {
      internal.rafId = requestAnimationFrame(updateState);
    }
  }, []);

  const start = useCallback(() => {
    if (internalState.current.startedAt !== null) {
      return; // Already started
    }
    internalState.current.startedAt = performance.now();
    setState((prev) => ({ ...prev, isRunning: true }));
    internalState.current.rafId = requestAnimationFrame(updateState);
  }, [updateState]);

  const pause = useCallback(() => {
    const internal = internalState.current;
    if (!internal.startedAt || internal.pausedAt !== null) {
      return; // Not running or already paused
    }
    internal.pausedAt = performance.now();
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const resume = useCallback(() => {
    const internal = internalState.current;
    if (!internal.startedAt || internal.pausedAt === null) {
      return; // Not started or not paused
    }
    internal.totalPausedMs += performance.now() - internal.pausedAt;
    internal.pausedAt = null;
    setState((prev) => ({ ...prev, isRunning: true }));
    internalState.current.rafId = requestAnimationFrame(updateState);
  }, [updateState]);

  const adjustTime = useCallback((deltaMs: number) => {
    internalState.current.adjustmentMs += deltaMs;
  }, []);

  const reset = useCallback((newInitialMs?: number) => {
    const internal = internalState.current;
    if (internal.rafId !== null) {
      cancelAnimationFrame(internal.rafId);
    }

    const newInitial = newInitialMs ?? options.initialMs;

    internal.initialMs = newInitial;
    internal.startedAt = null;
    internal.pausedAt = null;
    internal.totalPausedMs = 0;
    internal.adjustmentMs = 0;
    internal.rafId = null;
    internal.hasExpired = false;

    setState({
      isRunning: false,
      isExpired: false,
      remainingMs: newInitial,
    });
  }, [options.initialMs]);

  useEffect(() => {
    if (options.autoStart) {
      start();
    }

    return () => {
      if (internalState.current.rafId !== null) {
        cancelAnimationFrame(internalState.current.rafId);
      }
    };
  }, [options.autoStart, start]);

  return {
    isRunning: state.isRunning,
    isExpired: state.isExpired,
    remainingMs: state.remainingMs,
    start,
    pause,
    resume,
    adjustTime,
    reset,
  };
}
```

- [ ] **Step 3: Run the tests to verify they pass**

```bash
npm test -- src/features/timeAttack/__tests__/timer.test.ts --testNamePattern="initial state|start and running"
```

Expected output: Both test suites pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/timeAttack/timer.ts src/features/timeAttack/__tests__/timer.test.ts
git commit -m "feat: implement useTimer start() and RAF loop with drift-free timing"
```

---

## Task 3: Add tests for pause() and resume()

**Files:**
- Modify: `src/features/timeAttack/__tests__/timer.test.ts`

- [ ] **Step 1: Add pause/resume tests**

Add to `timer.test.ts` after the "start and running" describe block:

```typescript
  describe('pause and resume', () => {
    it('pause() stops time accumulation', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        performanceNow += 1000;
        jest.advanceTimersByTime(0);
      });

      const afterFirstAdvance = result.current.remainingMs;

      act(() => {
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);

      // Advance time while paused
      act(() => {
        performanceNow += 1000;
        jest.advanceTimersByTime(0);
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
        performanceNow += 1000;
        jest.advanceTimersByTime(0);
      });

      const beforePause = result.current.remainingMs;

      act(() => {
        result.current.pause();
      });

      act(() => {
        performanceNow += 2000; // This time should not count
        jest.advanceTimersByTime(0);
      });

      act(() => {
        result.current.resume();
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.remainingMs).toBe(beforePause);

      act(() => {
        performanceNow += 500;
        jest.advanceTimersByTime(0);
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
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test -- src/features/timeAttack/__tests__/timer.test.ts --testNamePattern="pause and resume"
```

Expected output: All pause/resume tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/timeAttack/__tests__/timer.test.ts
git commit -m "test: add pause/resume behavior tests"
```

---

## Task 4: Add tests for adjustTime()

**Files:**
- Modify: `src/features/timeAttack/__tests__/timer.test.ts`

- [ ] **Step 1: Add adjustTime tests**

Add to `timer.test.ts` after the "pause and resume" describe block:

```typescript
  describe('adjustTime', () => {
    it('adjustTime(+5000) increases remainingMs by 5000', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 10000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        performanceNow += 2000;
        jest.advanceTimersByTime(0);
      });

      const beforeAdjust = result.current.remainingMs;

      act(() => {
        result.current.adjustTime(5000);
      });

      // Need to advance RAF to see the update
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.remainingMs).toBeCloseTo(beforeAdjust + 5000, 0);
    });

    it('adjustTime(-5000) decreases remainingMs by 5000', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 10000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        performanceNow += 1000;
        jest.advanceTimersByTime(0);
      });

      const beforeAdjust = result.current.remainingMs;

      act(() => {
        result.current.adjustTime(-5000);
      });

      // Need to advance RAF to see the update
      act(() => {
        jest.advanceTimersByTime(0);
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
        performanceNow += 3000;
        jest.advanceTimersByTime(0);
      });

      expect(onExpire).not.toHaveBeenCalled();

      act(() => {
        result.current.adjustTime(-3000); // Drives it negative
      });

      act(() => {
        jest.advanceTimersByTime(0); // Next RAF tick
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
        performanceNow += 4000;
        jest.advanceTimersByTime(0);
      });

      act(() => {
        result.current.adjustTime(-5000); // Drives negative
      });

      // Should not have fired yet
      expect(onExpire).not.toHaveBeenCalled();
    });
  });
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test -- src/features/timeAttack/__tests__/timer.test.ts --testNamePattern="adjustTime"
```

Expected output: All adjustTime tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/timeAttack/__tests__/timer.test.ts
git commit -m "test: add adjustTime behavior tests"
```

---

## Task 5: Add tests for reset()

**Files:**
- Modify: `src/features/timeAttack/__tests__/timer.test.ts`

- [ ] **Step 1: Add reset tests**

Add to `timer.test.ts` after the "adjustTime" describe block:

```typescript
  describe('reset', () => {
    it('reset() returns timer to initial state with original initialMs', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        performanceNow += 2000;
        jest.advanceTimersByTime(0);
      });

      expect(result.current.remainingMs).toBeLessThan(5000);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isExpired).toBe(false);
      expect(result.current.remainingMs).toBe(5000);
    });

    it('reset(newInitialMs) uses the new initial value', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        performanceNow += 2000;
        jest.advanceTimersByTime(0);
      });

      act(() => {
        result.current.reset(10000);
      });

      expect(result.current.remainingMs).toBe(10000);
    });

    it('reset() clears pause state', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.pause();
      });

      act(() => {
        result.current.reset();
      });

      act(() => {
        result.current.start();
      });

      // Timer should run normally
      expect(result.current.isRunning).toBe(true);

      act(() => {
        performanceNow += 1000;
        jest.advanceTimersByTime(0);
      });

      expect(result.current.remainingMs).toBeLessThan(5000);
    });

    it('reset() clears adjustments', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 5000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.adjustTime(3000);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.remainingMs).toBe(5000);
    });
  });
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test -- src/features/timeAttack/__tests__/timer.test.ts --testNamePattern="reset"
```

Expected output: All reset tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/timeAttack/__tests__/timer.test.ts
git commit -m "test: add reset behavior tests"
```

---

## Task 6: Add tests for expiration and autoStart

**Files:**
- Modify: `src/features/timeAttack/__tests__/timer.test.ts`

- [ ] **Step 1: Add expiration and autoStart tests**

Add to `timer.test.ts` after the "reset" describe block:

```typescript
  describe('expiration', () => {
    it('fires onExpire exactly once when timer reaches zero', () => {
      const onExpire = jest.fn();
      const { result } = renderHook(() =>
        useTimer({ initialMs: 2000, onExpire })
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        performanceNow += 2100;
        jest.advanceTimersByTime(0);
      });

      expect(result.current.isExpired).toBe(true);
      expect(onExpire).toHaveBeenCalledTimes(1);

      // Advance more time
      act(() => {
        performanceNow += 1000;
        jest.advanceTimersByTime(0);
      });

      // Should still only have fired once
      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('sets remainingMs to 0 or lower when expired', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 2000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        performanceNow += 3000;
        jest.advanceTimersByTime(0);
      });

      expect(result.current.remainingMs).toBe(0);
    });

    it('sets isRunning to false when expired', () => {
      const { result } = renderHook(() => useTimer({ initialMs: 2000 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        performanceNow += 2100;
        jest.advanceTimersByTime(0);
      });

      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('autoStart', () => {
    it('starts timer automatically when autoStart is true', () => {
      const { result } = renderHook(() =>
        useTimer({ initialMs: 5000, autoStart: true })
      );

      // May not be running immediately due to RAF scheduling
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.isRunning).toBe(true);
    });

    it('does not start when autoStart is false', () => {
      const { result } = renderHook(() =>
        useTimer({ initialMs: 5000, autoStart: false })
      );

      expect(result.current.isRunning).toBe(false);
    });

    it('respects autoStart on mount', () => {
      const onExpire = jest.fn();
      const { result } = renderHook(() =>
        useTimer({ initialMs: 1000, autoStart: true, onExpire })
      );

      act(() => {
        performanceNow += 1100;
        jest.advanceTimersByTime(0);
      });

      expect(result.current.isExpired).toBe(true);
      expect(onExpire).toHaveBeenCalled();
    });
  });
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test -- src/features/timeAttack/__tests__/timer.test.ts --testNamePattern="expiration|autoStart"
```

Expected output: All expiration and autoStart tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/timeAttack/__tests__/timer.test.ts
git commit -m "test: add expiration and autoStart tests"
```

---

## Task 7: Verify all tests pass and run full test suite

**Files:**
- None (verification only)

- [ ] **Step 1: Run all timer tests**

```bash
npm test -- src/features/timeAttack/__tests__/timer.test.ts
```

Expected output: All tests pass (expected: 20+ passing tests)

- [ ] **Step 2: Run all Time Attack tests to verify no regressions**

```bash
npm test -- --testPathPattern="src/features/timeAttack"
```

Expected output: All Time Attack test suites pass (difficulty, stats, timer, useTimeAttack, SetupScreen, Clock, PlayScreen, etc.)

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected output: All tests pass across the entire project (no regressions in classic game or other modules)

- [ ] **Step 4: Verify TypeScript strict mode**

```bash
npm run build
```

Expected output: Build succeeds with no TypeScript errors

- [ ] **Step 5: Final commit**

```bash
git log --oneline -5
```

Verify that the last commits include timer implementation commits. The implementation is complete.

---

## Self-Review

**Spec coverage:**
- ✅ Types defined (TimerState, TimerControls, UseTimerOptions)
- ✅ Drift-free timing via `performance.now()` timestamps
- ✅ Smooth RAF-driven updates
- ✅ Pause/resume with pause duration tracking
- ✅ Time adjustments (positive and negative)
- ✅ Expiration with single `onExpire` callback
- ✅ Reset with optional new initial value
- ✅ autoStart option
- ✅ RAF cleanup on unmount
- ✅ Jest tests with fake timers and mocked performance.now
- ✅ Tests cover all behaviors and edge cases

**Placeholder check:** None found. All code is complete.

**Type consistency:** All function signatures, property names, and return types are consistent throughout.

**No regressions:** Tests verify all prior Time Attack tests still pass.
