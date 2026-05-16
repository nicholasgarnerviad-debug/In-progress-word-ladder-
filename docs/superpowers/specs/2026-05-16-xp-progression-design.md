# XP Progression & Achievement System — Design

> **Goal:** Create a dedicated progression page accessible from the home page that displays player level, XP progress, and achievements. Audit XP balance across all game modes to ensure fair progression and incentives.

> **Architecture:** Extend existing XP/level system with a new `/progression` route featuring level progress visualization, achievement filtering, and reward previews. Audit current XP earnings across Classic, Time Attack, and Blitz modes for balance and fairness.

> **Tech Stack:** React Router for `/progression` route, existing useEconomy hook for XP/level data, existing achievements system, localStorage for achievement state

---

## Overview

Players can currently see their level and XP on the home page via a clickable XP bar, but clicking it leads nowhere. This design creates a dedicated progression page that serves as the player's personal progression hub, showing:

- Current level and XP progress to next level
- Level rewards and milestones
- All achievements with earned/locked status and unlock criteria
- Reward information for each achievement

Additionally, this design calls for a comprehensive audit of XP balance across all game modes to ensure:
- Earning parity (similar time investment = similar XP across modes)
- Mode incentives (no single mode dominates progression)
- Alignment between XP and coin rewards
- Fair difficulty scaling
- Meaningful progression for new players

---

## Data Model

### Progression Page State

```typescript
interface ProgressionPageState {
  currentLevel: number;
  totalXp: number;
  xpToNextLevel: number;
  xpProgressPercent: number;
  nextRewardLevel: number | null;
  nextRewardInfo: LevelReward | null;
  achievements: AchievementWithStatus[];
  filter: 'all' | 'earned' | 'locked';
}

interface AchievementWithStatus {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
  isEarned: boolean;
  earnedDate?: number; // timestamp
  unlockedAt?: number; // timestamp
  reward: {
    xp: number;
    coins: number;
  };
  criteria: {
    type: string;
    value?: number;
    mode?: string;
  };
}
```

### Data Sources

- **XP/Level:** `useEconomy()` hook returns `wallet.xp` and `wallet.level`
- **Achievements:** Existing achievements system in `src/lib/leaderboard/achievements/`
- **Level Rewards:** Existing `levelRewards.ts` with milestone rewards
- **Achievement Status:** localStorage or leaderboard tracker (earned achievements)

---

## User Experience

### Route & Navigation

**URL:** `/progression`

