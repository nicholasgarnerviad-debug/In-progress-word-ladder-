import React from 'react';
import type { ShopItem } from '../../lib/economy/shop';
import type { Wallet } from '../../lib/economy/wallet';
import type { Inventory } from '../../lib/economy/inventory';

const CONSUMABLE_ICONS: Record<string, string> = {
  hint: '💡',
  reveal_next_word: '👁️',
  undo_step: '↩️',
  time_extension_15s: '⏱️',
};

interface ShopCardProps {
  item: ShopItem;
  inventory: Inventory;
  wallet: Wallet;
  onBuyClick: (item: ShopItem) => void;
}

export const ShopCard = React.memo(({ item, inventory, wallet, onBuyClick }: ShopCardProps) => {
  const canAfford = wallet.coins >= item.cost;
  const currentCount = inventory.consumables[item.consumableType] || 0;
  const coinsNeeded = Math.max(0, item.cost - wallet.coins);
  const icon = CONSUMABLE_ICONS[item.consumableType] || '📦';

  return (
    <div className="p-4 md:p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md dark:hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200">
      {/* Icon */}
      <div className="text-4xl text-center mb-3">{icon}</div>

      {/* Name */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-1">
        {item.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
        {item.description}
      </p>

      {/* Inventory Count */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
        You have: {currentCount}
      </p>

      {/* Price */}
      <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded p-3 mb-3 text-center">
        <div className="text-2xl md:text-3xl font-bold text-yellow-500">
          {item.cost}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">coins</div>
      </div>

      {/* Buy Button */}
      <button
        onClick={() => onBuyClick(item)}
        disabled={!canAfford}
        className={`w-full py-3 rounded-lg font-medium text-white transition-colors mb-2 ${
          canAfford
            ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer'
            : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-50'
        }`}
      >
        {canAfford ? 'Buy' : 'Buy'}
      </button>

      {/* Insufficient Coins Message */}
      {!canAfford && (
        <p className="text-red-500 dark:text-red-400 text-xs text-center">
          You have {wallet.coins} coins, need {coinsNeeded} more
        </p>
      )}
    </div>
  );
});

ShopCard.displayName = 'ShopCard';
