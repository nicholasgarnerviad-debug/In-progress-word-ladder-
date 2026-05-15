# Economy Integration Audit & Classic Mode Visual Alignment Plan

**Status:** Planning Document  
**Date:** 2026-05-14  
**Scope:** Cross-mode economy feature integration audit + Classic mode visual alignment

---

## Section 1: Investigation Plan

Before implementation, audit the current state of economy integration across all game modes.

### 1.1 Core Economy Files

**src/lib/economy/useEconomy.ts** (80 lines)
- Confirm API surface: earnCoins, addXp, buyConsumable, useConsumable, getConsumableCount
- Check: Does addXp automatically push level-up rewards to LevelUpProvider context, or must the caller do it?
- Look for: useRef guards for single-fire effects; error handling on storage operations
- Red flags: any place that loads then saves without checking for concurrent writes; missing error handling on context push

**src/lib/economy/wallet.ts** (read full)
- Verify: earnCoins, addXp, spendCoins signatures and return types
- Check: Level-up reward calculation logic — is it correct? Are level milestones 2,3,5,7,10,12,15,18,20?
- Look for: XP to level progression curve (is it exponential or linear?)

**src/lib/economy/inventory.ts** (read full)
- Verify: addConsumable, useConsumable, getConsumableCount, addUnlock
- Check: What consumables are tracked? (hint, undo, reveal_next_word, skip, time_15, second_chance, letter_peek, etc.)
- Look for: Does inventory distinguish free consumables from purchased ones?

**src/lib/economy/types.ts** (read full)
- Verify: CoinSource and XpSource enum values
- Check: Are all source types needed for tracking earnings properly?

**src/components/economy/LevelUpProvider.tsx** (66 lines, already read)
- Status: Properly wraps App.tsx, queue-based modal system looks correct
- Verify: Is the queue system actually being used by callers?

**src/components/economy/LevelUpModal.tsx** (read full)
- Verify: Modal shows rewards correctly, dismiss handler works
- Check: Is the modal styled consistently with rest of app?

**src/components/economy/WalletStrip.tsx** (read full)
- Verify: Shows coins, level, XP progress bar
- Check: Updates correctly when economy state changes? Does it refresh on storage events?
- Look for: Are there two variants (compact, full)? Are they both used?

### 1.2 Mode Integration Points

**src/ClassicGame.tsx** (591 lines, partial read)
- Status: Already using useEconomy, calling earnCoins('classic_solve')
- Verify in full: Is addXp being called? When? What amount? Are level-up rewards being pushed to context?
- Check: Is there XP reward on loss? Should there be?
- Look for: Any race conditions between game-end detection and economy calls
- Red flags: xpAwardedRef suggests single-fire guard — is it working correctly?

**src/features/timeAttack/pages/TimeAttackPage.tsx** (62 lines, read full)
- Verify: Is economy being used? If so, where? If not, what's the plan?
- Check: Are coins being awarded per-solve or per-run-end?
- Look for: Should there be XP awards? Per-solve or per-run?

**src/features/blitz/components/BlitzResultsScreen.tsx** (372 lines, partial read)
- Status: Task 10 just wired coin/XP rewards
- Verify in full: Is earnCoins being called? addXp? Are level-ups being properly pushed to context?
- Check: Does the confetti animation interfere with level-up modal timing?

