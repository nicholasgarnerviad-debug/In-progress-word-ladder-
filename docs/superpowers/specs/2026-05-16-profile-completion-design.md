# Player Profile Completion — Design

> **Goal:** Complete the player profile page to display comprehensive player stats, current level with XP progress, and achievements with expandable details. Create a unified profile view that works for viewing any player (including yourself).

> **Architecture:** Enhance existing PlayerProfileScreen component with integrated level display, improved stats presentation, and expandable achievement modals. Reuse existing LevelCard component from progression page and achievements system.

> **Tech Stack:** React Router for `/profile/:userId` route, existing useEconomy hook for level/XP data, existing achievements system, Tailwind CSS for styling, Jest for tests.

---

## Overview

The player profile page currently displays basic stats and mode breakdowns, but is missing key features from the specification:
- Current level display with XP progress
- Level rewards and next milestone preview
- Achievement details with rarity, unlock dates, and rewards
- Expandable achievement modals for detailed information

This design completes the profile page to show a comprehensive player summary, with emphasis on stats and achievements as requested.

---

## Data Model

### Player Profile State

The existing `PlayerProfile` interface includes:
```typescript
interface PlayerProfile {
  userId: string;
  name: string;
  avatar?: string;
  joinedAt: Timestamp;
  level: number;
  xp: number;
  totalGames: number;
  totalScore: number;
  stats: {
    [mode: string]: ModeStats;
  };
  achievements: string[]; // array of achievement IDs
}

interface ModeStats {
  gamesPlayed: number;
  bestScore: number;
  totalScore: number;
  averageScore: number;
  wins?: number;
  totalTime?: number;
  bestTime?: number;
  completedPuzzles?: number;
}
```

### Achievement Details Integration

Achievements are loaded from the existing achievements system:
```typescript
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
  reward: { xp: number; coins: number };
  criteria: { type: string; value?: number; mode?: string };
}
```

---

## User Experience

### Route & Navigation

**URL:** `/profile/:userId` (unified for viewing any player or yourself)

**Navigation:**
- Home page "Profile" link → navigate to `/profile/{currentUserId}`
- Leaderboards (view other players) → click player name → `/profile/{userId}`
- Back button or home link → return to previous page
- Direct URL access: `/profile/{userId}` shows that player's profile

### Page Layout

**1. Header**
- Avatar (large, initials or emoji as fallback)
- Player name (bold, prominent)
- Join date (smaller text, gray)
- Back/home button (top-left)
- Mobile-responsive with appropriate spacing

**2. Level Card** (from progression page)
- Large level number (text-5xl)
- "Current Level" label
- XP progress bar with percentage and visual fill
- "X / Y XP to Level Z" display
- Next reward preview box (if applicable)
- Styling: Blue gradient background, dark mode support
- Same component used in progression page for consistency

**3. Overall Stats Grid**
- Total Games: Display total games played across all modes
- Total Score: Display cumulative score across all modes
- 2-column grid layout on mobile, responsive
- Card styling: Gray background with dark mode support

**4. Mode-Specific Stats** (for each game mode: Classic, Time Attack, Blitz)
- Section heading: "Mode Stats"
- For each mode:
  - Mode name (capitalized)
  - 2x3 grid of stat pairs:
    - Games Played / Best Score
    - Total Score / Average Score
    - Wins (if applicable) / Total Time (if applicable)
    - Best Time (if applicable) / Completed Puzzles (if applicable)
  - Card styling with border, dark mode support
  - Responsive grid layout

**5. Achievements Showcase**
- Section heading: "Achievements (X)" showing count
- Grid layout: responsive (3 cols mobile, 4-5 cols desktop)
- Achievement cards:
  - Icon/emoji (large, centered)
  - Achievement title (optional, or on hover)
  - Click to open expandable modal
  - Earned achievements: green/yellow badge styling
  - Locked achievements: gray styling
- Modal on click:
  - Achievement icon (large)
  - Title, description, rarity badge
  - Unlock date (if earned)
  - Reward info: "+X XP, +Y coins"
  - Unlock criteria (for locked achievements)
  - Close button or click-outside to dismiss

