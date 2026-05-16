import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { LevelReward } from '../../lib/economy/types';
import { LevelUpModal } from './LevelUpModal';
import { getAchievementReward } from '../../lib/leaderboard/achievements/achievements';
import { getAchievementById } from '../../lib/leaderboard/achievements/achievements';
import {
  addConsumable,
  loadInventory,
  saveInventory,
} from '../../lib/economy/inventory';

/**
 * Context value for the LevelUp queue.
 */
type LevelUpContextValue = {
  push: (rewards: LevelReward[]) => void;
  onAchievementUnlocked: (achievementId: string) => void;
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
   * Handle achievement unlock by awarding consumable rewards based on rarity.
   * Common: 1 Hint
   * Rare: 2 Hints + 1 Undo
   * Legendary: 5 Time Extensions
   */
  const onAchievementUnlocked = useCallback((achievementId: string) => {
    const achievement = getAchievementById(achievementId);
    if (!achievement) {
      console.warn(`Achievement not found: ${achievementId}`);
      return;
    }

    // Get consumable rewards based on rarity
    const rewards = getAchievementReward(achievement.rarity);

    // Load inventory and add rewards
    let inventory = loadInventory();
    for (const reward of rewards) {
      inventory = addConsumable(inventory, reward.consumableType, reward.count);
    }
    saveInventory(inventory);

    // Log for debugging
    console.log(`Achievement unlocked: ${achievementId} (${achievement.rarity})`);
    console.log(
      `Awarded consumables:`,
      rewards.map((r) => `${r.count}x ${r.consumableType}`).join(', ')
    );
  }, []);

  /**
   * Dismiss the current modal and show the next one.
   */
  const dismiss = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  return (
    <LevelUpContext.Provider value={{ push, onAchievementUnlocked }}>
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
