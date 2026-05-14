# Economy System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete coin/consumable economy system enabling purchase and use of in-game assists across Classic and Time Attack modes.

**Architecture:** Three-layer system — (1) Wallet: localStorage-backed coin/XP balance; (2) Shop: consumable catalog with costs; (3) Inventory: track consumable counts per player. useEconomy hook provides the unified API. Integration points: ClassicGame (refactor existing coin system), TimeAttackPage (wire end-run rewards + consumable buttons).

**Tech Stack:** React hooks (useState, useEffect, useCallback), localStorage persistence, Jest testing.

---

## Task 1: Wallet System (localStorage persistence)

**Files:**
- Create: `src/lib/economy/wallet.ts`
- Create: `src/lib/economy/wallet.test.ts`

### Step 1: Write wallet types and tests

Create `src/lib/economy/wallet.ts` with types and persistence layer:

```typescript
// src/lib/economy/wallet.ts

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
```

### Step 2: Create wallet tests

```typescript
// src/lib/economy/wallet.test.ts

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
```

### Step 3: Run tests

```bash
npm test -- wallet.test.ts
```

Expected: All wallet tests pass.

### Step 4: Commit

```bash
git add src/lib/economy/wallet.ts src/lib/economy/wallet.test.ts
git commit -m "feat: add wallet system with localStorage persistence"
```

---

## Task 2: Shop System (consumable catalog)

**Files:**
- Create: `src/lib/economy/shop.ts`
- Create: `src/lib/economy/shop.test.ts`

### Step 1: Define shop types and catalog

```typescript
// src/lib/economy/shop.ts

export type ConsumableType = 
  | 'hint'
  | 'reveal_next_word'
  | 'undo_step'
  | 'time_extension_15s';

export interface ShopItem {
  id: string;
  consumableType: ConsumableType;
  name: string;
  description: string;
  cost: number;
  consumableCount: number;
  category: 'assists' | 'time_bonuses';
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'hint-5pack',
    consumableType: 'hint',
    name: 'Hints',
    description: 'Reveal one letter of the next word',
    cost: 30,
    consumableCount: 5,
    category: 'assists'
  },
  {
    id: 'reveal-3pack',
    consumableType: 'reveal_next_word',
    name: 'Reveal Next Word',
    description: 'See the entire next word on the ladder',
    cost: 60,
    consumableCount: 3,
    category: 'assists'
  },
  {
    id: 'undo-3pack',
    consumableType: 'undo_step',
    name: 'Undo Step',
    description: 'Take back your last word (Time Attack only)',
    cost: 25,
    consumableCount: 3,
    category: 'assists'
  },
  {
    id: 'time-5pack',
    consumableType: 'time_extension_15s',
    name: '+15 Seconds',
    description: 'Add 15 seconds to your timer',
    cost: 40,
    consumableCount: 5,
    category: 'time_bonuses'
  }
];

export function getShopItem(consumableType: ConsumableType): ShopItem | undefined {
  return SHOP_ITEMS.find(item => item.consumableType === consumableType);
}

export function getItemsByCategory(category: 'assists' | 'time_bonuses'): ShopItem[] {
  return SHOP_ITEMS.filter(item => item.category === category);
}
```

### Step 2: Write shop tests

```typescript
// src/lib/economy/shop.test.ts

import { SHOP_ITEMS, getShopItem, getItemsByCategory } from './shop';

describe('Shop', () => {
  it('exports all shop items', () => {
    expect(SHOP_ITEMS.length).toBe(4);
  });

  it('all items have required fields', () => {
    for (const item of SHOP_ITEMS) {
      expect(item.id).toBeDefined();
      expect(item.consumableType).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.cost).toBeGreaterThan(0);
      expect(item.consumableCount).toBeGreaterThan(0);
      expect(['assists', 'time_bonuses']).toContain(item.category);
    }
  });

  it('getShopItem returns correct item by type', () => {
    const hint = getShopItem('hint');
    expect(hint?.name).toBe('Hints');
    expect(hint?.cost).toBe(30);
  });

  it('getShopItem returns undefined for unknown type', () => {
    expect(getShopItem('unknown_type' as any)).toBeUndefined();
  });

  it('getItemsByCategory filters correctly', () => {
    const assists = getItemsByCategory('assists');
    expect(assists.length).toBe(3);
    expect(assists.map(i => i.id)).toEqual(['hint-5pack', 'reveal-3pack', 'undo-3pack']);

    const timeBonuses = getItemsByCategory('time_bonuses');
    expect(timeBonuses.length).toBe(1);
    expect(timeBonuses[0].id).toBe('time-5pack');
  });
});
```

