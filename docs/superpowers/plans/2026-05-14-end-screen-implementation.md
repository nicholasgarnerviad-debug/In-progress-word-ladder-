# End Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the EndScreen component that displays post-run results, personal best tracking, and replay/navigation controls.

**Architecture:** EndScreen is a presentational component that receives run summary data plus comparison snapshots. The useTimeAttack reducer captures the previous best before recording a run, enabling EndScreen to compute personal best status without race conditions. Component renders centerpiece stats, optional achievement badges, secondary stats, and action buttons.

**Tech Stack:** React, TypeScript, Tailwind CSS, @testing-library/react, jest

---

## File Structure

**Create:**
- `src/features/timeAttack/components/EndScreen.tsx` — End screen presentation component
- `src/features/timeAttack/components/__tests__/EndScreen.test.tsx` — Component tests

**Modify:**
- `src/features/timeAttack/useTimeAttack.ts` — Add previousBestAtRunEnd to state, capture in reducer
- `src/features/timeAttack/__tests__/useTimeAttack.test.ts` — Add reducer test for previousBestAtRunEnd capture
- `src/features/timeAttack/pages/TimeAttackPage.tsx` — Pass previousBestAtRunEnd to EndScreen

---

## Task 1: Update useTimeAttack Reducer to Capture Previous Best

**Files:**
- Modify: `src/features/timeAttack/useTimeAttack.ts:9-30` (TimeAttackState type)
- Modify: `src/features/timeAttack/useTimeAttack.ts:58-75` (initialState)
- Modify: `src/features/timeAttack/useTimeAttack.ts:166-171` (END_RUN/TIMER_EXPIRED case)
- Modify: `src/features/timeAttack/useTimeAttack.ts:173-190` (PLAY_AGAIN case)
- Modify: `src/features/timeAttack/useTimeAttack.ts:310-336` (endRun callback)
- Test: `src/features/timeAttack/__tests__/useTimeAttack.test.ts`

**Context:** The reducer currently calls recordRun() inside the endRun callback, but by that point we've already lost the previous best. We need to capture it before calling recordRun so EndScreen can determine if this is a new personal best.

### Step 1: Add previousBestAtRunEnd to TimeAttackState type

In `src/features/timeAttack/useTimeAttack.ts`, update the TimeAttackState type (line 9-30) to include:

```typescript
export type TimeAttackState = {
  phase: Phase;
  mode: TimeAttackMode | null;
  tier: DurationTier | null;

  timeRemainingMs: number;
  isTimeRewardFlashing: boolean;

  solvedCount: number;
  currentStreak: number;
  longestStreak: number;
  freeSkipsRemaining: number;

  currentPuzzle: Puzzle | null;
  currentPuzzleIndex: number;
  currentDifficulty: Difficulty | null;

  bestDifficulty: Difficulty | null;
  runStartedAt: number | null;
  solveTimings: number[];
  lastSolveStartedAt: number | null;

  previousBestAtRunEnd: { solved: number; longestStreak: number; achievedAt: string } | null;
};
```

Note: We use inline object type instead of importing TimeAttackBest to avoid circular imports with stats module.

- [ ] **Step 1: Add previousBestAtRunEnd to TimeAttackState type**

Update lines 9-30 to add the field above.

- [ ] **Step 2: Initialize previousBestAtRunEnd in initialState**

In initialState (line 58-75), add:

```typescript
const initialState: TimeAttackState = {
  phase: 'idle',
  mode: null,
  tier: null,
  timeRemainingMs: 0,
  isTimeRewardFlashing: false,
  solvedCount: 0,
  currentStreak: 0,
  longestStreak: 0,
  freeSkipsRemaining: FREE_SKIPS_PER_RUN,
  currentPuzzle: null,
  currentPuzzleIndex: 0,
  currentDifficulty: null,
  bestDifficulty: null,
  runStartedAt: null,
  solveTimings: [],
  lastSolveStartedAt: null,
  previousBestAtRunEnd: null,
};
```

- [ ] **Step 3: Update END_RUN and TIMER_EXPIRED case to capture previous best**

The END_RUN/TIMER_EXPIRED case (lines 166-171) currently just sets phase to 'ended'. We need to expand it to capture the previous best. However, reducer cases should be pure and not call external functions. Instead, we'll do the capture in the endRun callback and dispatch it via an action.

