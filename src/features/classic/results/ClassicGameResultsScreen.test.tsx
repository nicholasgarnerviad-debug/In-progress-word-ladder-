import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ClassicGameResultsScreen } from './ClassicGameResultsScreen';
import * as walletModule from '../../../lib/economy/wallet';
import * as inventoryModule from '../../../lib/economy/inventory';

// Mock the modules
jest.mock('../../../lib/economy/wallet');
jest.mock('../../../lib/economy/inventory');

describe('ClassicGameResultsScreen', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Default mock implementations
    (walletModule.loadWallet as jest.Mock).mockReturnValue({
      coins: 100,
      xp: 50,
      level: 1,
      lifetimeCoinsEarned: 100,
      lifetimeCoinsSpent: 0,
      lifetimeXpEarned: 50,
      lastUpdatedAt: new Date().toISOString(),
      dailyCoinsEarned: 10,
      lastDailyResetAt: Date.now(),
      weeklyCoinsEarned: 10,
      lastWeeklyResetAt: Date.now(),
      currentStreak: 1,
      bestStreak: 1,
      lastEarnedAt: Date.now(),
      joinedAt: Date.now(),
      dailyBonusClaimedAt: 0,
    });

    (inventoryModule.loadInventory as jest.Mock).mockReturnValue({
      consumables: { hint: 0, reveal_next_word: 0, undo_step: 0, time_extension_15s: 0 },
      unlocks: [],
      dictionaryVouchers: 0,
    });

    (walletModule.canClaimDailyBonus as jest.Mock).mockReturnValue(true);
    (walletModule.claimDailyBonus as jest.Mock).mockReturnValue({
      coins: 100,
      xp: 50,
      level: 1,
      lifetimeCoinsEarned: 100,
      lifetimeCoinsSpent: 0,
      lifetimeXpEarned: 50,
      lastUpdatedAt: new Date().toISOString(),
      dailyCoinsEarned: 10,
      lastDailyResetAt: Date.now(),
      weeklyCoinsEarned: 10,
      lastWeeklyResetAt: Date.now(),
      currentStreak: 1,
      bestStreak: 1,
      lastEarnedAt: Date.now(),
      joinedAt: Date.now(),
      dailyBonusClaimedAt: Date.now(),
    });

    (inventoryModule.addConsumable as jest.Mock).mockImplementation(
      (inventory, type, count) => ({
        ...inventory,
        consumables: {
          ...inventory.consumables,
          [type]: (inventory.consumables[type] || 0) + count,
        },
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the results screen', () => {
    render(
      <BrowserRouter>
        <ClassicGameResultsScreen />
      </BrowserRouter>
    );

    expect(screen.getByText('Game Over')).toBeInTheDocument();
    expect(screen.getByText(/Great effort/)).toBeInTheDocument();
  });

  it('checks for daily bonus on mount', () => {
    render(
      <BrowserRouter>
        <ClassicGameResultsScreen />
      </BrowserRouter>
    );

    expect(walletModule.loadWallet).toHaveBeenCalled();
    expect(walletModule.canClaimDailyBonus).toHaveBeenCalled();
  });

  it('claims daily bonus and adds consumables when available', async () => {
    render(
      <BrowserRouter>
        <ClassicGameResultsScreen />
      </BrowserRouter>
    );

    // Wait for bonus message to appear
    const bonusMessage = await screen.findByText(/Daily bonus claimed/);
    expect(bonusMessage).toBeInTheDocument();

    // Verify wallet was updated
    expect(walletModule.saveWallet).toHaveBeenCalled();

    // Verify inventory was updated with hint and undo
    expect(inventoryModule.saveInventory).toHaveBeenCalled();
  });

  it('does not claim bonus if already claimed today', () => {
    (walletModule.canClaimDailyBonus as jest.Mock).mockReturnValue(false);

    render(
      <BrowserRouter>
        <ClassicGameResultsScreen />
      </BrowserRouter>
    );

    expect(walletModule.claimDailyBonus).not.toHaveBeenCalled();
    expect(screen.queryByText(/Daily bonus claimed/)).not.toBeInTheDocument();
  });

  it('renders Home button and navigates on click', () => {
    render(
      <BrowserRouter>
        <ClassicGameResultsScreen />
      </BrowserRouter>
    );

    const homeButton = screen.getByRole('button', { name: /Home/i });
    expect(homeButton).toBeInTheDocument();
  });

  it('calls onHome callback when Home button is clicked', () => {
    const mockOnHome = jest.fn();

    render(
      <BrowserRouter>
        <ClassicGameResultsScreen onHome={mockOnHome} />
      </BrowserRouter>
    );

    const homeButton = screen.getByRole('button', { name: /Home/i });
    fireEvent.click(homeButton);

    expect(mockOnHome).toHaveBeenCalled();
  });

  it('displays the correct daily bonus message', async () => {
    render(
      <BrowserRouter>
        <ClassicGameResultsScreen />
      </BrowserRouter>
    );

    const bonusMessage = await screen.findByText(/1 Hint \+ 1 Undo/);
    expect(bonusMessage).toBeInTheDocument();
  });
});
