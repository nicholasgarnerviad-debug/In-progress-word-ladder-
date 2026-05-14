import { loadWallet, saveWallet, earnCoins, spendCoins, earnXp } from './wallet';

describe('Wallet', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default wallet (150 coins, 0 xp) when empty', () => {
    const wallet = loadWallet();
    expect(wallet.coins).toBe(150);
    expect(wallet.xp).toBe(0);
  });

  it('persists wallet to localStorage', () => {
    const wallet = { coins: 200, xp: 50 };
    saveWallet(wallet);
    const loaded = loadWallet();
    expect(loaded.coins).toBe(200);
    expect(loaded.xp).toBe(50);
  });

  it('earnCoins increments balance and persists', () => {
    earnCoins(50);
    const wallet = loadWallet();
    expect(wallet.coins).toBe(200); // 150 default + 50
  });

  it('spendCoins decrements balance, cannot go negative', () => {
    spendCoins(300);
    const wallet = loadWallet();
    expect(wallet.coins).toBe(0);
  });

  it('earnXp increments xp', () => {
    earnXp(100);
    const wallet = loadWallet();
    expect(wallet.xp).toBe(100);
  });
});
