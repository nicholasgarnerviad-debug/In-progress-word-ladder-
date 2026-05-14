# Time Attack Page Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the TimeAttackPage orchestrator and ResultsScreen to complete the Time Attack feature, ready to activate at `/play/time-attack`.

**Architecture:** TimeAttackPage wraps useTimeAttack hook and conditionally renders SetupScreen (idle/setup), PlayScreen (playing), or ResultsScreen (ended) based on phase. ResultsScreen displays run statistics and offers play-again or home navigation. All components use existing design patterns from HomePage/SetupScreen.

**Tech Stack:** React, TypeScript, React Router, Tailwind CSS, @testing-library/react

---

## File Structure

**Create:**
- `src/features/timeAttack/pages/TimeAttackPage.tsx` — Orchestrator component, wraps hook, renders phase-based screens
- `src/features/timeAttack/components/ResultsScreen.tsx` — Results display and navigation

**Modify:**
- `src/App.tsx` — Add route `/play/time-attack` → TimeAttackPage

**Test:**
- `src/features/timeAttack/pages/__tests__/TimeAttackPage.test.tsx`
- `src/features/timeAttack/components/__tests__/ResultsScreen.test.tsx`

---

## Task 1: Create TimeAttackPage

**Files:**
- Create: `src/features/timeAttack/pages/TimeAttackPage.tsx`
- Test: `src/features/timeAttack/pages/__tests__/TimeAttackPage.test.tsx`

- [ ] **Step 1: Create TimeAttackPage component with hook integration**

Create `src/features/timeAttack/pages/TimeAttackPage.tsx`:

```typescript
import React, { useEffect } from 'react';
import { useTimeAttack } from '../useTimeAttack';
import { SetupScreen } from '../components/SetupScreen';
import { PlayScreen } from '../components/PlayScreen';
import { ResultsScreen } from '../components/ResultsScreen';

export const TimeAttackPage: React.FC = () => {
  const state = useTimeAttack();

  useEffect(() => {
    document.title = 'Time Attack — Word Ladder';
  }, []);

  return (
    <>
      {(state.phase === 'idle' || state.phase === 'setup') && (
        <SetupScreen
          mode={state.mode}
          tier={state.tier}
          onChooseMode={state.chooseMode}
          onChooseTier={state.chooseTier}
          onStartRun={state.startRun}
          onReset={state.reset}
        />
      )}

      {state.phase === 'playing' && (
        <PlayScreen
          puzzle={state.currentPuzzle}
          puzzleIndex={state.currentPuzzleIndex}
          remainingMs={state.timeRemainingMs}
          isTimeRewardFlashing={state.isTimeRewardFlashing}
          solvedCount={state.solvedCount}
          currentStreak={state.currentStreak}
          tier={state.tier!}
          onSolved={state.reportSolved}
          onSkip={state.skipPuzzle}
          freeSkipsRemaining={state.freeSkipsRemaining}
        />
      )}

      {state.phase === 'ended' && (
        <ResultsScreen
          mode={state.mode!}
          tier={state.tier!}
          solvedCount={state.solvedCount}
          longestStreak={state.longestStreak}
          timeTakenMs={state.runStartedAt ? Date.now() - state.runStartedAt : 0}
          averageSolveMs={
            state.solveTimings.length > 0
              ? Math.round(state.solveTimings.reduce((a, b) => a + b, 0) / state.solveTimings.length)
              : null
          }
          bestDifficulty={state.bestDifficulty}
          onPlayAgain={state.playAgain}
          onBackToHome={state.reset}
        />
      )}
    </>
  );
};
```

- [ ] **Step 2: Create test file with initial render test**

