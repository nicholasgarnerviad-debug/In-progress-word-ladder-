import { loadInventory, saveInventory, addConsumable, useConsumable, getConsumableCount } from './inventory';

describe('Inventory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default inventory (all zeros) when empty', () => {
    const inv = loadInventory();
    expect(inv.hint).toBe(0);
    expect(inv.reveal_next_word).toBe(0);
  });

  it('persists inventory to localStorage', () => {
    const inventory = { hint: 5, reveal_next_word: 3, undo_step: 0, time_extension_15s: 2 };
    saveInventory(inventory);
    const loaded = loadInventory();
    expect(loaded.hint).toBe(5);
    expect(loaded.time_extension_15s).toBe(2);
  });

  it('addConsumable increments count', () => {
    addConsumable('hint', 3);
    addConsumable('hint', 2);
    const count = getConsumableCount('hint');
    expect(count).toBe(5);
  });

  it('useConsumable decrements count and returns true', () => {
    addConsumable('hint', 3);
    const used = useConsumable('hint');
    expect(used).toBe(true);
    expect(getConsumableCount('hint')).toBe(2);
  });

  it('useConsumable returns false if count is 0', () => {
    const used = useConsumable('hint');
    expect(used).toBe(false);
    expect(getConsumableCount('hint')).toBe(0);
  });
});
