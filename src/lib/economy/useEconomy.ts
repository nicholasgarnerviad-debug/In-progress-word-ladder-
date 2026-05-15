import { useState, useCallback, useEffect } from 'react';
import { loadWallet, saveWallet, earnCoins as walletEarnCoins, spendCoins, addXp as walletAddXp } from './wallet';
import type { Wallet, AddXpResult } from './wallet';
import { loadInventory, saveInventory, addConsumable, useConsumable, getConsumableCount, addUnlock, addDictionaryVouchers } from './inventory';
import type { Inventory } from './inventory';
import { ConsumableType } from './shop';
import type { CoinSource, XpSource } from './types';

export interface EconomyState {
  coins: number;
  xp: number;
  level: number;
  inventory: { [key: string]: number };
}

export interface EarnXpResult {
  leveledUp: boolean;
  rewards: Array<{ level: number; coins: number; description: string; unlocks: any[] }>;
}

export function useEconomy() {
  const [wallet, setWallet] = useState<Wallet>(() => loadWallet());
  const [inventory, setInventory] = useState<Inventory>(() => loadInventory());

  // Listen for storage changes (other tabs/windows)
  useEffect(() => {
    const handleStorageChange = () => {
      setWallet(loadWallet());
      setInventory(loadInventory());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const earnCoins = useCallback((amount: number, source: CoinSource) => {
    const current = loadWallet();
    const updated = walletEarnCoins(current, amount, source);
    saveWallet(updated);
    setWallet(updated);
  }, []);

  const spend = useCallback((amount: number): boolean => {
    const current = loadWallet();
    if (current.coins < amount) {
      return false;
    }
    const updated = spendCoins(current, amount, 'admin_grant');
    saveWallet(updated);
    setWallet(updated);
    return true;
  }, []);

  const addXp = useCallback((amount: number, source: XpSource): EarnXpResult => {
    const current = loadWallet();
    const result = walletAddXp(current, amount, source);

    let workingWallet = result.newState;
    let workingInventory = loadInventory();

    // Apply each level-up reward atomically
    for (const reward of result.rewards) {
      // Add bonus coins
      workingWallet = walletEarnCoins(workingWallet, reward.coins, 'level_reward');

      // Apply unlocks
      for (const unlock of reward.unlocks) {
        switch (unlock.type) {
          case 'consumable':
            workingInventory = addConsumable(workingInventory, unlock.consumableType as ConsumableType, unlock.count);
            break;
          case 'mode':
            workingInventory = addUnlock(workingInventory, unlock.modeId);
            break;
          case 'badge':
            workingInventory = addUnlock(workingInventory, `badge_${unlock.id}`);
            break;
          case 'dictionary_voucher':
            workingInventory = addDictionaryVouchers(workingInventory, unlock.count);
            break;
        }
      }
    }

    // Persist everything atomically
    saveWallet(workingWallet);
    saveInventory(workingInventory);
    setWallet(workingWallet);
    setInventory(workingInventory);

    return {
      leveledUp: result.leveledUp,
      rewards: result.rewards.map(r => ({
        level: r.level,
        coins: r.coins,
        description: r.description,
        unlocks: r.unlocks,
      })),
    };
  }, []);

  const buyConsumable = useCallback((type: ConsumableType, cost: number, count: number): boolean => {
    if (!spend(cost)) {
      return false;
    }
    const current = loadInventory();
    const updated = addConsumable(current, type, count);
    saveInventory(updated);
    setInventory(updated);
    return true;
  }, [spend]);

  const useItem = useCallback((type: ConsumableType): boolean => {
    const current = loadInventory();
    const updated = useConsumable(current, type);
    if (updated === current) {
      // No change means we didn't have any
      return false;
    }
    saveInventory(updated);
    setInventory(updated);
    return true;
  }, []);

  const getCount = useCallback((type: ConsumableType): number => {
    const current = loadInventory();
    return getConsumableCount(current, type);
  }, []);

  // Flatten inventory back to old shape for backward compatibility
  const inventoryFlat = {
    ...inventory.consumables,
  };

  return {
    coins: wallet.coins,
    xp: wallet.xp,
    level: wallet.level,
    inventory: inventoryFlat,
    earnCoins,
    spend,
    addXp,
    buyConsumable,
    useItem,
    getCount,
  };
}
