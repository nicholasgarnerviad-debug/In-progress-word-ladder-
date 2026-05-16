import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShopCard } from '../ShopCard';
import type { ShopItem } from '../../lib/economy/shop';
import type { Wallet } from '../../lib/economy/wallet';
import type { Inventory } from '../../lib/economy/inventory';

describe('ShopCard', () => {
  const mockItem: ShopItem = {
    id: 'hint-5pack',
    consumableType: 'hint',
    name: 'Hints',
    description: 'Reveal one letter',
    cost: 30,
    consumableCount: 5,
    category: 'assists',
  };

  const mockWallet: Wallet = {
    coins: 100,
    xp: 0,
    level: 1,
    lifetimeCoinsEarned: 0,
    lifetimeCoinsSpent: 0,
    lifetimeXpEarned: 0,
    lastUpdatedAt: new Date().toISOString(),
    dailyCoinsEarned: 0,
    lastDailyResetAt: 0,
    weeklyCoinsEarned: 0,
    lastWeeklyResetAt: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastEarnedAt: 0,
    joinedAt: 0,
    dailyBonusClaimedAt: 0,
  };

  const mockInventory: Inventory = {
    consumables: {
      hint: 5,
      reveal_next_word: 0,
      undo_step: 2,
      time_extension_15s: 0,
    },
    unlocks: [],
    dictionaryVouchers: 0,
  };

  test('renders item name, description, and price', () => {
    render(
      <ShopCard
        item={mockItem}
        inventory={mockInventory}
        wallet={mockWallet}
        onBuyClick={() => {}}
      />
    );

    expect(screen.getByText('Hints')).toBeInTheDocument();
    expect(screen.getByText('Reveal one letter')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  test('displays current inventory count', () => {
    render(
      <ShopCard
        item={mockItem}
        inventory={mockInventory}
        wallet={mockWallet}
        onBuyClick={() => {}}
      />
    );

    expect(screen.getByText(/You have: 5/i)).toBeInTheDocument();
  });

  test('disables buy button when insufficient coins', () => {
    const lowWallet: Wallet = { ...mockWallet, coins: 10 };

    render(
      <ShopCard
        item={mockItem}
        inventory={mockInventory}
        wallet={lowWallet}
        onBuyClick={() => {}}
      />
    );

    const button = screen.getByRole('button', { name: /buy/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/need.*more/i)).toBeInTheDocument();
  });

  test('enables buy button when sufficient coins', () => {
    render(
      <ShopCard
        item={mockItem}
        inventory={mockInventory}
        wallet={mockWallet}
        onBuyClick={() => {}}
      />
    );

    const button = screen.getByRole('button', { name: /buy/i });
    expect(button).not.toBeDisabled();
  });

  test('calls onBuyClick when buy button clicked', () => {
    const mockClick = jest.fn();

    render(
      <ShopCard
        item={mockItem}
        inventory={mockInventory}
        wallet={mockWallet}
        onBuyClick={mockClick}
      />
    );

    const button = screen.getByRole('button', { name: /buy/i });
    fireEvent.click(button);

    expect(mockClick).toHaveBeenCalledWith(mockItem);
  });

  test('displays emoji icon for consumable type', () => {
    render(
      <ShopCard
        item={mockItem}
        inventory={mockInventory}
        wallet={mockWallet}
        onBuyClick={() => {}}
      />
    );

    expect(screen.getByText('💡')).toBeInTheDocument();
  });
});