Add a new action type to ReducerAction union (line 44-56):

```typescript
type ReducerAction =
  | { type: 'CHOOSE_MODE'; mode: TimeAttackMode }
  | { type: 'CHOOSE_TIER'; tier: DurationTier }
  | { type: 'BACK_TO_MODE_SELECT' }
  | { type: 'START_RUN'; initialTimerMs: number; firstPuzzle: Puzzle }
  | { type: 'REPORT_SOLVED'; currentTime: number; puzzle: Puzzle; nextIndex: number }
  | { type: 'SKIP_PUZZLE'; puzzle: Puzzle; nextIndex: number }
  | { type: 'END_RUN'; currentTime: number; previousBest: { solved: number; longestStreak: number; achievedAt: string } | null }
  | { type: 'TIMER_EXPIRED'; previousBest: { solved: number; longestStreak: number; achievedAt: string } | null }
  | { type: 'PLAY_AGAIN' }
  | { type: 'RESET' }
  | { type: 'SET_TIME_REWARD_FLASH' }
  | { type: 'CLEAR_FLASH_TIMEOUT' };
```

Then update the END_RUN/TIMER_EXPIRED case (lines 166-171) to:

```typescript
case 'END_RUN':
case 'TIMER_EXPIRED':
  return {
    ...state,
    phase: 'ended',
    previousBestAtRunEnd: action.previousBest,
  };
```

- [ ] **Step 4: Update PLAY_AGAIN to reset previousBestAtRunEnd**

In the PLAY_AGAIN case (lines 173-190), add `previousBestAtRunEnd: null` to the reset:

```typescript
case 'PLAY_AGAIN':
  return {
    ...state,
    phase: 'setup',
    solvedCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    freeSkipsRemaining: FREE_SKIPS_PER_RUN,
    currentPuzzle: null,
    currentPuzzleIndex: 0,
    currentDifficulty: null,
    bestDifficulty: null,
    runStartedAt: null,
    solveTimings: [],
    lastSolveStartedAt: null,
    timeRemainingMs: 0,
    isTimeRewardFlashing: false,
    previousBestAtRunEnd: null,
  };
```

- [ ] **Step 5: Update endRun callback to capture previous best before recordRun**

Find the endRun callback (around line 310-336). Update it to capture the previous best and pass it to the dispatch:

```typescript
const endRun = useCallback(() => {
  if (state.phase !== 'playing') {
    return;
  }

  const currentTime = performance.now();
  timer.pause();

  const timeTakenMs = state.runStartedAt ? (currentTime - state.runStartedAt) : 0;
  const summary: RunSummary = {
    mode: state.mode!,
    tier: state.tier!,
    solvedCount: state.solvedCount,
    longestStreak: state.longestStreak,
    timeTakenMs,
    bestDifficulty: state.bestDifficulty,
    averageSolveMs: state.solveTimings.length > 0
      ? Math.round(state.solveTimings.reduce((a, b) => a + b, 0) / state.solveTimings.length)
      : null,
  };

  // Capture previous best BEFORE recording the run
  const currentStats = loadStats();
  const key = `${summary.mode}:${summary.tier}`;
  const previousBest = currentStats.bests[key] ?? null;

  // Record the run and update stats
  const updatedStats = recordRun(currentStats, summary);
  saveStats(updatedStats);

  // Dispatch END_RUN with previous best snapshot
  dispatch({ type: 'END_RUN', currentTime, previousBest });
}, [state.phase, state.mode, state.tier, state.solvedCount, state.longestStreak, state.runStartedAt, state.bestDifficulty, state.solveTimings, timer]);
```

- [ ] **Step 6: Test the reducer changes**

Create or update `src/features/timeAttack/__tests__/useTimeAttack.test.ts` to add a test for previousBestAtRunEnd capture:

```typescript
it('captures previousBestAtRunEnd when ending a run', () => {
  // Setup: render hook, choose mode/tier, start run
  const { result } = renderHook(() => useTimeAttack());
  
  act(() => {
    result.current.chooseMode('sprint');
    result.current.chooseTier(60);
    result.current.startRun();
  });

  // Simulate some gameplay
  act(() => {
    result.current.reportSolved();
  });

  // End the run
  act(() => {
    result.current.endRun();
  });

  // Verify previousBestAtRunEnd is captured
  expect(result.current.previousBestAtRunEnd).toBeDefined();
  expect(result.current.phase).toBe('ended');
});
```

