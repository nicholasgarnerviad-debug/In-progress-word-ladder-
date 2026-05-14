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
      try {
        onExpireRef.current?.();
      } catch (error) {
        console.error('Timer onExpire callback error:', error);
      }
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