### Step 3: Run tests

```bash
npm test -- shop.test.ts
```

Expected: All shop tests pass.

### Step 4: Commit

```bash
git add src/lib/economy/shop.ts src/lib/economy/shop.test.ts
git commit -m "feat: add shop system with consumable catalog"
```

---

## Task 3: Inventory System (consumable counts)

**Files:**
- Create: `src/lib/economy/inventory.ts`
- Create: `src/lib/economy/inventory.test.ts`

### Step 1: Define inventory types

```typescript
// src/lib/economy/inventory.ts

import { ConsumableType } from './shop';

export interface Inventory {
  [key: string]: number; // consumableType -> count
}

const INVENTORY_KEY = 'wordLadder.inventory';

export function loadInventory(): Inventory {
  const saved = localStorage.getItem(INVENTORY_KEY);
  if (!saved) {
    return {
      hint: 0,
      reveal_next_word: 0,
      undo_step: 0,
      time_extension_15s: 0
    };
  }
  return JSON.parse(saved);
}

export function saveInventory(inventory: Inventory): void {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
}

export function addConsumable(type: ConsumableType, count: number): Inventory {
  const inventory = loadInventory();
  inventory[type] = (inventory[type] || 0) + count;
  saveInventory(inventory);
  return inventory;
}

export function useConsumable(type: ConsumableType): boolean {
  const inventory = loadInventory();
  if ((inventory[type] || 0) <= 0) {
    return false;
  }
  inventory[type]--;
  saveInventory(inventory);
  return true;
}

export function getConsumableCount(type: ConsumableType): number {
  const inventory = loadInventory();
  return inventory[type] || 0;
}
```

### Step 2: Write inventory tests

```typescript
// src/lib/economy/inventory.test.ts

import { loadInventory, saveInventory, addConsumable, useConsumable, getConsumableCount } from './inventory';

describe('Inventory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default inventory (all zeros) when empty', () => {
    const inv = loadInventory();
    expect(inv.hint).toBe(0);
    expect(inv.reveal_next_word).toBe(0);
  });

  it('persists inventory to localStorage', () => {
    const inventory = { hint: 5, reveal_next_word: 3, undo_step: 0, time_extension_15s: 2 };
    saveInventory(inventory);
    const loaded = loadInventory();
    expect(loaded.hint).toBe(5);
    expect(loaded.time_extension_15s).toBe(2);
  });

  it('addConsumable increments count', () => {
    addConsumable('hint', 3);
    addConsumable('hint', 2);
    const count = getConsumableCount('hint');
    expect(count).toBe(5);
  });

  it('useConsumable decrements count and returns true', () => {
    addConsumable('hint', 3);
    const used = useConsumable('hint');
    expect(used).toBe(true);
    expect(getConsumableCount('hint')).toBe(2);
  });

  it('useConsumable returns false if count is 0', () => {
    const used = useConsumable('hint');
    expect(used).toBe(false);
    expect(getConsumableCount('hint')).toBe(0);
  });
});
```

### Step 3: Run tests

```bash
npm test -- inventory.test.ts
```

Expected: All inventory tests pass.

### Step 4: Commit

```bash
git add src/lib/economy/inventory.ts src/lib/economy/inventory.test.ts
git commit -m "feat: add inventory system for tracking consumables"
```

---

## Task 4: useEconomy Hook (unified API)

**Files:**
- Create: `src/lib/economy/useEconomy.ts`
- Create: `src/lib/economy/useEconomy.test.ts`
- Modify: `src/lib/economy/index.ts` (export all)

### Step 1: Create useEconomy hook

