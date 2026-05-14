# Time Attack Timer Hook Design

**Date:** 2026-05-13  
**Component:** `src/features/timeAttack/timer.ts`  
**Status:** Approved

## Overview

The Time Attack timer is a drift-free, framerate-agnostic hook that powers the countdown for both Sprint (fixed time) and Survival (time accumulation) modes. It naturally pauses when the browser tab is backgrounded and supports live time adjustments (skip penalties, survival rewards) without resetting session state.

## Requirements

- **Drift-free timing:** Use `performance.now()` timestamps, never a decrementing counter
- **Smooth updates:** Drive via `requestAnimationFrame` for per-frame state updates
- **Pausable & resumable:** Accurately exclude pause intervals from elapsed time
- **Adjustable:** Apply skip penalties and survival rewards without losing progress
- **Tab-aware:** Naturally pause when the tab is backgrounded (RAF stops firing)
- **Single expiration:** Fire `onExpire` callback exactly once at expiration

## Types

```typescript
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
```

## Internal State

The hook maintains:

| Field | Type | Purpose |
|-------|------|---------|
| `initialMs` | number | Starting budget in milliseconds |
| `startedAt` | number \| null | `performance.now()` when timer started |
| `pausedAt` | number \| null | `performance.now()` when paused (null if running) |
| `totalPausedMs` | number | Cumulative milliseconds spent paused |
| `adjustmentMs` | number | Cumulative time added/subtracted via adjustments |

## Computation

**Elapsed time:**
```
if not running: 0
else: (now - startedAt) - totalPausedMs - (pausedAt ? now - pausedAt : 0)
```

**Remaining time:**
```
remainingMs = initialMs - elapsed + adjustmentMs

If remainingMs <= 0:
  - Set isExpired: true
  - Cancel RAF
  - Fire onExpire() exactly once
```

## Control Flow

### `start()`
- Set `startedAt = performance.now()`
- Set `isRunning = true`
- Start RAF loop

**No-op if already running.**

### `pause()`
- Set `pausedAt = performance.now()`

**No-op if not running.**

### `resume()`
- Add `(now - pausedAt)` to `totalPausedMs`
- Clear `pausedAt`

**No-op if not paused.**

### `adjustTime(deltaMs)`
- Add `deltaMs` to `adjustmentMs`
- Do NOT fire `onExpire` synchronously; let the next RAF tick detect expiration

This ensures adjustments are applied consistently without breaking the RAF-driven update cycle.

### `reset(newInitialMs?)`
- Cancel RAF loop
- Reset all internal state to initial values
- If `newInitialMs` provided, use it; otherwise restore original `initialMs`
- Set `isRunning = false`, `isExpired = false`

## RAF Loop

While `isRunning`:
1. Compute current `remainingMs`
2. Update React state
3. Check if `remainingMs <= 0`:
   - If yes and not yet expired: set `isExpired = true`, fire `onExpire()` once, cancel RAF
   - If yes and already expired: cancel RAF

**Cleanup on unmount:** useEffect cleanup must cancel the RAF ID.

## Tab Backgrounding

When the browser tab is backgrounded, RAF stops firing automatically. This naturally pauses the timer without explicit code. When the tab returns to focus, RAF resumes, and elapsed time during the backgrounded period is accurately subtracted via `totalPausedMs` logic (the user's pause gesture was implicit, not explicit).

For explicit pause/resume, the timer tracks `pausedAt` explicitly to avoid adding RAF-gap time to the budget.

## Testing Strategy

### Setup
- Use `jest.useFakeTimers()`
- Mock `performance.now()` to return controlled timestamps
- Mock `requestAnimationFrame()` to fire when `jest.advanceTimersByTime()` is called

### Test Cases
1. **Initial state:** `isRunning: false`, `isExpired: false`, `remainingMs: initialMs`
2. **After start():** `isRunning: true`, time decreases as `performance.now()` advances
3. **Adjustments:**
   - `adjustTime(+5000)` increases `remainingMs` by 5000
   - `adjustTime(-5000)` decreases `remainingMs` by 5000
   - Negative remaining triggers expiration on next RAF tick
4. **Pause/resume:** Paused duration is excluded; no time lost
5. **Reset:** Returns to initial state with all counters reset
6. **Expiration:** `onExpire()` fires exactly once, not on every subsequent RAF tick

## Acceptance Criteria

- ✅ All timer tests pass
- ✅ All prior Time Attack tests still pass (no regressions)
- ✅ Strict TypeScript compilation
- ✅ No modifications outside `src/features/timeAttack/`
- ✅ RAF loop is properly cleaned up on unmount
