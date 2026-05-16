# Puzzle Library Feature Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Classic mode with a structured Puzzle Library system where players progress through difficulty categories (3-letter to 7-letter words), complete puzzles, and review their solutions alongside optimal solutions.

**Architecture:** IndexedDB-backed puzzle library with React state management, progressive unlock system based on word length, dedicated library browser UI, and solution comparison display on completion.

**Tech Stack:** React 19, TypeScript, IndexedDB, existing wordGraph for optimal path calculation, Tailwind CSS for responsive design.

---

## 1. Feature Overview

### 1.1 Core Concept
The Puzzle Library replaces the current random Classic game mode with a structured progression system:
- **Categories:** 6 difficulty tiers based on word length (3-letter through 7-letter)
- **Per-Category:** 10 puzzles per difficulty level
- **Progression:** Complete puzzles within a category; unlock next category after choosing to advance
- **Replay:** Access completed puzzles from a dedicated Library Browser anytime
- **Solution Tracking:** Store both player's solution and optimal solution for each completed puzzle

### 1.2 In-Scope (Classic Mode Only)
- Replaces existing Classic Game
- Does NOT affect TimeAttack or Blitz modes
- Does NOT add new game mechanics (uses existing PuzzleBoard component)
- Does NOT add social/leaderboard features

### 1.3 Out-of-Scope
- Cloud sync (local storage only, architecture supports it later)
- Achievements/badges (can add as extension)
- Difficulty customization within categories
- Import/export of library

---

## 2. Data Architecture

### 2.1 IndexedDB Schema

**Table: `puzzles`**
```javascript
{
  id: string,                    // Unique: "{startWord}_{endWord}"
  wordLength: number,            // 3-7
  startWord: string,
  endWord: string,
  category: number,              // Derived from wordLength (3→0, 4→1, ... 7→5)
  completed: boolean,            // Has player solved this?
  userSolution?: string[],       // Words they played: ["cat", "bat", "bar", ...]
  optimalSolution?: string[],    // Shortest path
  moveCount?: number,            // Length of userSolution - 1
  optimalMoveCount?: number,     // Length of optimalSolution - 1
  completedAt?: number           // Timestamp
}
```

**Table: `categories`**
```javascript
{
  wordLength: number,            // 3-7, serves as ID
  totalPuzzles: number,          // Always 10
  completedCount: number,        // Count of completed puzzles
  lastPlayedIndex: number,       // Index of last puzzle shown (for resume)
  unlockedAt?: number            // Timestamp when category unlocked
}
```

**Table: `progress`**
```javascript
{
  id: "global",
  currentWordLength: number,     // Currently playing (3-7)
  totalCompleted: number,        // Total puzzles completed across all categories
  lastPlayedAt: number           // Timestamp of last play
}
```

### 2.2 Initialization
- On first app load (or category unlock): Generate 10 random valid puzzles for the category
- Valid puzzle = solvable path exists from start to end word (use existing wordGraph)
- Store in IndexedDB for persistence
- Do NOT regenerate puzzles between sessions (same 10 per category always)

### 2.3 Puzzle Lifecycle
1. **Initial State:** `{ completed: false }` when generated
2. **During Play:** Player solves puzzle using PuzzleBoard component
3. **On Completion:** Calculate optimal solution using wordGraph shortest path, store both solutions
4. **Persistent:** Puzzle remains in IndexedDB with both solutions for replay/browsing

---

## 3. UI & Navigation

### 3.1 Home Screen
**Changes:**
- Replace "Classic" button with "Puzzle Library"
- Show progress chip: "3-Letter: 7/10" (current category progress)
- Maintain existing TimeAttack and Blitz buttons

### 3.2 Puzzle Library Entry Points

**Entry Point 1: Play Next Puzzle**
- Click "Puzzle Library" → loads random unsolved puzzle in current category
- Display: start word → end word, category label ("3-Letter Easy")
- Uses existing PuzzleBoard component