```typescript
// src/lib/economy/useEconomy.ts

import { useState, useCallback, useEffect } from 'react';
import { loadWallet, earnCoins as walletEarnCoins, spendCoins } from './wallet';
import { earnXp } from './wallet';
import { loadInventory, addConsumable, useConsumable, getConsumableCount } from './inventory';
import { ConsumableType } from './shop';

export interface EconomyState {
  coins: number;
  xp: number;
  inventory: { [key: string]: number };
}

export function useEconomy() {
  const [state, setState] = useState<EconomyState>(() => {
    const wallet = loadWallet();
    const inventory = loadInventory();
    return {
      coins: wallet.coins,
      xp: wallet.xp,
      inventory
    };
  });

  // Listen for storage changes (when other tabs/windows change economy)
  useEffect(() => {
    const handleStorageChange = () => {
      const wallet = loadWallet();
      const inventory = loadInventory();
      setState({
        coins: wallet.coins,
        xp: wallet.xp,
        inventory
      });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const earnCoins = useCallback((amount: number, source: string) => {
    walletEarnCoins(amount);
    setState(prev => ({ ...prev, coins: prev.coins + amount }));
  }, []);

  const spend = useCallback((amount: number): boolean => {
    if (state.coins < amount) {
      return false;
    }
    spendCoins(amount);
    setState(prev => ({ ...prev, coins: Math.max(0, prev.coins - amount) }));
    return true;
  }, [state.coins]);

  const addXp = useCallback((amount: number, source: string) => {
    earnXp(amount);
    setState(prev => ({ ...prev, xp: prev.xp + amount }));
  }, []);

  const buyConsumable = useCallback((type: ConsumableType, cost: number, count: number): boolean => {
    if (!spend(cost)) {
      return false;
    }
    addConsumable(type, count);
    setState(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [type]: (prev.inventory[type] || 0) + count
      }
    }));
    return true;
  }, [spend]);

  const useItem = useCallback((type: ConsumableType): boolean => {
    const success = useConsumable(type);
    if (success) {
      setState(prev => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          [type]: Math.max(0, (prev.inventory[type] || 0) - 1)
        }
      }));
    }
    return success;
  }, []);

  const getCount = useCallback((type: ConsumableType): number => {
    return getConsumableCount(type);
  }, []);

  return {
    coins: state.coins,
    xp: state.xp,
    inventory: state.inventory,
    earnCoins,
    spend,
    addXp,
    buyConsumable,
    useItem,
    getCount
  };
}
```

### Step 2: Create hook tests

```typescript
// src/lib/economy/useEconomy.test.ts

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
```

### Step 3: Create index.ts for exports

```typescript
// src/lib/economy/index.ts

export { loadWallet, saveWallet, earnCoins, spendCoins, earnXp } from './wallet';
export type { Wallet } from './wallet';
export { SHOP_ITEMS, getShopItem, getItemsByCategory } from './shop';
export type { ConsumableType, ShopItem } from './shop';
export { loadInventory, saveInventory, addConsumable, useConsumable, getConsumableCount } from './inventory';
export type { Inventory } from './inventory';
export { useEconomy } from './useEconomy';
export type { EconomyState } from './useEconomy';
```

### Step 4: Run tests

```bash
npm test -- useEconomy.test.ts
```

Expected: All useEconomy tests pass.

### Step 5: Commit

```bash
git add src/lib/economy/useEconomy.ts src/lib/economy/useEconomy.test.ts src/lib/economy/index.ts
git commit -m "feat: add useEconomy hook with unified economy API"
```

---

## Task 5: Integrate Economy into Classic Game

**Files:**
- Modify: `src/ClassicGame.tsx`

### Step 1: Update ClassicGame to use useEconomy

Replace the manual coin state with useEconomy hook:

```typescript
// In ClassicGame.tsx, replace coin state management:

import { useEconomy } from './lib/economy';

// Remove these useState calls:
// const [coins, setCoins] = useState<number>(() => { ... });
// Replace with:
const economy = useEconomy();

// In the win/loss effect, replace:
// setCoins(prev => prev + winReward);
// With:
// economy.earnCoins(winReward, 'classic_win');

// In handleUseHint, replace:
// setCoins(prev => prev - 30);
// With:
// if (!economy.spend(30)) return;

// Full snippet:
// economy.earnCoins(winReward, game.state.phase === 'won' ? 'classic_win' : 'classic_loss_recovery');
```

Complete file modification:
- Line 41-53: Replace coin useState with `const economy = useEconomy();`
- Line 51-53: Replace coin localStorage update with economy integration
- Line 81: Replace `setCoins(prev => prev + winReward)` with `economy.earnCoins(winReward, 'classic_win')`
- Line 97: Replace `setCoins(prev => prev - 50)` with `if (!economy.spend(50)) return;` in loss handler
- Line 165-172: Replace handleUseHint coin logic with `if (!economy.spend(30)) return;`
- Line 175-212: Replace handleRevealStep coin logic with `if (!economy.spend(60)) return;`
- Line 215: Replace handleResetCoins with `economy.earnCoins(150 - economy.coins, 'manual_reset')`
- Line 219-224: Replace handleUndoStep coin logic with `if (!economy.spend(20)) return;`
- Line 249: Display coins as `<span className="text-lg font-bold text-gray-800 dark:text-gray-100">{economy.coins}</span>`