**src/features/blitz/BlitzPage.tsx** (read full)
- Verify: Does it render with LevelUpProvider in context? (It should, since it's nested under App)

### 1.3 UI Integration Points

**src/pages/HomePage.tsx** (read full)
- Verify: Does it show WalletStrip? Is it updating correctly?
- Check: Are mode unlock tiles (Practice, Endless, etc.) showing correctly based on inventory?

**src/pages/SettingsPage.tsx** (read full)
- Verify: Does it have a shop for consumables?
- Check: Purchase handler — does it call economy.buyConsumable?

**src/ClassicGame.tsx** (continued)
- Check lines 100-200: Win/loss modals — are they styled consistently with rest of app?
- Look for: Do consumable buttons (hint, undo, reveal) exist? Are they wired to useConsumable?

**src/features/timeAttack/pages/TimeAttackPage.tsx** (continued)
- Check: Do consumable buttons exist and work?
- Verify: Can consumables be purchased mid-run? What's the UX for that?

### 1.4 Test Files to Review

**src/lib/economy/useEconomy.test.ts** (read full)
- Verify: What's actually tested? What's assumed but not tested?
- Check: Are the test cases comprehensive enough to catch integration issues?

**src/ClassicGame.test.tsx** (read full)
- Verify: Do tests mock useEconomy? How?
- Check: Are there tests that would break if we change economy behavior?

---

## Section 2: Feature-by-Feature Integration Matrix

| Feature | Classic | Time Attack | Word Blitz | Expected Behavior | Likely Current State |
|---------|---------|-------------|-----------|-------------------|----------------------|
| **Coin earning on win/end** | ✓ Wired | ? Verify | ✓ Task 10 | Award coins based on performance | Classic works; TA unclear; Blitz wired |
| **XP earning on win/end** | ? Verify | ? Verify | ✓ Task 10 | Award XP based on difficulty | Only Blitz confirmed |
| **XP earning per-solve** | N/A | ? Design choice | ✓ Task 10 | Depends on product decision | Need to decide for TA |
| **Level-up modal trigger** | ? Verify | ? Verify | ? Verify | Modal queues and displays on level crossing | Depends on addXp wiring |
| **WalletStrip visibility** | ? Verify | ? Verify | ? Verify | Shows on all game screens | Need to verify presence |
| **WalletStrip updates** | ? Verify | ? Verify | ? Verify | Reflects coins/XP immediately | Cross-tab sync working? |
| **Hint (free)** | ? Verify | ? Design choice | N/A multiplayer | First hint per session free | Need to verify |
| **Hint (consumable)** | ? Verify | ? Verify | N/A | Deduct from inventory | Need to verify wiring |
| **Undo (free)** | ? Verify | ? Design choice | N/A | Allowed once per session | Need to verify |
| **Undo (consumable)** | ? Verify | ? Verify | N/A | Deduct from inventory | Need to verify wiring |
| **Reveal next word** | N/A | ? Verify | N/A | Deduct from inventory, show next step | Need to verify |
| **Skip (free)** | N/A | ? Design choice | N/A | Allowed once per run | Need to verify |
| **Skip (consumable)** | N/A | ? Verify | N/A | Deduct from inventory, auto-advance | Need to verify |
| **+15s consumable** | N/A | ? Verify | N/A | Add time to timer, show earned XP bonus | Need to verify |
| **Second chance** | ? Verify | ? Verify | N/A | Allow one extra loss before game over | Need to verify |
| **Letter peek** | N/A | ? Verify | N/A | Reveal one letter, deduct from inventory | Need to verify |
| **Mode unlocks** | ? Verify | ? Verify | N/A | Tile shows active when unlocked | Need to verify |
| **Themed dictionaries** | ? Verify | ? Verify | ? Verify | Toggle in settings, apply to puzzle words | Need to verify |
| **Achievements eval** | ? Design choice | ? Design choice | ? Design choice | Run after relevant game events | Deferred? |
| **Daily bonus claim** | ? Verify | ? Verify | ? Verify | Award coins/XP once per calendar day | Need to verify exists |

### 2.1 Summary Assessment

**Likely Complete:**
- Coin earning in Classic (already wired, xpAwardedRef pattern in place)
- Coin/XP earning in Word Blitz (just finished Task 10)
- LevelUpProvider setup (properly wraps app)

**Likely Missing or Half-Done:**
- XP earning in Time Attack (no evidence found in TimeAttackPage)
- XP earning in Classic (xpAwardedRef suggests it was started but may not be finished)
- WalletStrip display on all game screens (presence not verified)
- Consumable wiring in Classic (buttons may exist but not call useConsumable)
- Consumable wiring in Time Attack (same concern)
- Daily bonus system (existence not verified)
- Achievements (likely deferred)

**Needs Design Decision:**
- Time Attack: per-solve vs. per-run XP/coins
- Time Attack: should skip have a free tier?
- Time Attack: which consumables make sense in a timed mode?

---

## Section 3: Edge Cases & Gotchas

### 3.1 Timing & Concurrency

1. **Level-up modal mid-animation** - If player levels up during countdown-to-playing transition (Word Blitz), does the level-up modal overlay correctly? Could it render behind or conflict with CountdownOverlay?
   - **Mitigation:** Modal should use z-index higher than game screens; test with rapid XP gains

2. **Storage events racing** - Two tabs both earning coins simultaneously. Does the second tab's setState overwrite the first's?
   - **Mitigation:** useEconomy reads fresh state from loadWallet() before every write, so last-write-wins is safe

3. **useEconomy callback dependency array** - If earnCoins callback doesn't include necessary dependencies, stale closures could read old wallet state
   - **Mitigation:** Verify each callback uses loadWallet() fresh, not relying on state closure

4. **Level-up rewards atomic persistence** - If addXp awards coins + consumables + unlocks, and we crash mid-way, do we end up in inconsistent state?
   - **Mitigation:** useEconomy already does atomic saveWallet + saveInventory; verify it completes

5. **WalletStrip update lag** - If WalletStrip mounted in one mode, then player navigates to another mode and earns coins, does WalletStrip reflect the change immediately?
   - **Mitigation:** useEconomy listens to storage events, so cross-route updates should work

### 3.2 Empty / First-Play States

6. **New player, zero coins** - Does any UI look broken with "0 coins"? Is the WalletStrip layout still legible?
   - **Mitigation:** Verify WalletStrip renders correctly with small numbers

7. **New player, level 1 with 0 XP** - XP progress bar at 0% — is it visually clear it's not broken?
   - **Mitigation:** Ensure bar shows some minimum visual state even at 0%

8. **Player with no puzzle history** - Classic win/loss stats view — does empty state render correctly?
   - **Mitigation:** Verify no console errors on first play

9. **First daily bonus claim** - Player taps daily bonus button for first time ever. Does the flow work? Any assumptions about prior claims?
   - **Mitigation:** Verify daily bonus logic handles "no prior claims" case

### 3.3 Edge Values

10. **Player at max level (20+)** - Does addXp still work if player is already at level 20? Does it award participation XP even though no level-up?
    - **Mitigation:** Verify wallet.addXp handles already-at-max-level case gracefully

11. **Multiple level-ups in one XP gain** - Player is level 18 with 100 XP, gains 500 XP. Should hit both level 19 and 20. Does the modal queue both?
    - **Mitigation:** Test addXp with large XP amounts; verify rewards array has all entries

12. **Very high coin count (>10,000)** - Does WalletStrip format "10500 coins" correctly, or does it overflow the layout?
    - **Mitigation:** Verify responsive formatting; consider abbreviations (10.5k)

13. **Consumable count overflow** - Player buys a 10-pack when already has 5. Does inventory correctly show 15, not capped at 10?
    - **Mitigation:** Verify addConsumable is additive, not replacing

14. **Negative coins/XP** - Does the system ever try to award negative amounts? Would that crash?
    - **Mitigation:** Add defensive checks; earnCoins should validate amount > 0

15. **Daily spend cap hit mid-purchase** - Player has 450/500 coins daily allowance, tries to buy something for 100 coins. Does shop reject gracefully?
    - **Mitigation:** Verify shop UI shows available budget; grays out purchases that exceed cap

### 3.4 Multiplayer-Specific (Word Blitz)

16. **Tied winners** - Both players score 1000 points. Does each get full win bonus, or do they split?
    - **Mitigation:** Verify Blitz scoring logic; recommend both get full bonus (fairest)

17. **Solo Blitz** - One player in room. Does "solo win" count as a win for bonus purposes?
    - **Mitigation:** Define: is solo-player-finish a win bonus event?

18. **Mid-game disconnect** - Player disconnects after solving 3 puzzles. Do they still get credit for those solves if they don't finish the run?
    - **Mitigation:** Blitz should award per-solve, not just per-run-end

19. **Host plays again** - After game ends, host clicks "Play Again". Do per-session rewards reset, or do they double-award?
    - **Mitigation:** Verify playAgain() clears player state properly

20. **Tied leaderboard positions** - Both players solve in identical time. What's the tiebreaker? Does it matter for reward purposes?
    - **Mitigation:** Define tiebreaker; ensure both get rewards if both qualify

### 3.5 Mode Interaction Edge Cases

21. **Mid-run shop visit** - Player in Classic game, opens settings to buy a consumable hint. Game state is "playing". Does the purchase work? Does WalletStrip on game screen update?
    - **Mitigation:** Verify shop is always accessible; economy state is global

22. **Consumable already used, then undo** - Player uses hint in Turn 1, then clicks undo. Should hint count be restored?
    - **Mitigation:** Verify undo rolls back inventory state (or clarify it shouldn't)

23. **Free + consumable distinction** - Classic: player's first hint is free, second uses inventory. Is this UI-clear? Or does it confuse as "two different buttons"?
    - **Mitigation:** Label clearly: "Hint (1 free)" vs "Hint (from inventory)"

24. **Reveal on last puzzle** - Time Attack: player reveals final puzzle. Auto-advance still happens?
    - **Mitigation:** Verify reveal doesn't block game-end detection

25. **Consumable with failed purchase** - Player tries to use hint but has 0 coins and 0 inventory. Error message shown? Button disabled?
    - **Mitigation:** Preemptively disable consumable buttons if not available

### 3.6 Visual / Accessibility Edge Cases

26. **Dark mode: yellow accent** - WalletStrip yellow accent text in dark mode. Is contrast > 4.5:1?
    - **Mitigation:** Verify WCAG AA compliance for dark mode colors

27. **Mobile 375px: WalletStrip width** - Does adding WalletStrip to right side of game screen still fit on 375px phone?
    - **Mitigation:** WalletStrip may need to move to header or bottom on mobile

28. **Red/green solve indicators** - Do they have non-color affordances (icon, text) for colorblind players?
    - **Mitigation:** Verify non-color indicators present

29. **Level-up modal keyboard dismiss** - Can player dismiss level-up modal with Escape key? Enter?
    - **Mitigation:** Add keyboard support; test accessibility

30. **Screen reader: economy events** - Does level-up trigger an aria-live announcement? Coin earning?
    - **Mitigation:** Add aria-live regions for economy feedback

### 3.7 Persistence / Data Corruption

31. **localStorage malformed JSON** - User manually edits localStorage, saving `{broken json}`. Does loadWallet crash or recover?
    - **Mitigation:** Wrap load functions in try/catch; default to fresh state on parse error

32. **localStorage quota exceeded** - Transaction log grows very large. Save fails. What happens?
    - **Mitigation:** Add quota check; consider archiving old transactions

33. **Old EconomyState shape** - Returning player has old wallet JSON without `xp` field. Does load handle missing fields?
    - **Mitigation:** Migration logic in load functions; provide defaults

34. **Unrecognized inventory unlocks** - Old code added unlock `"badge_old"`, new code doesn't know it. Breaks anything?
    - **Mitigation:** Graceful handling of unknown unlocks (just store them)

### 3.8 Testing / Verification Edge Cases

35. **Snapshot tests breaking** - Visual restyling of Classic will break all snapshots. Acceptable?
    - **Mitigation:** Plan to regenerate snapshots; note in commit message

36. **Tests mocking useEconomy** - Do test mocks match the real API? Would they catch API changes?
    - **Mitigation:** Keep mocks in sync with real implementation; add integration tests

37. **Consumable tests with real useEconomy** - Tests using real economy logic may be slow. Should they use mocks?
    - **Mitigation:** Provide both unit (mocked) and integration (real) test variants

### 3.9 Migration Edge Cases

38. **Player with inventory for removed consumable** - Old code tracked "hint_pack_10", new code doesn't. UI shows Unknown Consumable?
    - **Mitigation:** Whitelist consumables in inventory; ignore unknown keys

---

## Section 4: Classic Mode Visual Alignment Plan

### 4a: Target Reference (Priority Order)

1. **src/features/timeAttack/pages/TimeAttackPage.tsx** - Defines header layout, game screen container, responsive grid
2. **src/features/blitz/components/BlitzGameScreen.tsx** - Defines button row styling, dark mode patterns, spacing consistency
3. **src/pages/HomePage.tsx** - Defines page container, card layouts, accent color usage, mobile responsiveness
4. **src/components/economy/WalletStrip.tsx** - Defines coin/level display, compact/full variants, dark mode

### 4b: Current Classic State

- **Header:** Appears to be custom styled, may not match TimeAttack/Blitz header strip (~48px, hairline border)
- **Page container:** Likely max-w-md or similar, needs verification
- **Puzzle display:** Custom rendering, may not use consistent typography
- **Buttons:** Hint/Undo/Reveal buttons likely exist but styling may be inconsistent
- **Win/Loss modals:** Custom styled, may not match rest of app's modal patterns
- **Dark mode:** Implemented but may not use consistent dark: classes
- **Mobile:** Likely responsive but width not verified

### 4c: Element-by-Element Change List

| Element | Target Appearance | Change Needed | Risk Level |
|---------|-------------------|---------------|-----------|
| Header strip | ~48px tall, hairline bottom border, "Word Ladder" title | Adjust height/padding, add border-gray-200/dark:border-gray-800 | Low — style only |
| Page container | max-w-md, centered, generous padding | Verify current; adjust if needed | Low |
| Title/puzzle info | text-4xl font-bold, tracking-wide | Restyle typography | Low — semantic unchanged |
| Puzzle ladder | Centered display, monospace font | Verify current styling | Low |
| Input row | Button-like styling, focus ring | Update to match TimeAttack pattern | Low |
| Letter tiles | Consistent with puzzle display | No change needed | N/A |
| Submit button | Primary button variant (from theme.ts) | Restyle to BLITZ theme | Low — behavior unchanged |
| Hint button | Secondary button, shows count or "Use inventory" | Restyle; update label | Low |
| Undo button | Secondary button, disabled if 0 uses | Restyle; ensure disabled state clear | Low |
| Reveal button | Secondary button, consumable only | Restyle; ensure inventory wiring clear | Low |
| Win modal | Centered, white bg, rounded corners, dark-friendly | Match TimeAttack win modal style | Low |
| Loss modal | Centered, white bg, rounded corners, dark-friendly | Match TimeAttack loss modal style | Low |
| Wrong-guess feedback | Subtle visual, non-color affordance | Update to match PuzzleBoard feedback | Low |
| Restart/New puzzle | Button row at bottom, primary + secondary | Restyle to match other modes | Low |

### 4d: Hard Boundary (What NOT to Change)

- Game logic (reducer, move validation, win/loss detection)
- Puzzle generation algorithm
- Scoring formulas for coins
- Hint algorithm or undo behavior
- Word graph or path finding
- Test assertions on behavior (only visual tests may change)

### 4e: Risks

- **DOM-query tests** - Tests using class name selectors may break if we restructure HTML. **Mitigation:** Use accessible roles instead of class names
- **Inline behavior styles** - Any CSS that encodes game state (e.g., "disabled class means no more undos") must be preserved. **Mitigation:** Move to data-attributes if refactoring
- **Snapshot tests** - Will break on visual changes. **Mitigation:** Plan to regenerate; document in commit

### 4f: Verification Approach

**Before & After Checklist:**
- [ ] Header height matches TimeAttack (~48px)
- [ ] Page container is max-w-md, centered
- [ ] Typography: title is text-4xl font-bold
- [ ] Button sizes: 44px minimum touch target
- [ ] Dark mode: all text readable, no invisible elements
- [ ] Mobile 375px: no horizontal scroll, buttons stack appropriately
- [ ] Focus rings: visible on all interactive elements

**Behavioral Verification:**
- [ ] Play full puzzle to win; verify win modal appears and styles correctly
- [ ] Play full puzzle to loss; verify loss modal appears
- [ ] Use hint button; verify it calls useEconomy.useConsumable
- [ ] Use undo button; verify it correctly undoes last move
- [ ] Check dark mode toggle; verify all UI readable

**Test Suite:**
- [ ] npm test runs with 0 failures
- [ ] No console errors during play
- [ ] Snapshot tests regenerated and passing

---

## Section 5: Order of Operations

### Step 1: Audit & Documentation (No Code Changes)
**Deliverable:** Written audit report with actual current state (not guesses)  
**Verification:** Report reviewed, all uncertainties resolved  
**Time:** ~2 hours reading code + writing findings

### Step 2: Create Test Harness for Economy Integration
**Deliverable:** Integration test file that exercises all mode-economy combinations  
**What to do:** Write tests (not implementation) covering coins, XP, level-ups across all modes  
**Why first:** Tests clarify expectations before implementation; provide regression harness for later changes  
**Verification:** Tests run (many fail — that's expected); captures current gaps  
**Time:** 1-2 hours

### Step 3: Wire XP Earning in Classic Mode
**Deliverable:** ClassicGame calls economy.addXp on win; level-up modal pushes correctly  
**What to do:** Add addXp call in win handler; wire useLevelUpQueue if needed  
**Why:** Largest existing mode; serves as pattern for Time Attack  
**Verification:** Audit test "Classic XP on win" passes; manual play test confirms modal appears  
**Rollback:** Revert useGameState changes  
**Time:** 1-2 hours

### Step 4: Wire XP Earning in Time Attack
**Design decision required first:** Per-solve or per-run XP? Free vs consumable skip?  
**Deliverable:** TimeAttackPage calls economy.addXp; level-ups queue  
**Verification:** Audit test "Time Attack XP on run end" passes  
**Time:** 1-2 hours

### Step 5: Wire XP Earning in Word Blitz (if not already wired)
**Deliverable:** BlitzResultsScreen calls addXp if not already done in Task 10  
**Verification:** Audit test passes  
**Time:** 0.5-1 hour (likely already done)

### Step 6: Add WalletStrip to Game Screens
**Deliverable:** WalletStrip renders on /play/classic, /play/time-attack, /blitz/playing screens  
**What to do:** Import WalletStrip; place on right sidebar (or top on mobile)  
**Why:** Provides real-time feedback; integrates economy into gameplay  
**Verification:** WalletStrip updates within 200ms of earning coins; works in dark mode  
**Time:** 1-2 hours (includes mobile layout work)

### Step 7: Verify Consumable Wiring (Classic & Time Attack)
**Deliverable:** Hint/Undo/Reveal buttons call useConsumable; inventory counts update  
**What to do:** Check if buttons exist; if they do, verify they call economy hooks  
**Verification:** Manual test: buy hint, use hint, verify inventory decreases  
**Time:** 1-2 hours (depends on current state)

### Step 8: Visual Alignment of Classic Mode
**Deliverable:** Classic game screen matches TimeAttack visual language  
**What to do:** Restyle header, buttons, modals to match theme.ts patterns  
**Why:** Last, not first — other changes may introduce new elements  
**Verification:** Side-by-side comparison; manual play in light & dark mode; 375px responsive test  
**Time:** 2-3 hours

### Step 9: Visual Alignment of Time Attack (if needed)
**Deliverable:** Time Attack modals, buttons, WalletStrip consistency  
**Verification:** Visual comparison  
**Time:** 1-2 hours (likely minimal changes needed)

### Step 10: Integration Test Suite Pass
**Deliverable:** All integration tests passing (coins, XP, level-ups, consumables working end-to-end)  
**Verification:** npm test, full suite passes  
**Time:** 1-2 hours (fix any remaining bugs)

### Step 11: Cross-Mode Smoke Test
**Deliverable:** Manual play of full cycle in each mode  
**What to do:** Play Classic win, earn coins/XP, level up, check WalletStrip update. Repeat for TA and Blitz.  
**Verification:** No console errors; modals appear; economy updates are immediate  
**Time:** 1-2 hours

### Step 12: Edge Case Verification (Selected High-Risk Cases)
**Deliverable:** Manual tests of 8-10 critical edge cases  
**Cases to test:**
- Level-up during game animation
- Very high coin count display
- Dark mode WalletStrip contrast
- Mobile 375px layout
- Cross-tab coin earning
**Verification:** No crashes, no invisible UI  
**Time:** 1-2 hours

### Step 13: Final Visual Pass & Dark Mode Verification
**Deliverable:** All screens look polished in light & dark mode  
**Verification:** No visual regressions; WCAG AA contrast met  
**Time:** 1 hour

### Step 14: Test Suite Cleanup & Documentation
**Deliverable:** All tests passing; snapshot tests regenerated; test comments updated  
**Verification:** npm test, 0 failures  
**Time:** 1 hour

---

## Section 6: Risks & Open Questions

### 6.1 Architectural Questions

**Q1: Is LevelUpProvider wrapping the entire app?**
- Current evidence: App.tsx shows LevelUpProvider wrapping Routes ✓
- Impact: Level-ups should work correctly across all pages
- Decision: No change needed; verify in audit

**Q2: Should we add a ToastProvider for "+X coins" notifications?**
- Options:
  - A) Add ToastProvider; show ephemeral toast on coin earning
  - B) Keep current approach (WalletStrip updates + modals for level-ups)
- Recommendation: Start with B; add ToastProvider in future if UX feedback suggests players miss coin earning feedback
- Risk: If we don't add it, players might not notice small coin gains; mitigated by WalletStrip always visible

**Q3: Is there a shared "game ended" pattern we could extract?**
- Current: Each mode has its own end-of-game handler (ClassicGame, TimeAttackPage, BlitzResultsScreen)
- Options:
  - A) Leave as-is; duplication is acceptable given mode-specific logic
  - B) Extract common pattern (call earnCoins + addXp + recordStats)