**Navigation:**
- Home page XP bar click → navigate to `/progression`
- Back button or "Home" link on progression page → return to home
- Direct URL access: `/progression` (always shows current player's progression)

### Page Layout

**1. Header**
- Back/Home button (top-left)
- Title: "Your Progression" (center)
- Mobile-responsive, consistent with existing header style

**2. Level Card** (prominent, above the fold)
- Large level number (e.g., "Level 5")
- XP progress bar with visual fill
- Text below: "1,250 / 2,100 XP to Level 6"
- Optional: percentage ("59% progress to next level")
- Styling: Card with subtle background, clear visual hierarchy

**3. Next Reward Preview** (optional)
- If level has upcoming reward: Show what's next
- Format: "Next reward at Level 7: +5 Hints, +3 Undos"
- Or if at a milestone: "Milestone reached! You unlocked Practice Mode" (with animation/highlight)
- Disappears if player has reached max level with no more rewards

**4. Achievements Section**
- Filter bar: Tabs for "All" | "Earned" | "Locked"
- Achievement grid or list:
  - Icon (emoji or small image)
  - Title (bold)
  - Description (smaller text)
  - Rarity badge (common/rare/legendary color)
  - Reward: "+10 XP, +25 coins"
  - For locked: Unlock criteria (e.g., "Play 10 Blitz games")
  - For earned: Checkmark or "Unlocked" label with date
- Scrollable section (achievements can number 20+)
- Empty state: "No achievements in this category"

**5. Footer**
- Optional: "Keep playing to unlock more achievements"
- Version info or link to leaderboards

### Styling & Responsiveness

- **Container:** max-w-md (consistent with existing app)
- **Colors:** Inherit from existing design system (dark mode support)
- **Typography:** Existing font hierarchy
- **Rarity badges:**
  - Common: Gray background
  - Rare: Blue background
  - Legendary: Gold/orange background
- **Progress bar:** Blue (standard), with background track showing remaining XP
- **Mobile:** Touch-friendly tap targets (48px minimum)

---

## XP System Balance Audit

### Current Earning Structure

**Classic Mode:**
- Base: Solve puzzle = base XP
- Bonus: Efficiency bonus based on steps vs optimal
- Loss: Failed/abandoned games = XP penalty
- Formula: `(optimal - actual) * efficiency_multiplier + base`
- Typical: 15-30 XP per win

**Time Attack Mode:**
- Per-puzzle: Each unique puzzle solved = base XP
- Difficulty multiplier: Harder tiers (medium/hard/expert) give more XP
- Session-based: Total XP = puzzles_solved * difficulty_multiplier
- Typical: 8-12 XP per puzzle, 40-60 XP per session (5 puzzles)

**Blitz Mode:**
- Base: Participation = base XP per game
- Placement bonus: 1st=highest, 4th=lowest bonus
- Puzzle bonus: Number of puzzles solved in match = additional XP
- Formula: `base + placement_bonus + (puzzles_solved * per_puzzle_xp)`
- Typical: 50-80 XP per 1st place game, 30-50 XP per 4th place game

### Balance Audit Checklist

**1. Earning Parity**
- [ ] Test: Play 5 minutes of each mode, record XP earned
- [ ] Verify: Similar time investment yields similar XP (within 20% variance)
- [ ] If imbalanced: Adjust XP multipliers for slower modes

**2. Mode Incentives**
- [ ] Verify: No single mode is obviously superior for progression
- [ ] Check: All three modes are viable paths to leveling
- [ ] If one dominates: Boost slower modes or reduce XP from fastest mode

**3. Coin vs XP Alignment**
- [ ] Verify: Modes earning most coins also earn proportional XP
- [ ] Check: Doesn't create perverse incentive (grind coins but ignore XP)
- [ ] Goal: XP and coins track together, not diverge

**4. Difficulty Scaling**
- [ ] Verify: Harder puzzles/matches give more XP proportionally
- [ ] Check: Time Attack expert tier gives more XP than easy tier
- [ ] Check: Blitz 1st place significantly better than 4th

**5. New Player Experience**
- [ ] Verify: First 10 levels feel achievable in 1-2 hours
- [ ] Check: Early achievements unlock frequently (encouragement)
- [ ] Check: First level reward (level 2) achievable within first session
- [ ] If slow: Boost early-game XP or adjust level curve

**6. Level Reward Distribution**
- [ ] Verify: Rewards at levels 2, 3, 5, 7, 10, 12, 15, 18, 20 are well-timed
- [ ] Check: No long droughts without rewards (no gaps >3 levels early game)
- [ ] Check: Milestone rewards (badges, mode unlocks) feel earned, not handed out

### Audit Methodology

During implementation:
1. **Log actual XP earnings:** Capture XP gained per game in each mode
2. **Compare time-to-level:** Measure minutes played to reach each milestone
3. **Survey balance:** If ratios are significantly skewed, flag for adjustment
4. **Test early game:** Ensure new players don't hit motivation wall

### Expected Outcomes

- All three modes viable for progression (no "must grind one mode" feeling)
- XP earnings align with difficulty (harder content = more reward)
- New players reach level 5 within reasonable playtime (2-3 hours)
- Coin and XP rewards correlated (same content gives both proportionally)

---

## Testing Strategy

### Unit Tests
- Progression page renders correctly with sample data
- Filter tabs work (all/earned/locked)
- XP bar progress calculation correct
- Level computation matches levels.ts
- Next reward preview shows correct milestone

### Integration Tests
- Navigation: Home page XP bar → progression page
- Data: useEconomy hook integrates correctly
- Achievements: Earned/locked status displays correctly
- Filters: Switching between all/earned/locked updates view

### Manual Testing (Balance Audit)
- Play 5 minutes of Classic, log XP earned
- Play 5 minutes of Time Attack, log XP earned
- Play 5 minutes of Blitz, log XP earned
- Compare rates, document findings
- Identify any modes that feel unrewarding

### Edge Cases
- Player at max level (no next reward): Show appropriate message
- No achievements earned: Show empty state
- Large achievement list: Verify scrolling and performance
- Mobile viewport: Verify touch targets and layout

---

## Success Criteria

- ✅ Dedicated `/progression` route created and accessible from home page
- ✅ Level, XP progress, and next level requirement clearly displayed
- ✅ All achievements visible with earned/locked filter
- ✅ Achievement unlock criteria and rewards shown
- ✅ Mobile responsive and accessible
- ✅ XP balance audit completed across all modes
- ✅ Balance issues identified and documented (if any)
- ✅ All tests passing (unit, integration, balance tests)

---

## Scope & Out of Scope

**Included:**
- Progression page with level and XP display
- Achievement filtering and display with criteria/rewards
- Next reward preview
- XP balance audit across three game modes
- Navigation from home page

**Not Included (Future Work):**
- Achievement notification/celebration animations (v1.1)
- Social sharing of achievements (v1.1)
- Achievement hunting guides or tips (v1.1)
- XP boosts or seasonal events (future)
- Per-player XP multipliers (future)

---

## Open Questions

1. Should progression page show achievement rarity distribution (e.g., "You have 3 common, 1 rare, 0 legendary")?
2. Should next reward preview include when it can be earned (e.g., "in about 1 week of play")?
3. For XP balance, what variance is acceptable between modes? (20%, 30%, 50%?)
4. Should locked achievements show estimated time to unlock based on current play rate?
