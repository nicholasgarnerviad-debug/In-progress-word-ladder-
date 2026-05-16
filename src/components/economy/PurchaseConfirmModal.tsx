import React from 'react';
import type { ShopItem } from '../../lib/economy/shop';
import type { Wallet } from '../../lib/economy/wallet';

const CONSUMABLE_ICONS: Record<string, string> = {
  hint: '💡',
  reveal_next_word: '👁️',
  undo_step: '↩️',
  time_extension_15s: '⏱️',
};

interface PurchaseConfirmModalProps {
  isOpen: boolean;
  item: ShopItem;
  wallet: Wallet;
  onConfirm: (item: ShopItem) => void;
  onCancel: () => void;
}

export const PurchaseConfirmModal = React.memo(
  ({ isOpen, item, wallet, onConfirm, onCancel }: PurchaseConfirmModalProps) => {
    if (!isOpen) return null;

    const icon = CONSUMABLE_ICONS[item.consumableType] || '📦';
    const balanceAfter = wallet.coins - item.cost;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={handleBackdropClick}
      >
        <div
          role="dialog"
          className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Confirm Purchase
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Icon */}
          <div className="text-6xl text-center mb-4">{icon}</div>

          {/* Item Details */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">
            {item.consumableCount}x {item.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
            {item.description}
          </p>

          {/* Cost and Balance */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 space-y-2 text-center">
            <div className="text-base text-gray-700 dark:text-gray-300">
              Spend {item.cost} coins for {item.consumableCount}x {item.name}?
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              You have {wallet.coins} coins
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              After purchase: {balanceAfter} coins
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-lg font-medium bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(item)}
              className="flex-1 py-3 px-4 rounded-lg font-medium bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }
);

PurchaseConfirmModal.displayName = 'PurchaseConfirmModal';
