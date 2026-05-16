import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ShopPage } from '../ShopPage';
import { loadWallet, saveWallet, getDefaultWallet } from '../../lib/economy/wallet';
import { loadInventory, saveInventory, getDefaultInventory } from '../../lib/economy/inventory';
import { SHOP_ITEMS } from '../../lib/economy/shop';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

describe('ShopPage Integration Tests', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
    // Initialize with default wallet and inventory
    const wallet = getDefaultWallet();
    const inventory = getDefaultInventory();
    localStorage.setItem('wordLadder.wallet', JSON.stringify(wallet));
    localStorage.setItem('wordLadder.inventory', JSON.stringify(inventory));
  });

  describe('Complete Purchase Flow', () => {
    test('complete purchase flow: open modal, confirm, update wallet and inventory', async () => {
      render(
        <BrowserRouter>
          <ShopPage />
        </BrowserRouter>
      );

      // Verify initial state - should show 150 coins (default)
      await waitFor(() => {
        expect(screen.getByText(/💰 150 coins/i)).toBeInTheDocument();
      });

      // Verify shop items are displayed
      expect(screen.getByText('Hints')).toBeInTheDocument();

      // Click buy button on first item (Hints pack)
      const buyButtons = screen.getAllByRole('button', { name: /Buy 5x Hints/i });
      fireEvent.click(buyButtons[0]);

      // Verify modal appears with correct content
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // The modal should show the purchase details for Hints pack (30 coins for 5 hints)
      expect(screen.getByText(/Spend 30 coins for 5x Hints/i)).toBeInTheDocument();

      // Find and click confirm button
      const confirmButton = screen.getByRole('button', { name: /Confirm purchase/i });
      fireEvent.click(confirmButton);

      // Verify modal closes
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify toast notification appears
      await waitFor(() => {
        expect(screen.getByText(/You got 5x Hints!/i)).toBeInTheDocument();
      });

      // Verify wallet was updated: 150 - 30 = 120 coins
      const savedWallet = JSON.parse(localStorage.getItem('wordLadder.wallet') || '{}');
      expect(savedWallet.coins).toBe(120);
      expect(savedWallet.lifetimeCoinsSpent).toBe(30);

      // Verify inventory was updated: hints increased from 5 (default) to 10 (5 default + 5 purchased)
      const savedInventory = JSON.parse(localStorage.getItem('wordLadder.inventory') || '{}');
      expect(savedInventory.consumables.hint).toBe(10);
    });

    test('purchase multiple items sequentially updates wallet and inventory correctly', async () => {
      render(
        <BrowserRouter>
          <ShopPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/💰 150 coins/i)).toBeInTheDocument();
      });

      // First purchase: Hints (30 coins, +5 hints)
      let buyButtons = screen.getAllByRole('button', { name: /Buy 5x Hints/i });
      fireEvent.click(buyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      let confirmButton = screen.getByRole('button', { name: /Confirm purchase/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/You got 5x Hints!/i)).toBeInTheDocument();
      });

      // Wait for toast to disappear and verify state
      await waitFor(() => {
        const wallet = JSON.parse(localStorage.getItem('wordLadder.wallet') || '{}');
        expect(wallet.coins).toBe(120);
      }, { timeout: 5000 });

      // Second purchase: Undo Step (25 coins, +3 undos)
      buyButtons = screen.getAllByRole('button', { name: /Buy 3x Undo Step/i });
      fireEvent.click(buyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      confirmButton = screen.getByRole('button', { name: /Confirm purchase/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/You got 3x Undo Step!/i)).toBeInTheDocument();
      });

      // Verify final state: 150 - 30 - 25 = 95 coins
      const finalWallet = JSON.parse(localStorage.getItem('wordLadder.wallet') || '{}');
      expect(finalWallet.coins).toBe(95);
      expect(finalWallet.lifetimeCoinsSpent).toBe(55);

      const finalInventory = JSON.parse(localStorage.getItem('wordLadder.inventory') || '{}');
      expect(finalInventory.consumables.hint).toBe(10);
      expect(finalInventory.consumables.undo_step).toBe(6);
    });
  });

  describe('Insufficient Coins Validation', () => {
    test('cannot purchase with insufficient coins - button disabled', async () => {
      // Set wallet with low balance (10 coins)
      const wallet = getDefaultWallet();
      wallet.coins = 10;
      localStorage.setItem('wordLadder.wallet', JSON.stringify(wallet));

      render(
        <BrowserRouter>
          <ShopPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Shop/i)).toBeInTheDocument();
      });

      // All buttons should be disabled since 10 coins is not enough for any item
      const hintButtons = screen.queryAllByRole('button', { name: /Buy 5x Hints/i });
      const revealButtons = screen.queryAllByRole('button', { name: /Buy 3x Reveal Next Word/i });
      const undoButtons = screen.queryAllByRole('button', { name: /Buy 3x Undo Step/i });
      const timeButtons = screen.queryAllByRole('button', { name: /Buy 5x \+15 Seconds/i });

      if (hintButtons.length > 0) expect(hintButtons[0]).toBeDisabled();
      if (revealButtons.length > 0) expect(revealButtons[0]).toBeDisabled();
      if (undoButtons.length > 0) expect(undoButtons[0]).toBeDisabled();
      if (timeButtons.length > 0) expect(timeButtons[0]).toBeDisabled();
    });

    test('can only purchase item that fits within available coins', async () => {
      // Set wallet with enough for one item only (35 coins = enough for Hints at 30)
      const wallet = getDefaultWallet();
      wallet.coins = 35;
      localStorage.setItem('wordLadder.wallet', JSON.stringify(wallet));

      render(
        <BrowserRouter>
          <ShopPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Shop/i)).toBeInTheDocument();
      });

      // First button (Hints) costs 30 coins - should be enabled
      const hintButtons = screen.getAllByRole('button', { name: /Buy 5x Hints/i });
      expect(hintButtons[0]).not.toBeDisabled();

      // Complete a purchase
      fireEvent.click(hintButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm purchase/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/You got 5x Hints!/i)).toBeInTheDocument();
      });

      // Verify wallet is now 5 coins (35 - 30)
      const updatedWallet = JSON.parse(localStorage.getItem('wordLadder.wallet') || '{}');
      expect(updatedWallet.coins).toBe(5);
    });
  });

  describe('Modal and Toast Interactions', () => {
    test('cancel button closes modal without updating state', async () => {
      const initialWallet = JSON.parse(localStorage.getItem('wordLadder.wallet') || '{}');
      const initialInventory = JSON.parse(localStorage.getItem('wordLadder.inventory') || '{}');

      render(
        <BrowserRouter>
          <ShopPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/💰 150 coins/i)).toBeInTheDocument();
      });

      const buyButtons = screen.getAllByRole('button', { name: /Buy 5x Hints/i });
      fireEvent.click(buyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel purchase/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify nothing changed
      const finalWallet = JSON.parse(localStorage.getItem('wordLadder.wallet') || '{}');
      const finalInventory = JSON.parse(localStorage.getItem('wordLadder.inventory') || '{}');

      expect(finalWallet.coins).toBe(initialWallet.coins);
      expect(finalInventory.consumables.hint).toBe(initialInventory.consumables.hint);
    });

    test('toast notification disappears after timeout', async () => {
      jest.useFakeTimers();

      render(
        <BrowserRouter>
          <ShopPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/💰 150 coins/i)).toBeInTheDocument();
      });

      const buyButtons = screen.getAllByRole('button', { name: /Buy 5x Hints/i });
      fireEvent.click(buyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm purchase/i });
      fireEvent.click(confirmButton);

      // Toast should appear
      await waitFor(() => {
        expect(screen.getByText(/You got 5x Hints!/i)).toBeInTheDocument();
      });

      // Fast-forward time to trigger toast timeout (3000ms default)
      jest.advanceTimersByTime(3100);

      // Toast should disappear after timeout
      await waitFor(() => {
        expect(screen.queryByText(/You got 5x Hints!/i)).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Data Persistence', () => {
    test('purchases persist in localStorage across component remounts', async () => {
      const { unmount } = render(
        <BrowserRouter>
          <ShopPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/💰 150 coins/i)).toBeInTheDocument();
      });

      // Make a purchase
      const buyButtons = screen.getAllByRole('button', { name: /Buy 5x Hints/i });
      fireEvent.click(buyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm purchase/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/You got 5x Hints!/i)).toBeInTheDocument();
      });

      // Verify saved state
      const walletAfterPurchase = JSON.parse(localStorage.getItem('wordLadder.wallet') || '{}');
      const inventoryAfterPurchase = JSON.parse(localStorage.getItem('wordLadder.inventory') || '{}');

      expect(walletAfterPurchase.coins).toBe(120);
      expect(inventoryAfterPurchase.consumables.hint).toBe(10);

      // Unmount and remount
      unmount();

      render(
        <BrowserRouter>
          <ShopPage />
        </BrowserRouter>
      );

      // Verify data loaded from localStorage
      await waitFor(() => {
        expect(screen.getByText(/💰 120 coins/i)).toBeInTheDocument();
      });

      // Verify inventory is still accurate
      const walletAfterRemount = JSON.parse(localStorage.getItem('wordLadder.wallet') || '{}');
      const inventoryAfterRemount = JSON.parse(localStorage.getItem('wordLadder.inventory') || '{}');

      expect(walletAfterRemount.coins).toBe(120);
      expect(inventoryAfterRemount.consumables.hint).toBe(10);
    });

    test('wallet tracks lifetime coins spent correctly', async () => {
      render(
        <BrowserRouter>
          <ShopPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/💰 150 coins/i)).toBeInTheDocument();
      });

      // First purchase: 30 coins (Hints)
      let buyButtons = screen.getAllByRole('button', { name: /Buy 5x Hints/i });
      fireEvent.click(buyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      let confirmButton = screen.getByRole('button', { name: /Confirm purchase/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/You got 5x Hints!/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Second purchase: 25 coins (Undo Step)
      buyButtons = screen.getAllByRole('button', { name: /Buy 3x Undo Step/i });
      fireEvent.click(buyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      confirmButton = screen.getByRole('button', { name: /Confirm purchase/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/You got 3x Undo Step!/i)).toBeInTheDocument();
      });

      // Verify lifetime coins spent = 30 + 25 = 55
      const finalWallet = JSON.parse(localStorage.getItem('wordLadder.wallet') || '{}');
      expect(finalWallet.lifetimeCoinsSpent).toBe(55);
      expect(finalWallet.coins).toBe(95);
    });
  });

  describe('All Shop Items Purchase', () => {
    test('can purchase all different shop item types', async () => {
      jest.useFakeTimers();

      // Set high coin balance to purchase everything
      const wallet = getDefaultWallet();
      wallet.coins = 500;
      localStorage.setItem('wordLadder.wallet', JSON.stringify(wallet));

      render(
        <BrowserRouter>
          <ShopPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/💰 500 coins/i)).toBeInTheDocument();
      });

      // Test each shop item
      const itemsToTest = [
        { buttonName: /Buy 5x Hints/i, toastName: /5x Hints/, cost: 30, type: 'hint', count: 5 },
        { buttonName: /Buy 3x Reveal Next Word/i, toastName: /3x Reveal Next Word/, cost: 60, type: 'reveal_next_word', count: 3 },
        { buttonName: /Buy 3x Undo Step/i, toastName: /3x Undo Step/, cost: 25, type: 'undo_step', count: 3 },
        { buttonName: /Buy 5x \+15 Seconds/i, toastName: /5x \+15 Seconds/, cost: 40, type: 'time_extension_15s', count: 5 },
      ];

      let totalSpent = 0;

      for (const item of itemsToTest) {
        const buyButtons = screen.getAllByRole('button', { name: item.buttonName });
        fireEvent.click(buyButtons[0]);

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        const confirmButton = screen.getByRole('button', { name: /Confirm purchase/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(screen.getByText(item.toastName)).toBeInTheDocument();
        });

        totalSpent += item.cost;

        // Fast-forward time to auto-dismiss toast
        jest.advanceTimersByTime(3100);

        await waitFor(() => {
          expect(screen.queryByText(item.toastName)).not.toBeInTheDocument();
        });
      }

      // Verify final state
      const finalWallet = JSON.parse(localStorage.getItem('wordLadder.wallet') || '{}');
      const finalInventory = JSON.parse(localStorage.getItem('wordLadder.inventory') || '{}');

      expect(finalWallet.coins).toBe(500 - totalSpent);
      expect(finalWallet.lifetimeCoinsSpent).toBe(totalSpent);
      expect(finalInventory.consumables.hint).toBe(10);
      expect(finalInventory.consumables.reveal_next_word).toBe(3);
      expect(finalInventory.consumables.undo_step).toBe(6);
      expect(finalInventory.consumables.time_extension_15s).toBe(5);

      jest.useRealTimers();
    });
  });
});