- Recommendation: A. Modes have sufficiently different end-game flows; extraction would create brittle abstraction

### 6.2 Product/Design Questions

**Q4: Time Attack — per-solve or per-run XP/coins?**
- Per-solve: More frequent feedback; players see progress more often
- Per-run: Cleaner; no reward mid-run; simpler math
- Recommendation: **Per-run**, matching Classic win-based model. Simpler to understand, less reward spam
- Fallback: Check TimeAttackPage to see if already decided

**Q5: Should daily bonus streak offer multipliers?**
- Current: Likely flat daily rewards
- Options: A) Keep flat, B) Add streak multiplier (day 3 = 1.5x, day 7 = 2.0x)
- Recommendation: A for this pass. Multipliers add complexity; defer to future if retention metrics suggest needed

**Q6: Should achievements be visible in this pass?**
- Current state: Likely deferred or not started
- Recommendation: **Out of scope.** Achievements add significant UI work; defer to next pass. Mark in success criteria as "TBD"

**Q7: How important is Classic looking identical to other modes vs. visually consistent but distinct?**
- Concern: Classic is older; perfect visual parity may require extensive refactoring
- Recommendation: **Visually consistent but distinct is acceptable.** Share header pattern, spacing, dark mode, button styles, but allow Classic's puzzle display to keep its character. Example: TimeAttack and Blitz use modern grid layouts; Classic keeps centered column — fine, as long as spacing/typography/colors are shared

