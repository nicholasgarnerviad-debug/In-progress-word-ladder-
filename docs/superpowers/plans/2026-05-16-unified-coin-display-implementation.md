# Unified Coin Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate coin displays across all game modes using a single universal WalletStrip positioned consistently at top-left without blocking navigation buttons.

**Architecture:** Replace scattered coin icon implementations with unified WalletStrip component (already exists, just needs repositioning). Update positioning from top-right to top-left in ClassicGame, TimeAttackPage, and BlitzPage. Remove duplicate coin display from ClassicGame.

**Tech Stack:** React, TypeScript, Tailwind CSS, existing WalletStrip component

---

## File Structure

**Files to modify:**
- `src/ClassicGame.tsx` - Remove old coin display (lines 379-383), reposition WalletStrip
- `src/features/timeAttack/pages/TimeAttackPage.tsx` - Reposition WalletStrip
- `src/features/blitz/BlitzPage.tsx` - Reposition WalletStrip
- `src/components/navigation/HomeButton.tsx` - Check z-index if needed
- Test files: Update selectors if tests rely on old coin display location

---

### Task 1: Remove Old Coin Display from ClassicGame

**Files:**
- Modify: `src/ClassicGame.tsx:379-391`
- Test: `src/ClassicGame.test.tsx`

- [ ] **Step 1: Verify current coin display in ClassicGame**

Open `src/ClassicGame.tsx` and locate lines 379-391:
```typescript
<div className="flex justify-between items-center mb-6">
  <div className="flex items-center gap-1">
    <span className="text-2xl">◎</span>
    <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{economy.coins}</span>
  </div>
  <div className="flex gap-1">
    {[0, 1, 2].map(i => (
      <span key={i} className={game.state.lives > i ? 'text-red-500 text-lg' : 'text-gray-300 text-lg'}>
        ❤
      </span>
    ))}
  </div>
</div>
```

This is the old coin display that needs to be removed.

- [ ] **Step 2: Check tests for old coin display references**

Run: `grep -n "◎" src/ClassicGame.test.tsx`

Note any tests that check for this emoji. These will need updating in later tasks.

- [ ] **Step 3: Remove old coin display div**

In `src/ClassicGame.tsx`, delete lines 379-391 (the entire `<div className="flex justify-between items-center mb-6">` section).

After deletion, the code should jump from the `</header>` closing tag directly to the `{/* Puzzle History Modal */}` comment.

- [ ] **Step 4: Run tests to identify breakage**

Run: `npm test -- src/ClassicGame.test.tsx 2>&1 | head -50`

Expected: Tests may fail if they're checking for coin display. Note which tests fail.

- [ ] **Step 5: Commit**

```bash
git add src/ClassicGame.tsx
git commit -m "refactor: remove old coin display from ClassicGame"
```

---

### Task 2: Reposition WalletStrip in ClassicGame

**Files:**
- Modify: `src/ClassicGame.tsx:360-362`
- Test: `src/ClassicGame.test.tsx`

- [ ] **Step 1: Locate WalletStrip in ClassicGame**

Current code at lines 360-362:
```typescript
<div className="fixed top-4 right-4 z-50">
  <WalletStrip compact={true} />
</div>
```

This needs to move to top-left.

- [ ] **Step 2: Change position from top-4 right-4 to top-4 left-4**

Replace lines 360-362 with:
```typescript
<div className="fixed top-4 left-4 z-50">
  <WalletStrip compact={true} />
</div>
```

- [ ] **Step 3: Run tests to verify no breakage**

Run: `npm test -- src/ClassicGame.test.tsx 2>&1 | tail -20`

Expected: Tests pass (or previously identified failures are the same).

- [ ] **Step 4: Verify visual layout doesn't block HomeButton**

HomeButton is rendered at line 357. It uses fixed positioning. Check that it's positioned top-right (not conflicting with left-side WalletStrip).

Open browser DevTools and inspect HomeButton element. It should show `position: fixed; top: ...` with right positioning, not left.

- [ ] **Step 5: Commit**

```bash
git add src/ClassicGame.tsx
git commit -m "refactor: reposition WalletStrip to top-left in ClassicGame"
```

---

