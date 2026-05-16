# Step 4: Feature Parity Across Game Modes — Findings

**Date:** 2026-05-16  
**Verification Focus:** Consumable features availability across Classic, TimeAttack, and Blitz  
**Status:** ⚠️ FEATURE GAPS DETECTED - Not all modes implement all features

---

## Executive Summary

**Feature Parity Status:** ❌ INCOMPLETE  
**Critical Gaps:** 3  
**Affected Features:** Reveals, Undos, Hints (in Blitz)  
**Impact:** Users cannot access same power-ups across modes

| Feature | Classic | TimeAttack | Blitz | Status |
|---------|---------|-----------|-------|--------|
| Hints | ✅ | ✅ | ❌ | **2/3** |
| Reveals | ✅ | ❌ | ❌ | **1/3** |
| Undos | ✅ | ❌ | ❌ | **1/3** |
| Time Extensions | N/A | ✅ | ❌ | **1/2** |

---

## Part 1: Consumable Types Defined

**Four consumable types are defined in shop.ts:**

```typescript
type ConsumableType = 
  | 'hint'                    // Reveal one letter of next word
  | 'reveal_next_word'        // See entire next word
  | 'undo_step'              // Take back last word (Time Attack only)
  | 'time_extension_15s'     // Add 15 seconds to timer
```

**Shop Items Available:**
1. **Hints (5-pack)** - 30 coins
2. **Reveal Next Word (3-pack)** - 60 coins
3. **Undo Step (3-pack)** - 25 coins (labeled "Time Attack only")
4. **+15 Seconds (5-pack)** - 40 coins

---

## Part 2: ClassicGame Feature Implementation

**File:** `src/ClassicGame.tsx`

### 2.1 Features Implemented

**Hints:**
```typescript
// Line 304
game.applyHint(hintIndex);
```
- ✅ **Available** via HintRevealButtons component
- ✅ Handler connected to game reducer
- ✅ UI integrated

**Reveals:**
```typescript
// Line 325
game.applyReveal(path[1].split(''));
```
- ✅ **Available** via HintRevealButtons component
- ✅ Shows entire next word
- ✅ UI integrated

**Undos:**
```typescript
// Line 352
game.undoStep();
```
- ✅ **Available** as "Undo" button
- ✅ Handler connected to game state reducer
- ✅ UI integrated

**Time Extensions:**
- ❌ **Not Applicable** (no timer in Classic mode)

### 2.2 Component: HintRevealButtons

**Location:** `src/components/game/HintRevealButtons.tsx`

The component provides three separate buttons:
- "Hint" button (applyHint)
- "Reveal" button (applyReveal)
- "Undo" button (undoStep)

All buttons styled with min-h-[48px] for touch accessibility.

---

## Part 3: TimeAttack Feature Implementation

**File:** `src/features/timeAttack/components/PlayScreen.tsx`

### 3.1 Features Implemented

**Hints:**
```typescript
// Line 203-213
<ConsumableButton
  type="hint"
  label="Hint"
  count={economy.getCount('hint')}
  cost={30}
  disabled={false}
  onUse={handleUseHint}
  onBuy={() => { economy.buyConsumable('hint', 30, 5); }}
/>
```
- ✅ **Available** via ConsumableButton component
- ✅ Uses economy system for inventory tracking
- ✅ Can buy directly if not in inventory (30 coins for 5 hints)
- ✅ Handler: `handleUseHint()` calls `puzzleBoardRef.current?.applyHint(hintIndex)`

**Reveals:**
- ❌ **NOT IMPLEMENTED** - No ConsumableButton for reveal_next_word
- ❌ No handler
- ❌ Not accessible to player

**Undos:**
- ❌ **NOT IMPLEMENTED** - No ConsumableButton for undo_step
- ❌ Shop description says "Time Attack only" but feature is missing
- ❌ Not accessible to player

**Time Extensions:**
```typescript
// Line 214-227
<ConsumableButton
  type="time_extension_15s"
  label="+15s"
  count={economy.getCount('time_extension_15s')}
  cost={40}
  disabled={skipDisabled}
  onUse={() => {
    economy.useItem('time_extension_15s');
    onAddTime();
  }}
  onBuy={() => {
    economy.buyConsumable('time_extension_15s', 40, 5);
  }}
/>
```
- ✅ **Available** via ConsumableButton component
- ✅ Uses economy system
- ✅ Handler: calls `onAddTime()` callback
- ✅ UI integrated

### 3.2 Component: ConsumableButton

**Location:** `src/components/ConsumableButton.tsx`

