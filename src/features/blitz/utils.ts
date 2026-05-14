import type { BlitzWordLength, BlitzDifficulty, RoomCode } from './types';
import { createRoomCode } from './types';

/**
 * Generates a 6-character room code using alphanumeric characters,
 * excluding ambiguous chars: 0, O, 1, I, L
 */
export function generateRoomCode(): RoomCode {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return createRoomCode(code);
}

/**
 * Validates a room code format (6 chars, alphanumeric, no ambiguous chars).
 * Case-insensitive, trims whitespace.
 */
export function isValidRoomCode(code: string): boolean {
  const trimmed = code.trim().toUpperCase();
  if (trimmed.length !== 6) return false;

  const ambiguous = /[0O1IL]/;
  if (ambiguous.test(trimmed)) return false;

  const valid = /^[A-Z2-9]{6}$/;
  return valid.test(trimmed);
}

/**
 * Generates a batch of unique puzzles deterministically.
 * Uses a simple seeded RNG for puzzle generation.
 * If count unavailable puzzles, retries up to 3 times with fresh seed.
 */
export function generateBlitzPuzzleBatch(
  wordLength: BlitzWordLength,
  difficulty: BlitzDifficulty,
  seed: string,
  count: number
): string[] {
  const PUZZLE_BANK: Record<BlitzWordLength, Record<BlitzDifficulty, string[]>> = {
    4: {
      easy: ['able', 'back', 'cage', 'dark', 'each', 'face', 'game', 'hand', 'idea', 'jack'],
      medium: ['bold', 'chat', 'dull', 'epic', 'folk', 'gulf', 'halt', 'inch', 'joke', 'keep'],
      hard: ['buff', 'coax', 'deft', 'envy', 'flux', 'gyms', 'hymn', 'jowl', 'lynx', 'myth'],
    },
    5: {
      easy: [
        'about',
        'beach',
        'clean',
        'dance',
        'early',
        'field',
        'glove',
        'heart',
        'image',
        'judge',
      ],
      medium: [
        'black',
        'brand',
        'check',
        'draft',
        'elite',
        'frank',
        'ghost',
        'happy',
        'joint',
        'knife',
      ],
      hard: [
        'bogey',
        'crisp',
        'dwarf',
        'epoch',
        'frizz',
        'glyph',
        'humor',
        'jazzy',
        'knack',
        'lymph',
      ],
    },
    6: {
      easy: [
        'action',
        'bridge',
        'camera',
        'dinner',
        'energy',
        'finger',
        'golden',
        'humble',
        'island',
        'jungle',
      ],
      medium: [
        'branch',
        'caught',
        'church',
        'danger',
        'escape',
        'friend',
        'ground',
        'height',
        'import',
        'jumped',
      ],
      hard: [
        'branch',
        'chrome',
        'coyote',
        'dryly',
        'elf',
        'frolic',
        'groove',
        'hyphen',
        'jargon',
        'knight',
      ],
    },
  };

  const bank = PUZZLE_BANK[wordLength]?.[difficulty] || [];
  if (bank.length === 0) {
    throw new Error(`No puzzles available for length ${wordLength}, difficulty ${difficulty}`);
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const selected = new Set<string>();
    let currentSeed = seed + '_attempt_' + attempts;

    for (let i = 0; i < count; i++) {
      // Seeded RNG: hash seed + index to get deterministic but varied indices
      let hash = 0;
      const combined = currentSeed + '_' + i;
      for (let j = 0; j < combined.length; j++) {
        hash = ((hash << 5) - hash + combined.charCodeAt(j)) | 0;
      }
      const index = Math.abs(hash) % bank.length;
      const puzzle = bank[index];

      selected.add(puzzle);
    }

    if (selected.size >= count) {
      return Array.from(selected).slice(0, count);
    }

    attempts++;
  }

  throw new Error(`Could not generate ${count} unique puzzles after ${maxAttempts} attempts`);
}

/**
 * Formats milliseconds as time string.
 * >= 10s: "M:SS.t" (e.g., "1:23.4")
 * < 10s: "S.t" (e.g., "9.8")
 * Handles negatives by returning "0.0"
 */
export function formatTime(ms: number): string {
  if (ms < 0) return '0.0';

  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((ms % 1000) / 100);

  if (totalSeconds >= 10) {
    return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
  } else {
    return `${Math.floor(totalSeconds)}.${tenths}`;
  }
}

/**
 * Formats milliseconds as MM:SS format for Blitz timer display.
 * Example: 65000ms -> "01:05", 45000ms -> "00:45"
 * Handles edge cases: 0ms -> "00:00", negative -> "00:00"
 * Caps extremely large values at 99:59
 */
export function formatBlitzTime(ms: number): string {
  if (ms < 0) return '00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.min(Math.floor(totalSeconds / 60), 99);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Generates a session seed: timestamp + 5 random alphanumeric chars.
 */
export function generateSessionSeed(): string {
  const timestamp = Date.now();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let random = '';
  for (let i = 0; i < 5; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${timestamp}_${random}`;
}
