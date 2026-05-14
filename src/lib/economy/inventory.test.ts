import {
  loadInventory,
  saveInventory,
  addConsumable,
  useConsumable,
  getConsumableCount,
  addUnlock,
  hasUnlock,
  getDefaultInventory,
} from './inventory';

describe('Inventory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default inventory (all zeros, empty unlocks) when empty', () => {
    const inv = loadInventory();
    expect(inv.consumables.hint).toBe(0);
    expect(inv.consumables.reveal_next_word).toBe(0);
    expect(inv.unlocks).toHaveLength(0);
    expect(inv.dictionaryVouchers).toBe(0);
  });

  it('persists inventory to localStorage', () => {
    const inventory = {
      consumables: { hint: 5, reveal_next_word: 3, undo_step: 0, time_extension_15s: 2 },
      unlocks: [],
      dictionaryVouchers: 0,
    };
    saveInventory(inventory);
    const loaded = loadInventory();
    expect(loaded.consumables.hint).toBe(5);
    expect(loaded.consumables.time_extension_15s).toBe(2);
  });

  it('addConsumable increments count', () => {
    let inv = getDefaultInventory();
    inv = addConsumable(inv, 'hint', 3);
    inv = addConsumable(inv, 'hint', 2);
    const count = getConsumableCount(inv, 'hint');
    expect(count).toBe(5);
  });

  it('useConsumable decrements count and returns updated inventory', () => {
    let inv = getDefaultInventory();
    inv = addConsumable(inv, 'hint', 3);
    inv = useConsumable(inv, 'hint');
    expect(getConsumableCount(inv, 'hint')).toBe(2);
  });

  it('useConsumable returns same inventory if count is 0', () => {
    const inv = getDefaultInventory();
    const result = useConsumable(inv, 'hint');
    expect(result).toBe(inv);
    expect(getConsumableCount(result, 'hint')).toBe(0);
  });

  it('addUnlock adds new unlock', () => {
    let inv = getDefaultInventory();
    inv = addUnlock(inv, 'badge_sprout');
    expect(inv.unlocks).toContain('badge_sprout');
    expect(hasUnlock(inv, 'badge_sprout')).toBe(true);
  });

  it('addUnlock does not duplicate unlocks', () => {
    let inv = getDefaultInventory();
    inv = addUnlock(inv, 'badge_sprout');
    inv = addUnlock(inv, 'badge_sprout');
    expect(inv.unlocks.filter(u => u === 'badge_sprout')).toHaveLength(1);
  });

  it('handles migration from old flat format', () => {
    const oldFormat = { hint: 5, undo_step: 2, reveal_next_word: 1, time_extension_15s: 0 };
    localStorage.setItem('wordLadder.inventory', JSON.stringify(oldFormat));
    const loaded = loadInventory();
    expect(loaded.consumables.hint).toBe(5);
    expect(loaded.consumables.undo_step).toBe(2);
    expect(loaded.consumables.reveal_next_word).toBe(1);
    expect(loaded.unlocks).toEqual([]);
  });
});