**Entry Point 2: Library Browser Screen** (new component)
- Accessible from: Home screen (separate button) or home nav
- Shows tabs: "3-Letter" | "4-Letter" | "5-Letter" | "6-Letter" | "7-Letter"
- Each tab shows:
  - Category progress: "7/10 Completed" with visual progress bar
  - Completed puzzles in grid: start → end, click to replay
  - Show: user's move count vs optimal (e.g., "Your: 5 | Optimal: 3")
  - Uncompleted puzzles grayed out
- Click puzzle to replay (same UI as normal play, but marked as replay)

### 3.3 Gameplay Screen
**Changes from current ClassicGame:**
- Top bar shows: "3-Letter Category | Puzzle 7/10" (progress indicator)
- Same PuzzleBoard component (no changes)
- Bottom button: "Next Puzzle" (instead of random)

### 3.4 Results Screen (After Puzzle Completion)
**New Component: `ResultsWithComparison`**
- Show player's solution (sequence of words with move count)
- Show optimal solution in parallel (highlight where they diverged)
- Stats: "You took 5 moves | Optimal: 3 moves | +2 moves over optimal"
- Coin reward (same as current random mode)
- Button options:
  - "Next Puzzle" → load next unsolved in category
  - "View Library" → open Library Browser
  - If category complete (10/10): "Move to 4-Letter Category" button in addition to "Continue with 3-Letter"

---

## 4. Game Flow & Progression

### 4.1 First-Time Experience
1. Player opens app → sees "Puzzle Library" button instead of "Classic"
2. Click → shows intro modal: "Welcome to Puzzle Library. Start with 3-letter words and progress through difficulty levels."
3. Load first 3-letter puzzle automatically
4. Player solves → results screen shows stats + encourages library browsing

### 4.2 Category Progression
**Rules:**
- Start: Only 3-letter category playable, others locked
- To unlock 4-letter: Complete ANY puzzle in 3-letter (not all 10)
- Once unlocked: Player can choose to:
  - Continue 3-letter (play more from the 10)
  - Advance to 4-letter
  - Go backwards to replay 3-letter
- No forced progression; player controls difficulty advancement

### 4.3 Puzzle Selection Within Category
- When loading "Next Puzzle": Select random puzzle from unsolved (completed=false) in current category
- Once all 10 solved: Show "Category Complete!" modal with options (move forward or replay)
- Replay: Can select any completed puzzle from Library Browser anytime

### 4.4 Progress Persistence
- On app restart: Resume with last played category and puzzle state
- Session state: React Context (fast access), synced to IndexedDB on completion
- No data loss on navigate away or app close

---

## 5. Solution Comparison UX

### 5.1 Optimal Solution Calculation
- Use existing `shortestPath` function from wordGraph
- Calculate on puzzle completion (or lazy on first view if perf concern)
- Store in IndexedDB for repeated views (no recalculation)

### 5.2 Comparison Display
**Results Screen Layout:**
```
┌─────────────────────────────────────────┐
│ Puzzle Complete!                        │
├─────────────────────────────────────────┤
│ YOUR SOLUTION (5 moves)    OPTIMAL (3)  │
│ ━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━  │
│ cat                        cat          │
│ bat ← diverged here        bat          │
│ bar                        bar → end    │
│ bar                                     │
│ end                                     │
│                                         │
│ +2 moves over optimal                   │
├─────────────────────────────────────────┤
│ [Next Puzzle] [View Library] [Skip]    │
└─────────────────────────────────────────┘
```

### 5.3 Highlighting
- Same words: normal text
- Divergence point: highlight the first word that differs, show arrow
- Player path: normal styling
- Optimal path: subtle highlight (green tint or checkmark)

---

## 6. Polish & UX Details

### 6.1 Animations
- Category completion: Confetti or slide animation when unlocking new difficulty
- Puzzle progress: Smooth progress bar fill animation
- Results screen: Slide-in from bottom, fade solutions into view
- Library: Smooth transitions between tabs, grid layout animation on load

### 6.2 Visual Design
- Progress indicators: Clear per-category progress bars (e.g., "7/10")
- Completed badge: Checkmark or color-coded on library puzzles
- Category lock state: Grayed out with lock icon until unlocked
- Typography: Hierarchy (category label larger, move counts smaller)
- Responsive: Works on mobile (375px) and desktop (1024px+)
- Dark mode: Full support with category-specific color coding if desired