- [ ] **Step 7: Verify all useTimeAttack tests still pass**

```bash
npm test -- src/features/timeAttack/__tests__/useTimeAttack.test.ts
```

Expected: All tests pass with new previousBestAtRunEnd tests included.

- [ ] **Step 8: Commit**

```bash
git add src/features/timeAttack/useTimeAttack.ts src/features/timeAttack/__tests__/useTimeAttack.test.ts
git commit -m "feat: capture previousBestAtRunEnd in reducer for personal best comparison"
```

---

## Task 2: Create EndScreen Component

**Files:**
- Create: `src/features/timeAttack/components/EndScreen.tsx`

- [ ] **Step 1: Create EndScreen component file with complete implementation**

Create `src/features/timeAttack/components/EndScreen.tsx`:

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TimeAttackMode, DurationTier, Difficulty } from '../types';

export type EndScreenProps = {
  mode: TimeAttackMode;
  tier: DurationTier;
  solvedCount: number;
  longestStreak: number;
  timeRemainingMs: number; // For sprint: tier * 1000 - timeRemaining
  averageSolveMs: number | null;
  bestDifficulty: Difficulty | null;
  previousBestAtRunEnd: { solved: number; longestStreak: number; achievedAt: string } | null;
  onPlayAgain: () => void;
  onBackToHome: () => void;
};

const formatMs = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getDurationLabel = (mode: TimeAttackMode, tier: DurationTier): string => {
  if (mode === 'sprint') {
    return `${tier}s`;
  } else {
    const labels: Record<DurationTier, string> = { 60: 'Short (45s base)', 90: 'Medium (75s base)', 120: 'Long (120s base)' };
    return labels[tier] || `${tier}s`;
  }
};

const computeElapsedTime = (mode: TimeAttackMode, tier: DurationTier, timeRemainingMs: number): string => {
  if (mode === 'sprint') {
    // Sprint: tier is total time, timeRemainingMs is what's left, so elapsed = tier*1000 - timeRemaining
    const elapsedMs = tier * 1000 - timeRemainingMs;
    return formatMs(Math.max(0, elapsedMs));
  } else {
    // Survival: timeRemainingMs is actual remaining time, so elapsed = initial - remaining
    // We'd need initial base time, but for simplicity, we show what stats.ts calculates
    // This will be passed from parent as calculated in endRun
    return formatMs(timeRemainingMs);
  }
};