**6. Navigation Footer**
- Buttons to navigate to related pages:
  - "View Leaderboards" (blue button)
  - "View All Achievements" (purple button)
- Responsive: stacked on mobile, side-by-side on desktop

### Styling & Responsiveness

- **Container:** max-w-2xl for desktop, full width with padding on mobile
- **Colors:** Inherit from existing design system (dark mode support throughout)
- **Typography:** Consistent with existing pages (Tailwind scale)
- **Rarity badges:**
  - Common: Gray background
  - Rare: Blue background
  - Legendary: Gold/yellow background
- **Progress bar:** Blue with background track
- **Mobile:** Touch-friendly tap targets (48px minimum), stacked layout
- **Dark mode:** Full support with `dark:` prefix on all colors

---

## Component Structure

### Modified Files

**PlayerProfileScreen.tsx:**
- Keep existing header, overall stats, mode stats sections
- Add LevelCard component display (import and render)
- Enhance achievements section:
  - Change from ID display to achievement icon grid
  - Add click handlers to open achievement modals
  - Add achievement modal component
- Add modal for achievement details with expandable view

### New Components

**AchievementModal.tsx:**
- Receives achievement data and earned status
- Displays full achievement details
- Shows unlock date if earned
- Shows unlock criteria if locked
- Styling: Centered modal with backdrop, dark mode support
- Close on backdrop click or close button

---

## Integration Points

### Existing Systems

- **useEconomy hook:** Already provides `wallet.level` and `wallet.xp` (can fetch from profile)
- **Achievement system:** `getAllAchievements()` returns achievement metadata
- **Firestore:** PlayerProfile already loaded via FirebaseLeaderboardAdapter
- **LevelCard component:** Reuse from `/progression` page
- **Styling:** Consistent with existing Tailwind patterns

### Data Flow

1. **Page Load:** Fetch PlayerProfile via Firebase (already implemented)
2. **Level Display:** Extract `level` and `xp` from profile, pass to LevelCard
3. **Mode Stats:** Display stats from `profile.stats` (already implemented)
4. **Achievements:** 
   - Load achievement IDs from `profile.achievements`
   - Match with achievement metadata from achievements system
   - Render grid of earned achievement icons
   - On click, display full details in modal

---

## Testing Strategy

### Unit Tests
- LevelCard renders correctly with profile data
- AchievementModal displays achievement details
- Achievement grid renders correct number of icons
- Mode stats display correct values

### Integration Tests
- Navigating to `/profile/{userId}` loads correct profile
- Clicking achievement opens modal with correct details
- Modal closes on backdrop click
- Level card shows correct next reward

### Manual Testing
- View own profile (click Profile on home)
- View other players' profiles (via leaderboard)
- Click achievements to see details
- Verify level display with XP bar
- Test dark mode on profile page
- Test mobile responsiveness
- Verify all stats display correctly

---

## Success Criteria

- ✅ Profile page displays current level with XP progress bar
- ✅ Level card shows next reward preview
- ✅ Overall stats displayed (total games, total score)
- ✅ Mode-specific stats shown in organized cards
- ✅ Achievements displayed as grid of icons
- ✅ Clicking achievement opens expandable modal with details
- ✅ Modal shows rarity, unlock date, rewards, and criteria
- ✅ Mobile responsive and accessible
- ✅ Dark mode fully supported
- ✅ Works for viewing any player profile
- ✅ All tests passing
- ✅ No regressions in existing tests

---

## Scope & Out of Scope

**Included:**
- Level card with XP progress and next reward
- Overall and mode-specific statistics
- Achievement showcase with expandable details
- Achievement modals with full information
- Navigation to related pages
- Mobile responsive design
- Dark mode support

**Not Included (Future Work):**
- Game history / recent games list
- Player comparison / friend profiles
- Achievement hunting guides
- Custom profile themes or personalization
- Profile editing (name, avatar)
- Achievement notifications on visit

---

## Open Questions

1. Should the profile show a "Current Rank" (player's global rank)?
2. Should there be an estimated time-to-unlock displayed for locked achievements?
3. Should locked achievements be visible in the grid, or only show earned ones?
4. Should profile support viewing your own vs. other players differently (e.g., show edit button for your own)?

