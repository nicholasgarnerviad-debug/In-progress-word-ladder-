import {
  isInCatchUpPeriod,
  shouldResetDailyCoins,
  resetDailyCoins,
  shouldResetWeeklyCoins,
  resetWeeklyCoins,
  canEarnCoins,
  enforceDailyCap,
  updateStreak,
  qualifiesForWeeklyBonus,
} from '../capAndStreaks';
import { Wallet } from '../wallet';

describe('capAndStreaks', () => {
  const NOW = Date.now();
  const ONE_DAY_MS = 86400000;
  const SEVEN_DAYS_MS = ONE_DAY_MS * 7;

  describe('isInCatchUpPeriod', () => {
    it('returns true if account age < 7 days', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 0,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW - ONE_DAY_MS * 3, // 3 days ago
      };
      expect(isInCatchUpPeriod(wallet)).toBe(true);
    });

    it('returns false if account age >= 7 days', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 0,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW - SEVEN_DAYS_MS - ONE_DAY_MS, // 8 days ago
      };
      expect(isInCatchUpPeriod(wallet)).toBe(false);
    });

    it('returns false at exactly 7 day boundary', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 0,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW - SEVEN_DAYS_MS,
      };
      expect(isInCatchUpPeriod(wallet)).toBe(false);
    });
  });

  describe('shouldResetDailyCoins', () => {
    it('returns true if more than 24 hours have passed', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 50,
        lastDailyResetAt: NOW - ONE_DAY_MS - 1000, // 24h + 1s ago
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW,
      };
      expect(shouldResetDailyCoins(wallet)).toBe(true);
    });

    it('returns false if less than 24 hours have passed', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 50,
        lastDailyResetAt: NOW - ONE_DAY_MS + 1000, // 24h - 1s ago
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW,
      };
      expect(shouldResetDailyCoins(wallet)).toBe(false);
    });
  });

  describe('resetDailyCoins', () => {
    it('resets dailyCoinsEarned to 0', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 75,
        lastDailyResetAt: NOW - ONE_DAY_MS,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW,
      };
      const reset = resetDailyCoins(wallet);
      expect(reset.dailyCoinsEarned).toBe(0);
    });

    it('updates lastDailyResetAt to current time', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 75,
        lastDailyResetAt: NOW - ONE_DAY_MS,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW,
      };
      const reset = resetDailyCoins(wallet);
      expect(reset.lastDailyResetAt).toBeGreaterThanOrEqual(NOW);
      expect(reset.lastDailyResetAt).toBeLessThan(NOW + 1000);
    });

    it('does not modify other wallet fields', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 50,
        level: 2,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 75,
        lastDailyResetAt: NOW - ONE_DAY_MS,
        weeklyCoinsEarned: 200,
        lastWeeklyResetAt: NOW,
        currentStreak: 5,
        bestStreak: 10,
        lastEarnedAt: NOW,
        joinedAt: NOW - SEVEN_DAYS_MS,
      };
      const reset = resetDailyCoins(wallet);
      expect(reset.coins).toBe(100);
      expect(reset.xp).toBe(50);
      expect(reset.level).toBe(2);
      expect(reset.weeklyCoinsEarned).toBe(200);
      expect(reset.currentStreak).toBe(5);
    });
  });

  describe('shouldResetWeeklyCoins', () => {
    it('returns true if Monday 00:00 UTC has passed since reset', () => {
      // Last reset: Wednesday
      const lastReset = NOW - ONE_DAY_MS * 5; // 5 days ago
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 0,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: lastReset,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW,
      };
      expect(shouldResetWeeklyCoins(wallet)).toBe(true);
    });

    it('returns false if Monday 00:00 UTC has not passed yet', () => {
      // Last reset: this Monday
      const now = Date.now();
      const dayOfWeek = new Date(now).getUTCDay();
      const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // Sun=0, Mon=1
      const nextMonday = now + daysUntilNextMonday * ONE_DAY_MS;

      if (nextMonday > now + ONE_DAY_MS * 7) {
        // Skip this test if we're very close to Monday transition
        expect(true).toBe(true);
      } else {
        const wallet: Wallet = {
          coins: 100,
          xp: 0,
          level: 1,
          lifetimeCoinsEarned: 0,
          lifetimeCoinsSpent: 0,
          lifetimeXpEarned: 0,
          lastUpdatedAt: new Date().toISOString(),
          dailyCoinsEarned: 0,
          lastDailyResetAt: NOW,
          weeklyCoinsEarned: 0,
          lastWeeklyResetAt: now,
          currentStreak: 0,
          bestStreak: 0,
          lastEarnedAt: NOW,
          joinedAt: NOW,
        };
        expect(shouldResetWeeklyCoins(wallet)).toBe(false);
      }
    });
  });

  describe('resetWeeklyCoins', () => {
    it('resets weeklyCoinsEarned to 0', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 0,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 150,
        lastWeeklyResetAt: NOW - ONE_DAY_MS * 7,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW,
      };
      const reset = resetWeeklyCoins(wallet);
      expect(reset.weeklyCoinsEarned).toBe(0);
    });

    it('updates lastWeeklyResetAt to current time', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 0,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 150,
        lastWeeklyResetAt: NOW - ONE_DAY_MS * 7,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW,
      };
      const reset = resetWeeklyCoins(wallet);
      expect(reset.lastWeeklyResetAt).toBeGreaterThanOrEqual(NOW);
    });

    it('preserves other wallet fields', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 50,
        level: 2,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 30,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 150,
        lastWeeklyResetAt: NOW - ONE_DAY_MS * 7,
        currentStreak: 5,
        bestStreak: 10,
        lastEarnedAt: NOW,
        joinedAt: NOW,
      };
      const reset = resetWeeklyCoins(wallet);
      expect(reset.coins).toBe(100);
      expect(reset.dailyCoinsEarned).toBe(30);
      expect(reset.currentStreak).toBe(5);
    });
  });

  describe('canEarnCoins', () => {
    it('returns true if in catch-up period', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 90,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW - ONE_DAY_MS * 2, // 2 days old (in catch-up)
      };
      expect(canEarnCoins(wallet, 20)).toBe(true); // Would exceed cap but in catch-up
    });

    it('returns false if at daily cap', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 100,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW - SEVEN_DAYS_MS - ONE_DAY_MS, // Old account
      };
      expect(canEarnCoins(wallet, 1)).toBe(false);
    });

    it('returns true if under daily cap', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 70,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW - SEVEN_DAYS_MS - ONE_DAY_MS, // Old account
      };
      expect(canEarnCoins(wallet, 20)).toBe(true);
    });

    it('returns false if earning would exceed cap', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 90,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW - SEVEN_DAYS_MS - ONE_DAY_MS, // Old account
      };
      expect(canEarnCoins(wallet, 20)).toBe(false);
    });
  });

  describe('enforceDailyCap', () => {
    it('returns full amount if in catch-up period', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 90,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW - ONE_DAY_MS, // 1 day old (in catch-up)
      };
      expect(enforceDailyCap(wallet, 20)).toBe(20);
    });

    it('caps coins if would exceed 100', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 90,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW - SEVEN_DAYS_MS - ONE_DAY_MS, // Old account
      };
      expect(enforceDailyCap(wallet, 20)).toBe(10); // 100 - 90
    });

    it('returns 0 if already at cap', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 100,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW - SEVEN_DAYS_MS - ONE_DAY_MS, // Old account
      };
      expect(enforceDailyCap(wallet, 20)).toBe(0);
    });

    it('returns full amount if under cap', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 50,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 0,
        bestStreak: 0,
        lastEarnedAt: NOW,
        joinedAt: NOW - SEVEN_DAYS_MS - ONE_DAY_MS, // Old account
      };
      expect(enforceDailyCap(wallet, 30)).toBe(30);
    });
  });

  describe('updateStreak', () => {
    it('increments streak when coins earned today', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 10,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 3,
        bestStreak: 5,
        lastEarnedAt: NOW - ONE_DAY_MS,
        joinedAt: NOW,
      };
      const updated = updateStreak(wallet, 10);
      expect(updated.currentStreak).toBe(4);
    });

    it('updates bestStreak if currentStreak exceeds it', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 10,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 10,
        bestStreak: 9,
        lastEarnedAt: NOW - ONE_DAY_MS,
        joinedAt: NOW,
      };
      const updated = updateStreak(wallet, 10);
      expect(updated.bestStreak).toBe(11);
    });

    it('resets streak if 0 coins earned today and lastEarnedAt was previous day', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 0,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 5,
        bestStreak: 5,
        lastEarnedAt: NOW - ONE_DAY_MS * 2, // 2 days ago
        joinedAt: NOW,
      };
      const updated = updateStreak(wallet, 0);
      expect(updated.currentStreak).toBe(0);
    });

    it('does not reset streak if lastEarnedAt is today', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 0,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 5,
        bestStreak: 5,
        lastEarnedAt: NOW - 1000, // A few seconds ago (same day)
        joinedAt: NOW,
      };
      const updated = updateStreak(wallet, 0);
      expect(updated.currentStreak).toBe(5);
    });

    it('updates lastEarnedAt when coins earned', () => {
      const wallet: Wallet = {
        coins: 100,
        xp: 0,
        level: 1,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        lifetimeXpEarned: 0,
        lastUpdatedAt: new Date().toISOString(),
        dailyCoinsEarned: 10,
        lastDailyResetAt: NOW,
        weeklyCoinsEarned: 0,
        lastWeeklyResetAt: NOW,
        currentStreak: 2,
        bestStreak: 5,
        lastEarnedAt: NOW - ONE_DAY_MS * 3,
        joinedAt: NOW,
      };
      const updated = updateStreak(wallet, 10);
      expect(updated.lastEarnedAt).toBeGreaterThanOrEqual(NOW);
    });
  });

  describe('qualifiesForWeeklyBonus', () => {
    it('returns true if 5+ days have earnings', () => {
      expect(qualifiesForWeeklyBonus(undefined as any, 5)).toBe(true);
      expect(qualifiesForWeeklyBonus(undefined as any, 6)).toBe(true);
      expect(qualifiesForWeeklyBonus(undefined as any, 7)).toBe(true);
    });

    it('returns false if < 5 days have earnings', () => {
      expect(qualifiesForWeeklyBonus(undefined as any, 4)).toBe(false);
      expect(qualifiesForWeeklyBonus(undefined as any, 0)).toBe(false);
      expect(qualifiesForWeeklyBonus(undefined as any, 1)).toBe(false);
    });
  });
});
