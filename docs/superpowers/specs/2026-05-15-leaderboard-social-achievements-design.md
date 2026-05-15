# Leaderboard/Social/Achievement System Design

> **Goal:** Build a comprehensive, integrated system for persistent leaderboards, player profiles, and achievements across Word Ladder (Blitz multiplayer, Classic/TimeAttack single-player).

> **Architecture:** Firestore + local cache using sync adapter pattern. Real-time leaderboards, offline-first gameplay, integrated achievement progression.

> **Tech Stack:** Firebase Firestore, IndexedDB (local cache), sync adapters (extending existing pattern), TypeScript

---

## Overview

This system adds three interconnected features to Word Ladder:

1. **Persistent Leaderboards** — Global rankings by game mode and time period (all-time, weekly, monthly)
2. **Player Profiles** — Personal stats, achievement showcase, game history
3. **Achievement System** — Unlockable badges with clear progression criteria

The system is integrated: achievements feed into profiles, profiles display on leaderboards, leaderboards motivate achievement hunting.

**Data flows:**
- During gameplay: Local-only (works fully offline)
- After game ends: Result saves locally, syncs to Firestore when online
- Leaderboards: Real-time updates when players score
- Profiles: Load from cache first, sync on connectivity

---

## Architecture

### Three-Layer Design

**Local Layer (IndexedDB)**
- Stores player profile, cached leaderboards, achievements
- Used for offline access and instant UI rendering
- Synced to Firestore when connectivity available

**Firestore Layer**
- Persistent single source of truth
- Collections: `players`, `gameResults`, `leaderboards`, `achievements`
- Real-time listeners for leaderboard updates
- Automatic triggers for achievement evaluation and leaderboard recalculation

**Sync Adapter Layer**
- `FirebaseLeaderboardAdapter` implements consistent async interface
- Mirrors existing `BlitzSyncAdapter` pattern
- Handles online/offline transitions, retry logic, error recovery
- Can be swapped for mock adapter in tests

### Data Persistence Strategy

**Offline-First:**
1. Game played entirely locally (no network needed)
2. Result saved to IndexedDB immediately after game
3. Local cache shows user's profile/stats
4. Background job syncs to Firestore when online
5. Real-time listeners update leaderboards once connected

**Benefits:**
- Fully playable offline (mobile networks are spotty)
- Instant local feedback (no network latency)
- Automatic sync when connectivity returns
- No data loss (everything queued locally)

---

## Data Models

### Collection: `players`

Document ID: `userId` (auth ID or anonymous UUID)

```typescript
interface PlayerProfile {
  name: string;                    // Display name
  avatar?: string;                 // Emoji or initials
  joinedAt: Timestamp;
  
  // Aggregated stats
  totalGames: number;
  totalScore: number;
  
  // Mode-specific stats
  stats: {
    blitz: {
      gamesPlayed: number;
      wins: number;
      bestScore: number;
      totalScore: number;
      averageScore: number;
      totalTime: number;           // ms
    };
    classic: {
      gamesPlayed: number;
      wins: number;
      bestScore: number;
      totalScore: number;
      averageScore: number;
    };
    timeAttack: {
      gamesPlayed: number;
      bestTime: number;            // ms
      completedPuzzles: number;
      totalScore: number;
    };
  };
  
  // Achievements
  achievements: string[];          // Achievement IDs earned
  badges: string[];                // Badge IDs for display
  lastGameAt: Timestamp;
}
```

### Collection: `gameResults`

Document ID: auto-generated

```typescript
interface GameResult {
  userId: string;
  mode: 'blitz' | 'classic' | 'timeAttack';
  
  // Game metadata
  roomCode?: string;               // For multiplayer blitz
  score: number;
  solved: number;
  wrong: number;
  duration: number;                // ms
  difficulty: string;
  wordLength?: number;
  
  // Ranking (multiplayer only)
  placement?: number;              // Rank in that game
  totalPlayers?: number;
  
  timestamp: Timestamp;
}
```

### Collection: `leaderboards`

Document ID: `{mode}-{period}` (e.g., `blitz-allTime`, `blitz-weekly`, `classic-allTime`)

Pre-computed for performance. Updated via Firestore function when `gameResults` added.

