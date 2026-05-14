import { useState, useCallback, useEffect } from 'react';
import { loadWallet, earnCoins as walletEarnCoins, spendCoins } from './wallet';
import { earnXp } from './wallet';
import { loadInventory, addConsumable, useConsumable, getConsumableCount } from './inventory';
import { ConsumableType } from './shop';

export interface EconomyState {
  coins: number;
  xp: number;
  inventory: { [key: string]: number };
}

export function useEconomy() {
  const [state, setState] = useState<EconomyState>(() => {
    const wallet = loadWallet();
    const inventory = loadInventory();
    return {
      coins: wallet.coins,
      xp: wallet.xp,
      inventory
    };
  });

  // Listen for storage changes (when other tabs/windows change economy)
  useEffect(() => {
    const handleStorageChange = () => {
      const wallet = loadWallet();
      const inventory = loadInventory();
      setState({
        coins: wallet.coins,
        xp: wallet.xp,
        inventory
      });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const earnCoins = useCallback((amount: number, source: string) => {
    walletEarnCoins(amount);
    setState(prev => ({ ...prev, coins: prev.coins + amount }));
  }, []);

  const spend = useCallback((amount: number): boolean => {
    if (state.coins < amount) {
      return false;
    }
    spendCoins(amount);
    setState(prev => ({ ...prev, coins: Math.max(0, prev.coins - amount) }));
    return true;
  }, [state.coins]);

  const addXp = useCallback((amount: number, source: string) => {
    earnXp(amount);
    setState(prev => ({ ...prev, xp: prev.xp + amount }));
  }, []);

  const buyConsumable = useCallback((type: ConsumableType, cost: number, count: number): boolean => {
    if (!spend(cost)) {
      return false;
    }
    addConsumable(type, count);
    setState(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [type]: (prev.inventory[type] || 0) + count
      }
    }));
    return true;
  }, [spend]);

  const useItem = useCallback((type: ConsumableType): boolean => {
    const success = useConsumable(type);
    if (success) {
      setState(prev => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          [type]: Math.max(0, (prev.inventory[type] || 0) - 1)
        }
      }));
    }
    return success;
  }, []);

  const getCount = useCallback((type: ConsumableType): number => {
    return getConsumableCount(type);
  }, []);

  return {
    coins: state.coins,
    xp: state.xp,
    inventory: state.inventory,
    earnCoins,
    spend,
    addXp,
    buyConsumable,
    useItem,
    getCount
  };
}