Create `src/features/timeAttack/pages/__tests__/TimeAttackPage.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TimeAttackPage } from '../TimeAttackPage';
import * as useTimeAttackModule from '../../useTimeAttack';

jest.mock('../../useTimeAttack');

describe('TimeAttackPage', () => {
  const mockState = {
    phase: 'idle' as const,
    mode: null,
    tier: null,
    timeRemainingMs: 0,
    isTimeRewardFlashing: false,
    solvedCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    freeSkipsRemaining: 2,
    currentPuzzle: null,
    currentPuzzleIndex: 0,
    currentDifficulty: null,
    bestDifficulty: null,
    runStartedAt: null,
    solveTimings: [],
    lastSolveStartedAt: null,
    chooseMode: jest.fn(),
    chooseTier: jest.fn(),
    backToModeSelect: jest.fn(),
    startRun: jest.fn(),
    reportSolved: jest.fn(),
    skipPuzzle: jest.fn(),
    endRun: jest.fn(),
    playAgain: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTimeAttackModule.useTimeAttack as jest.Mock).mockReturnValue(mockState);
  });

  it('renders SetupScreen when phase is idle', () => {
    render(<TimeAttackPage />);
    expect(screen.getByText('Time Attack')).toBeInTheDocument();
    expect(screen.getByText('Sprint')).toBeInTheDocument();
  });

  it('renders PlayScreen when phase is playing', () => {
    (useTimeAttackModule.useTimeAttack as jest.Mock).mockReturnValue({
      ...mockState,
      phase: 'playing' as const,
      currentPuzzle: {
        start: 'cat',
        end: 'dog',
        optimal: 3,
        chain: ['cat', 'cot', 'dot', 'dog'],
        lockedIndices: [0, 3],
        extraRungs: 0,
      },
    });

    render(<TimeAttackPage />);
    expect(screen.getByText('Solved')).toBeInTheDocument();
    expect(screen.getByText('Streak')).toBeInTheDocument();
  });

  it('renders ResultsScreen when phase is ended', () => {
    (useTimeAttackModule.useTimeAttack as jest.Mock).mockReturnValue({
      ...mockState,
      phase: 'ended' as const,
      mode: 'sprint' as const,
      tier: 60 as const,
      solvedCount: 5,
      longestStreak: 3,
      bestDifficulty: 'hard' as const,
    });

    render(<TimeAttackPage />);
    expect(screen.getByText(/Solved:/i)).toBeInTheDocument();
  });

  it('sets document title', () => {
    render(<TimeAttackPage />);
    expect(document.title).toBe('Time Attack — Word Ladder');
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
npm test -- src/features/timeAttack/pages/__tests__/TimeAttackPage.test.tsx
```

Expected: 4 tests pass

- [ ] **Step 4: Commit**

```bash
git add src/features/timeAttack/pages/TimeAttackPage.tsx src/features/timeAttack/pages/__tests__/TimeAttackPage.test.tsx
git commit -m "feat: create TimeAttackPage orchestrator component"
```

---

## Task 2: Create ResultsScreen

**Files:**
- Create: `src/features/timeAttack/components/ResultsScreen.tsx`
- Test: `src/features/timeAttack/components/__tests__/ResultsScreen.test.tsx`

- [ ] **Step 1: Create ResultsScreen component**

Create `src/features/timeAttack/components/ResultsScreen.tsx`:

```typescript
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TimeAttackMode, DurationTier, Difficulty } from '../types';
import { getBest, loadStats } from '../stats';

export type ResultsScreenProps = {
  mode: TimeAttackMode;
  tier: DurationTier;
  solvedCount: number;
  longestStreak: number;
  timeTakenMs: number;
  averageSolveMs: number | null;
  bestDifficulty: Difficulty | null;
  onPlayAgain: () => void;
  onBackToHome: () => void;
};

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  mode,
  tier,
  solvedCount,
  longestStreak,
  timeTakenMs,
  averageSolveMs,
  bestDifficulty,
  onPlayAgain,
  onBackToHome,
}) => {
  const navigate = useNavigate();
  const stats = loadStats();
  const personalBest = getBest(stats, mode, tier);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (duration: DurationTier): string => {
    if (mode === 'sprint') {
      return `${duration}s`;
    } else {
      const labels = { 60: 'Short', 90: 'Medium', 120: 'Long' };
      return labels[duration];
    }
  };

  const handlePlayAgain = () => {
    onPlayAgain();
  };

  const handleBackToHome = () => {
    onBackToHome();
    navigate('/');
  };

  const isBestRun = !personalBest || solvedCount > personalBest.solved;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header strip */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center justify-center px-4">
        <h1 className="text-xl font-bold">Run Complete</h1>
      </div>

      {/* Main content */}
      <div className="max-w-md mx-auto px-4">
        {/* Best run indicator */}
        {isBestRun && (
          <div className="pt-6 pb-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4 text-center">
              <p className="text-green-700 dark:text-green-300 font-bold">🎉 New Personal Best!</p>
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div className="py-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Solved</p>
              <p className="text-3xl font-bold font-mono">{solvedCount}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Streak</p>
              <p className="text-3xl font-bold font-mono">{longestStreak}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Time</p>
              <p className="text-lg font-bold font-mono">{formatTime(timeTakenMs)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Avg</p>
              <p className="text-lg font-bold font-mono">
                {averageSolveMs !== null ? `${Math.round(averageSolveMs / 1000)}s` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Mode/tier and personal best */}
        <div className="py-4 space-y-3">
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Mode & Duration</p>
            <div className="flex items-center justify-between">
              <p className="font-bold capitalize">{mode}</p>
              <p className="font-bold text-gray-600 dark:text-gray-400">{formatDuration(tier)}</p>
            </div>
          </div>

          {personalBest && (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Personal Best</p>
              <p className="font-bold">{personalBest.solved} solved</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="py-6 space-y-3">
          <button
            onClick={handlePlayAgain}
            className="w-full py-3 px-4 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold transition-colors hover:bg-gray-800 dark:hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            Play Again
          </button>
          <button
            onClick={handleBackToHome}
            className="w-full py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create test file**

Create `src/features/timeAttack/components/__tests__/ResultsScreen.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ResultsScreen } from '../ResultsScreen';
import * as statsModule from '../../stats';

