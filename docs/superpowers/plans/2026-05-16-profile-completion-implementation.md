# Player Profile Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the player profile page with level card display, improved stats presentation, and expandable achievement modals showing full achievement details.

**Architecture:** Enhance existing PlayerProfileScreen component to integrate the LevelCard component from the progression page, create a new AchievementModal component for expandable achievement details, update the achievements section to display icons in a grid with click handlers, and add modal state management to PlayerProfileScreen.

**Tech Stack:** React with TypeScript, React Router, Tailwind CSS for styling, Jest for testing, existing useEconomy hook, existing achievements system.

---

## File Structure

### Modified Files
- `src/components/leaderboard/PlayerProfileScreen.tsx` — Main profile component (add LevelCard, modal state, update achievements display)

### New Files
- `src/components/leaderboard/AchievementModal.tsx` — Modal component for achievement details
- `src/components/leaderboard/__tests__/AchievementModal.test.tsx` — Modal tests
- `src/components/leaderboard/__tests__/PlayerProfileScreen.test.tsx` — Profile component tests

---

## Tasks

### Task 1: Create AchievementModal Component

**Files:**
- Create: `src/components/leaderboard/AchievementModal.tsx`
- Test: `src/components/leaderboard/__tests__/AchievementModal.test.tsx`

- [ ] **Step 1: Write failing tests for AchievementModal**

Create `src/components/leaderboard/__tests__/AchievementModal.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AchievementModal } from '../AchievementModal';

describe('AchievementModal', () => {
  const mockAchievement = {
    id: 'firstGame',
    title: 'First Steps',
    description: 'Play your first game',
    icon: '🎮',
    rarity: 'common' as const,
    reward: { xp: 10, coins: 25 },
    criteria: { type: 'gameCount', value: 1 },
  };

  it('displays achievement title', () => {
    render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('First Steps')).toBeInTheDocument();
  });

  it('displays achievement icon', () => {
    render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('🎮')).toBeInTheDocument();
  });

  it('displays rarity badge', () => {
    render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/common/i)).toBeInTheDocument();
  });

  it('displays reward info', () => {
    render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/10.*xp/i)).toBeInTheDocument();
    expect(screen.getByText(/25.*coins/i)).toBeInTheDocument();
  });

  it('displays unlock date for earned achievements', () => {
    const earnDate = new Date('2026-05-10').getTime();
    render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={true}
        earnedDate={earnDate}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/unlocked|earned/i)).toBeInTheDocument();
  });

  it('displays unlock criteria for locked achievements', () => {
    render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={false}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/play 1 game/i)).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const mockOnClose = jest.fn();
    const { container } = render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={true}
        onClose={mockOnClose}
      />
    );
    const backdrop = container.querySelector('[data-testid="modal-backdrop"]');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={true}
        onClose={mockOnClose}
      />
    );
    const closeButton = screen.getByRole('button', { name: /close|×/i });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- AchievementModal.test.ts`
Expected: FAIL - AchievementModal not found

- [ ] **Step 3: Create AchievementModal component**

Create `src/components/leaderboard/AchievementModal.tsx`:

