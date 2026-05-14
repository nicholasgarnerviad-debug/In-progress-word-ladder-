export { loadWallet, saveWallet, earnCoins, spendCoins, addXp, getDefaultWallet } from './wallet';
export type { Wallet, AddXpResult } from './wallet';

export { SHOP_ITEMS, getShopItem, getItemsByCategory } from './shop';
export type { ConsumableType, ShopItem } from './shop';

export {
  loadInventory,
  saveInventory,
  addConsumable,
  useConsumable,
  getConsumableCount,
  addUnlock,
  hasUnlock,
  addDictionaryVouchers,
  getDefaultInventory,
} from './inventory';
export type { Inventory } from './inventory';

export { useEconomy } from './useEconomy';
export type { EconomyState } from './useEconomy';

export type { CoinSource, XpSource, LevelReward, LevelRewardUnlock } from './types';

export { computeLevel, xpRequiredForLevel, xpToNextLevel, xpProgressInLevel, xpDeltaToLevelProgress } from './levels';

export { getLevelReward, getRewardsBetween, getNextRewardLevel, LEVEL_REWARDS } from './levelRewards';
