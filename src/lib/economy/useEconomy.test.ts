import { renderHook, act } from '@testing-library/react';
import { useEconomy } from './useEconomy';

describe('useEconomy', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default wallet (150 coins, 0 xp)', () => {
    const { result } = renderHook(() => useEconomy());
    expect(result.current.coins).toBe(150);
    expect(result.current.xp).toBe(0);
  });

  it('earnCoins increases balance', () => {
    const { result } = renderHook(() => useEconomy());
    act(() => {
      result.current.earnCoins(50, 'test');
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

  it('addXp increases xp', () => {
    const { result } = renderHook(() => useEconomy());
    act(() => {
      result.current.addXp(50, 'test');
    });
    expect(result.current.xp).toBe(50);
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
});