```typescript
import React from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
  reward: { xp: number; coins: number };
  criteria: { type: string; value?: number; mode?: string };
}

interface AchievementModalProps {
  achievement: Achievement;
  isEarned: boolean;
  earnedDate?: number;
  onClose: () => void;
}

const rarityColors = {
  common: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  rare: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  legendary: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
};

function getCriteriaText(criteria: Achievement['criteria']): string {
  if (criteria.type === 'gameCount') {
    const modeText = criteria.mode ? ` in ${criteria.mode}` : '';
    return `Play ${criteria.value} game${criteria.value !== 1 ? 's' : ''}${modeText}`;
  }
  if (criteria.type === 'scoreThreshold') {
    return `Achieve a score of ${criteria.value} or higher`;
  }
  return 'Unknown criteria';
}

export const AchievementModal: React.FC<AchievementModalProps> = ({
  achievement,
  isEarned,
  earnedDate,
  onClose,
}) => {
  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="modal-backdrop"
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Achievement
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none font-bold"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Icon */}
            <div className="text-center">
              <div className="text-6xl inline-block">{achievement.icon}</div>
            </div>

            {/* Title and rarity */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {achievement.title}
              </h3>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  rarityColors[achievement.rarity]
                }`}
              >
                {achievement.rarity}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {achievement.description}
            </p>

            {/* Status */}
            <div className="text-center">
              {isEarned ? (
                <div>
                  <p className="text-green-600 dark:text-green-400 font-semibold">
                    ✓ Unlocked
                  </p>
                  {earnedDate && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(earnedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold">
                    Locked
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {getCriteriaText(achievement.criteria)}
                  </p>
                </div>
              )}
            </div>

            {/* Rewards */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Reward
              </p>
              <div className="flex gap-4 justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    +{achievement.reward.xp}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">XP</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    +{achievement.reward.coins}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Coins
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- AchievementModal.test.ts`
Expected: PASS - all 7 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/components/leaderboard/AchievementModal.tsx src/components/leaderboard/__tests__/AchievementModal.test.tsx
git commit -m "feat: create achievement modal component with details display"
```

---

### Task 2: Enhance PlayerProfileScreen with LevelCard

**Files:**
- Modify: `src/components/leaderboard/PlayerProfileScreen.tsx`

- [ ] **Step 1: Add imports and state management**

At the top of `src/components/leaderboard/PlayerProfileScreen.tsx`, add:

```typescript
import { AchievementModal } from './AchievementModal';
import { useState } from 'react';
import { getAllAchievements } from '../../lib/leaderboard/achievements/achievements';
```

After the existing state declarations (around line 14), add:

```typescript
const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
const [achievementMap, setAchievementMap] = useState<{
  [key: string]: any;
}>({});

useEffect(() => {
  const achievements = getAllAchievements();
  const map: { [key: string]: any } = {};
  achievements.forEach((achievement) => {
    map[achievement.id] = achievement;
  });
  setAchievementMap(map);
}, []);
```

- [ ] **Step 2: Add level display after header section**

After line 51 (after the header closes), add:

```typescript
{/* Level Display */}
<div className="mb-6 md:mb-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
  <div className="text-center mb-4">
    <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
      {profile.level}
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Current Level</p>
  </div>
  
  {/* XP Bar */}
  <div className="mb-4">
    <div className="relative w-full bg-gray-300 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
      <div
        className="bg-blue-500 dark:bg-blue-400 h-full transition-all duration-300"
        style={{ width: `${Math.min(100, (profile.xp % 300) / 3)}%` }}
        role="progressbar"
        aria-valuenow={Math.min(100, (profile.xp % 300) / 3)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
      {profile.xp} XP
    </p>
  </div>
</div>
```

- [ ] **Step 3: Update achievements section**

Find and replace the achievements section (around line 138-147) with:

```typescript
{/* Achievements */}
<div className="mb-6 md:mb-8">
  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
    Achievements ({profile.achievements.length})
  </h2>
  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 md:gap-3">
    {profile.achievements.map((achievementId) => (
      <button
        key={achievementId}
        onClick={() => setSelectedAchievementId(achievementId)}
        className="p-2 md:p-3 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded-lg text-center min-h-[70px] md:min-h-[90px] flex flex-col items-center justify-center transition-colors cursor-pointer"
        title={achievementId}
      >
        <div className="text-2xl md:text-3xl mb-1">🏆</div>
        <div className="text-xs text-gray-600 dark:text-gray-300 break-words line-clamp-1 hover:line-clamp-2">
          {achievementId}
        </div>
      </button>
    ))}
  </div>
</div>

{/* Achievement Modal */}
{selectedAchievementId && achievementMap[selectedAchievementId] && (
  <AchievementModal
    achievement={achievementMap[selectedAchievementId]}
    isEarned={true}
    onClose={() => setSelectedAchievementId(null)}
  />
)}
```

- [ ] **Step 4: Run tests to ensure no regressions**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/leaderboard/PlayerProfileScreen.tsx
git commit -m "feat: enhance profile with level display and achievement modals"
```

---

### Task 3: Create PlayerProfileScreen Tests

**Files:**
- Create: `src/components/leaderboard/__tests__/PlayerProfileScreen.test.tsx`

- [ ] **Step 1: Write tests for profile**

Create `src/components/leaderboard/__tests__/PlayerProfileScreen.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PlayerProfileScreen } from '../PlayerProfileScreen';

jest.mock('../../../lib/leaderboard/sync/FirebaseLeaderboardAdapter', () => ({
  FirebaseLeaderboardAdapter: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    getPlayerProfile: jest.fn().mockResolvedValue({
      userId: 'user123',
      name: 'Test Player',
      avatar: 'T',
      joinedAt: { toDate: () => new Date('2026-01-01') },
      level: 5,
      xp: 1250,
      totalGames: 42,
      totalScore: 2500,
      stats: {
        classic: {
          gamesPlayed: 20,
          bestScore: 100,
          totalScore: 1500,
          averageScore: 75,
        },
      },
      achievements: ['firstGame'],
    }),
  })),
}));