```typescript
interface LeaderboardDoc {
  mode: 'blitz' | 'classic' | 'timeAttack';
  period: 'allTime' | 'weekly' | 'monthly';
  
  rankings: Array<{
    userId: string;
    name: string;
    score: number;
    placement: number;
    gamesPlayed: number;
    lastGameAt: Timestamp;
  }>;
  
  lastUpdated: Timestamp;
  updatedCount: number;            // For real-time animation (red flash)
}
```

### Collection: `achievements` (Config)

Document ID: achievement ID (e.g., `firstBlitzWin`, `solveHard100`, `levelUp10`)

```typescript
interface AchievementConfig {
  id: string;
  title: string;
  description: string;
  icon: string;                    // Emoji
  rarity: 'common' | 'rare' | 'legendary';
  
  // Unlock criteria
  criteria: {
    type: 'gameCount' | 'scoreThreshold' | 'difficulty' | 'mode' | 'speedChallenge' | 'custom';
    value: number | string;
    mode?: 'blitz' | 'classic' | 'timeAttack';
  };
  
  // XP/reward (optional, integrates with economy)
  reward?: {
    xp: number;
    coins: number;
  };
}
```

---

## Components & Screens

### New Screens

#### PlayerProfileScreen
- URL: `/profile` or `/profile/:userId`
- Shows:
  - Header: Avatar, name, join date, level (from economy system)
  - Stats cards: Total games, best score (by mode), current streak
  - Achievement showcase: Earned badges with unlock dates
  - Game history: Last 20 games (sortable by mode/date)
  - Navigation links to leaderboards

#### LeaderboardScreen
- URL: `/leaderboards`
- Tabs:
  - Period: All-Time | Weekly | Monthly
  - Mode: Blitz | Classic | TimeAttack
- Shows:
  - Top 100 players
  - Current user's rank highlighted
  - Real-time updates: Badge animations when someone scores
  - User rank card: "You are ranked #47 globally"

#### AchievementsScreen
- URL: `/achievements`
- Shows:
  - Earned achievements (rarity badges: common/rare/legendary)
  - In-progress achievements with progress bars
  - Locked achievements (greyed out)
  - Filter tabs: All | Earned | Nearly There | Locked
  - Achievement details on click (criteria, unlock date, reward)

#### FriendsLeaderboardScreen (Optional v2)
- Compare scores with friends
- Friend list management
- Friendly rivalry notifications

### Updates to Existing Screens

**HomePage**
- Quick stats widget:
  - Current level (from economy)
  - XP progress bar
  - Rank in global leaderboard
  - Recent achievement (if unlocked in last week)
  - "View Profile" link

**BlitzResultsScreen** (post-game)
- Add achievement notifications:
  - "🎉 Achievement unlocked: First Win!" appears at top
  - Global rank: "You're now ranked #2,847 worldwide"
  - Highlight any newly-earned badges
- Link to full profile/leaderboards

**Settings**
- Profile link
- Leaderboard link
- Achievement progress summary

---

## Component Architecture

### FirebaseLeaderboardAdapter

Implements async interface matching `BlitzSyncAdapter` pattern:

```typescript
interface FirebaseLeaderboardAdapter {
  // Record a game result and update player profile
  recordGameResult(userId: string, result: GameResult): Promise<void>;
  
  // Subscribe to real-time leaderboard updates
  subscribeToLeaderboard(
    mode: 'blitz' | 'classic' | 'timeAttack',
    period: 'allTime' | 'weekly' | 'monthly',
    listener: (leaderboard: LeaderboardDoc) => void
  ): () => void;  // Returns unsubscribe function
  
  // Load player profile (local cache first, sync on connectivity)
  getPlayerProfile(userId: string): Promise<PlayerProfile>;
  
  // Check and grant achievements
  checkAndGrantAchievements(userId: string): Promise<string[]>;  // Returns newly-granted achievement IDs
  
  // Get all achievement configs
  getAchievements(): Promise<AchievementConfig[]>;
  
  // Sync local results to Firestore (called on connectivity)
  syncLocalResults(userId: string): Promise<void>;
}
```

### Offline Sync Strategy

After each game:
1. Save `GameResult` to IndexedDB locally
2. Update local `PlayerProfile` cache
3. Evaluate achievements locally (criteria met?)
4. If achievement unlocked, queue for sync
5. On connectivity change:
   - Call `FirebaseLeaderboardAdapter.syncLocalResults(userId)`
   - Batch upload all pending results to `gameResults` collection
   - Firestore Cloud Function recalculates leaderboards
   - Real-time listener notifies UI of updates

