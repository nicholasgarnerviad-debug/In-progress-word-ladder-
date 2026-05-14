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
}

export type AddXpResult = {
  newState: Wallet;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  rewards: LevelReward[];     // empty if no level-ups
};

const WALLET_KEY = 'wordLadder.wallet';

export function getDefaultWallet(): Wallet {
  return {
    coins: 150,
    xp: 0,
    level: 1,
    lifetimeCoinsEarned: 0,
    lifetimeCoinsSpent: 0,
    lifetimeXpEarned: 0,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function loadWallet(): Wallet {
  const saved = localStorage.getItem(WALLET_KEY);
  if (!saved) {
    return getDefaultWallet();
  }
  try {
    const data = JSON.parse(saved);
    // Ensure level is computed from xp (defensive)
    return {
      ...data,
      level: computeLevel(data.xp),
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
