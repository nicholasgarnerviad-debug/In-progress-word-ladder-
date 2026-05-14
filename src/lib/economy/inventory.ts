import { ConsumableType } from './shop';

export interface Inventory {
  consumables: { [key: string]: number };  // e.g., { hint: 3, undo: 1 }
  unlocks: string[];                        // e.g., ['mode_practice', 'badge_sprout']
  dictionaryVouchers: number;
}

const INVENTORY_KEY = 'wordLadder.inventory';

export function getDefaultInventory(): Inventory {
  return {
    consumables: {
      hint: 0,
      reveal_next_word: 0,
      undo_step: 0,
      time_extension_15s: 0,
    },
    unlocks: [],
    dictionaryVouchers: 0,
  };
}

export function loadInventory(): Inventory {
  const saved = localStorage.getItem(INVENTORY_KEY);
  if (!saved) {
    return getDefaultInventory();
  }
  try {
    const data = JSON.parse(saved);
    // Handle migration from old flat format to new nested format
    if (typeof data.hint === 'number') {
      // Old format: { hint: 5, undo_step: 2, ... }
      const consumables: { [key: string]: number } = {};
      for (const key of ['hint', 'reveal_next_word', 'undo_step', 'time_extension_15s']) {
        consumables[key] = data[key] || 0;
      }
      return {
        consumables,
        unlocks: data.unlocks || [],
        dictionaryVouchers: data.dictionaryVouchers || 0,
      };
    }
    return data;
  } catch {
    return getDefaultInventory();
  }
}

export function saveInventory(inventory: Inventory): void {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
}

export function addConsumable(inventory: Inventory, type: ConsumableType, count: number): Inventory {
  return {
    ...inventory,
    consumables: {
      ...inventory.consumables,
      [type]: (inventory.consumables[type] || 0) + count,
    },
  };
}

export function useConsumable(inventory: Inventory, type: ConsumableType): Inventory {
  const current = inventory.consumables[type] || 0;
  if (current <= 0) {
    return inventory;
  }
  return {
    ...inventory,
    consumables: {
      ...inventory.consumables,
      [type]: current - 1,
    },
  };
}

export function getConsumableCount(inventory: Inventory, type: ConsumableType): number {
  return inventory.consumables[type] || 0;
}

export function addUnlock(inventory: Inventory, unlock: string): Inventory {
  if (inventory.unlocks.includes(unlock)) {
    return inventory;
  }
  return {
    ...inventory,
    unlocks: [...inventory.unlocks, unlock],
  };
}

export function hasUnlock(inventory: Inventory, unlock: string): boolean {
  return inventory.unlocks.includes(unlock);
}

export function addDictionaryVouchers(inventory: Inventory, count: number): Inventory {
  return {
    ...inventory,
    dictionaryVouchers: inventory.dictionaryVouchers + count,
  };
}