---

### 6.3 Technical Risks

**Risk 1: Visual restyle breaks snapshot tests**
- If Classic has snapshot tests, all will fail
- Mitigation: Plan snapshot regeneration; note in PR description that this is expected

**Risk 2: WalletStrip consumes vertical space, crowds gameplay UI**
- On 375px phones with small game areas, adding WalletStrip might push puzzle off-screen
- Mitigation: WalletStrip moves to header or bottom on mobile; test at breakpoints

**Risk 3: useRef single-fire guards — common bug source**
- ClassicGame uses xpAwardedRef; pattern must be correct
- Mitigation: Verify ref is checked AND updated correctly; write test that verifies XP not double-awarded

**Risk 4: Cross-tab synchronization edge cases**
- When added, two tabs both trying to award daily bonus at same time could double-award
- Mitigation: Add unique session ID to daily bonus claim; verify idempotence in audit

**Risk 5: Consumable wiring incomplete in one or more modes**
- Buttons exist but don't call useEconomy.useConsumable
- Mitigation: Integration tests will catch this immediately

---

### 6.4 Process Risks

**Risk 6: Audit reveals significantly more is broken than expected**
- Mitigation: Build in 1-2 hour buffer after audit before committing to timeline

**Risk 7: Some features intentionally deferred vs. actually missing**
- Example: "Achievements not wired" — is that because not started, or because it's in next sprint?
- Mitigation: Audit report must distinguish "missing entirely" from "deferred deliberately"

