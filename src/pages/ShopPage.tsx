import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopCard } from '../components/economy/ShopCard';
import { PurchaseConfirmModal } from '../components/economy/PurchaseConfirmModal';
import { PurchaseToast } from '../components/economy/PurchaseToast';
import { SHOP_ITEMS, type ShopItem } from '../lib/economy/shop';
import { loadWallet, saveWallet, spendCoins } from '../lib/economy/wallet';
import { loadInventory, saveInventory, addConsumable } from '../lib/economy/inventory';
import type { Wallet } from '../lib/economy/wallet';
import type { Inventory } from '../lib/economy/inventory';

export const ShopPage: React.FC = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; icon: string } | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadedWallet = loadWallet();
    const loadedInventory = loadInventory();
    setWallet(loadedWallet);
    setInventory(loadedInventory);
  }, []);

  // Handle buy click
  const handleBuyClick = useCallback((item: ShopItem) => {
    setSelectedItem(item);
    setIsConfirming(true);
  }, []);

  // Handle confirm purchase
  const handleConfirmPurchase = useCallback(
    async (item: ShopItem) => {
      if (!wallet) return;

      setIsProcessing(true);

      try {
        // Simulate slight delay for UX
        await new Promise(resolve => setTimeout(resolve, 300));

        // Deduct coins
        const updatedWallet = spendCoins(wallet, item.cost, 'shop_purchase');
        setWallet(updatedWallet);
        saveWallet(updatedWallet);

        // Add consumables
        if (inventory) {
          const updatedInventory = addConsumable(
            inventory,
            item.consumableType,
            item.consumableCount
          );
          setInventory(updatedInventory);
          saveInventory(updatedInventory);
        }

        // Show success toast
        const consumableIcon = {
          hint: '💡',
          reveal_next_word: '👁️',
          undo_step: '↩️',
          time_extension_15s: '⏱️',
        }[item.consumableType] || '📦';

        setToast({
          message: `You got ${item.consumableCount}x ${item.name}!`,
          icon: consumableIcon,
        });

        setIsConfirming(false);
        setSelectedItem(null);
      } catch (error) {
        console.error('Purchase failed:', error);
        setToast({
          message: 'Purchase failed. Please try again.',
          icon: '❌',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [wallet, inventory]
  );

  if (!wallet || !inventory) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-900 dark:text-white">Loading shop...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-2xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            aria-label="Go back"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Shop</h1>
          <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
            💰 {wallet.coins} coins
          </div>
        </div>
      </div>

      {/* Shop Grid */}
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {SHOP_ITEMS.map(item => (
            <ShopCard
              key={item.id}
              item={item}
              inventory={inventory}
              wallet={wallet}
              onBuyClick={handleBuyClick}
            />
          ))}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-900 dark:text-blue-200">
          <p className="font-medium mb-2">💡 How to earn free consumables:</p>
          <ul className="space-y-1 text-xs">
            <li>• Win Blitz matches to get Time Extensions</li>
            <li>• Log in daily for Hints & Undos</li>
            <li>• Unlock achievements for consumable packs</li>
          </ul>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedItem && (
        <PurchaseConfirmModal
          isOpen={isConfirming}
          item={selectedItem}
          wallet={wallet}
          onConfirm={handleConfirmPurchase}
          onCancel={() => setIsConfirming(false)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <PurchaseToast
          message={toast.message}
          icon={toast.icon}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ShopPage;