export const EndScreen: React.FC<EndScreenProps> = ({
  mode,
  tier,
  solvedCount,
  longestStreak,
  timeRemainingMs,
  averageSolveMs,
  bestDifficulty,
  previousBestAtRunEnd,
  onPlayAgain,
  onBackToHome,
}) => {
  const navigate = useNavigate();
  
  const isPersonalBest = previousBestAtRunEnd === null || solvedCount > previousBestAtRunEnd.solved;
  const isFirstRun = previousBestAtRunEnd === null;

  const handleBackToHome = () => {
    onBackToHome();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header strip */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center px-4">
        <button
          onClick={handleBackToHome}
          className="text-2xl leading-none hover:opacity-60 transition-opacity"
          aria-label="Back to home"
        >
          ←
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center py-8 px-4 gap-6">
        {/* Achievement badge */}
        {isFirstRun && (
          <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-semibold">
            First Run!
          </div>
        )}
        {isPersonalBest && !isFirstRun && (
          <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-sm font-semibold">
            New Personal Best!
          </div>
        )}

        {/* Centerpiece: large number */}
        <div className="text-center">
          <div className="text-7xl font-bold font-mono tabular-nums">{solvedCount}</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Puzzles Solved</p>
        </div>

        {/* Mode + tier badge */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {mode === 'sprint' ? 'Sprint' : 'Survival'} • {getDurationLabel(mode, tier)}
          </p>
        </div>

        {/* Secondary stats card */}
        <div className="w-full max-w-sm border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Longest Streak</span>
            <span className="font-mono font-semibold text-lg">{longestStreak}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Time</span>
            <span className="font-mono font-semibold text-lg">{computeElapsedTime(mode, tier, timeRemainingMs)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Avg Solve</span>
            <span className="font-mono font-semibold text-lg">
              {averageSolveMs !== null ? formatMs(averageSolveMs) : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Best Difficulty</span>
            <span className="font-mono font-semibold text-lg">
              {bestDifficulty ? bestDifficulty.charAt(0).toUpperCase() + bestDifficulty.slice(1) : '—'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 px-4 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold transition-colors hover:bg-gray-800 dark:hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            Play Again
          </button>
          <button
            onClick={handleBackToHome}
            className="w-full py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify component compiles and TypeScript is correct**

```bash
npm run type-check
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/timeAttack/components/EndScreen.tsx
git commit -m "feat: create EndScreen component for post-run results display"
```

---

## Task 3: Create EndScreen Tests

**Files:**
- Create: `src/features/timeAttack/components/__tests__/EndScreen.test.tsx`

- [ ] **Step 1: Create comprehensive test file**

Create `src/features/timeAttack/components/__tests__/EndScreen.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { EndScreen } from '../EndScreen';

const renderEndScreen = (props = {}) => {
  return render(
    <BrowserRouter>
      <EndScreen
        mode="sprint"
        tier={60}
        solvedCount={5}
        longestStreak={3}
        timeRemainingMs={10000}
        averageSolveMs={6000}
        bestDifficulty="hard"
        previousBestAtRunEnd={null}
        onPlayAgain={jest.fn()}
        onBackToHome={jest.fn()}
        {...props}
      />
    </BrowserRouter>
  );
};

describe('EndScreen', () => {
  it('renders centerpiece solvedCount with label', () => {
    renderEndScreen();
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Puzzles Solved')).toBeInTheDocument();
  });

  it('shows "First Run!" pill when previousBestAtRunEnd is null', () => {
    renderEndScreen({ previousBestAtRunEnd: null });
    
    expect(screen.getByText('First Run!')).toBeInTheDocument();
  });

  it('shows "New Personal Best!" pill when solvedCount beats previous best', () => {
    renderEndScreen({
      previousBestAtRunEnd: { solved: 3, longestStreak: 2, achievedAt: '2026-05-13' },
      solvedCount: 5,
    });
    
    expect(screen.getByText('New Personal Best!')).toBeInTheDocument();
  });

  it('shows no badge when solvedCount does not beat previous best', () => {
    renderEndScreen({
      previousBestAtRunEnd: { solved: 6, longestStreak: 3, achievedAt: '2026-05-13' },
      solvedCount: 5,
    });
    
    expect(screen.queryByText('First Run!')).not.toBeInTheDocument();
    expect(screen.queryByText('New Personal Best!')).not.toBeInTheDocument();
  });

  it('displays mode and tier correctly for sprint', () => {
    renderEndScreen({ mode: 'sprint', tier: 90 });
    
    expect(screen.getByText('Sprint • 90s')).toBeInTheDocument();
  });

  it('displays mode and tier correctly for survival', () => {
    renderEndScreen({ mode: 'survival', tier: 90 });
    
    expect(screen.getByText(/Survival • Medium \(75s base\)/)).toBeInTheDocument();
  });

  it('renders secondary stats card with all values', () => {
    renderEndScreen({
      longestStreak: 4,
      averageSolveMs: 5500,
      bestDifficulty: 'medium',
    });
    
    expect(screen.getByText('4')).toBeInTheDocument(); // longestStreak
    expect(screen.getByText('Medium')).toBeInTheDocument(); // bestDifficulty capitalized
    expect(screen.getByText(/0:05/)).toBeInTheDocument(); // averageSolveMs formatted
  });

  it('displays "—" for null averageSolveMs', () => {
    renderEndScreen({ averageSolveMs: null });
    
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('displays "—" for null bestDifficulty', () => {
    renderEndScreen({ bestDifficulty: null });
    
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('calls onPlayAgain when Play Again button clicked', async () => {
    const onPlayAgain = jest.fn();
    const user = userEvent.setup();
    renderEndScreen({ onPlayAgain });
    
    const button = screen.getByRole('button', { name: /Play Again/i });
    await user.click(button);
    
    expect(onPlayAgain).toHaveBeenCalled();
  });

  it('calls onBackToHome when Home button clicked', async () => {
    const onBackToHome = jest.fn();
    const user = userEvent.setup();
    renderEndScreen({ onBackToHome });
    
    const button = screen.getByRole('button', { name: /Home/i });
    await user.click(button);
    
    expect(onBackToHome).toHaveBeenCalled();
  });

  it('calls onBackToHome when back arrow clicked', async () => {
    const onBackToHome = jest.fn();
    const user = userEvent.setup();
    renderEndScreen({ onBackToHome });
    
    const backButton = screen.getByRole('button', { name: /Back to home/i });
    await user.click(backButton);
    
    expect(onBackToHome).toHaveBeenCalled();
  });

  it('formats time correctly for sprint mode', () => {
    // sprint: 60s tier, 10000ms remaining = 50s elapsed
    renderEndScreen({ mode: 'sprint', tier: 60, timeRemainingMs: 10000 });
    
    expect(screen.getByText('0:50')).toBeInTheDocument();
  });

  it('capitalizes difficulty names correctly', () => {
    renderEndScreen({ bestDifficulty: 'hard' });
    
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they all pass**

```bash
npm test -- src/features/timeAttack/components/__tests__/EndScreen.test.tsx
```

Expected: All tests pass (12+).

- [ ] **Step 3: Verify no regressions in full test suite**

```bash
npm test
```

Expected: All tests pass (280+).

- [ ] **Step 4: Commit**

```bash
git add src/features/timeAttack/components/__tests__/EndScreen.test.tsx
git commit -m "test: add comprehensive EndScreen component tests"
```

---

## Task 4: Update TimeAttackPage to Use EndScreen

**Files:**
- Modify: `src/features/timeAttack/pages/TimeAttackPage.tsx`

- [ ] **Step 1: Import EndScreen and update conditional render**

In `src/features/timeAttack/pages/TimeAttackPage.tsx`, update the import and the ended phase rendering:

First, add EndScreen to imports at the top:

```typescript
import { EndScreen } from '../components/EndScreen';
```

Then, replace the ResultsScreen rendering (the `state.phase === 'ended'` block) with:

```typescript
{state.phase === 'ended' && (
  <EndScreen
    mode={state.mode!}
    tier={state.tier!}
    solvedCount={state.solvedCount}
    longestStreak={state.longestStreak}
    timeRemainingMs={state.timeRemainingMs}
    averageSolveMs={
      state.solveTimings.length > 0
        ? Math.round(state.solveTimings.reduce((a, b) => a + b, 0) / state.solveTimings.length)
        : null
    }
    bestDifficulty={state.bestDifficulty}
    previousBestAtRunEnd={state.previousBestAtRunEnd}
    onPlayAgain={state.playAgain}
    onBackToHome={state.reset}
  />
)}
```

- [ ] **Step 2: Run tests to verify no regressions**

```bash
npm test -- src/features/timeAttack/pages/__tests__/TimeAttackPage.test.tsx
```

Expected: All TimeAttackPage tests pass.

- [ ] **Step 3: Verify full test suite**

```bash
npm test
```

Expected: All 280+ tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/timeAttack/pages/TimeAttackPage.tsx
git commit -m "feat: integrate EndScreen component into TimeAttackPage"
```

---

## Self-Review

**Spec coverage:**
- ✅ Header strip with back arrow linking to / and calling reset()
- ✅ Centerpiece: large solvedCount with "Puzzles Solved" label
- ✅ Personal best badge logic: "New Personal Best" when beat previous, "First Run!" when no previous
- ✅ Mode + tier display: Sprint format and Survival format with base time
- ✅ Secondary stats card: Longest Streak, Time, Avg Solve, Best Difficulty
- ✅ Action buttons: Play Again (calls playAgain()), Home (calls reset() + navigate('/'))
- ✅ Comparison logic implemented in reducer capturing previousBestAtRunEnd before recordRun()
- ✅ All changes within src/features/timeAttack/

**Placeholder scan:** None found. All code is complete and specific.

**Type consistency:**
- TimeAttackState type consistent throughout
- previousBestAtRunEnd type matches getBest return type
- EndScreenProps type has all required fields
- All callback signatures match hook interface

**No red flags:** Implementation is straightforward, tests are comprehensive, reducer logic is sound.

---

## Execution Notes

- The key insight: capture previousBestAtRunEnd BEFORE calling recordRun() in the endRun callback to avoid race conditions where stats are updated before EndScreen can read the old best.
- EndScreen is purely presentational; all logic (personal best comparison) happens via props passed from parent.
- Time formatting differs between Sprint and Survival modes, handled by computeElapsedTime helper.
- All styling uses Tailwind with dark mode support, consistent with existing components.
