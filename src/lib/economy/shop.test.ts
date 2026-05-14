import { SHOP_ITEMS, getShopItem, getItemsByCategory } from './shop';

describe('Shop', () => {
  it('exports all shop items', () => {
    expect(SHOP_ITEMS.length).toBe(4);
  });

  it('all items have required fields', () => {
    for (const item of SHOP_ITEMS) {
      expect(item.id).toBeDefined();
      expect(item.consumableType).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.cost).toBeGreaterThan(0);
      expect(item.consumableCount).toBeGreaterThan(0);
      expect(['assists', 'time_bonuses']).toContain(item.category);
    }
  });

  it('getShopItem returns correct item by type', () => {
    const hint = getShopItem('hint');
    expect(hint?.name).toBe('Hints');
    expect(hint?.cost).toBe(30);
  });

  it('getShopItem returns undefined for unknown type', () => {
    expect(getShopItem('unknown_type' as any)).toBeUndefined();
  });

  it('getItemsByCategory filters correctly', () => {
    const assists = getItemsByCategory('assists');
    expect(assists.length).toBe(3);
    expect(assists.map(i => i.id)).toEqual(['hint-5pack', 'reveal-3pack', 'undo-3pack']);

    const timeBonuses = getItemsByCategory('time_bonuses');
    expect(timeBonuses.length).toBe(1);
    expect(timeBonuses[0].id).toBe('time-5pack');
  });
});
