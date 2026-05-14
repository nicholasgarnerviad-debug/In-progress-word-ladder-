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