**Risk 8: Haiku model constraints on large implementation**
- This integration might be too large for Haiku (many files, complex state changes)
- Mitigation: Plan to use Sonnet if Haiku hits complexity limits; break work into smaller subagent tasks

---

## Section 7: Success Criteria

### 7.1 Coin Earning Integration

- [ ] Classic: Win awards coins based on performance formula (efficiency - mistakes)
- [ ] Classic: Loss awards participation coins (or 0, depending on design)
- [ ] Time Attack: Run end awards coins based on puzzles solved × difficulty
- [ ] Word Blitz: Run end awards coins with difficulty multiplier (verified in Task 10)
- [ ] All modes: WalletStrip shows updated coin count within 200ms of earning

### 7.2 XP Earning Integration

- [ ] Classic: Win awards XP; amount scales with difficulty
- [ ] Classic: Loss awards participation XP (or 0, depending on design)
- [ ] Time Attack: Run end awards XP; amount scales with difficulty and performance
- [ ] Word Blitz: Run end awards XP with difficulty multiplier (verified in Task 10)
- [ ] All modes: XP visibly updates in WalletStrip immediately

### 7.3 Level-Up System

- [ ] Level-up modal appears when any puzzle/run triggers level crossing
- [ ] Modal shows rewards: coins, unlocks, description
- [ ] Multiple level-ups in one XP gain queue correctly; user dismisses one, next appears
- [ ] Level-up doesn't conflict with game-end animations (no modal behind confetti, etc.)
- [ ] Level-up modal dismissible via button, Escape key, or clicking overlay
- [ ] Screen reader announces level-up (aria-live region)

