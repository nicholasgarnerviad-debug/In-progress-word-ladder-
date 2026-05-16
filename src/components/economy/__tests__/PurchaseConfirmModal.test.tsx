import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PurchaseConfirmModal } from '../PurchaseConfirmModal';
import type { ShopItem } from '../../lib/economy/shop';
import type { Wallet } from '../../lib/economy/wallet';

describe('PurchaseConfirmModal', () => {
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

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <PurchaseConfirmModal
        isOpen={false}
        item={mockItem}
        wallet={mockWallet}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  test('renders when isOpen is true', () => {
    render(
      <PurchaseConfirmModal
        isOpen={true}
        item={mockItem}
        wallet={mockWallet}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('displays item details', () => {
    render(
      <PurchaseConfirmModal
        isOpen={true}
        item={mockItem}
        wallet={mockWallet}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByRole('heading', { name: /5x Hints/i })).toBeInTheDocument();
    expect(screen.getByText(/Spend 30 coins for 5x Hints\?/i)).toBeInTheDocument();
  });

  test('shows balance breakdown', () => {
    render(
      <PurchaseConfirmModal
        isOpen={true}
        item={mockItem}
        wallet={mockWallet}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText(/You have 100 coins/i)).toBeInTheDocument();
    expect(screen.getByText(/After purchase: 70 coins/i)).toBeInTheDocument();
  });

  test('calls onConfirm when confirm button clicked', () => {
    const mockConfirm = jest.fn();

    render(
      <PurchaseConfirmModal
        isOpen={true}
        item={mockItem}
        wallet={mockWallet}
        onConfirm={mockConfirm}
        onCancel={() => {}}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm purchase/i });
    fireEvent.click(confirmButton);

    expect(mockConfirm).toHaveBeenCalledWith(mockItem);
  });

  test('calls onCancel when cancel button clicked', () => {
    const mockCancel = jest.fn();

    render(
      <PurchaseConfirmModal
        isOpen={true}
        item={mockItem}
        wallet={mockWallet}
        onConfirm={() => {}}
        onCancel={mockCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel purchase/i });
    fireEvent.click(cancelButton);

    expect(mockCancel).toHaveBeenCalled();
  });

  test('calls onCancel when backdrop clicked', () => {
    const mockCancel = jest.fn();

    render(
      <PurchaseConfirmModal
        isOpen={true}
        item={mockItem}
        wallet={mockWallet}
        onConfirm={() => {}}
        onCancel={mockCancel}
      />
    );

    const backdrop = screen.getByRole('dialog').parentElement;
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(mockCancel).toHaveBeenCalled();
  });

  test('displays emoji icon', () => {
    render(
      <PurchaseConfirmModal
        isOpen={true}
        item={mockItem}
        wallet={mockWallet}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('💡')).toBeInTheDocument();
  });

  test('calls onCancel when Escape key pressed', () => {
    const mockCancel = jest.fn();

    render(
      <PurchaseConfirmModal
        isOpen={true}
        item={mockItem}
        wallet={mockWallet}
        onConfirm={() => {}}
        onCancel={mockCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockCancel).toHaveBeenCalled();
  });
});
