import type { CoinSource, XpSource, LevelReward } from './types';
import { computeLevel } from './levels';
import { getRewardsBetween } from './levelRewards';

export interface Wallet {
  coins: number;
  xp: number;
  level: number;              // derived from xp, cached
  lifetimeCoinsEarned: number;
  lifetimeCoinsSpent: number;
  lifetimeXpEarned: number;
  lastUpdatedAt: string;      // ISO datetime
  // Daily/Weekly tracking
  dailyCoinsEarned: number;   // coins earned today
  lastDailyResetAt: number;   // timestamp of last daily reset
  weeklyCoinsEarned: number;  // coins earned this week
  lastWeeklyResetAt: number;  // timestamp of last weekly reset
  // Streak tracking
  currentStreak: number;      // consecutive days with earnings
  bestStreak: number;         // longest streak ever
  lastEarnedAt: number;       // timestamp of last coin earning
  // Account tracking
  joinedAt: number;           // timestamp for catch-up period detection
  dailyBonusClaimedAt: number;    // timestamp of last daily bonus claim
}

export type AddXpResult = {
  newState: Wallet;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  rewards: LevelReward[];     // empty if no level-ups
};

const WALLET_KEY = 'wordLadder.wallet';

export function migrateWallet(wallet: Partial<Wallet>): Wallet {
  const now = Date.now();
  return {
    coins: wallet.coins ?? 150,
    xp: wallet.xp ?? 0,
    level: wallet.level ?? 1,
    lifetimeCoinsEarned: wallet.lifetimeCoinsEarned ?? 0,
    lifetimeCoinsSpent: wallet.lifetimeCoinsSpent ?? 0,
    lifetimeXpEarned: wallet.lifetimeXpEarned ?? 0,
    lastUpdatedAt: wallet.lastUpdatedAt ?? new Date().toISOString(),
    dailyCoinsEarned: wallet.dailyCoinsEarned ?? 0,
    lastDailyResetAt: wallet.lastDailyResetAt ?? now,
    weeklyCoinsEarned: wallet.weeklyCoinsEarned ?? 0,
    lastWeeklyResetAt: wallet.lastWeeklyResetAt ?? now,
    currentStreak: wallet.currentStreak ?? 0,
    bestStreak: wallet.bestStreak ?? 0,
    lastEarnedAt: wallet.lastEarnedAt ?? 0,
    joinedAt: wallet.joinedAt ?? now,
    dailyBonusClaimedAt: wallet.dailyBonusClaimedAt ?? 0,
  };
}

export function getDefaultWallet(): Wallet {
  const now = Date.now();
  return {
    coins: 150,
    xp: 0,
    level: 1,
    lifetimeCoinsEarned: 0,
    lifetimeCoinsSpent: 0,
    lifetimeXpEarned: 0,
    lastUpdatedAt: new Date().toISOString(),
    dailyCoinsEarned: 0,
    lastDailyResetAt: now,
    weeklyCoinsEarned: 0,
    lastWeeklyResetAt: now,
    currentStreak: 0,
    bestStreak: 0,
    lastEarnedAt: 0,
    joinedAt: now,
    dailyBonusClaimedAt: 0,
  };
}

export function loadWallet(): Wallet {
  const saved = localStorage.getItem(WALLET_KEY);
  if (!saved) {
    return getDefaultWallet();
  }
  try {
    const data = JSON.parse(saved);
    // Migrate wallet to ensure all new fields exist
    const migrated = migrateWallet(data);
    // Ensure level is computed from xp (defensive)
    return {
      ...migrated,
      level: computeLevel(migrated.xp),
    };
  } catch {
    return getDefaultWallet();
  }
}

export function saveWallet(wallet: Wallet): void {
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
}

export function earnCoins(wallet: Wallet, amount: number, source: CoinSource): Wallet {
  const updated: Wallet = {
    ...wallet,
    coins: wallet.coins + amount,
    lifetimeCoinsEarned: wallet.lifetimeCoinsEarned + amount,
    lastUpdatedAt: new Date().toISOString(),
  };
  return updated;
}

export function spendCoins(wallet: Wallet, amount: number, source: CoinSource): Wallet {
  const spent = Math.min(amount, wallet.coins);
  return {
    ...wallet,
    coins: Math.max(0, wallet.coins - amount),
    lifetimeCoinsSpent: wallet.lifetimeCoinsSpent + spent,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function addXp(wallet: Wallet, amount: number, source: XpSource): AddXpResult {
  const oldLevel = wallet.level;
  const newXp = wallet.xp + amount;
  const newLevel = computeLevel(newXp);
  const rewards = getRewardsBetween(oldLevel, newLevel);

  const newState: Wallet = {
    ...wallet,
    xp: newXp,
    level: newLevel,
    lifetimeXpEarned: wallet.lifetimeXpEarned + amount,
    lastUpdatedAt: new Date().toISOString(),
  };

  return {
    newState,
    oldLevel,
    newLevel,
    leveledUp: newLevel > oldLevel,
    rewards,
  };
}

/**
 * Check if player can claim their daily bonus today.
 * Daily bonus resets at UTC midnight.
 */
export function canClaimDailyBonus(wallet: Wallet): boolean {
  const now = Date.now();
  if (wallet.dailyBonusClaimedAt === 0) return true; // Never claimed

  const lastClaimDate = new Date(wallet.dailyBonusClaimedAt);
  const todayDate = new Date(now);

  // Compare UTC date strings directly (YYYY-MM-DD format)
  const lastClaimUTC = lastClaimDate.toISOString().split('T')[0];
  const todayUTC = todayDate.toISOString().split('T')[0];

  return lastClaimUTC < todayUTC;
}

/**
 * Claim the daily bonus (1 Hint + 1 Undo).
 * Returns updated wallet or null if already claimed today.
 */
export function claimDailyBonus(wallet: Wallet): Wallet | null {
  if (!canClaimDailyBonus(wallet)) {
    return null;
  }

  return {
    ...wallet,
    dailyBonusClaimedAt: Date.now(),
    lastUpdatedAt: new Date().toISOString(),
  };
}