### 7.4 WalletStrip Integration

- [ ] WalletStrip visible on /play/classic, /play/time-attack, /blitz/playing
- [ ] Shows coins, level number, XP progress bar with percentage
- [ ] Updates within 200ms of any earning event
- [ ] Works correctly in dark mode (no invisible text)
- [ ] Mobile responsive: stacks appropriately on 375px screens (may move to header or bottom)
- [ ] Compact variant renders correctly when space-constrained
- [ ] Coin count with >9,999 coins displays with abbreviation (10.0k) or full number, not truncated

### 7.5 Consumable System

- [ ] Hint button in Classic: "Hint (1 free)" on first use, then "Hint (inventory)" if available
- [ ] Hint button in Time Attack: per-design-decision (free or consumable-only)
- [ ] Hint deduction: inventory count decreases by 1 when used
- [ ] Undo button shows remaining uses
- [ ] Undo disabled when count = 0
- [ ] Reveal button (Time Attack) available only if in inventory
- [ ] Skip button (Time Attack) shows free uses remaining, then "Skip (inventory)" if needed
- [ ] All consumable buttons show disabled state clearly (grayed out, no click)
- [ ] Purchasing consumables from settings immediately updates inventory; game reflects the change

### 7.6 Inventory & Unlocks

- [ ] Mode unlock "Practice" (or others) shows tile active on homepage when unlocked
- [ ] Themed dictionary toggle in settings only appears after corresponding unlock purchased
- [ ] Badges visible on profile (if profile exists; otherwise deferred)
- [ ] Inventory count for consumables accurate (no off-by-one, no negative values)
- [ ] Purchasing a 10-pack when you have 5 shows 15 total, not capped

