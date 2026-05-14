import { ConsumableType } from './shop';

export interface Inventory {
  [key: string]: number; // consumableType -> count
}

const INVENTORY_KEY = 'wordLadder.inventory';

export function loadInventory(): Inventory {
  const saved = localStorage.getItem(INVENTORY_KEY);
  if (!saved) {
    return {
      hint: 0,
      reveal_next_word: 0,
      undo_step: 0,
      time_extension_15s: 0
    };
  }
  return JSON.parse(saved);
}

export function saveInventory(inventory: Inventory): void {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
}

export function addConsumable(type: ConsumableType, count: number): Inventory {
  const inventory = loadInventory();
  inventory[type] = (inventory[type] || 0) + count;
  saveInventory(inventory);
  return inventory;
}

export function useConsumable(type: ConsumableType): boolean {
  const inventory = loadInventory();
  if ((inventory[type] || 0) <= 0) {
    return false;
  }
  inventory[type]--;
  saveInventory(inventory);
  return true;
}

export function getConsumableCount(type: ConsumableType): number {
  const inventory = loadInventory();
  return inventory[type] || 0;
}