### Step 2: Run tests

```bash
npm test -- ClassicGame
```

Expected: ClassicGame tests still pass (they mock out the economy or use its API correctly).

### Step 3: Test in browser

- Start dev server: `npm run dev`
- Play a game: win → should award coins
- Try using hints, reveals, undos → should deduct coins
- Check localStorage `wordLadder.wallet` to verify persistence

### Step 4: Commit

```bash
git add src/ClassicGame.tsx
git commit -m "refactor: integrate useEconomy hook into Classic game"
```

---

## Task 6: Wire Rewards into Time Attack End Screen

**Files:**
- Modify: `src/features/timeAttack/components/EndScreen.tsx`
- Create: `src/features/timeAttack/components/EndScreen.test.tsx` (update existing tests if needed)

### Step 1: Calculate and display rewards

Add reward calculation to EndScreen:

```typescript
// In EndScreen.tsx

import { useEconomy } from '../../../lib/economy';

export type EndScreenProps = {
  // ... existing props ...
  onRewardEarned?: (coins: number, xp: number) => void;
};

export const EndScreen: React.FC<EndScreenProps> = ({
  // ... props ...
  onRewardEarned
}) => {
  const economy = useEconomy();
  const [rewardAwarded, setRewardAwarded] = useState(false);

  // Award reward on mount (only once)
  useEffect(() => {
    if (rewardAwarded) return;

    const baseCoins = solvedCount * 20;
    const personalBestBonus = isPersonalBest && !isFirstRun ? 50 : 0;
    const totalCoins = baseCoins + personalBestBonus;

    const baseXp = solvedCount * 10;
    const streakBonus = longestStreak >= 5 ? 50 : 0;
    const totalXp = baseXp + streakBonus;

    economy.earnCoins(totalCoins, 'time_attack_run');
    economy.addXp(totalXp, 'time_attack_run');
    onRewardEarned?.(totalCoins, totalXp);
    setRewardAwarded(true);
  }, [solvedCount, longestStreak, isPersonalBest, isFirstRun, economy, onRewardEarned, rewardAwarded]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* ... existing content ... */}

      {/* Add reward display row in the secondary stats card */}
      <div className="w-full max-w-sm border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
        {/* ... existing stats ... */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400">Earned</span>
          <span className="font-mono font-semibold text-lg">
            +{Math.round(solvedCount * 20 + (isPersonalBest && !isFirstRun ? 50 : 0))} coins
          </span>
        </div>
      </div>

      {/* ... action buttons ... */}
    </div>
  );
};
```

### Step 2: Update TimeAttackPage to pass props

In TimeAttackPage.tsx, update EndScreen prop:

```typescript
{state.phase === 'ended' && (
  <EndScreen
    // ... existing props ...
    onRewardEarned={(coins, xp) => {
      // Any side effects on reward earned
    }}
  />
)}
```

### Step 3: Run tests

```bash
npm test -- EndScreen
```

Expected: EndScreen tests pass; reward calculation logic verified.

### Step 4: Test in browser

- Play Time Attack: run to completion → end screen shows earned coins
- Verify Time Attack stats show correctly with new reward display

### Step 5: Commit

```bash
git add src/features/timeAttack/components/EndScreen.tsx src/features/timeAttack/pages/TimeAttackPage.tsx
git commit -m "feat: wire coin rewards into Time Attack end screen"
```

---

## Task 7: Add Consumable Buttons to Time Attack Play Screen

**Files:**
- Modify: `src/features/timeAttack/components/PlayScreen.tsx`
- Create: `src/components/ConsumableButton.tsx`
- Create: `src/components/ConsumableButton.test.tsx`

### Step 1: Create ConsumableButton component

```typescript
// src/components/ConsumableButton.tsx

import React from 'react';
import { ConsumableType } from '../lib/economy';

export interface ConsumableButtonProps {
  type: ConsumableType;
  label: string;
  count: number;
  cost: number;
  disabled: boolean;
  onUse: () => void;
  onBuy: () => void;
}

export const ConsumableButton: React.FC<ConsumableButtonProps> = ({
  label,
  count,
  cost,
  disabled,
  onUse,
  onBuy
}) => {
  const hasItem = count > 0;

  const handleClick = () => {
    if (hasItem) {
      onUse();
    } else {
      onBuy();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none ${
        disabled
          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
          : hasItem
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
      }`}
      title={hasItem ? `Use ${label}` : `Buy ${label} for ${cost} coins`}
    >
      {label} {hasItem ? `(${count})` : `(${cost}◎)`}
    </button>
  );
};
```

### Step 2: Add ConsumableButton tests

```typescript
// src/components/ConsumableButton.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConsumableButton } from './ConsumableButton';