---

## Achievement System

### Achievement Types

**Common (Easy to earn):**
- First game played (any mode)
- 10 games played (per mode)
- Score over 200 (per mode)

**Rare (Medium effort):**
- 50 games played (per mode)
- Best score over 500
- Perfect game (no wrong answers)
- Win streak: 5+ consecutive wins

**Legendary (High effort):**
- 500 games played
- Best score over 1,000
- Solve every word length (4, 5, 6 letters)
- Master all difficulties
- 20+ win streak

### Achievement Evaluation

Runs after each game:

```typescript
function evaluateAchievements(userId: string, newResult: GameResult): string[] {
  const profile = loadProfileFromCache(userId);
  const configs = loadAchievementConfigs();
  
  const newlyEarned: string[] = [];
  
  for (const config of configs) {
    if (profile.achievements.includes(config.id)) continue;  // Already earned
    
    if (meetsUnlockCriteria(profile, config.criteria, newResult)) {
      newlyEarned.push(config.id);
      // Grant XP/coins from economy integration (if config.reward set)
    }
  }
  
  return newlyEarned;
}
```

---

## Error Handling & Edge Cases

**Network Errors:**
- Offline? Queue result locally, sync on connectivity
- Firestore quota exceeded? Log error, fall back to local-only mode, retry later
- Duplicate submission? Idempotent writes: check `gameResult.timestamp` uniqueness

**Achievement Bugs:**
- Achievement evaluation crash? Log, don't crash game, retry on next game
- Firestore Cloud Function fails? Results still saved, leaderboard calculated on retry trigger

**Real-Time Sync:**
- Multiple tabs? IndexedDB shared, but Firestore listeners separate
- Stale cache? Sync on every app launch + every game end
- Leaderboard not updating? Manually refresh via button

---

## Testing Strategy

**Unit Tests:**
- Achievement criteria evaluation (does player meet unlock condition?)
- Score calculation (consistent across modes)
- Leaderboard ranking logic (correct sort order)
- Offline cache consistency

**Integration Tests:**
- Play game → record result → update profile → check leaderboards
- Offline game → connectivity returns → sync to Firestore
- Multiple players → see real-time leaderboard updates
- Achievement evaluation → correct achievements unlocked

**E2E Tests:**
- Play Blitz game → view results → check profile/leaderboard
- Earn achievement → see notification → view achievement detail
- Go offline → play games → go online → see leaderboard sync

**Manual Tests:**
- Offline gameplay (toggle airplane mode)
- Real-time updates (two browsers, one account, watch live leaderboard)
- Achievement unlock notifications
- Leaderboard filtering and sorting

---

## Scope & Constraints

**What's Included:**
- Firestore + local cache architecture
- Player profiles with mode-specific stats
- Global leaderboards (all-time, weekly, monthly)
- Achievement system with rarity tiers
- Real-time leaderboard updates
- Offline-first gameplay
- Achievement notifications in UI

**What's NOT Included (Future Work):**
- Friend system (friend leaderboards, invites)
- Social features (comments, follows, messaging)
- Replays (store game move-by-move data for replay)
- Streaming integration
- Mobile app (web version first, PWA for now)

**Constraints:**
- Firestore read quota: Pre-compute leaderboards to minimize reads
- IndexedDB size: Keep local cache to last 100 games per user
- Real-time listeners: Limit to 1 active leaderboard subscription at a time
- Achievement evaluation: Run locally first, confirm on Firestore sync

---

## Success Criteria

- [ ] Player can play games fully offline, sync results on connectivity
- [ ] Leaderboards update in real-time when players score
- [ ] Achievements unlock with clear feedback and notification
- [ ] Profiles aggregate stats across modes correctly
- [ ] Local cache stays in sync with Firestore
- [ ] All tests pass (unit, integration, E2E)
- [ ] Offline gameplay fully functional (zero network required)
- [ ] Leaderboard real-time updates visible within 1-2 seconds
- [ ] Achievement unlock notification appears during/after game end
- [ ] Player profile loads in <500ms (cached) or <2s (fresh sync)

