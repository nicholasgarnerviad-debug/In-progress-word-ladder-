# Word Graph - Word Ladder & Puzzle Generator

TypeScript modules for word ladder pathfinding, BFS-based shortest paths, and deterministic daily puzzle generation.

## Features

- **getNeighbors(word: string)**: Returns all valid one-letter-edit neighbors from the dictionary
- **shortestPath(start: string, end: string)**: Finds the shortest word ladder path using BFS
- **Cached adjacency list**: Pre-computed at import time for O(1) neighbor lookups
- **Dictionary**: 600+ common English words (3-5 letters)

## Usage

```typescript
import { getNeighbors, shortestPath } from './wordGraph';

// Find all one-letter edits of a word
const neighbors = getNeighbors('cat');
// → ['bat', 'eat', 'fat', 'hat', 'mat', 'oat', 'pat', 'rat']

// Find shortest path between two words
const path = shortestPath('cat', 'dog');
// → ['cat', 'cot', 'dot', 'dog']

// Case-insensitive
const pathUpper = shortestPath('CAT', 'DOG');
// → ['cat', 'cot', 'dot', 'dog']

// Returns null if unreachable
const unreachable = shortestPath('cat', 'zzz');
// → null
```

## Test Results

All 13 tests pass:

- ✅ getNeighbors returns valid neighbors for words
- ✅ Case-insensitive input handling
- ✅ Returns empty array for invalid/out-of-range words
- ✅ **CAT→DOG path length ≤ 4** ✓ (returns 4-word path: CAT→COT→DOT→DOG)
- ✅ BFS validation (each step differs by exactly one letter)
- ✅ Unreachable word detection
- ✅ Self-reference handling
- ✅ Multi-word ladder paths

## Architecture

```
wordList (600+ words)
         ↓
Filter 3-5 letter words
         ↓
Build adjacency list cache at import
         ↓
getNeighbors() - O(1) lookup
shortestPath() - BFS with visited set
```

## Puzzle Generator Module

Generate word ladder puzzles with configurable difficulty and word lengths.

### API

```typescript
import { generatePuzzle, getDailyPuzzle } from './generatePuzzle';

// Generate a seeded puzzle
const puzzle = generatePuzzle(3, 'easy', 'my-seed');
// → {
//     start: 'how',
//     end: 'rap',
//     optimal: 4,
//     chain: ['how', 'row', 'raw', 'rap'],
//     lockedIndices: [2],
//     extraRungs: 2
//   }

// Get today's deterministic daily puzzle
const daily = getDailyPuzzle(4, 'medium');
```

### Features

- **Difficulty levels**: easy (4 steps), medium (5 steps), hard (6 steps)
- **Word lengths**: 3, 4, or 5 letters
- **Seeded randomness**: Use `seedrandom` for deterministic puzzles
- **Daily puzzles**: Same puzzle all day, different each day (seeded with `Date.toDateString()`)
- **Locked indices**: 0-2 random non-first-letter positions (for puzzle variants)
- **Extra rungs**: Always 2 (for difficulty multiplier)

### Example Puzzle Generation

```
Easy 3-letter (4 steps):    how → row → raw → rap
Medium 3-letter (5 steps):  peg → leg → lag → hag → hug
Hard 4-letter (6 steps):    wool → pool → poll → roll → role → rose
```

## Game State Hook (`useGameState`)

React hook that manages word ladder game state with pure reducer pattern.

### API

```typescript
import { useGameState } from './useGameState';

const { state, pressLetter, deleteLetter, submitWord, useHint, undoStep } = 
  useGameState(puzzle);
```

### State Shape

```typescript
{
  history: string[][];      // Word path progression
  burned: number;            // Wrong guess count
  currentInput: string[];    // Current word being typed
  selectedIdx: number;       // Cursor position
  hintsLeft: number;         // Remaining hints available
  score: number;             // Game score
  phase: 'playing'|'won'|'lost'; // Game state
}
```

### Methods

- **pressLetter(letter)** - Add letter to current word (auto-lowercased)
- **deleteLetter()** - Remove last letter
- **submitWord()** - Validate and submit word:
  - Must be in dictionary
  - Must differ by exactly 1 letter
  - Cannot be same as previous word
  - Wrong attempts increment `burned` count
- **useHint()** - Reveal one letter (if available)
- **undoStep()** - Revert to previous word in chain

### Score System

| Action | Points |
|--------|--------|
| Correct word | -20 |
| Wrong word | -50 |
| Use hint | -60 |
| Undo step | -10 |
| Win bonus (optimal) | +150 |

### Game Flow

- Start with puzzle start word
- Type and submit guesses
- 3 wrong guesses → "lost" phase
- Reach puzzle end word → "won" phase
- Cannot submit after game ends

## Performance

- **Build time**: O(n × m²) where n = word count, m = word length (pre-computed once)
- **getNeighbors**: O(1) lookup
- **shortestPath**: O(V + E) where V = vertices, E = edges in reachable subgraph
- **Puzzle generation**: O(maxAttempts × V) with seeded RNG for determinism
- **State updates**: O(1) for all reducer actions