describe('ConsumableButton', () => {
  it('displays label and count when item is available', () => {
    const { result } = render(
      <ConsumableButton
        type="hint"
        label="Hint"
        count={3}
        cost={30}
        disabled={false}
        onUse={jest.fn()}
        onBuy={jest.fn()}
      />
    );
    expect(screen.getByText('Hint (3)')).toBeInTheDocument();
  });

  it('displays label and cost when item is not available', () => {
    render(
      <ConsumableButton
        type="hint"
        label="Hint"
        count={0}
        cost={30}
        disabled={false}
        onUse={jest.fn()}
        onBuy={jest.fn()}
      />
    );
    expect(screen.getByText(/Hint \(30◎\)/)).toBeInTheDocument();
  });

  it('calls onUse when clicked with available items', () => {
    const onUse = jest.fn();
    const onBuy = jest.fn();
    render(
      <ConsumableButton
        type="hint"
        label="Hint"
        count={3}
        cost={30}
        disabled={false}
        onUse={onUse}
        onBuy={onBuy}
      />
    );
    fireEvent.click(screen.getByText('Hint (3)'));
    expect(onUse).toHaveBeenCalled();
    expect(onBuy).not.toHaveBeenCalled();
  });

  it('calls onBuy when clicked with no items', () => {
    const onUse = jest.fn();
    const onBuy = jest.fn();
    render(
      <ConsumableButton
        type="hint"
        label="Hint"
        count={0}
        cost={30}
        disabled={false}
        onUse={onUse}
        onBuy={onBuy}
      />
    );
    fireEvent.click(screen.getByText(/Hint \(30◎\)/));
    expect(onBuy).toHaveBeenCalled();
    expect(onUse).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <ConsumableButton
        type="hint"
        label="Hint"
        count={3}
        cost={30}
        disabled={true}
        onUse={jest.fn()}
        onBuy={jest.fn()}
      />
    );
    const button = screen.getByText('Hint (3)') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
```

### Step 3: Integrate buttons into PlayScreen

Add ConsumableButton row above the Skip button in PlayScreen.tsx:

```typescript
{/* Consumables row (above Skip button) */}
<div className="flex gap-2 flex-wrap justify-center mb-4">
  <ConsumableButton
    type="hint"
    label="Hint"
    count={economy.getCount('hint')}
    cost={30}
    disabled={skipDisabled}
    onUse={() => {
      // Call PuzzleBoard onHintUsed if available
    }}
    onBuy={() => {
      if (economy.buyConsumable('hint', 30, 5)) {
        // Show feedback
      }
    }}
  />
  <ConsumableButton
    type="time_extension_15s"
    label="+15s"
    count={economy.getCount('time_extension_15s')}
    cost={40}
    disabled={skipDisabled}
    onUse={() => {
      if (economy.useItem('time_extension_15s')) {
        timer.adjustTime(15000);
      }
    }}
    onBuy={() => {
      if (economy.buyConsumable('time_extension_15s', 40, 5)) {
        // Show feedback
      }
    }}
  />
</div>
```

### Step 4: Run tests

```bash
npm test -- ConsumableButton
npm test -- PlayScreen
```

Expected: All tests pass; buttons integrate correctly.

### Step 5: Commit

```bash
git add src/components/ConsumableButton.tsx src/components/ConsumableButton.test.tsx src/features/timeAttack/components/PlayScreen.tsx
git commit -m "feat: add consumable buttons to Time Attack play screen"
```

---

## Acceptance Criteria

✅ Wallet persists to localStorage  
✅ useEconomy hook provides unified API  
✅ Shop catalog defines all consumables with costs  
✅ Inventory tracks consumable counts  
✅ Classic game refactored to use useEconomy  
✅ Time Attack end screen awards coins + XP  
✅ ConsumableButtons work in Time Attack play screen  
✅ All 295+ tests pass  
✅ No TypeScript errors  
✅ Manual testing: buy consumables → use them → inventory updates  

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-14-economy-system.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**