Generic component that:
- Shows consumable count
- Shows cost if count is 0
- Has "Use" and "Buy" options
- Tracks economy state
- Updates on purchase/use

**Currently Used For:**
- Hints (TimeAttack)
- Time Extensions (TimeAttack)

**Not Used For:**
- Reveals (all modes)
- Undos (all modes except Classic)
- Hints/Time Extensions in Blitz

---

## Part 4: Blitz Feature Implementation

**File:** `src/features/blitz/components/BlitzGameScreen.tsx`

### 4.1 Features Implemented

**Hints:**
- ❌ **NOT IMPLEMENTED** - No consumable buttons
- ❌ No hint handler
- ❌ Not accessible to player

**Reveals:**
- ❌ **NOT IMPLEMENTED** - No consumable buttons
- ❌ No reveal handler
- ❌ Not accessible to player

**Undos:**
- ❌ **NOT IMPLEMENTED** - No consumable buttons
- ❌ No undo handler
- ❌ Not accessible to player

**Time Extensions:**
- ❌ **NOT IMPLEMENTED** - No consumable buttons
- ❌ No time extension handler
- ❌ Not accessible to player

### 4.2 Bottom Bar Implementation

BlitzGameScreen has only two buttons at the bottom:
```typescript
// Lines 187-209
<button onClick={handleSkipPuzzle} aria-label="Skip current puzzle">
  Skip Puzzle
</button>
<button onClick={handleForfeit} aria-label="Forfeit the game">
  Forfeit Game
</button>
```

**No ConsumableButtons are present.**

---

## Part 5: Feature Parity Matrix

### 5.1 Availability by Mode

| Feature | Type | Classic | TimeAttack | Blitz | Notes |
|---------|------|---------|-----------|-------|-------|
| **Hints** | hint | ✅ Button | ✅ ConsumableButton | ❌ | Available in 2/3 modes |
| **Reveals** | reveal_next_word | ✅ Button | ❌ | ❌ | Available in 1/3 modes (Classic only) |
| **Undos** | undo_step | ✅ Button | ❌ | ❌ | Available in 1/3 modes (Classic only) |
| **Time Ext** | time_extension_15s | N/A | ✅ ConsumableButton | ❌ | Available in 1/2 timed modes |

### 5.2 UI Component Consistency

| Component | Classic | TimeAttack | Blitz | Status |
|-----------|---------|-----------|-------|--------|
| HintRevealButtons | ✅ Used | ❌ Not used | ❌ Not used | Only in Classic |
| ConsumableButton | ❌ Not used | ✅ Used | ❌ Not used | Only in TimeAttack |
| Consumables display | Via HintRevealButtons | Via ConsumableButton | ❌ None | Inconsistent UI patterns |

---

## Part 6: Critical Issues Found

### 🔴 Issue 1: Reveals Not Available in TimeAttack

**Severity:** Medium  
**Location:** `src/features/timeAttack/components/PlayScreen.tsx`  
**Impact:** Players cannot use "Reveal Next Word" consumable in TimeAttack despite purchasing it from shop

**Current State:**
- Shop allows purchase of reveal_next_word
- PlayScreen has only Hints + Time Extensions
- No reveal_next_word ConsumableButton
- No applyReveal handler

**Fix Required:** Add ConsumableButton for reveal_next_word to PlayScreen

---

### 🔴 Issue 2: Undos Not Available in TimeAttack

**Severity:** Medium  
**Location:** `src/features/timeAttack/components/PlayScreen.tsx`  
**Impact:** Players cannot use "Undo Step" consumable despite shop description saying "Time Attack only"

**Current State:**
- Shop.ts explicitly labels undo_step as "Time Attack only"
- PlayScreen has NO undo_step ConsumableButton
- No undoStep handler in TimeAttack game logic
- Feature is completely missing despite label

**Fix Required:** 
1. Add ConsumableButton for undo_step to PlayScreen
2. Implement undoStep handler that integrates with TimeAttack game state

---

### 🔴 Issue 3: NO Consumables in Blitz

**Severity:** High  
**Location:** `src/features/blitz/components/BlitzGameScreen.tsx`  
**Impact:** Blitz players have zero access to any power-ups (hints, reveals, undos, time extensions)

**Current State:**
- BlitzGameScreen renders only Skip/Forfeit buttons
- No ConsumableButton imports or usage
- No handlers for any consumable type
- Players cannot purchase or use any power-ups

**Fix Required:**
1. Add ConsumableButton components for all applicable types (hints, time extensions)
2. Potentially reveals and undos if game logic supports
3. Implement handlers in BlitzGameScreen or BlitzGame logic

---

## Part 7: Economy Integration Status