### Task 3: Reposition WalletStrip in TimeAttackPage

**Files:**
- Modify: `src/features/timeAttack/pages/TimeAttackPage.tsx`
- Test: `src/features/timeAttack/pages/__tests__/TimeAttackPage.test.tsx`

- [ ] **Step 1: Locate WalletStrip in TimeAttackPage**

Run: `grep -n "WalletStrip\|top-4 right-4" src/features/timeAttack/pages/TimeAttackPage.tsx`

Find the current positioning of WalletStrip (should be `top-4 right-4`).

- [ ] **Step 2: Change position to top-left**

Update the div containing WalletStrip from `top-4 right-4` to `top-4 left-4`.

Example change:
```typescript
// Before:
<div className="fixed top-4 right-4 z-50">
  <WalletStrip compact={true} />
</div>

// After:
<div className="fixed top-4 left-4 z-50">
  <WalletStrip compact={true} />
</div>
```

- [ ] **Step 3: Run TimeAttack tests**

Run: `npm test -- src/features/timeAttack/pages/__tests__/TimeAttackPage.test.tsx 2>&1 | tail -20`

Expected: Tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/timeAttack/pages/TimeAttackPage.tsx
git commit -m "refactor: reposition WalletStrip to top-left in TimeAttackPage"
```

---

### Task 4: Reposition WalletStrip in BlitzPage

**Files:**
- Modify: `src/features/blitz/BlitzPage.tsx`
- Test: `src/features/blitz/__tests__/BlitzPage.test.ts`

- [ ] **Step 1: Locate WalletStrip in BlitzPage**

Run: `grep -n "WalletStrip\|top-4 right-4" src/features/blitz/BlitzPage.tsx`

Find the current positioning of WalletStrip.

- [ ] **Step 2: Change position to top-left**

Update the div containing WalletStrip from `top-4 right-4` to `top-4 left-4`.

- [ ] **Step 3: Run Blitz tests**

Run: `npm test -- src/features/blitz/BlitzPage.test.ts 2>&1 | tail -20`

Expected: Tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/blitz/BlitzPage.tsx
git commit -m "refactor: reposition WalletStrip to top-left in BlitzPage"
```

---

### Task 5: Verify Navigation Button Z-Index

**Files:**
- Check: `src/components/navigation/HomeButton.tsx`
- Check: `src/components/navigation/SettingsButton.tsx`

- [ ] **Step 1: Check HomeButton z-index**

Run: `grep -n "z-\|fixed\|absolute" src/components/navigation/HomeButton.tsx | head -10`

Note the z-index value. Should be lower than WalletStrip's z-50 (or not fixed if it's positioned absolutely relative to a parent).

- [ ] **Step 2: Check SettingsButton z-index**

Run: `grep -n "z-\|fixed\|absolute" src/components/navigation/SettingsButton.tsx | head -10`

SettingsButton should remain unblocked at top-right.

- [ ] **Step 3: Verify in browser**

Start dev server: `npm run dev`

