export interface Wallet {
  coins: number;
  xp: number;
}

const WALLET_KEY = 'wordLadder.wallet';

export function loadWallet(): Wallet {
  const saved = localStorage.getItem(WALLET_KEY);
  if (!saved) {
    return { coins: 150, xp: 0 };
  }
  return JSON.parse(saved);
}

export function saveWallet(wallet: Wallet): void {
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
}

export function earnCoins(amount: number): Wallet {
  const wallet = loadWallet();
  wallet.coins += amount;
  saveWallet(wallet);
  return wallet;
}

export function spendCoins(amount: number): Wallet {
  const wallet = loadWallet();
  wallet.coins = Math.max(0, wallet.coins - amount);
  saveWallet(wallet);
  return wallet;
}

export function earnXp(amount: number): Wallet {
  const wallet = loadWallet();
  wallet.xp += amount;
  saveWallet(wallet);
  return wallet;
}
