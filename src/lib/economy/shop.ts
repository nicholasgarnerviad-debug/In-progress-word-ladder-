export type ConsumableType =
  | 'hint'
  | 'reveal_next_word'
  | 'undo_step'
  | 'time_extension_15s';

export interface ShopItem {
  id: string;
  consumableType: ConsumableType;
  name: string;
  description: string;
  cost: number;
  consumableCount: number;
  category: 'assists' | 'time_bonuses';
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'hint-5pack',
    consumableType: 'hint',
    name: 'Hints',
    description: 'Reveal one letter of the next word',
    cost: 30,
    consumableCount: 5,
    category: 'assists'
  },
  {
    id: 'reveal-3pack',
    consumableType: 'reveal_next_word',
    name: 'Reveal Next Word',
    description: 'See the entire next word on the ladder',
    cost: 60,
    consumableCount: 3,
    category: 'assists'
  },
  {
    id: 'undo-3pack',
    consumableType: 'undo_step',
    name: 'Undo Step',
    description: 'Take back your last word (Time Attack only)',
    cost: 25,
    consumableCount: 3,
    category: 'assists'
  },
  {
    id: 'time-5pack',
    consumableType: 'time_extension_15s',
    name: '+15 Seconds',
    description: 'Add 15 seconds to your timer',
    cost: 40,
    consumableCount: 5,
    category: 'time_bonuses'
  }
];

export function getShopItem(consumableType: ConsumableType): ShopItem | undefined {
  return SHOP_ITEMS.find(item => item.consumableType === consumableType);
}

export function getItemsByCategory(category: 'assists' | 'time_bonuses'): ShopItem[] {
  return SHOP_ITEMS.filter(item => item.category === category);
}