### 7.7 Daily Bonus System

- [ ] Daily bonus button/region visible on homepage or wallet screen
- [ ] Claiming daily bonus awards coins + XP
- [ ] Claims limited to once per calendar day (00:00 UTC)
- [ ] Button disabled after claim; text shows "Claim again tomorrow"
- [ ] Returning player with old data: claim still works (no crash on missing fields)

### 7.8 Classic Mode Visual Alignment

- [ ] Header strip height ~48px, matching TimeAttack
- [ ] Header has hairline border-bottom (border-gray-200 dark:border-gray-800)
- [ ] Page container max-w-md, centered, generous padding
- [ ] Title text-4xl font-bold tracking-wide
- [ ] Buttons have 44px minimum height/width (WCAG touch target)
- [ ] Primary button uses yellow accent matching Blitz
- [ ] Secondary buttons use gray with clear hover state
- [ ] Win/Loss modals styled consistently with other modes (white bg, rounded, shadow)
- [ ] Dark mode: all text has contrast > 4.5:1; no elements invisible
- [ ] Mobile 375px: no horizontal scroll; buttons stack vertically; game content visible

### 7.9 Time Attack & Blitz Consistency

- [ ] Time Attack buttons match Blitz button styling (if Blitz added new patterns)
- [ ] All modals across modes use consistent styling
- [ ] Spacing and padding consistent across modes

### 7.10 Cross-Mode Interaction

- [ ] Player in Classic, pauses to buy consumable from settings, returns to game: purchase reflected immediately
- [ ] Player earns coins in one mode, switches to another: WalletStrip shows updated balance
- [ ] Player in one browser tab earning coins; WalletStrip in other tab updates via storage event

### 7.11 Edge Case Handling