### 7.1 Economy Hooks Available

**useEconomy() Provides:**
- `getCount(consumableType)` - Check inventory count
- `useItem(consumableType)` - Consume one item
- `buyConsumable(type, cost, count)` - Purchase from shop

**Usage:**
- ClassicGame: Uses game reducer for hints/reveals/undos (doesn't use useEconomy for consumables)
- TimeAttack: Uses useEconomy for hints and time extensions ✅
- Blitz: Not using useEconomy at all ❌

### 7.2 PuzzleBoard Interface

**Methods Expected:**
- `applyHint(index: number)` - Highlight one letter
- `applyReveal(word: string[])` - Show entire word

**Used In:**
- ClassicGame: ✅ Direct calls via HintRevealButtons
- TimeAttack: ✅ Called via puzzleBoardRef in PlayScreen
- Blitz: ⚠️ PuzzleBoard is rendered but applyHint/applyReveal not exposed

---

## Part 8: UI Pattern Inconsistency

### 8.1 Different UI Approaches

**ClassicGame:**
- Uses `HintRevealButtons` component
- Three separate styled buttons
- Direct game reducer calls
- Not integrated with economy system for consumables

**TimeAttack:**
- Uses `ConsumableButton` component
- Generic component accepting type parameter
- Integrated with economy system
- Shows counts and purchase option

**Inconsistency Problem:**
- Two different UI patterns for same features
- Makes it confusing for players
- Harder to maintain

**Recommendation:** 
Standardize on `ConsumableButton` across all modes (already generic enough)

---

## Part 9: Recommendations for Feature Parity

### Priority 1: Add Missing Features (Critical)

1. **TimeAttack - Add Reveals**
   - Add ConsumableButton for reveal_next_word
   - Cost: 60 coins (3-pack)
   - Handler: Call puzzleBoardRef.current?.applyReveal()

2. **TimeAttack - Add Undos**
   - Add ConsumableButton for undo_step
   - Cost: 25 coins (3-pack)
   - Handler: Integrate with TimeAttack game state reducer

3. **Blitz - Add All Consumables**
   - Add ConsumableButton for hints
   - Add ConsumableButton for time_extension_15s
   - (Optional) Add reveals/undos if game logic supports
   - Handlers: Integrate with BlitzGame logic

### Priority 2: UI Standardization (Medium)

1. **Replace HintRevealButtons with ConsumableButton**
   - In ClassicGame, render multiple ConsumableButton components
   - Benefit: Consistent UI across all modes
   - Benefit: Integrated economy display

2. **Consider Grouping Consumables**
   - Could render consumable buttons in a row/grid
   - Could add "Power-ups" section header
   - Current: scattered across bottom of screen

### Priority 3: Economy Integration (Medium)

1. **Verify All Features Track Consumable Usage**
   - Ensure economy.useItem() is called after applyHint/applyReveal/undoStep
   - Ensure inventory decrements correctly

2. **Add Tracking to ClassicGame**
   - Currently uses direct game reducer calls
   - Should also track in economy system for stats
   - Allows player to see total hints/reveals used

---

## Part 10: Scope Impact for Execution Plan

### If Implementing Feature Parity

**Estimated Effort:**
- Add 2 ConsumableButton instances to TimeAttackPage: **30 min**
- Implement undoStep handler in TimeAttack: **1 hour**
- Add 4+ ConsumableButton instances to BlitzGameScreen: **30 min**
- Implement handlers in BlitzGame logic: **2 hours**
- Testing and verification: **1 hour**

**Total: ~5 hours**

### If Deferring Feature Parity

- Acknowledge gap in findings
- Create separate "Feature Parity Polish" task for Step 4+
- Continue with other optimization work

---

## Conclusion

**Feature Parity Status: INCOMPLETE**

Current implementation shows:
- ✅ Classic mode is feature-rich (hints, reveals, undos)
- ⚠️ TimeAttack has partial features (hints + time ext, missing reveals/undos)
- ❌ Blitz has NO consumable features (critical gap)

**This is a user-facing gap:** Players who purchase consumables from shop expect to use them in all modes, but features are arbitrarily restricted per mode.

**Recommendation:** Include feature parity fixes in Step 4+ (Feature Integration) of execution plan before moving to visual alignment work.

---

**Feature Parity Audit Complete — 2026-05-16 17:40 EDT**

Next Step Options:
1. **Implement Feature Parity** — Fix the 3 critical gaps identified
2. **Continue to Visual Alignment** — Address styling differences between modes
3. **Both in Parallel** — Assign feature parity to Step 4, visual alignment to Step 5