jest.mock('../../stats');

describe('ResultsScreen', () => {
  const mockActions = {
    onPlayAgain: jest.fn(),
    onBackToHome: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (statsModule.loadStats as jest.Mock).mockReturnValue({
      bests: {},
      totalRuns: 0,
      totalSolved: 0,
    });
    (statsModule.getBest as jest.Mock).mockReturnValue(null);
  });

  const renderResultsScreen = (props = {}) => {
    return render(
      <BrowserRouter>
        <ResultsScreen
          mode="sprint"
          tier={60}
          solvedCount={5}
          longestStreak={3}
          timeTakenMs={45000}
          averageSolveMs={5000}
          bestDifficulty="hard"
          {...mockActions}
          {...props}
        />
      </BrowserRouter>
    );
  };

  it('renders run stats', () => {
    renderResultsScreen();

    expect(screen.getByText('Run Complete')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // solvedCount
    expect(screen.getByText('3')).toBeInTheDocument(); // longestStreak
  });

  it('formats time correctly', () => {
    renderResultsScreen();

    expect(screen.getByText('0:45')).toBeInTheDocument(); // 45s formatted
  });

  it('displays personal best when available', () => {
    (statsModule.getBest as jest.Mock).mockReturnValue({
      solved: 4,
      tier: 60,
      mode: 'sprint',
    });

    renderResultsScreen();

    expect(screen.getByText('4 solved')).toBeInTheDocument();
  });

  it('shows best run indicator when solvedCount beats personal best', () => {
    (statsModule.getBest as jest.Mock).mockReturnValue({
      solved: 3,
      tier: 60,
      mode: 'sprint',
    });

    renderResultsScreen({ solvedCount: 5 });

    expect(screen.getByText('🎉 New Personal Best!')).toBeInTheDocument();
  });

  it('calls onPlayAgain when Play Again button clicked', async () => {
    const user = userEvent.setup();
    renderResultsScreen();

    const playAgainButton = screen.getByRole('button', { name: /Play Again/i });
    await user.click(playAgainButton);

    expect(mockActions.onPlayAgain).toHaveBeenCalled();
  });

  it('calls onBackToHome when Back to Home button clicked', async () => {
    const user = userEvent.setup();
    renderResultsScreen();

    const backButton = screen.getByRole('button', { name: /Back to Home/i });
    await user.click(backButton);

    expect(mockActions.onBackToHome).toHaveBeenCalled();
  });

  it('displays "—" for average when no solveTimings', () => {
    renderResultsScreen({ averageSolveMs: null });

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('displays mode and duration correctly for survival', () => {
    renderResultsScreen({ mode: 'survival', tier: 90 });

    expect(screen.getByText('survival')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
npm test -- src/features/timeAttack/components/__tests__/ResultsScreen.test.tsx
```

Expected: 9 tests pass

- [ ] **Step 4: Commit**

```bash
git add src/features/timeAttack/components/ResultsScreen.tsx src/features/timeAttack/components/__tests__/ResultsScreen.test.tsx
git commit -m "feat: create ResultsScreen component for end-of-run display"
```

---

## Task 3: Update App.tsx routing

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import TimeAttackPage and add route**

Update `src/App.tsx` to add the `/play/time-attack` route. Find the routes section and add:

```typescript
import { TimeAttackPage } from './features/timeAttack/pages/TimeAttackPage';

// In the routes array, add:
<Route path="/play/time-attack" element={<TimeAttackPage />} />
```

- [ ] **Step 2: Verify route works and tests pass**

```bash
npm test
```

Expected: All 263+ tests pass, no regressions

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add Time Attack route at /play/time-attack"
```

---

## Self-Review

**Spec coverage:**
- ✅ TimeAttackPage orchestrates SetupScreen/PlayScreen/ResultsScreen by phase
- ✅ ResultsScreen displays solvedCount, longestStreak, timeTakenMs, averageSolveMs
- ✅ ResultsScreen shows personal best comparison
- ✅ Play Again and Back to Home navigation
- ✅ Minimalist styling consistent with existing components
- ✅ All changes in src/features/timeAttack/ with route in App.tsx

**Placeholder check:** None found. All code is complete and specific.

**Type consistency:** Types match existing TimeAttackState and component props throughout.

---

## Execution Notes

- TimeAttackPage is a thin orchestrator; most logic lives in useTimeAttack hook
- ResultsScreen is presentational; parent (TimeAttackPage) owns navigation and state reset
- Both components follow existing design patterns from HomePage/SetupScreen
- Route `/play/time-attack` activates the full Time Attack feature (ready from previous tasks)