- [ ] New player (0 coins, 0 XP) plays game: no UI broken, WalletStrip readable
- [ ] Player levels up while game animation is running: modal doesn't clip or render behind other UI
- [ ] Player at max level (20): earning XP still works (participates without another level-up)
- [ ] Multiple consumable purchases in quick succession: counts accumulate correctly
- [ ] localStorage manually corrupted (malformed JSON): app recovers with default state, no crash
- [ ] High coin count (>10,000): displays correctly without text overflow or truncation
- [ ] Consumable count very high (100+): shows accurately, no overflow
- [ ] Cross-tab rapid updates: last-write-wins is applied; no race conditions visible to user

### 7.12 Code Quality & Testing

- [ ] All existing tests pass (npm test)
- [ ] npm run build succeeds with 0 TypeScript errors
- [ ] No new console.error or console.warn messages during normal play
- [ ] Integration test suite for economy features all passing
- [ ] Snapshot tests regenerated and all passing
- [ ] Code review: no hardcoded magic numbers (use named constants)
- [ ] Code review: no console.log debugging statements left behind

### 7.13 Accessibility

- [ ] Keyboard navigation: Tab moves through all interactive elements
- [ ] Keyboard support: Escape dismisses modals, Enter activates buttons
- [ ] Screen reader: Level-up event announced via aria-live
- [ ] Screen reader: Coin earning announced (or optional per product)
- [ ] Focus indicators: Visible on all buttons, inputs, interactive elements
- [ ] Color contrast: WCAG AA met for all text in light and dark mode

---

## Section 8: Out of Scope

This pass focuses on cross-mode economy integration + Classic visual alignment. Explicitly NOT included:

### 8.1 Firebase Adapter for Word Blitz
- **Why deferred:** Multiplayer over Firebase is Phase 2; LocalSyncAdapter works for local pass-and-play
- **Next:** Build FirebaseSyncAdapter in dedicated pass

### 8.2 New Game Modes (Practice, Endless, Reverse, Locked-Letter)
- **Why deferred:** Requires new game logic; mode unlock UI shows them as "locked" until earned
- **Next:** Implement each mode as separate sprint

### 8.3 Achievements System (if not already partially implemented)
- **Why deferred:** Significant feature; would require achievement definition + evaluation logic + UI
- **Next:** Separate brainstorm/design/implement pass

### 8.4 Friend Challenges / Competitive Features
- **Why deferred:** Multi-player social features; depends on Firebase setup
- **Next:** Phase 3 or later

### 8.5 Weekly Leaderboards
- **Why deferred:** Backend infrastructure needed
- **Next:** Phase 3 or later

### 8.6 Puzzle Generation Algorithm Optimization
- **Why deferred:** Out of scope; current generation works
- **Next:** Only if performance metrics suggest it's needed

### 8.7 Dictionary Content Expansion
- **Why deferred:** Content, not code
- **Next:** Handled by content team or dedicated content sprint

### 8.8 Sound Effects / Audio Feedback
- **Why deferred:** Nice-to-have; not critical for retention features
- **Next:** Polish pass after core features solid

### 8.9 Performance Optimization
- **Why deferred:** Not blockers; current performance acceptable for small codebase
- **Next:** After feature set complete

### 8.10 Theme Customization Beyond Light/Dark
- **Why deferred:** Current light/dark sufficient
- **Next:** Later if user requests suggest demand

### 8.11 Profile Page / Player Stats Page
- **Why deferred:** Separate feature; relates to economy but independent
- **Next:** Separate design/implementation

### 8.12 Refactoring Existing Features for Consistency
- Examples: extracting common reducer patterns, standardizing hook interfaces
- **Why deferred:** Would delay economy wiring
- **Next:** Tech-debt sprint after features ship

---

## Appendix: Files to Read (Full Audit List)

In priority order:

1. src/lib/economy/useEconomy.ts (already partially read)
2. src/lib/economy/wallet.ts
3. src/lib/economy/inventory.ts
4. src/lib/economy/types.ts
5. src/components/economy/LevelUpProvider.tsx (already read)
6. src/components/economy/LevelUpModal.tsx
7. src/components/economy/WalletStrip.tsx
8. src/ClassicGame.tsx (already partially read; continue from line 100)
9. src/features/timeAttack/pages/TimeAttackPage.tsx (fully)
10. src/features/blitz/components/BlitzResultsScreen.tsx (fully)
11. src/pages/HomePage.tsx (check for WalletStrip, mode tiles)
12. src/pages/SettingsPage.tsx (check for shop)
13. src/App.tsx (already read — correct)
14. src/lib/economy/useEconomy.test.ts (check test coverage)
15. src/ClassicGame.test.tsx (check for economy mocks, snapshot tests)

---

**Document Status:** Ready for review  
**Next Step:** Execute Section 1 (full file audit) to confirm actual current state; then proceed to implementation via sequenced prompts

