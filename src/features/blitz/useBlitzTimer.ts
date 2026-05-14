import { useEffect, useRef, useState } from 'react';

export type UseBlitzTimerOptions = {
  startTimestamp: number | null;
  durationSeconds: number;
  onExpire?: () => void;
};

export type UseBlitzTimerResult = {
  remainingMs: number;
  isExpired: boolean;
  isRunning: boolean;
};

/**
 * Drift-free timer hook anchored to timestamps.
 *
 * The remaining time is always derived from (startTimestamp + durationSeconds * 1000) - Date.now(),
 * never from a local counter. This ensures:
 * - No drift accumulation across RAF frames
 * - Tab backgrounding is handled automatically: RAF won't fire while tab is hidden,
 *   but timestamps catch up instantly when the tab becomes visible again
 * - Cross-client sync via Firebase will be trivial (just share timestamps)
 *
 * State machine:
 * - startTimestamp null: no timer active, return full duration, isRunning false
 * - startTimestamp in future: countdown phase (hasn't started), return full duration, isRunning false
 * - startTimestamp in past and time remaining: timer running, derive remainingMs, isRunning true
 * - remainingMs === 0: timer expired, isExpired true, stop RAF, fire onExpire once
 *
 * onExpire callback fires exactly once via useRef guard, even if component re-renders or
 * options change while expired.
 */
export function useBlitzTimer(options: UseBlitzTimerOptions): UseBlitzTimerResult {
  const { startTimestamp, durationSeconds, onExpire } = options;

  const [remainingMs, setRemainingMs] = useState<number>(() => {
    if (startTimestamp === null) return durationSeconds * 1000;
    if (startTimestamp > Date.now()) return durationSeconds * 1000;
    const remaining = Math.max(0, (startTimestamp + durationSeconds * 1000) - Date.now());
    return remaining;
  });

  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Guard to ensure onExpire fires exactly once
  const hasExpiredRef = useRef<boolean>(false);

  // Track current RAF request ID for cleanup
  const rafIdRef = useRef<number | null>(null);

  // Update state based on current timer state
  const updateTimer = () => {
    if (startTimestamp === null) {
      setRemainingMs(durationSeconds * 1000);
      return false; // Stop RAF
    }

    const now = Date.now();

    // If startTimestamp is in the future, timer hasn't started yet
    if (startTimestamp > now) {
      setRemainingMs(durationSeconds * 1000);
      return false; // Stop RAF
    }

    // Timer is running, derive remainingMs from timestamps
    const newRemaining = Math.max(0, (startTimestamp + durationSeconds * 1000) - now);

    setRemainingMs(newRemaining);

    if (newRemaining === 0) {
      // Timer has expired
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        setIsExpired(true);
        onExpire?.();
      }
      return false; // Stop RAF
    }

    // Timer is still running, continue RAF
    return true;
  };

  // RAF loop for smooth updates
  const scheduleNextFrame = () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Determine if we should schedule RAF
    if (startTimestamp === null || startTimestamp > Date.now()) {
      // Timer not active
      return;
    }

    const now = Date.now();
    const endTime = startTimestamp + durationSeconds * 1000;

    if (now >= endTime) {
      // Already expired, just update state and don't schedule
      updateTimer();
      return;
    }

    // Schedule next frame for smooth countdown
    rafIdRef.current = requestAnimationFrame(() => {
      const shouldContinue = updateTimer();
      if (shouldContinue) {
        scheduleNextFrame();
      }
    });
  };

  // Effect to handle timer lifecycle
  useEffect(() => {
    // Reset expiry state when startTimestamp changes
    hasExpiredRef.current = false;
    setIsExpired(false);

    // Update state immediately
    updateTimer();

    // Schedule RAF if timer is active
    scheduleNextFrame();

    // Cleanup: cancel RAF on unmount or when options change
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [startTimestamp, durationSeconds]);

  const isRunning = startTimestamp !== null && startTimestamp <= Date.now() && !isExpired;

  return {
    remainingMs,
    isExpired,
    isRunning,
  };
}