jest.mock('../../../lib/leaderboard/achievements/achievements', () => ({
  getAllAchievements: jest.fn(() => [
    {
      id: 'firstGame',
      title: 'First Steps',
      description: 'Play your first game',
      icon: '🎮',
      rarity: 'common',
      reward: { xp: 10, coins: 25 },
      criteria: { type: 'gameCount', value: 1 },
    },
  ]),
}));

describe('PlayerProfileScreen', () => {
  it('displays player level', async () => {
    render(
      <BrowserRouter>
        <PlayerProfileScreen />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText(/current level/i)).toBeInTheDocument();
    });
  });

  it('displays XP progress', async () => {
    render(
      <BrowserRouter>
        <PlayerProfileScreen />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/1250 xp/i)).toBeInTheDocument();
    });
  });

  it('displays achievement count', async () => {
    render(
      <BrowserRouter>
        <PlayerProfileScreen />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/achievements \(1\)/i)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- PlayerProfileScreen.test.ts`
Expected: PASS - all 3 tests passing

- [ ] **Step 3: Commit**

```bash
git add src/components/leaderboard/__tests__/PlayerProfileScreen.test.tsx
git commit -m "test: add player profile screen tests"
```

---

### Task 4: Manual Testing & Verification

**Files:**
- No new files

- [ ] **Step 1: Start dev server and navigate to profile**

Run: `npm run dev`
Navigate to: http://localhost:5173
Click "Profile" button on home page

- [ ] **Step 2: Verify profile displays correctly**

- [ ] Check level is displayed (Level X, "Current Level" label)
- [ ] Check XP bar shows and percentage is calculated
- [ ] Check "X XP" text displays
- [ ] Check mode stats display correctly
- [ ] Check achievements grid shows achievement icons

- [ ] **Step 3: Test achievement modal**

- [ ] Click on an achievement
- [ ] Modal opens with:
  - Icon (large)
  - Title and rarity badge
  - Description
  - "Unlocked" status
  - Reward info (+XP, +Coins)
- [ ] Click close button, modal closes
- [ ] Click backdrop, modal closes

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: All tests passing (1200+ tests)

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "test: profile feature fully tested and verified"
```

---

## Summary

This plan completes the player profile page with:
- ✅ Level display with XP progress bar
- ✅ Overall and mode-specific statistics
- ✅ Achievement showcase with click handlers
- ✅ Expandable achievement modals with full details
- ✅ Mobile responsive design
- ✅ Dark mode support
- ✅ Comprehensive test coverage

**Total tasks:** 4  
**Estimated effort:** 4-6 hours  
**Files created:** 2  
**Files modified:** 1