### 6.3 Accessibility
- Keyboard navigation: Tab through puzzles in library, arrow keys to switch categories
- ARIA labels: "7 of 10 puzzles completed", "Optimal solution: 3 moves"
- Focus rings: Visible on buttons, category tabs
- Screen reader support: Announce completion status, solution comparison

### 6.4 Error Handling
- Invalid puzzle (no path): Skip to next puzzle, log warning
- IndexedDB failure: Fallback to session storage with warning to user
- Missing optimal solution: Show user solution only, calculate optimal on demand

### 6.5 Loading States
- First load of category: Show spinner, "Generating puzzles..."
- Optimal solution calculation: Quick (< 100ms), don't show spinner
- Library browser: Instant (local storage), no skeleton needed

---

## 7. Integration with Existing Systems

### 7.1 Economy & Rewards
- Each puzzle completion earns coins (same formula as current random mode)
- No change to economy system, just applies to library puzzles
- Replay of completed puzzle: Still earns coins (or reduced coins if needed balance)

### 7.2 Stats Tracking
- Puzzle completions: Tracked in existing stats system
- Move counts: Store per puzzle for future analytics
- Category unlock times: Store for progress tracking

### 7.3 Navigation
**Home Screen:**
- Replace "Classic Game" button with "Puzzle Library"
- Add small button for "Library Browser" (view all completed puzzles)
- No changes to TimeAttack or Blitz buttons

### 7.4 Backwards Compatibility
- Current players: Optional migration screen
  - Show summary: "You've completed X random puzzles in Classic mode"
  - Option: "Start Fresh" (begin Puzzle Library) or "Keep History" (if feasible)
- New players: Start directly in Puzzle Library

---

## 8. File Structure

**New Files:**
```
src/lib/puzzleLibrary/
├── db.ts                 # IndexedDB setup, initialization
├── types.ts              # TypeScript interfaces (Puzzle, Category, Progress)
├── queries.ts            # CRUD operations (get, save, update puzzles)
├── optimalSolver.ts      # Wrapper for shortestPath calculation
└── useLibraryProgress.ts # React hook for library state

src/features/classic/
├── PuzzleLibraryMode.tsx         # Main game screen (replaces ClassicGame)
├── PuzzleLibraryBrowser.tsx      # Library history screen
├── ResultsWithComparison.tsx     # Results + solution comparison
├── CategoryUnlockModal.tsx       # "Category Complete" modal
└── __tests__/
    ├── PuzzleLibraryMode.test.tsx
    ├── puzzleLibrary.integration.test.ts
    └── db.test.ts
```

**Modified Files:**
```
src/App.tsx              # Route change: "classic" → "puzzle-library"
src/Home.tsx             # Button change: "Classic" → "Puzzle Library"
src/useGameState.ts      # No changes (used by PuzzleBoard)
src/generatePuzzle.ts    # No changes (not used directly)
```

---

## 9. Success Criteria

✅ Puzzle Library system fully replaces Classic mode
✅ Categories 3-7 letter words, 10 puzzles per category
✅ Progression unlocks and navigation work as designed
✅ IndexedDB persists all puzzle data correctly
✅ Solution comparison displays user vs optimal paths
✅ Library Browser shows all completed puzzles with stats
✅ Replay functionality works on any completed puzzle
✅ Responsive design: 375px mobile and 1024px+ desktop
✅ Dark mode fully supported
✅ Animations smooth and polished (category unlock, transitions)
✅ Accessibility: keyboard nav, ARIA labels, screen reader support
✅ Economy rewards applied correctly
✅ All existing tests pass, new tests added for library system

---

## 10. Timeline Estimate

- Data layer (IndexedDB setup): 2-3 hours
- UI components (3-4 new screens): 4-5 hours
- Game logic (progression, selection): 2-3 hours
- Integration & testing: 2-3 hours
- Polish (animations, dark mode, accessibility): 2-3 hours

**Total: ~13-17 hours**

---

**Design Complete — Ready for Implementation Plan**
