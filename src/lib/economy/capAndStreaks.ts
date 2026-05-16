import { Wallet } from './wallet';

const ONE_DAY_MS = 86400000; // 24 hours in milliseconds
const SEVEN_DAYS_MS = ONE_DAY_MS * 7;
const DAILY_CAP = 100;
const WEEKLY_BONUS = 50;
const MINIMUM_DAYS_FOR_BONUS = 5;

/**
 * Check if account is in the first 7 days (catch-up period with no daily cap).
 */
export function isInCatchUpPeriod(wallet: Wallet): boolean {
  const accountAge = Date.now() - wallet.joinedAt;
  return accountAge < SEVEN_DAYS_MS;
}

/**
 * Check if daily coin reset is needed (24+ hours since last reset).
 */
export function shouldResetDailyCoins(wallet: Wallet): boolean {
  return Date.now() > wallet.lastDailyResetAt + ONE_DAY_MS;
}

/**
 * Reset daily coin counter (called when new day starts).
 */
export function resetDailyCoins(wallet: Wallet): Wallet {
  return {
    ...wallet,
    dailyCoinsEarned: 0,
    lastDailyResetAt: Date.now(),
  };
}

/**
 * Check if weekly coin reset is needed (Monday 00:00 UTC crossed since last reset).
 */
export function shouldResetWeeklyCoins(wallet: Wallet): boolean {
  const now = Date.now();
  const lastResetDate = new Date(wallet.lastWeeklyResetAt);

  // Calculate the Monday of current week (Monday 00:00 UTC)
  const nowDate = new Date(now);
  const nowDayOfWeek = nowDate.getUTCDay();
  const daysSinceMonday = nowDayOfWeek === 0 ? 6 : nowDayOfWeek - 1;
  const mondayThisWeek = now - daysSinceMonday * ONE_DAY_MS;

  // Reset needed if lastWeeklyResetAt is before this Monday
  return wallet.lastWeeklyResetAt < mondayThisWeek;
}

/**
 * Reset weekly coin counter (called when Monday 00:00 UTC occurs).
 */
export function resetWeeklyCoins(wallet: Wallet): Wallet {
  return {
    ...wallet,
    weeklyCoinsEarned: 0,
    lastWeeklyResetAt: Date.now(),
  };
}

/**
 * Check if player can earn the requested coins (respects daily cap if not in catch-up).
 */
export function canEarnCoins(wallet: Wallet, coinsToEarn: number): boolean {
  if (isInCatchUpPeriod(wallet)) {
    return true; // No cap during catch-up
  }
  return wallet.dailyCoinsEarned + coinsToEarn <= DAILY_CAP;
}

/**
 * Enforce daily cap: return the amount of coins actually earned after cap applied.
 */
export function enforceDailyCap(wallet: Wallet, coinsToEarn: number): number {
  if (isInCatchUpPeriod(wallet)) {
    return coinsToEarn;
  }

  const remaining = DAILY_CAP - wallet.dailyCoinsEarned;
  return Math.max(0, Math.min(coinsToEarn, remaining));
}

/**
 * Update streak: increment on earnings, reset on missed day.
 */
export function updateStreak(wallet: Wallet, coinsEarnedToday: number): Wallet {
  let { currentStreak, bestStreak, lastEarnedAt } = wallet;

  if (coinsEarnedToday > 0) {
    // Earned coins today: increment streak
    currentStreak += 1;
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
    lastEarnedAt = Date.now();
  } else {
    // No coins earned today: check if streak should reset
    // Reset only if lastEarnedAt was from a previous day (more than 24h ago)
    const daysSinceLastEarn = (Date.now() - lastEarnedAt) / ONE_DAY_MS;
    if (daysSinceLastEarn > 1) {
      currentStreak = 0;
    }
  }

  return {
    ...wallet,
    currentStreak,
    bestStreak,
    lastEarnedAt,
  };
}

/**
 * Check if player qualifies for weekly bonus (5+ days with earnings this week).
 */
export function qualifiesForWeeklyBonus(
  wallet: Wallet,
  daysWithEarningsThisWeek: number
): boolean {
  return daysWithEarningsThisWeek >= MINIMUM_DAYS_FOR_BONUS;
}
