import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { LevelReward } from '../../lib/economy/types';
import { LevelUpModal } from './LevelUpModal';

/**
 * Context value for the LevelUp queue.
 */
type LevelUpContextValue = {
  push: (rewards: LevelReward[]) => void;
};

/**
 * Create the context with an undefined default.
 * This allows us to throw an error if used outside the provider.
 */
const LevelUpContext = createContext<LevelUpContextValue | undefined>(undefined);

/**
 * Props for the LevelUpProvider component.
 */
export type LevelUpProviderProps = {
  children: ReactNode;
};

/**
 * LevelUpProvider - Manages a queue of LevelReward objects and displays
 * one modal at a time. When the user dismisses a modal, the next reward
 * in the queue is displayed automatically.
 */
export function LevelUpProvider({ children }: LevelUpProviderProps) {
  const [queue, setQueue] = useState<LevelReward[]>([]);

  /**
   * Add one or more rewards to the queue.
   */
  const push = useCallback((rewards: LevelReward[]) => {
    if (rewards.length === 0) return;
    setQueue((prev) => [...prev, ...rewards]);
  }, []);

  /**
   * Dismiss the current modal and show the next one.
   */
  const dismiss = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  return (
    <LevelUpContext.Provider value={{ push }}>
      {children}
      {queue.length > 0 && <LevelUpModal reward={queue[0]} onClose={dismiss} />}
    </LevelUpContext.Provider>
  );
}

/**
 * Hook to access the LevelUp queue from within the LevelUpProvider.
 * @throws Error if used outside of <LevelUpProvider>
 */
export function useLevelUpQueue(): LevelUpContextValue {
  const ctx = useContext(LevelUpContext);
  if (!ctx) {
    throw new Error('useLevelUpQueue must be used inside <LevelUpProvider>');
  }
  return ctx;
}
