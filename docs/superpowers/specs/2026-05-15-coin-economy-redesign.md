# Coin Economy Redesign — First-Time Puzzle Completion & Streaks

> **Goal:** Redesign the coin earning system so players earn coins only for first-time puzzle completions (across Classic and Time Attack), while Blitz earns based on game placement. Introduce daily/weekly caps, streak bonuses, and a catch-up system for new players to balance progression and prevent grinding.

> **Architecture:** Extend wallet and puzzle tracking systems to store completed puzzles per mode, daily/weekly coin totals, and streak data. Implement earnings validation on game end with cap enforcement and offline-to-online sync.

> **Tech Stack:** localStorage for completed puzzle tracking, wallet state extensions, no backend changes needed for initial release

---

## Overview

The current economy allows players to earn coins every time they play, leading to repetitive grinding. The redesigned system rewards **milestone achievements**: earning coins only on first completion of unique puzzles, with daily/weekly caps and streak bonuses to encourage consistent play.

**Key Changes:**
1. Track completed puzzles per mode (prevent repeat earnings)
2. Enforce daily coin cap (100 coins/day normal, unlimited first 7 days)
3. Award weekly streak bonuses (+50 coins for 5+ days of play)
4. Maintain monthly leaderboard for social engagement
5. Blitz remains high-reward for multiplayer (participation + placement bonus)

**Benefits:**
- Reduces grinding fatigue (no need to replay same puzzles for coins)
- Rewards consistency (daily play earns streak bonuses)
- Balances new vs experienced players (catch-up period)
- Makes hints/reveals feel earned (30/50 coin costs are now meaningful)

---

## Data Model

### Puzzle Completion Tracking

**Completed Puzzles Set** (`wordLadder-completedPuzzles`):
```typescript
interface CompletedPuzzle {
  id: string;                 // "{mode}:{startWord}:{endWord}" (e.g., "classic:cat:dog")
  mode: 'classic' | 'timeAttack' | 'blitz';
  startWord: string;
  endWord: string;
  firstCompletedAt: number;   // timestamp
}

// Stored as Set<string> of IDs for fast lookup
const completedPuzzles = new Set<string>();
```

**Lookup example:**
```typescript
const puzzleId = `classic:${puzzle.start}:${puzzle.end}`;
const isNewPuzzle = !completedPuzzles.has(puzzleId);
```

### Wallet Extensions

**Additional fields in wallet storage** (`wordLadder-wallet`):
```typescript
interface Wallet {
  coins: number;
  xp: number;
  level: number;
  
  // NEW: Daily/weekly tracking
  dailyCoinsEarned: number;           // coins earned today (resets 00:00 UTC)
  lastDailyResetAt: number;           // timestamp of last reset
  
  weeklyCoinsEarned: number;          // coins earned this week (resets Monday 00:00 UTC)
  lastWeeklyResetAt: number;          // timestamp of last weekly reset
  
  // NEW: Streak tracking
  currentStreak: number;              // consecutive days with earnings
  bestStreak: number;                 // longest streak ever
  lastEarnedAt: number;               // timestamp of last earning (for streak detection)
  
  // NEW: Account metadata
  joinedAt: number;                   // timestamp (for catch-up period detection)
}
```

---

## Earning Logic

### Classic Mode

**Earning:**
- Easy puzzle (first completion): **5 coins**
- Medium puzzle (first completion): **10 coins**
- Hard puzzle (first completion): **15 coins**
- Repeat puzzle: **0 coins**

**Example:**
- Player completes CAT→DOG (medium, first time): +10 coins
- Player replays CAT→DOG later: 0 coins (already earned)
- Player completes a different medium puzzle (first time): +10 coins

### Time Attack Mode

**Earning:**
- Each unique puzzle solved (first time): **8 coins**
- Repeat puzzle in same run: **0 coins**

**Example:**
- Sprint 60s, solve 5 new puzzles: 5 × 8 = 40 coins
- Same player runs again, solves 3 new puzzles + 1 repeat: 3 × 8 = 24 coins

