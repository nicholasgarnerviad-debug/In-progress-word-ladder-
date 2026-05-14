export type BlitzPhase = 'idle' | 'lobby' | 'countdown' | 'playing' | 'finished';
export type BlitzDifficulty = 'easy' | 'medium' | 'hard';
export type BlitzWordLength = 4 | 5 | 6;
export type BlitzTimerTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export type PlayerId = string & { readonly __brand: 'PlayerId' };
export type RoomCode = string & { readonly __brand: 'RoomCode' };

export function createPlayerId(id: string): PlayerId {
  return id as PlayerId;
}

export function createRoomCode(code: string): RoomCode {
  return code as RoomCode;
}

export interface BlitzPlayer {
  id: PlayerId;
  name: string;
  solved: number;
  wrong: number;
  hints: number;
  score: number;
  solvedAt: number | null;
  wrongAt: number[];
  hintsUsedAt: number[];
}

export interface BlitzMeta {
  roomCode: RoomCode;
  wordLength: BlitzWordLength;
  difficulty: BlitzDifficulty;
  durationMs: number;
  timerTier: BlitzTimerTier;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  sessionSeed: string;
}

export interface BlitzRoom {
  meta: BlitzMeta;
  players: Map<PlayerId, BlitzPlayer>;
  puzzles: string[];
  currentPuzzleIndex: number;
  currentPhase: BlitzPhase;
}

export interface BlitzPuzzleResult {
  solved: boolean;
  solveTime: number | null;
  wrong: number;
  hints: number;
  score: number;
}

export interface BlitzRoomSettings {
  wordLength: BlitzWordLength;
  difficulty: BlitzDifficulty;
  durationMs: number;
  timerTier: BlitzTimerTier;
  puzzleCount: number;
}

export interface BlitzRunSummary {
  roomCode: RoomCode;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  wordLength: BlitzWordLength;
  difficulty: BlitzDifficulty;
  totalPuzzles: number;
  playerResults: Map<
    PlayerId,
    {
      name: string;
      finalScore: number;
      solvedCount: number;
      wrongCount: number;
      hintsCount: number;
    }
  >;
}

export const BLITZ_LIMITS = {
  MIN_PLAYERS: 1,
  MAX_PLAYERS: 6,
  ROOM_CODE_LENGTH: 6,
  MIN_DURATION_MS: 30000,
  MAX_DURATION_MS: 300000,
  MIN_PUZZLE_COUNT: 5,
  MAX_PUZZLE_COUNT: 20,
  WORD_LENGTHS: [4, 5, 6] as const,
  DIFFICULTIES: ['easy', 'medium', 'hard'] as const,
  TIMER_TIERS: ['tier1', 'tier2', 'tier3', 'tier4'] as const,
  COUNTDOWN_MS: 3000,
  SCORE_PER_SOLVE: 100,
  PENALTY_PER_WRONG: 40,
  PENALTY_PER_HINT: 50,
  MIN_SCORE: 10,
  SPEED_BONUS_THRESHOLD_MS: 10000,
} as const;
