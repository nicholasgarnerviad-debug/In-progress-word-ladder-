import { renderHook, act } from '@testing-library/react';
import { useEconomy } from './useEconomy';

describe('useEconomy', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default wallet (150 coins, 0 xp, level 1)', () => {
    const { result } = renderHook(() => useEconomy());
    expect(result.current.coins).toBe(150);
    expect(result.current.xp).toBe(0);
    expect(result.current.level).toBe(1);
  });

  it('earnCoins increases balance', () => {
    const { result } = renderHook(() => useEconomy());
    act(() => {
      result.current.earnCoins(50, 'classic_solve');
    });
    expect(result.current.coins).toBe(200);
  });

  it('spend returns true if sufficient coins and decreases balance', () => {
    const { result } = renderHook(() => useEconomy());
    let success = false;
    act(() => {
      success = result.current.spend(50);
    });
    expect(success).toBe(true);
    expect(result.current.coins).toBe(100);
  });

  it('spend returns false if insufficient coins', () => {
    const { result } = renderHook(() => useEconomy());
    let success = false;
    act(() => {
      success = result.current.spend(300);
    });
    expect(success).toBe(false);
    expect(result.current.coins).toBe(150);
  });

  it('addXp increases xp and returns result', () => {
    const { result } = renderHook(() => useEconomy());
    let xpResult: any;
    act(() => {
      xpResult = result.current.addXp(50, 'puzzle_solve_easy');
    });
    expect(result.current.xp).toBe(50);
    expect(xpResult.leveledUp).toBe(false);
    expect(xpResult.rewards).toEqual([]);
  });

  it('addXp triggers level-up and returns rewards', () => {
    const { result } = renderHook(() => useEconomy());
    let xpResult: any;
    act(() => {
      xpResult = result.current.addXp(300, 'puzzle_solve_hard');
    });
    expect(result.current.xp).toBe(300);
    expect(result.current.level).toBe(2);
    expect(xpResult.leveledUp).toBe(true);
    expect(xpResult.rewards).toHaveLength(1);
  });

  it('buyConsumable spends coins and adds item to inventory', () => {
    const { result } = renderHook(() => useEconomy());
    let success = false;
    act(() => {
      success = result.current.buyConsumable('hint', 30, 5);
    });
    expect(success).toBe(true);
    expect(result.current.coins).toBe(120); // 150 - 30
    expect(result.current.inventory['hint']).toBe(5);
  });

  it('buyConsumable returns false if insufficient coins', () => {
    const { result } = renderHook(() => useEconomy());
    let success = false;
    act(() => {
      success = result.current.buyConsumable('hint', 200, 5);
    });
    expect(success).toBe(false);
    expect(result.current.coins).toBe(150);
    expect(result.current.getCount('hint')).toBe(0);
  });

  it('useItem decrements consumable count', () => {
    const { result } = renderHook(() => useEconomy());
    act(() => {
      result.current.buyConsumable('hint', 30, 5);
    });
    let used = false;
    act(() => {
      used = result.current.useItem('hint');
    });
    expect(used).toBe(true);
    expect(result.current.getCount('hint')).toBe(4);
  });

  it('useItem returns false if no consumables left', () => {
    const { result } = renderHook(() => useEconomy());
    let used = false;
    act(() => {
      used = result.current.useItem('hint');
    });
    expect(used).toBe(false);
  });

  describe('Level-up rewards integration', () => {
    it('earnXp(300) from 0 -> level 2 applies level 2 reward atomically', () => {
      const { result } = renderHook(() => useEconomy());
      let xpResult: any;

      act(() => {
        xpResult = result.current.addXp(300, 'puzzle_solve_easy');
      });

      // Verify level-up occurred
      expect(result.current.level).toBe(2);
      expect(result.current.xp).toBe(300);
      expect(xpResult.leveledUp).toBe(true);
      expect(xpResult.rewards).toHaveLength(1);

      // Verify level 2 reward (50 coins + sprout badge)
      expect(xpResult.rewards[0].level).toBe(2);
      expect(xpResult.rewards[0].coins).toBe(50);
      expect(xpResult.rewards[0].description).toBe('Sprout badge earned!');

      // Verify coins were added
      expect(result.current.coins).toBe(200); // 150 + 50

      // Verify badge unlock was applied
      const inventory = localStorage.getItem('wordLadder.inventory');
      const parsed = JSON.parse(inventory!);
      expect(parsed.unlocks).toContain('badge_sprout');
    });

    it('earnXp(700) from 0 -> levels 2 and 3 applies multiple rewards atomically', () => {
      const { result } = renderHook(() => useEconomy());
      let xpResult: any;

      act(() => {
        xpResult = result.current.addXp(700, 'puzzle_solve_hard');
      });

      // Verify multi-level up
      expect(result.current.level).toBe(3);
      expect(result.current.xp).toBe(700);
      expect(xpResult.leveledUp).toBe(true);
      expect(xpResult.rewards).toHaveLength(2);

      // Verify level 2 reward
      expect(xpResult.rewards[0].level).toBe(2);
      expect(xpResult.rewards[0].coins).toBe(50);

      // Verify level 3 reward
      expect(xpResult.rewards[1].level).toBe(3);
      expect(xpResult.rewards[1].coins).toBe(75);

      // Verify total coins: 150 + 50 + 75 = 275
      expect(result.current.coins).toBe(275);

      // Verify both badge and consumables applied
      const inventory = localStorage.getItem('wordLadder.inventory');
      const parsed = JSON.parse(inventory!);
      expect(parsed.unlocks).toContain('badge_sprout');
      expect(parsed.consumables.hint).toBe(3); // Level 3 gives +3 hints
    });

    it('earnXp(1500) from 0 -> levels 2,3,5 applies coins+modes+badges atomically', () => {
      const { result } = renderHook(() => useEconomy());
      let xpResult: any;

      act(() => {
        xpResult = result.current.addXp(1500, 'time_attack_run');
      });

      // Verify level reached
      expect(result.current.level).toBe(5);
      expect(xpResult.leveledUp).toBe(true);
      expect(xpResult.rewards).toHaveLength(3);

      // Verify rewards: level 2 (50), level 3 (75), level 5 (200) = 325 total
      expect(result.current.coins).toBe(475); // 150 + 325

      // Verify all unlocks applied
      const inventory = localStorage.getItem('wordLadder.inventory');
      const parsed = JSON.parse(inventory!);

      // Badges: sprout (level 2), apprentice (level 5)
      expect(parsed.unlocks).toContain('badge_sprout');
      expect(parsed.unlocks).toContain('badge_apprentice');

      // Mode from level 5
      expect(parsed.unlocks).toContain('mode_practice');

      // Consumables from level 3
      expect(parsed.consumables.hint).toBe(3);
    });

    it('earnXp without leveling applies no rewards', () => {
      const { result } = renderHook(() => useEconomy());
      let xpResult: any;

      act(() => {
        xpResult = result.current.addXp(100, 'puzzle_solve_easy');
      });

      // No level-up
      expect(result.current.level).toBe(1);
      expect(xpResult.leveledUp).toBe(false);
      expect(xpResult.rewards).toHaveLength(0);

      // Coins unchanged
      expect(result.current.coins).toBe(150);

      // Inventory empty
      const inventory = localStorage.getItem('wordLadder.inventory');
      const parsed = JSON.parse(inventory!);
      expect(parsed.unlocks).toHaveLength(0);
      expect(parsed.consumables.hint).toBe(0);
    });

    it('earnXp preserves previous unlocks when applying new rewards', () => {
      const { result } = renderHook(() => useEconomy());

      // First level-up to level 2 (need 300 XP)
      act(() => {
        result.current.addXp(300, 'puzzle_solve_easy');
      });
      expect(result.current.level).toBe(2);

      // Second level-up to level 3 (need 600 total XP, so add 300 more)
      act(() => {
        result.current.addXp(300, 'puzzle_solve_medium');
      });
      expect(result.current.level).toBe(3);

      // Verify both unlocks are present
      const inventory = localStorage.getItem('wordLadder.inventory');
      const parsed = JSON.parse(inventory!);
      expect(parsed.unlocks).toContain('badge_sprout');
      expect(parsed.consumables.hint).toBe(3);
    });

    it('earnXp returns reward with correct description', () => {
      const { result } = renderHook(() => useEconomy());
      let xpResult: any;

      act(() => {
        xpResult = result.current.addXp(300, 'puzzle_solve_easy');
      });

      expect(xpResult.rewards[0].description).toBe('Sprout badge earned!');
    });

    it('earnXp applies dictionary vouchers correctly', () => {
      const { result } = renderHook(() => useEconomy());
      let xpResult: any;

      // Level 12 gives dictionary voucher (need 7800 XP: 100 * 12 * 13 / 2)
      act(() => {
        xpResult = result.current.addXp(7800, 'puzzle_solve_hard');
      });

      expect(result.current.level).toBe(12);

      // Verify dictionary vouchers were added
      const inventory = localStorage.getItem('wordLadder.inventory');
      const parsed = JSON.parse(inventory!);
      expect(parsed.dictionaryVouchers).toBe(1);
    });

    it('wallet and inventory persist atomically on level-up', () => {
      const { result } = renderHook(() => useEconomy());

      act(() => {
        result.current.addXp(300, 'puzzle_solve_easy');
      });

      // Verify wallet persisted correctly
      const wallet = localStorage.getItem('wordLadder.wallet');
      const parsedWallet = JSON.parse(wallet!);
      expect(parsedWallet.coins).toBe(200);
      expect(parsedWallet.level).toBe(2);
      expect(parsedWallet.xp).toBe(300);

      // Verify inventory persisted correctly
      const inventory = localStorage.getItem('wordLadder.inventory');
      const parsedInventory = JSON.parse(inventory!);
      expect(parsedInventory.unlocks).toContain('badge_sprout');

      // Both should have been updated together
      expect(parsedWallet.lastUpdatedAt).toBeDefined();
    });
  });

  describe('earnCoinsWithCap (cap and streak integration)', () => {
    it('adds coins to wallet when under daily cap', () => {
      const { result } = renderHook(() => useEconomy());

      act(() => {
        result.current.earnCoins(10, 'classic_solve');
      });

      expect(result.current.coins).toBe(160); // 150 + 10
      const wallet = localStorage.getItem('wordLadder.wallet');
      const parsed = JSON.parse(wallet!);
      expect(parsed.dailyCoinsEarned).toBe(10);
    });

    it('caps coins at 100 per day for old accounts', () => {
      // Pre-set old account in localStorage before rendering
      const oldAccountTime = Date.now() - 86400000 * 10;
      const oldWallet = {
        coins: 150,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 0,
        lastDailyResetAt: Date.now(),
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: Date.now(),
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: 0,
        joinedAt: oldAccountTime,
      };
      localStorage.setItem('wordLadder.wallet', JSON.stringify(oldWallet));

      const { result } = renderHook(() => useEconomy());

      // Try to earn 90 coins, then 20 more (should be capped to 10)
      act(() => {
        result.current.earnCoins(90, 'classic_solve');
      });
      expect(result.current.coins).toBe(240); // 150 + 90

      act(() => {
        result.current.earnCoins(20, 'classic_solve');
      });
      const wallet = localStorage.getItem('wordLadder.wallet');
      const parsed = JSON.parse(wallet!);
      expect(parsed.dailyCoinsEarned).toBe(100); // 90 + 10 (capped)
      expect(result.current.coins).toBe(250); // 240 + 10 (capped)
    });

    it('increments streak when coins earned', () => {
      const { result } = renderHook(() => useEconomy());

      act(() => {
        result.current.earnCoins(10, 'classic_solve');
      });

      const wallet = localStorage.getItem('wordLadder.wallet');
      const parsed = JSON.parse(wallet!);
      expect(parsed.currentStreak).toBe(1);
    });

    it('does not cap coins during catch-up period (first 7 days)', () => {
      const { result } = renderHook(() => useEconomy());

      act(() => {
        result.current.earnCoins(90, 'classic_solve');
      });
      expect(result.current.coins).toBe(240); // 150 + 90

      act(() => {
        result.current.earnCoins(30, 'classic_solve'); // 120 total, would exceed cap but in catch-up
      });
      expect(result.current.coins).toBe(270); // 240 + 30 (no cap during catch-up)
    });

    it('resets daily coins when 24+ hours have passed', () => {
      const { result } = renderHook(() => useEconomy());

      act(() => {
        result.current.earnCoins(50, 'classic_solve');
      });
      let wallet = localStorage.getItem('wordLadder.wallet');
      let parsed = JSON.parse(wallet!);
      expect(parsed.dailyCoinsEarned).toBe(50);

      // Simulate time passing to next day
      act(() => {
        const walletData = JSON.parse(localStorage.getItem('wordLadder.wallet')!);
        walletData.lastDailyResetAt = Date.now() - 86400000 - 1000; // Past 24h
        localStorage.setItem('wordLadder.wallet', JSON.stringify(walletData));
      });

      act(() => {
        result.current.earnCoins(10, 'classic_solve');
      });

      wallet = localStorage.getItem('wordLadder.wallet');
      parsed = JSON.parse(wallet!);
      // Should have reset to 0 and then added 10
      expect(parsed.dailyCoinsEarned).toBe(10);
    });

    it('does not earn coins when 0 coins passed after cap', () => {
      // Set up: old account, at cap
      const oldAccountTime = Date.now() - 86400000 * 10;
      const oldWallet = {
        coins: 150,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 100,
        lastDailyResetAt: Date.now(),
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: Date.now(),
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: 0,
        joinedAt: oldAccountTime,
      };
      localStorage.setItem('wordLadder.wallet', JSON.stringify(oldWallet));

      const { result } = renderHook(() => useEconomy());

      const initialCoins = result.current.coins;
      act(() => {
        result.current.earnCoins(10, 'classic_solve'); // Should be capped to 0
      });

      // Coins should remain unchanged (0 earned after cap)
      expect(result.current.coins).toBe(initialCoins);
    });

    it('preserves existing coin balance when earning new coins', () => {
      const { result } = renderHook(() => useEconomy());

      act(() => {
        result.current.earnCoins(100, 'classic_solve');
      });
      expect(result.current.coins).toBe(250); // 150 + 100

      act(() => {
        result.current.earnCoins(25, 'classic_solve');
      });

      expect(result.current.coins).toBe(275); // 250 + 25
    });

    it('returns early if 0 coins earned after cap', () => {
      // Set old account at cap
      const oldAccountTime = Date.now() - 86400000 * 10;
      const oldWallet = {
        coins: 150,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 100,
        lastDailyResetAt: Date.now(),
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: Date.now(),
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: 0,
        joinedAt: oldAccountTime,
      };
      localStorage.setItem('wordLadder.wallet', JSON.stringify(oldWallet));

      const { result } = renderHook(() => useEconomy());

      const walletBefore = localStorage.getItem('wordLadder.wallet');
      const parsedBefore = JSON.parse(walletBefore!);
      const streakBefore = parsedBefore.currentStreak;

      // Try to earn coins (should be capped to 0 and return early)
      act(() => {
        result.current.earnCoins(10, 'classic_solve');
      });

      const walletAfter = localStorage.getItem('wordLadder.wallet');
      const parsedAfter = JSON.parse(walletAfter!);

      // Streak should not have incremented
      expect(parsedAfter.currentStreak).toBe(streakBefore);
      expect(parsedAfter.dailyCoinsEarned).toBe(100);
    });
  });
});