### Blitz Mode

**Earning (every game):**
- Base for participation: **10 coins**
- Placement bonus:
  - 1st place: **+40 coins** (total: 50)
  - 2nd place: **+30 coins** (total: 40)
  - 3rd place: **+15 coins** (total: 25)
  - 4th place: **+0 coins** (total: 10)

**Example:**
- Player plays Blitz, places 2nd: 10 + 30 = 40 coins
- Same player loses next game (4th place): 10 + 0 = 10 coins

**Note:** Blitz earnings are NOT limited to first completion (every game counts). Puzzle completion tracking applies only to Classic and Time Attack.

### Catch-Up System (First 7 Days)

**For new players** (determined by `joinedAt` timestamp):
- During first 7 days: **No daily coin cap**
- Earn at normal rates for all modes
- After day 7: Subject to daily/weekly caps like everyone else

**Purpose:** Helps new players feel progression and build initial coin reserves for power-ups.

### Streak System

**Streak Rules:**
- Earn coins on any day (any mode) = **+1 to currentStreak**
- Skip a day (0 coins earned) = streak resets to 0
- Daily reset happens at **00:00 UTC** (consistent global time)

**Weekly Streak Bonus:**
- If **5+ days in a week** have earnings: **+50 bonus coins** awarded Sunday 23:59 UTC
- Week = Monday 00:00 UTC to Sunday 23:59 UTC
- Bonus awarded regardless of daily cap (doesn't count toward daily limit)

**Example:**
- Player earns coins Mon, Tue, Wed, Thu, Fri: streak = 5 (qualifies for bonus)
- Sunday night: automatic +50 bonus coins
- Monday (day 6): streak continues to 6 (no reset, kept on Sat even though 0 coins earned)
- Tuesday with 0 coins: streak resets to 0

---

## Daily & Weekly Caps

### Daily Cap (resets 00:00 UTC)

**Normal players** (after first 7 days):
- Maximum **100 coins/day** across all modes combined
- Once 100 coins earned in a day: no additional coins until reset
- Includes Blitz participation bonus and placement bonus

**New players** (days 1-7 from joinedAt):
- **No cap** during first week
- Earn unlimited coins to accelerate progression

**Example:**
- Player earns 30 coins from Classic, 40 coins from Time Attack = 70 total (under 100, can play more)
- Player earns 5 more coins from Blitz = 75 total (still under 100)
- Player earns 25 more coins from Blitz = 100 total (at cap, no more coins today)
- Day resets at 00:00 UTC: counter goes back to 0

### Weekly Tracking & Streak Bonus

**Weekly Period:** Monday 00:00 UTC to Sunday 23:59 UTC

**Automatic Bonus:**
- If 5+ days in the week have any earnings: **+50 bonus coins** Sunday 23:59 UTC
- Bonus awarded to wallet automatically (doesn't count toward daily cap)
- Reset weekly totals Monday 00:00 UTC

**Example:**
- Week: Mon(30) + Tue(40) + Wed(0) + Thu(50) + Fri(100) + Sat(0) + Sun(25) = 5 days with earnings
- Sunday 23:59 UTC: Automatic +50 bonus coins awarded
- Monday 00:00 UTC: Weekly reset, counter to 0

### Monthly Leaderboard

**Scope:** Top 10 players by coins earned in current calendar month

**Calculation:** Sum of all coins earned (excludes bonus coins from streaks? clarify in implementation)

**Reset:** 1st of each month 00:00 UTC

**Display:**
- Leaderboard screen shows top 10 + player's current rank
- Monthly badge notification for top 3 placements

---

## Spending Logic

**No changes to existing spending:**
- Hint: **30 coins** (or use from inventory)
- Reveal: **50 coins** (or use from inventory)
- Undo: **25 coins** (or use from inventory)

**Consumable packs:**
- Hint 5-pack: 30 coins
- Reveal 3-pack: 60 coins
- Undo 3-pack: 25 coins

With the new cap (100 coins/day), a player earning 100 coins can buy:
- 3 × hint (90 coins)
- 1 × reveal (50 coins)
- 2 × undo (50 coins)

---

## Implementation Details

### Timezone Handling

**Daily Reset:**
- Store `lastDailyResetAt: number` (timestamp in ms)
- On every coin earning: check if current time > lastDailyResetAt + 86400000 (1 day)
- If true: reset `dailyCoinsEarned = 0`, update `lastDailyResetAt`

**Weekly Reset:**
- Similar to daily, but check day-of-week (Monday 00:00 UTC)
- Compare `Math.floor(timestamp / 86400000) % 7` to detect Monday

### Offline Gameplay

**During offline play:**
1. Game completes (win or loss)
2. Check if puzzle ID is in completedPuzzles set
3. If new: calculate coins earned, add to wallet locally
4. Store game result in IndexedDB sync queue

**On reconnect:**
1. Sync queue uploads results to Firestore
2. Validate puzzle uniqueness (Firestore has source of truth)
3. Check daily/weekly caps: if offline earn would exceed cap, apply cap retroactively
4. Don't double-award coins

**Example:**
- Player goes offline, plays 3 new Classic puzzles: +30 coins locally
- Player has already earned 80 coins today
- On sync: cap enforcement = allow 20 more coins (from 80 to 100), discard 10 coins
- Result: wallet = 100 coins (capped, not 110)

**Decision:** For now, offline-to-online cap enforcement applies retroactively. A more complex approach could queue coins and partially award them, but this is simpler.

### Puzzle Duplicate Detection

**Classic/Time Attack:**
- Generate puzzle ID: `{mode}:{startWord}:{endWord}` (lowercase, consistent)
- Example: `classic:cat:dog` (not `classic:CAT:DOG`)
- Before earning coins: check if ID in `completedPuzzles`
- If present: 0 coins; if absent: add to set and earn coins

**Blitz:**
- No duplicate detection (every game earns coins)
- Puzzle completion tracking doesn't apply to Blitz

### Leaderboard Spoofing Prevention

**Current Implementation (offline sync):**
- Classic/Time Attack: Tracked locally, sync'd to Firestore
- Firestore Cloud Functions validate puzzle legitimacy (can't have modified word lengths, etc.)
- For leaderboard ranking: use Firestore `gameResults` collection as source of truth

**Future enhancement:** Server-side leaderboard calculation (not in v1)

---

## Error Handling & Edge Cases

### Offline Puzzle Completion & Cap Collision

**Scenario:** Player offline, earns coins, then goes online when daily cap is active.

**Resolution:**
- Calculate total coins earned today (before sync)
- If total > 100: cap to 100, don't award overflow
- Log warning: "Offline coins capped due to daily limit"
- No notification to player (silent capping)

### Timezone Confusion

**Scenario:** Player in Tokyo (UTC+9), plays last game at 23:50 local time. Daily reset happens, but their local clock says same day.

**Resolution:**
- All timestamps use UTC (milliseconds since epoch)
- Daily reset uses UTC only (00:00 UTC = fixed moment globally)
- No per-player timezone tracking
- Leaderboard and streaks calculated in UTC

### Blitz Room Rejoin

**Scenario:** Player rejoins same Blitz game (e.g., connection drop, rejoin within time window).

**Resolution:**
- Game stores `roomId` and `startedAt` timestamp
- If player rejoins same room within 5 minutes: count as same game (no duplicate coins)
- After 5 minutes: treat as new game

### Streak Reset on Day Boundary

**Scenario:** Player earns 1 coin at 23:50 UTC, then nothing until 01:00 UTC next day.

**Resolution:**
- Streak increments on day with any earnings
- Next day with 0 earnings: streak resets to 0
- Edge case (11:59 PM → 00:01 AM): both considered same day if within 00:00 UTC boundary
- Handled by comparing `Math.floor(timestamp / 86400000)` values

### New Player Catch-Up Timing

**Scenario:** Player joins during first 7 days but plays inconsistently (e.g., days 1-3, then skip, come back day 6).

**Resolution:**
- Catch-up period is **7 calendar days from joinedAt**, not 7 days of play
- If joined May 15, catch-up ends May 22 regardless of play frequency
- Ensures consistency and prevents exploits

---

## Testing Strategy

### Unit Tests

**Puzzle Tracking:**
- New puzzle detected correctly (returns true for unknown ID)
- Repeat puzzle detected correctly (returns false for known ID)
- Puzzle ID generation consistent (case-insensitive, no extra spaces)

**Earning Calculations:**
- Classic: easy/medium/hard puzzles earn correct amounts
- Time Attack: per-puzzle earning correct
- Blitz: base + placement bonus correct for all placements
- Catch-up period: no cap during first 7 days, cap enforced after

**Daily/Weekly Caps:**
- Daily cap enforced at 100 coins (normal players)
- Daily cap ignored for new players (first 7 days)
- Weekly reset on Monday 00:00 UTC
- Streak bonus awarded correctly (5+ days)
- Streak reset on day with 0 earnings

**Timezone Handling:**
- Daily reset happens at correct UTC time
- Timestamp comparisons accurate across timezones

### Integration Tests

**Game-to-Wallet Flow:**
1. Play puzzle (new) → earn coins → check wallet updated
2. Play same puzzle again → no coins → wallet unchanged
3. Play different mode → earn mode-specific coins

**Offline & Sync:**
- Complete puzzle offline → coins queued
- Go online → coins synced with cap enforcement
- Cap collision: offline coins capped if needed

**Leaderboard & Streaks:**
- Earn coins Mon-Fri (5 days) → Sunday award 50 bonus
- Monday reset → weekly counter to 0
- Skip Saturday (0 coins) → Tuesday with earnings keeps current streak

### Edge Case Tests

- Timezone rollover (11:59 PM UTC → 12:01 AM UTC)
- Rejoin same Blitz game (no duplicate coins)
- Complete same puzzle twice in succession
- New player (first 7 days with high earning)
- Catch-up period boundary (day 7 to day 8)
- Monthly leaderboard ranking consistency

---

## Success Criteria

- ✅ Puzzle completion tracking prevents duplicate earnings in Classic/Time Attack
- ✅ Daily cap (100 coins/day) enforced for normal players
- ✅ Catch-up period (first 7 days, no cap) implemented correctly
- ✅ Weekly streaks calculated and bonuses awarded (+50 coins for 5+ days)
- ✅ Blitz earnings work on every game (participation + placement)
- ✅ Offline completion tracked locally, synced with cap enforcement
- ✅ Monthly leaderboard displays top 10 players
- ✅ All cap/timezone logic works across UTC boundaries
- ✅ Tests cover unit, integration, and edge case scenarios
- ✅ Documentation clear for future maintenance

---

## Scope & Out of Scope

**Included:**
- Puzzle completion tracking per mode (Classic, Time Attack)
- Daily/weekly coin caps and tracking
- Streak bonuses and monthly leaderboard
- Blitz placement-based earnings
- Catch-up system for new players
- Offline gameplay with sync

**Not Included (Future Work):**
- Server-side leaderboard calculation (will use Firestore initially)
- Anti-cheat measures beyond basic validation
- Friend-based earning bonuses
- Season passes or battle pass system
- Dynamic difficulty-based coin scaling

---

## Open Questions for Implementation

1. Should bonus coins from streaks count toward daily cap, or are they exempt?
2. Should monthly leaderboard exclude/include bonus coins?
3. What is the exact timing window for Blitz room rejoin detection (5 minutes)?
4. Should there be a visual indicator in-game showing daily coin progress toward 100-coin cap?
5. How should we handle players with large offline earnings hitting the cap retroactively (notification or silent)?
