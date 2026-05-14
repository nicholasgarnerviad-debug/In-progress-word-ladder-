# Word Ladder — Interactive Game & Puzzle Generator

A modern word ladder game with routing, persistent stats, theme customization, and a Wordle-inspired aesthetic.

## Features

- **Word Ladder Game** — Find shortest paths between words by changing one letter at a time
- **Persistent Stats** — Track games played, win %, current streak, and max streak across sessions
- **Theme System** — System, Light, or Dark mode (syncs with OS preference)
- **Responsive Design** — Works on mobile (375px) through desktop
- **Dark Mode Support** — Full Tailwind CSS dark mode with `class` strategy
- **Accessible Navigation** — Full keyboard support, focus rings, proper ARIA labels
- **Multi-path Discovery** — Find alternative valid solutions, not just the optimal path

## Tech Stack

- **React 19** with TypeScript
- **React Router v6** for client-side routing
- **Tailwind CSS** with dark mode
- **Jest** for testing (295 tests)
- **Vite** for bundling

## Pages

### `/` — Home
- **StatsStrip**: Game statistics (Played, Win %, Streak, Max)
- **Game Modes**:
  - Classic (active) → navigates to `/play/classic`
  - Time Attack (active) → navigates to `/play/time-attack`
  - Daily Puzzle, Endless (coming soon)
- **Header**: Settings gear icon links to `/settings`

### `/play/classic` — Game
- **Classic Mode**: Find the shortest path between two 4-letter words
- **Game UI**: 
  - Start and end words displayed at top
  - Word history showing player's path
  - Virtual keyboard for input
  - Power-ups: Hint (30◎), Reveal (60◎), Undo (20◎)
  - Stats showing current steps vs optimal
- **Puzzle History Modal**: View all completed games
- **Coins System**: Earn/spend on power-ups (win bonus ~20-100◎, loss penalty -50◎)

### `/play/time-attack` — Time Attack
- **Two Game Modes**:
  - **Sprint**: Fixed timer (60s, 90s, or 120s). Solve as many puzzles as you can before time expires.
  - **Survival**: Keep the clock alive. Each successful solve adds time (3–10s depending on difficulty).
- **Duration Tiers**: 
  - Sprint: 60s, 90s, 120s
  - Survival: Short (45s base), Medium (75s base), Long (120s base)
- **Skip System**:
  - 2 free skips per run
  - Additional skips cost time (5s penalty in Sprint 60, scales with tier)
- **Difficulty Ramp**: Puzzles start easy and increase in difficulty as you solve more (Easy → Medium → Hard → Expert)
- **Stats & Persistence**:
  - Personal best tracking (puzzles solved and longest streak per mode+tier)
  - Stored in `localStorage` under `wordLadder.timeAttackStats`
- **Visuals**:
  - Clock displays remaining/elapsed time with tenths of a second
  - Sub-5s urgency: Red color and faster pulse
  - Sub-10s urgency: Faster pulse
  - Survival mode: Green flash on time reward
  - End screen: Centerpiece solves count with personal best badge ("First Run!" or "New Personal Best!")

### `/settings` — Settings
- **Theme**: Select System, Light, or Dark mode
  - System mode follows OS preference and reacts to OS changes
  - Light/Dark modes persist across sessions
- **Default Difficulty**: Choose Easy, Medium, or Hard (ready for future use)
- **Back navigation**: Returns to home

## Architecture

### Core Modules

- **`src/lib/stats.ts`** — Game statistics with localStorage persistence
- **`src/lib/theme.ts`** — Theme management (system, light, dark)
- **`src/wordGraph.ts`** — BFS pathfinding, neighbor lookup, multi-path discovery
- **`src/useGameState.ts`** — Game state reducer with React hook API
- **`src/dictionary/`** — Curated word lists (3–7 letters, ~4,500 words)

### Components

- **`ModeTile`** — Game mode selector (active/coming-soon states)
- **`StatsStrip`** — Horizontal stats display (4 cells with labels)

### Storage Keys

- `wordLadder.stats` — Game statistics (played, won, streaks)
- `wordLadder.theme` — Theme preference (system/light/dark)
- `wordLadder.difficulty` — Default difficulty setting
- `wordLadder-coins` — In-game coin balance
- `wordLadder-records` — Puzzle completion history
- `wordLadder.timeAttackStats` — Time Attack statistics (personal bests by mode+tier)

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3014` (or whatever port Vite assigns).

## Testing

```bash
npm test              # Run all tests
npm test -- --watch  # Watch mode
```

**Current test coverage**: 146 tests across 7 suites
- Stats module: 25 tests (default state, loading, saving, win/loss logic, streaks)
- Game state: 50+ tests (reducer actions, phase transitions)
- Word graph: 9 tests (neighbors, shortest paths, validation)
- Game components: 60+ tests (UI rendering, interactions)

## Keyboard Navigation

- **Tab** — Navigate between interactive elements
- **Enter / Space** — Activate buttons and links
- **Arrow keys** — Radio button groups
- **Focus rings** — Visible in both light and dark mode

## Routing

- `/` → HomePage
- `/settings` → SettingsPage
- `/play/classic` → ClassicGame
- `/_preview` → ComponentsPreview (dev only)
- All other routes → redirect to `/`

## Performance

- **Build**: < 1.1s (Vite)
- **Bundle**: ~90 KB gzipped (281 KB uncompressed)
- **Tests**: < 5s full suite
- **App load**: Theme applied before first render (no flash)

## Styling

- **Aesthetic**: Wordle-inspired (minimal, hairline borders, generous whitespace)
- **Colors**: Gray-based palette with blue accents for interactive elements
- **Typography**: System fonts, clean hierarchy
- **No gradients** — Flat, minimal design
- **Dark mode**: Fully supported throughout

## Known Limitations

- Daily Puzzle and Endless modes are UI placeholders (coming soon)
- Difficulty setting not yet used by puzzle generation in Classic mode
- Limited to 4-letter word puzzles currently (extensible to 3–7 letters)