Navigate to Classic mode. Verify:
- WalletStrip visible at top-left
- HomeButton clickable at top-left (doesn't overlap with WalletStrip)
- SettingsButton clickable at top-right (not blocked)

- [ ] **Step 4: No changes needed**

If z-index and positioning are correct, no code changes needed. Just document the verification.

---

### Task 6: Update Tests if Needed

**Files:**
- Check: `src/ClassicGame.test.tsx`
- Check: All other test files that reference old coin display

- [ ] **Step 1: Run all tests to identify failures**

Run: `npm test -- --passWithNoTests 2>&1 | grep -E "FAIL|●.*Error" | head -20`

Expected: Minimal failures (the old coin display references we removed).

- [ ] **Step 2: Update test selectors if needed**

If any tests check for the old ◎ emoji or look for coins in the old location:

Search: `grep -r "◎" src/**/*.test.tsx`

If found, update test to use new WalletStrip location (top-left instead of header area).

- [ ] **Step 3: Verify all tests pass**

Run: `npm test -- --passWithNoTests 2>&1 | grep -E "Test Suites:|Tests:"`

Expected: All suites pass, all tests pass.

- [ ] **Step 4: Commit if any changes were needed**

```bash
git add src/**/*.test.tsx
git commit -m "test: update selectors for WalletStrip repositioning"
```

If no changes were needed, skip this commit.

---

### Task 7: Manual Testing - Desktop

**Files:**
- No code changes, testing only

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

Wait for server to start on localhost:5173 (or configured port).

- [ ] **Step 2: Test Classic Mode**

Navigate to http://localhost:5173/classic

Verify:
- [ ] WalletStrip visible at top-left with coins + level + XP
- [ ] 🪙 coin emoji present (not ◎)
- [ ] HomeButton clickable and visible
- [ ] SettingsButton clickable and visible at top-right
- [ ] No visual overlap or layout shift
- [ ] Game board renders correctly below

- [ ] **Step 3: Test Time Attack Mode**

Navigate to http://localhost:5173/time-attack

Verify:
- [ ] WalletStrip visible at top-left
- [ ] 🪙 coin emoji present
- [ ] No layout shift
- [ ] Game renders correctly

- [ ] **Step 4: Test Blitz Mode**

Navigate to http://localhost:5173/blitz

Verify:
- [ ] WalletStrip visible at top-left
- [ ] 🪙 coin emoji present
- [ ] Game renders correctly

- [ ] **Step 5: Test Home Screen**

Navigate to http://localhost:5173/

Verify:
- [ ] WalletStrip still displays appropriately
- [ ] Consistent with other modes

---

### Task 8: Manual Testing - Dark Mode

**Files:**
- No code changes, testing only

- [ ] **Step 1: Enable dark mode**

Click Settings button and toggle dark mode, or set in browser DevTools.

- [ ] **Step 2: Test Classic Mode (dark)**

Navigate to Classic mode with dark mode enabled.

Verify:
- [ ] WalletStrip renders correctly in dark colors
- [ ] Text is readable
- [ ] No contrast issues
- [ ] Coin emoji 🪙 visible

- [ ] **Step 3: Test other modes (dark)**

Quick check of Time Attack and Blitz modes in dark mode.

Verify:
- [ ] WalletStrip renders correctly
- [ ] No styling issues

---

### Task 9: Manual Testing - Mobile

**Files:**
- No code changes, testing only

- [ ] **Step 1: Open DevTools mobile view**

In browser DevTools, toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M).

Set viewport to 375x667 (iPhone size).

- [ ] **Step 2: Test Classic Mode (mobile)**

Navigate to Classic mode.

Verify:
- [ ] WalletStrip at top-left, compact size
- [ ] No layout shift
- [ ] HomeButton visible (left side)
- [ ] SettingsButton visible (right side)
- [ ] Game board fits screen
- [ ] Coins display is readable

- [ ] **Step 3: Test Time Attack (mobile)**

Verify same points for Time Attack mode.

- [ ] **Step 4: Test Blitz (mobile)**

Verify same points for Blitz mode.

- [ ] **Step 5: Test small viewport (320px)**

Resize to 320px width (small phone).

Verify:
- [ ] WalletStrip doesn't overflow
- [ ] All buttons remain clickable
- [ ] Text remains readable

---

### Task 10: Final Verification and Cleanup

**Files:**
- Review all modified files

- [ ] **Step 1: Run full test suite**

Run: `npm test -- --passWithNoTests 2>&1 | tail -5`

Expected output:
```
Test Suites: 79 passed, 79 total
Tests:       1259 passed, 1259 total
```

- [ ] **Step 2: Verify no console errors**

Navigate through all game modes in browser. Open DevTools console (F12).

Verify: No red error messages, only normal logs.

- [ ] **Step 3: Check git status**

Run: `git status`

Should show clean working tree (all changes committed).

- [ ] **Step 4: Review commits**

Run: `git log --oneline -10`

Verify all commits are present and messages are clear.

---

## Summary

✅ Old coin display (◎) removed from ClassicGame
✅ WalletStrip repositioned to top-left in all modes
✅ Universal 🪙 coin icon across entire app
✅ Navigation buttons remain unblocked
✅ Responsive design verified on mobile/tablet/desktop
✅ Dark mode styling consistent
✅ All tests passing
✅ Manual testing complete
