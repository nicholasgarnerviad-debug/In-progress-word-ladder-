import { useState, useEffect, useRef, useCallback } from 'react';

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
  const { initialMs, onExpire, autoStart = false } = options;

  // Internal state — never directly set in setState
  const internalState = useRef({
    initialMs,
    startedAt: null as number | null,
    pausedAt: null as number | null,
    totalPausedMs: 0,
    adjustmentMs: 0,
    hasExpired: false,
  });

  // React state — for triggering renders
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isExpired: false,
    remainingMs: initialMs,
  });

  const rafRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep onExpire ref up to date
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Compute remaining time based on internal state
  const computeRemaining = useCallback((): number => {
    const state = internalState.current;
    if (state.startedAt === null) {
      return state.initialMs + state.adjustmentMs;
    }

    const now = performance.now();
    const totalPausedMs =
      state.totalPausedMs + (state.pausedAt !== null ? now - state.pausedAt : 0);
    const elapsed = now - state.startedAt - totalPausedMs;

    return state.initialMs - elapsed + state.adjustmentMs;
  }, []);

  // RAF loop
  const tick = useCallback(() => {
    const remaining = computeRemaining();
    const isExpired = remaining <= 0;

    setTimerState({
      isRunning: !isExpired,
      isExpired,
      remainingMs: Math.max(0, remaining),
    });

    if (isExpired && !internalState.current.hasExpired) {
      internalState.current.hasExpired = true;
      onExpireRef.current?.();
    } else if (!isExpired) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [computeRemaining]);

  // start: mark as running
  const start = useCallback(() => {
    if (internalState.current.startedAt !== null) {
      return; // already started
    }
    internalState.current.startedAt = performance.now();
    internalState.current.pausedAt = null;
    internalState.current.totalPausedMs = 0;
    internalState.current.hasExpired = false;

    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      isExpired: false,
    }));

    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // pause: record paused time
  const pause = useCallback(() => {
    if (internalState.current.startedAt === null || internalState.current.pausedAt !== null) {
      return; // not running or already paused
    }
    internalState.current.pausedAt = performance.now();
    setTimerState((prev) => ({ ...prev, isRunning: false }));

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // resume: add paused duration to total, clear pausedAt
  const resume = useCallback(() => {
    if (internalState.current.startedAt === null || internalState.current.pausedAt === null) {
      return; // not paused
    }
    const now = performance.now();
    internalState.current.totalPausedMs +=
      now - internalState.current.pausedAt;
    internalState.current.pausedAt = null;

    setTimerState((prev) => ({ ...prev, isRunning: true }));
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // adjustTime: add/subtract from the budget
  const adjustTime = useCallback(
    (deltaMs: number) => {
      internalState.current.adjustmentMs += deltaMs;
      // Recompute and update state, but don't fire onExpire synchronously
      const remaining = computeRemaining();
      setTimerState((prev) => ({
        ...prev,
        remainingMs: Math.max(0, remaining),
      }));
    },
    [computeRemaining]
  );

  // reset: cancel RAF, clear all state
  const reset = useCallback((newInitialMs?: number) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const nextInitialMs = newInitialMs ?? internalState.current.initialMs;
    internalState.current = {
      initialMs: nextInitialMs,
      startedAt: null,
      pausedAt: null,
      totalPausedMs: 0,
      adjustmentMs: 0,
      hasExpired: false,
    };

    setTimerState({
      isRunning: false,
      isExpired: false,
      remainingMs: nextInitialMs,
    });
  }, []);

  // Auto-start if option is true
  useEffect(() => {
    if (autoStart) {
      start();
    }
  }, [autoStart, start]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    ...timerState,
    start,
    pause,
    resume,
    adjustTime,
    reset,
  };
}
