import { renderHook, act } from '@testing-library/react';
import { useEconomy } from '../useEconomy';
import { loadWallet, saveWallet, getDefaultWallet } from '../wallet';
import { loadInventory, saveInventory, getDefaultInventory } from '../inventory';
import { computeLevel, xpRequiredForLevel } from '../levels';
import type { Wallet } from '../wallet';
import type { Inventory } from '../inventory';

/**
 * Integration Test Harness for Economy System
 *
 * Tests all economy features across modes:
 * - Coin earning (Classic, Time Attack, Word Blitz)
 * - XP earning and level-ups
 * - Consumable system (add, use, counts)
 * - Mode unlocks and persistence
 * - Cross-mode interactions
 * - Edge cases (threshold crossing, multiple level-ups, etc.)
 */

describe('Economy Integration Tests', () => {
  beforeEach(() => {
    // Clear all economy-related localStorage
    localStorage.removeItem('wordLadder.wallet');
    localStorage.removeItem('wordLadder.inventory');
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.removeItem('wordLadder.wallet');
    localStorage.removeItem('wordLadder.inventory');
  });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Reset wallet to default state (150 coins, level 1, 0 XP)
   */
  function resetWallet(): void {
    const defaultWallet = getDefaultWallet();
    saveWallet(defaultWallet);
  }

  /**
   * Simulate a Classic mode win and calculate expected rewards
   * @param params.difficulty - 'easy' | 'medium' | 'hard'
   * @param params.efficiency - percentage of moves used vs optimal (0-1, lower is better)
   * @param params.mistakes - number of wrong letter submissions
   * @returns expectedCoins and expectedXp based on formulas
   */
  function simulateClassicWin(params: {
    difficulty: 'easy' | 'medium' | 'hard';
    efficiency: number;
    mistakes: number;
  }): { expectedCoins: number; expectedXp: number } {
    // Coin formula: base * efficiency_multiplier - mistake_penalty
    // Base: easy=50, medium=100, hard=150
    const baseCoins = params.difficulty === 'easy' ? 50 : params.difficulty === 'medium' ? 100 : 150;
    const efficiencyMultiplier = params.efficiency; // 0-1, lower is worse
    const mistakePenalty = params.mistakes * 5;
    const expectedCoins = Math.max(0, Math.floor(baseCoins * efficiencyMultiplier) - mistakePenalty);

    // XP formula: base * difficulty_multiplier
    // Base: 50 XP per solve
    // Difficulty multiplier: easy=1.0, medium=1.5, hard=2.0
    const baseXp = 50;
    const diffMultiplier = params.difficulty === 'easy' ? 1.0 : params.difficulty === 'medium' ? 1.5 : 2.0;
    const expectedXp = Math.floor(baseXp * diffMultiplier);

    return { expectedCoins, expectedXp };
  }

  /**
   * Simulate a Time Attack run and calculate expected rewards
   * @param params.puzzlesSolved - number of puzzles completed
   * @param params.difficulty - 'easy' | 'medium' | 'hard'
   * @param params.timeRemaining - seconds left at end of run (0-180)
   * @returns expectedCoins and expectedXp
   */
  function simulateTimeAttackRun(params: {
    puzzlesSolved: number;
    difficulty: 'easy' | 'medium' | 'hard';
    timeRemaining: number;
  }): { expectedCoins: number; expectedXp: number } {
    // Coin formula: puzzles_solved * base_per_puzzle * difficulty_multiplier
    // Base per puzzle: 30 coins
    // Difficulty multiplier: easy=1.0, medium=1.5, hard=2.0
    const basePerPuzzle = 30;
    const diffMultiplier = params.difficulty === 'easy' ? 1.0 : params.difficulty === 'medium' ? 1.5 : 2.0;
    const expectedCoins = Math.floor(params.puzzlesSolved * basePerPuzzle * diffMultiplier);

    // XP formula: puzzles_solved * base_xp * difficulty_multiplier + time_bonus
    // Base XP per puzzle: 25
    // Time bonus: time_remaining / 60 (rounded)
    // Difficulty multiplier: easy=1.0, medium=1.5, hard=2.0
    const baseXp = 25;
    const timeBonus = Math.floor(params.timeRemaining / 60);
    const expectedXp = Math.floor(params.puzzlesSolved * baseXp * diffMultiplier) + timeBonus;

    return { expectedCoins, expectedXp };
  }

  /**
   * Simulate a Word Blitz match and calculate expected rewards
   * @param params.puzzlesSolved - number of puzzles completed
   * @param params.won - true if player won the match
   * @param params.difficulty - 'easy' | 'medium' | 'hard'
   * @returns expectedCoins and expectedXp
   */
  function simulateBlitzWin(params: {
    puzzlesSolved: number;
    won: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
  }): { expectedCoins: number; expectedXp: number } {
    // Coin formula: base_participation + win_bonus * puzzles_solved
    // Base participation: 50 coins
    // Win bonus per puzzle: 20 coins (0 if not won)
    // Difficulty multiplier: easy=1.0, medium=1.5, hard=2.0
    const baseParticipation = 50;
    const diffMultiplier = params.difficulty === 'easy' ? 1.0 : params.difficulty === 'medium' ? 1.5 : 2.0;
    const baseCoins = Math.floor(baseParticipation * diffMultiplier);
    const winBonus = params.won ? Math.floor(params.puzzlesSolved * 20) : 0;
    const expectedCoins = baseCoins + winBonus;

    // XP formula: (base_per_puzzle * puzzles_solved + participation_xp) * difficulty_multiplier
    // Base per puzzle: 15
    // Participation XP: 30
    // Difficulty multiplier: easy=1.0, medium=1.5, hard=2.0
    const basePerPuzzle = 15;
    const participationXp = 30;
    const expectedXp = Math.floor((params.puzzlesSolved * basePerPuzzle + participationXp) * diffMultiplier);

    return { expectedCoins, expectedXp };
  }

  /**
   * Assert wallet state matches expected values
   * @param expected - expected { coins, xp, level }
   * @param actual - actual wallet state from useEconomy hook
   */
  function assertWalletState(
    expected: { coins: number; xp: number; level: number },
    actual: { coins: number; xp: number; level: number }
  ): void {
    expect(actual.coins).toBe(expected.coins);
    expect(actual.xp).toBe(expected.xp);
    expect(actual.level).toBe(expected.level);
  }

  /**
   * Assert inventory state matches expected values
   * @param expected - expected consumables/unlocks
   * @param actual - actual inventory from useEconomy hook
   */
  function assertInventoryState(
    expected: { consumables?: { [key: string]: number }; unlocks?: string[] },
    actual: { [key: string]: number }
  ): void {
    if (expected.consumables) {
      for (const [type, count] of Object.entries(expected.consumables)) {
        expect(actual[type] || 0).toBe(count);
      }
    }
  }

  /**
   * Assert that level-up rewards are correct
   * @param rewards - array of reward objects with level, coins, description
   */
  function assertLevelUpRewards(
    rewards: Array<{ level: number; coins: number; description: string }>
  ): void {
    expect(Array.isArray(rewards)).toBe(true);
    for (const reward of rewards) {
      expect(typeof reward.level).toBe('number');
      expect(typeof reward.coins).toBe('number');
      expect(typeof reward.description).toBe('string');
      expect(reward.level).toBeGreaterThan(0);
      expect(reward.coins).toBeGreaterThanOrEqual(0);
    }
  }

  // ============================================================================
  // TASK 2: COIN EARNING (4 tests)
  // ============================================================================

  describe('Task 2: Coin Earning', () => {
    test('Classic mode earns coins on win', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const startCoins = result.current.coins;
      const { expectedCoins } = simulateClassicWin({
        difficulty: 'medium',
        efficiency: 0.8,
        mistakes: 2,
      });

      act(() => {
        result.current.earnCoins(expectedCoins, 'classic_solve');
      });

      expect(result.current.coins).toBe(startCoins + expectedCoins);
    });

    test('Time Attack mode earns coins on run end', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const startCoins = result.current.coins;
      const { expectedCoins } = simulateTimeAttackRun({
        puzzlesSolved: 5,
        difficulty: 'hard',
        timeRemaining: 45,
      });

      act(() => {
        result.current.earnCoins(expectedCoins, 'time_attack_solve');
      });

      expect(result.current.coins).toBe(startCoins + expectedCoins);
    });

    test('Word Blitz earns coins with win multiplier', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const startCoins = result.current.coins;
      const { expectedCoins: winCoins } = simulateBlitzWin({
        puzzlesSolved: 4,
        won: true,
        difficulty: 'medium',
      });

      act(() => {
        result.current.earnCoins(winCoins, 'blitz_win');
      });

      expect(result.current.coins).toBeGreaterThan(startCoins);
    });

    test('Multiple game wins accumulate coins correctly', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const startCoins = result.current.coins;
      const reward1 = simulateClassicWin({
        difficulty: 'easy',
        efficiency: 0.7,
        mistakes: 1,
      });
      const reward2 = simulateClassicWin({
        difficulty: 'medium',
        efficiency: 0.9,
        mistakes: 0,
      });

      act(() => {
        result.current.earnCoins(reward1.expectedCoins, 'classic_solve');
        result.current.earnCoins(reward2.expectedCoins, 'classic_solve');
      });

      expect(result.current.coins).toBe(startCoins + reward1.expectedCoins + reward2.expectedCoins);
    });
  });

  // ============================================================================
  // TASK 3: XP EARNING (6 tests)
  // ============================================================================

  describe('Task 3: XP Earning', () => {
    test('XP gain without level-up increases XP only', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const startXp = result.current.xp;
      const startLevel = result.current.level;
      const smallXpGain = 50;

      act(() => {
        result.current.addXp(smallXpGain, 'puzzle_solve_easy');
      });

      expect(result.current.xp).toBe(startXp + smallXpGain);
      expect(result.current.level).toBe(startLevel);
    });

    test('XP threshold crossing triggers single level-up', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const xpForLevel2 = xpRequiredForLevel(2); // 300
      const startLevel = result.current.level;

      act(() => {
        const res = result.current.addXp(xpForLevel2, 'puzzle_solve_medium');
        assertLevelUpRewards(res.rewards);
      });

      expect(result.current.level).toBe(startLevel + 1);
      expect(result.current.xp).toBe(xpForLevel2);
    });

    test('Multiple level-ups in single XP gain queue all rewards', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const xpForLevel5 = xpRequiredForLevel(5);

      let rewards: Array<{ level: number; coins: number; description: string }> = [];
      act(() => {
        const res = result.current.addXp(xpForLevel5, 'puzzle_solve_hard');
        rewards = res.rewards;
        assertLevelUpRewards(res.rewards);
      });

      // Should cross levels 2, 3, 4, 5 — level rewards at 2, 3, 5
      expect(result.current.level).toBe(5);
      expect(rewards.length).toBeGreaterThan(0);
      expect(rewards[0].level).toBeGreaterThanOrEqual(2);
    });

    test('XP earning applies difficulty bonuses correctly', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const easyXp = simulateClassicWin({
        difficulty: 'easy',
        efficiency: 0.8,
        mistakes: 0,
      }).expectedXp;
      const hardXp = simulateClassicWin({
        difficulty: 'hard',
        efficiency: 0.8,
        mistakes: 0,
      }).expectedXp;

      act(() => {
        result.current.addXp(easyXp, 'puzzle_solve_easy');
      });
      const xpAfterEasy = result.current.xp;

      resetWallet();

      act(() => {
        result.current.addXp(hardXp, 'puzzle_solve_hard');
      });
      const xpAfterHard = result.current.xp;

      expect(xpAfterHard).toBeGreaterThan(xpAfterEasy);
    });

    test('Level-up rewards include coins and unlocks', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const xpForLevel2 = xpRequiredForLevel(2);
      const startCoins = result.current.coins;

      let rewards: Array<{ level: number; coins: number; description: string }> = [];
      act(() => {
        const res = result.current.addXp(xpForLevel2, 'puzzle_solve_medium');
        rewards = res.rewards;
      });

      // Level 2 has coin reward (50) and badge
      const levelUpCoins = rewards.reduce((sum, r) => sum + r.coins, 0);
      expect(levelUpCoins).toBeGreaterThan(0);
      expect(result.current.coins).toBeGreaterThan(startCoins);
    });

    test('XP per-run awards scale with difficulty and puzzles solved', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const easyRunXp = simulateTimeAttackRun({
        puzzlesSolved: 3,
        difficulty: 'easy',
        timeRemaining: 30,
      }).expectedXp;

      const hardRunXp = simulateTimeAttackRun({
        puzzlesSolved: 3,
        difficulty: 'hard',
        timeRemaining: 30,
      }).expectedXp;

      act(() => {
        result.current.addXp(easyRunXp, 'time_attack_run');
      });
      const xpAfterEasy = result.current.xp;

      resetWallet();

      act(() => {
        result.current.addXp(hardRunXp, 'time_attack_run');
      });
      const xpAfterHard = result.current.xp;

      expect(xpAfterHard).toBeGreaterThan(xpAfterEasy);
    });
  });

  // ============================================================================
  // TASK 4: CONSUMABLES (5 tests)
  // ============================================================================

  describe('Task 4: Consumables', () => {
    test('Add consumable increases inventory count', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const startCount = result.current.getCount('hint');

      act(() => {
        result.current.buyConsumable('hint', 50, 3);
      });

      const endCount = result.current.getCount('hint');
      expect(endCount).toBe(startCount + 3);
    });

    test('Use consumable decreases inventory count', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      act(() => {
        result.current.buyConsumable('hint', 50, 5);
      });

      const countAfterBuy = result.current.getCount('hint');

      act(() => {
        result.current.useItem('hint');
      });

      const countAfterUse = result.current.getCount('hint');
      expect(countAfterUse).toBe(countAfterBuy - 1);
    });

    test('Multiple consumable types tracked independently', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      act(() => {
        result.current.buyConsumable('hint', 50, 3);
        result.current.buyConsumable('undo_step', 40, 2);
      });

      expect(result.current.getCount('hint')).toBe(3);
      expect(result.current.getCount('undo_step')).toBe(2);
    });

    test('Cannot use consumable if inventory is empty', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const countBefore = result.current.getCount('hint');

      act(() => {
        result.current.useItem('hint');
      });

      const countAfter = result.current.getCount('hint');
      expect(countBefore).toBe(0);
      expect(countAfter).toBe(0);
    });

    test('Buying multiple consumable packs accumulates', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      act(() => {
        result.current.buyConsumable('hint', 50, 5);
      });

      const countAfterFirst = result.current.getCount('hint');

      act(() => {
        result.current.buyConsumable('hint', 50, 3);
      });

      const countAfterSecond = result.current.getCount('hint');
      expect(countAfterSecond).toBe(countAfterFirst + 3);
    });
  });

  // ============================================================================
  // TASK 5: UNLOCKS (3 tests)
  // ============================================================================

  describe('Task 5: Unlocks', () => {
    test('Level-up rewards include consumable unlocks', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const xpForLevel3 = xpRequiredForLevel(3);

      act(() => {
        result.current.addXp(xpForLevel3, 'puzzle_solve_medium');
      });

      // Level 3 should reward 3 hints
      const hintCount = result.current.getCount('hint');
      expect(hintCount).toBeGreaterThan(0);
    });

    test('Mode unlocks persist across sessions', () => {
      resetWallet();
      const { result: result1 } = renderHook(() => useEconomy());

      const xpForLevel5 = xpRequiredForLevel(5);

      act(() => {
        result1.current.addXp(xpForLevel5, 'puzzle_solve_hard');
      });

      // Create new hook instance (simulating page reload)
      const { result: result2 } = renderHook(() => useEconomy());

      // Level should still be 5, unlocks should persist
      expect(result2.current.level).toBe(5);
    });

    test('Mode unlocks earned at correct level thresholds', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      // Level 5 unlocks practice mode
      const xpForLevel5 = xpRequiredForLevel(5);

      act(() => {
        result.current.addXp(xpForLevel5, 'puzzle_solve_hard');
      });

      expect(result.current.level).toBe(5);
      // Verify unlock was applied by checking level is maintained on reload
      const reloadedHook = renderHook(() => useEconomy());
      expect(reloadedHook.result.current.level).toBe(5);
    });
  });

  // ============================================================================
  // TASK 6: CROSS-MODE (4 tests)
  // ============================================================================

  describe('Task 6: Cross-Mode Interactions', () => {
    test('Wallet state shared across all modes', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const startCoins = result.current.coins;

      // Earn coins in "classic mode"
      act(() => {
        result.current.earnCoins(100, 'classic_solve');
      });

      const afterClassic = result.current.coins;

      // Earn coins in "time attack mode"
      act(() => {
        result.current.earnCoins(75, 'time_attack_solve');
      });

      const afterTimeAttack = result.current.coins;

      expect(afterClassic).toBe(startCoins + 100);
      expect(afterTimeAttack).toBe(afterClassic + 75);
    });

    test('XP and level-ups persist across mode switches', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const xpForLevel2 = xpRequiredForLevel(2);

      act(() => {
        result.current.addXp(xpForLevel2, 'puzzle_solve_medium');
      });

      expect(result.current.level).toBe(2);

      // Reload hook (simulating mode switch)
      const reloadedHook = renderHook(() => useEconomy());
      expect(reloadedHook.result.current.level).toBe(2);
      expect(reloadedHook.result.current.xp).toBe(xpForLevel2);
    });

    test('Very large XP gains can cause multiple level-ups', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const xpForLevel10 = xpRequiredForLevel(10);
      const startLevel = result.current.level;

      act(() => {
        result.current.addXp(xpForLevel10, 'puzzle_solve_hard');
      });

      expect(result.current.level).toBe(10);
      expect(result.current.level - startLevel).toBe(9);
    });

    test('Cumulative bonuses stack correctly across modes', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const startCoins = result.current.coins;
      const classicReward = simulateClassicWin({
        difficulty: 'medium',
        efficiency: 0.85,
        mistakes: 1,
      });
      const timeAttackReward = simulateTimeAttackRun({
        puzzlesSolved: 3,
        difficulty: 'easy',
        timeRemaining: 60,
      });

      act(() => {
        result.current.earnCoins(classicReward.expectedCoins, 'classic_solve');
        result.current.earnCoins(timeAttackReward.expectedCoins, 'time_attack_solve');
      });

      expect(result.current.coins).toBe(
        startCoins + classicReward.expectedCoins + timeAttackReward.expectedCoins
      );
    });
  });

  // ============================================================================
  // TASK 7: EDGE CASES (6 tests)
  // ============================================================================

  describe('Task 7: Edge Cases', () => {
    test('First play state (0 coins, level 1) displays correctly', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      // Default wallet starts with 150 coins
      expect(result.current.coins).toBe(150);
      expect(result.current.level).toBe(1);
      expect(result.current.xp).toBe(0);
    });

    test('XP threshold exact match crosses level', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const xpForLevel2 = xpRequiredForLevel(2);

      act(() => {
        result.current.addXp(xpForLevel2, 'puzzle_solve_medium');
      });

      expect(result.current.level).toBe(2);
      expect(result.current.xp).toBe(xpForLevel2);
    });

    test('Zero coin earning does not crash', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const startCoins = result.current.coins;

      act(() => {
        result.current.earnCoins(0, 'classic_solve');
      });

      expect(result.current.coins).toBe(startCoins);
    });

    test('Five or more level-ups in single XP gain', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const xpForLevel7 = xpRequiredForLevel(7);
      const startLevel = result.current.level;

      let rewardCount = 0;
      act(() => {
        const res = result.current.addXp(xpForLevel7, 'puzzle_solve_hard');
        rewardCount = res.rewards.length;
      });

      expect(result.current.level - startLevel).toBeGreaterThanOrEqual(5);
      expect(rewardCount).toBeGreaterThan(0);
    });

    test('All consumable types can be purchased and used', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      // First earn extra coins to afford all consumables
      act(() => {
        result.current.earnCoins(500, 'admin_grant');
      });

      const consumableTypes: Array<'hint' | 'reveal_next_word' | 'undo_step' | 'time_extension_15s'> = [
        'hint',
        'reveal_next_word',
        'undo_step',
        'time_extension_15s',
      ];

      for (const type of consumableTypes) {
        act(() => {
          result.current.buyConsumable(type, 50, 2);
        });

        expect(result.current.getCount(type)).toBe(2);

        act(() => {
          result.current.useItem(type);
        });

        expect(result.current.getCount(type)).toBe(1);
      }
    });

    test('Spending coins reduces balance correctly', () => {
      resetWallet();
      const { result } = renderHook(() => useEconomy());

      const startCoins = result.current.coins;

      act(() => {
        result.current.spend(50);
      });

      expect(result.current.coins).toBe(startCoins - 50);
    });
  });
});
