import { loadWallet, saveWallet, earnCoins, spendCoins, addXp, getDefaultWallet, migrateWallet } from './wallet';

describe('Wallet', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default wallet (150 coins, 0 xp, level 1) when empty', () => {
    const wallet = loadWallet();
    expect(wallet.coins).toBe(150);
    expect(wallet.xp).toBe(0);
    expect(wallet.level).toBe(1);
  });

  it('persists wallet to localStorage', () => {
    const wallet = {
      coins: 200,
      xp: 50,
      level: 1,
      lifetimeCoinsEarned: 50,
      lifetimeCoinsSpent: 0,
      lifetimeXpEarned: 50,
      lastUpdatedAt: new Date().toISOString(),
    };
    saveWallet(wallet);
    const loaded = loadWallet();
    expect(loaded.coins).toBe(200);
    expect(loaded.xp).toBe(50);
  });

  it('earnCoins increments balance and returns updated wallet', () => {
    const wallet = getDefaultWallet();
    const updated = earnCoins(wallet, 50, 'admin_grant');
    expect(updated.coins).toBe(200); // 150 default + 50
    expect(updated.lifetimeCoinsEarned).toBe(50);
  });

  it('spendCoins decrements balance, cannot go negative', () => {
    const wallet = getDefaultWallet();
    const updated = spendCoins(wallet, 300, 'admin_grant');
    expect(updated.coins).toBe(0);
    expect(updated.lifetimeCoinsSpent).toBe(150);
  });

  it('addXp increments xp and computes level', () => {
    const wallet = getDefaultWallet();
    const result = addXp(wallet, 100, 'puzzle_solve_easy');
    expect(result.newState.xp).toBe(100);
    expect(result.leveledUp).toBe(false);
    expect(result.rewards).toHaveLength(0);
  });

  it('addXp triggers level-up at 300 XP (level 2)', () => {
    const wallet = getDefaultWallet();
    const result = addXp(wallet, 300, 'puzzle_solve_easy');
    expect(result.newState.xp).toBe(300);
    expect(result.newState.level).toBe(2);
    expect(result.leveledUp).toBe(true);
    expect(result.rewards).toHaveLength(1);
    expect(result.rewards[0].level).toBe(2);
  });

  it('addXp tracks lifetimeXpEarned', () => {
    const wallet = getDefaultWallet();
    const result = addXp(wallet, 100, 'puzzle_solve_easy');
    expect(result.newState.lifetimeXpEarned).toBe(100);
  });

  test('wallet includes dailyBonusClaimedAt field', () => {
    const wallet = getDefaultWallet();
    expect(wallet).toHaveProperty('dailyBonusClaimedAt');
    expect(typeof wallet.dailyBonusClaimedAt).toBe('number');
  });

  test('migration preserves dailyBonusClaimedAt', () => {
    const old = { coins: 100 };
    const migrated = migrateWallet(old);
    expect(migrated).toHaveProperty('dailyBonusClaimedAt');
    expect(typeof migrated.dailyBonusClaimedAt).toBe('number');
  });
});
