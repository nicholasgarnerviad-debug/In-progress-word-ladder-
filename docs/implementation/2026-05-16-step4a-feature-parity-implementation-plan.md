# Step 4a: Feature Parity Implementation Plan

**Status:** Ready for implementation  
**Complexity:** Medium (3-4 features, each ~15-30 min)  
**Risk:** Low (no breaking changes, UI additions only)

---

## Summary of Changes

Add 4 missing ConsumableButton instances across TimeAttack and Blitz modes to achieve feature parity.

---

## Task 1: TimeAttack - Add Reveal ConsumableButton

**File:** `src/features/timeAttack/components/PlayScreen.tsx`

**Location:** Lines 200-228 (bottom bar, after time_extension button, before Skip button)

**Implementation:**

```typescript
// After line 227 (closing </ConsumableButton> for time extension), add:

<ConsumableButton
  type="reveal_next_word"
  label="Reveal"
  count={economy.getCount('reveal_next_word')}
  cost={60}
  disabled={false}
  onUse={() => {
    if (!puzzle) return;
    // Get the next word from puzzle solution path
    const nextWordIndex = 1; // Second word in chain
    const nextWord = puzzle.chain[nextWordIndex];
    economy.useItem('reveal_next_word');
    puzzleBoardRef.current?.applyReveal(nextWord.split(''));
  }}
  onBuy={() => {
    economy.buyConsumable('reveal_next_word', 60, 3);
  }}
/>
```

**Dependencies:** None (PuzzleBoard already has applyReveal method)

**Testing:** 
- Verify button renders
- Verify inventory count shows
- Verify applyReveal is called with correct word
- Verify economy.useItem is called

**Commit:** `feat: add reveal consumable button to TimeAttack PlayScreen`

---

## Task 2: TimeAttack - Add Undo ConsumableButton

**File:** `src/features/timeAttack/components/PlayScreen.tsx`

**Location:** Lines 200-228, add after Reveal button

**Investigation Needed:** Does TimeAttack support undoStep?

**Query:** Check if useTimeAttack exports an undoStep action or if PuzzleBoard has undoStep method

**If PuzzleBoard has undoStep:**
```typescript
<ConsumableButton
  type="undo_step"
  label="Undo"
  count={economy.getCount('undo_step')}
  cost={25}
  disabled={false}
  onUse={() => {
    economy.useItem('undo_step');
    puzzleBoardRef.current?.undoStep?.();
  }}
  onBuy={() => {
    economy.buyConsumable('undo_step', 25, 3);
  }}
/>
```

**If NOT supported:** Document as "Not Implemented" and defer to Phase 2

**Commit:** `feat: add undo consumable button to TimeAttack PlayScreen` (or `docs: note undo not supported in TimeAttack`)

---

## Task 3: Blitz - Add Hints ConsumableButton

**File:** `src/features/blitz/components/BlitzGameScreen.tsx`

**Location:** Lines 185-210 (bottom section, before Skip/Forfeit buttons)

**Implementation:**

Insert before the first button (line 187):

```typescript
// Add hints row above Skip/Forfeit buttons
<div className="flex gap-4 flex-wrap justify-center mb-4">
  <ConsumableButton
    type="hint"
    label="Hint"
    count={economy.getCount('hint')}
    cost={30}
    disabled={timer.isExpired}
    onUse={() => {
      economy.useItem('hint');
      // Get first unhinted letter
      const hintIndex = 0; // Simplified - could calculate based on board state
      puzzleBoardRef.current?.applyHint(hintIndex);
    }}
    onBuy={() => {
      economy.buyConsumable('hint', 30, 5);
    }}
  />
```

**Prerequisites:**
- Import useEconomy hook: `const economy = useEconomy();`
- Add ref to PuzzleBoard: `const puzzleBoardRef = useRef<{ applyHint: (index: number) => void }>(null);`
- Pass ref to PuzzleBoard component on line 164: `<PuzzleBoard ref={puzzleBoardRef} ...`

**Testing:**
- Verify button renders above Skip/Forfeit
- Verify hint count shows
- Verify disabled state when timer expired
- Verify applyHint called correctly

**Commit:** `feat: add hints consumable button to Blitz mode`

---

## Task 4: Blitz - Add Time Extension ConsumableButton

**File:** `src/features/blitz/components/BlitzGameScreen.tsx`

**Location:** Same div as Task 3 (after Hints button)

**Implementation:**

```typescript
<ConsumableButton
  type="time_extension_15s"
  label="+15s"
  count={economy.getCount('time_extension_15s')}
  cost={40}
  disabled={timer.isExpired}
  onUse={() => {
    economy.useItem('time_extension_15s');
    // Add 15 seconds to timer - REQUIRES investigation
    // Need to find timer extension method
    timer.addSeconds?.(15);
  }}
  onBuy={() => {
    economy.buyConsumable('time_extension_15s', 40, 5);
  }}
/>
```

**Investigation Needed:** How to add seconds to Blitz timer?

**Query:** Check useBlitzTimer for addSeconds or addTime method

**Testing:**
- Verify button renders
- Verify timer extends by 15 seconds
- Verify disabled when timer expired

**Commit:** `feat: add time extension consumable button to Blitz mode`

---

## Implementation Order

1. **Task 1 (Reveal)** — Safest, no new dependencies
2. **Task 3 (Hints)** — Add useEconomy + ref setup to Blitz
3. **Task 4 (Time Ext)** — Requires understanding Blitz timer (might need additional investigation)
4. **Task 2 (Undo)** — Might require new game logic (defer if not simple)

---

## Risk Assessment

| Task | Risk | Notes |
|------|------|-------|
| Reveal | Low | PuzzleBoard has applyReveal, just add button |
| Hints (Blitz) | Low | PuzzleBoard has applyHint, add ref setup |
| Time Ext | Medium | Need to understand timer extension mechanism |
| Undo | Medium | May require new game logic in TimeAttack |

---

## Rollback Plan

Each task is independent:
- Revert individual commit if issues found
- No cascading failures
- Safe to implement incrementally

---

## Success Criteria

✅ All 4 buttons render and are visible  
✅ Consumable counts display correctly  
✅ Buttons call appropriate handlers  
✅ Economy system tracks usage  
✅ No console errors  
✅ Existing tests still pass  
✅ New buttons responsive on mobile (48px min-height)  

---

**Ready to implement:** Yes  
**Blockers:** None (may need minor investigation on Tasks 2 & 4)
