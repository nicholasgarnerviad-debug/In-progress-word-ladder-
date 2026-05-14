import {
  type BlitzSyncAdapter,
  type RoomListener,
  BlitzSyncError,
  BlitzSyncErrorCode,
} from './SyncAdapter';
import type { PlayerId, RoomCode, BlitzRoom, BlitzRoomSettings, BlitzPlayer } from '../types';
import { createPlayerId, createRoomCode, BLITZ_LIMITS } from '../types';
import {
  generateRoomCode,
  generateBlitzPuzzleBatch,
  generateSessionSeed,
} from '../utils';

/**
 * LocalSyncAdapter: In-memory implementation of BlitzSyncAdapter.
 * Single-tab only, no cross-tab sync (v1).
 * Stores all rooms in memory and notifies subscribers on updates.
 */
export class LocalSyncAdapter implements BlitzSyncAdapter {
  private rooms = new Map<RoomCode, BlitzRoom>();
  private subscribers = new Map<RoomCode, Set<RoomListener>>();
  private countdownTimers = new Map<RoomCode, number>();

  async createRoom(
    hostDisplayName: string,
    settings: BlitzRoomSettings
  ): Promise<{ code: RoomCode; playerId: PlayerId }> {
    this.validateSettings(settings);

    // Generate unique room code (retry up to 5 times)
    let code: RoomCode | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateRoomCode();
      if (!this.rooms.has(candidate)) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      throw new BlitzSyncError(
        BlitzSyncErrorCode.INVALID_SETTINGS,
        'Could not generate unique room code after 5 attempts'
      );
    }

    // Create host player
    const hostId = this.generatePlayerId();
    const host: BlitzPlayer = {
      id: hostId,
      name: hostDisplayName,
      solved: 0,
      wrong: 0,
      hints: 0,
      score: 0,
      solvedAt: null,
      wrongAt: [],
      hintsUsedAt: [],
    };

    // Create room
    const now = Date.now();
    const room: BlitzRoom = {
      meta: {
        roomCode: code,
        wordLength: settings.wordLength,
        difficulty: settings.difficulty,
        durationMs: settings.durationMs,
        timerTier: settings.timerTier,
        createdAt: now,
        startedAt: null,
        endedAt: null,
        sessionSeed: generateSessionSeed(),
      },
      players: new Map([[hostId, host]]),
      currentPuzzleIndex: 0,
      currentPhase: 'lobby',
    };

    // Store hostId in meta for host checking
    (room.meta as any).hostId = hostId;

    this.rooms.set(code, room);
    this.subscribers.set(code, new Set());

    // Notify subscribers
    this.notifySubscribers(code);

    return { code, playerId: hostId };
  }

  async joinRoom(code: RoomCode, displayName: string): Promise<{ playerId: PlayerId }> {
    const room = this.rooms.get(code);
    if (!room) {
      throw new BlitzSyncError(BlitzSyncErrorCode.ROOM_NOT_FOUND, `Room ${code} not found`);
    }

    if (room.players.size >= BLITZ_LIMITS.MAX_PLAYERS) {
      throw new BlitzSyncError(BlitzSyncErrorCode.ROOM_FULL, `Room ${code} is full`);
    }

    if (room.currentPhase !== 'lobby') {
      throw new BlitzSyncError(
        BlitzSyncErrorCode.GAME_ALREADY_STARTED,
        `Game in room ${code} has already started`
      );
    }

    // Create new player
    const playerId = this.generatePlayerId();
    const player: BlitzPlayer = {
      id: playerId,
      name: displayName,
      solved: 0,
      wrong: 0,
      hints: 0,
      score: 0,
      solvedAt: null,
      wrongAt: [],
      hintsUsedAt: [],
    };

    room.players.set(playerId, player);

    // Notify subscribers
    this.notifySubscribers(code);

    return { playerId };
  }

  subscribe(code: RoomCode, listener: RoomListener): () => void {
    let subscribers = this.subscribers.get(code);
    if (!subscribers) {
      subscribers = new Set();
      this.subscribers.set(code, subscribers);
    }

    subscribers.add(listener);

    // Immediately call listener with current room snapshot
    const room = this.rooms.get(code);
    if (room) {
      listener(this.deepCopyRoom(room));
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(code);
      if (subs) {
        subs.delete(listener);
      }
    };
  }

  async updateSettings(
    code: RoomCode,
    playerId: PlayerId,
    settings: BlitzRoomSettings
  ): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) {
      throw new BlitzSyncError(BlitzSyncErrorCode.ROOM_NOT_FOUND, `Room ${code} not found`);
    }

    this.checkIsHost(room, playerId);

    if (room.currentPhase !== 'lobby') {
      throw new BlitzSyncError(
        BlitzSyncErrorCode.GAME_ALREADY_STARTED,
        `Cannot update settings after game has started`
      );
    }

    this.validateSettings(settings);

    // Update room meta
    room.meta.wordLength = settings.wordLength;
    room.meta.difficulty = settings.difficulty;
    room.meta.durationMs = settings.durationMs;
    room.meta.timerTier = settings.timerTier;

    // Notify subscribers
    this.notifySubscribers(code);
  }

  async startGame(code: RoomCode, playerId: PlayerId): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) {
      throw new BlitzSyncError(BlitzSyncErrorCode.ROOM_NOT_FOUND, `Room ${code} not found`);
    }

    this.checkIsHost(room, playerId);

    try {
      // Generate puzzle batch
      const puzzles = generateBlitzPuzzleBatch(
        room.meta.wordLength,
        room.meta.difficulty,
        room.meta.sessionSeed,
        10 // Default 10 puzzles for now
      );
      (room as any).puzzles = puzzles;
    } catch (error) {
      throw new BlitzSyncError(
        BlitzSyncErrorCode.INVALID_SETTINGS,
        `Failed to generate puzzles: ${error instanceof Error ? error.message : 'unknown'}`
      );
    }

    // Clear any existing countdown timer
    const existingTimerId = this.countdownTimers.get(code);
    if (existingTimerId !== undefined) {
      clearTimeout(existingTimerId);
    }

    // Set countdown phase
    const now = Date.now();
    const countdownEndTime = now + BLITZ_LIMITS.COUNTDOWN_MS;
    room.meta.startedAt = countdownEndTime;
    room.currentPhase = 'countdown';
    room.currentPuzzleIndex = 0;

    // Notify immediately with 'countdown' phase
    this.notifySubscribers(code);

    // Schedule transition to 'playing' state
    const timerId = window.setTimeout(() => {
      const r = this.rooms.get(code);
      if (r && r.currentPhase === 'countdown') {
        r.currentPhase = 'playing';
        this.notifySubscribers(code);
      }
      this.countdownTimers.delete(code);
    }, BLITZ_LIMITS.COUNTDOWN_MS);

    // Store timer ID for cleanup
    this.countdownTimers.set(code, timerId);
  }

  async updateMyState(
    code: RoomCode,
    playerId: PlayerId,
    patch: Partial<any>
  ): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) {
      throw new BlitzSyncError(BlitzSyncErrorCode.ROOM_NOT_FOUND, `Room ${code} not found`);
    }

    const player = room.players.get(playerId);
    if (!player) {
      throw new BlitzSyncError(
        BlitzSyncErrorCode.NOT_IN_ROOM,
        `Player ${playerId} not in room ${code}`
      );
    }

    Object.assign(player, patch);

    // Notify subscribers
    this.notifySubscribers(code);
  }

  async postPuzzleResult(code: RoomCode, playerId: PlayerId, result: any): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) {
      throw new BlitzSyncError(BlitzSyncErrorCode.ROOM_NOT_FOUND, `Room ${code} not found`);
    }

    const player = room.players.get(playerId);
    if (!player) {
      throw new BlitzSyncError(
        BlitzSyncErrorCode.NOT_IN_ROOM,
        `Player ${playerId} not in room ${code}`
      );
    }

    // Ensure puzzleResults array exists
    if (!Array.isArray((player as any).puzzleResults)) {
      (player as any).puzzleResults = [];
    }

    (player as any).puzzleResults.push(result);

    // Notify subscribers
    this.notifySubscribers(code);
  }

  async leaveRoom(code: RoomCode, playerId: PlayerId): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) {
      throw new BlitzSyncError(BlitzSyncErrorCode.ROOM_NOT_FOUND, `Room ${code} not found`);
    }

    const player = room.players.get(playerId);
    if (!player) {
      throw new BlitzSyncError(
        BlitzSyncErrorCode.NOT_IN_ROOM,
        `Player ${playerId} not in room ${code}`
      );
    }

    const isHost = (room as any).meta.hostId === playerId;

    room.players.delete(playerId);

    // If host left and others remain, promote earliest-joined
    if (isHost && room.players.size > 0) {
      const earliestPlayer = Array.from(room.players.values())[0];
      (room as any).meta.hostId = earliestPlayer.id;
    }

    // If last player left, end game and clean up
    if (room.players.size === 0) {
      room.currentPhase = 'finished';
      room.meta.endedAt = Date.now();

      // Clear countdown timer if running
      const timerId = this.countdownTimers.get(code);
      if (timerId !== undefined) {
        clearTimeout(timerId);
        this.countdownTimers.delete(code);
      }

      // Notify before deletion
      this.notifySubscribers(code);

      // Delete room and subscribers
      this.rooms.delete(code);
      this.subscribers.delete(code);
    } else {
      // Notify of player removal
      this.notifySubscribers(code);
    }
  }

  async endGame(code: RoomCode, playerId: PlayerId): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) {
      throw new BlitzSyncError(BlitzSyncErrorCode.ROOM_NOT_FOUND, `Room ${code} not found`);
    }

    // Idempotent: if already finished, return immediately
    if (room.currentPhase === 'finished') {
      return;
    }

    room.currentPhase = 'finished';
    room.meta.endedAt = Date.now();

    // Clear countdown timer if running
    const timerId = this.countdownTimers.get(code);
    if (timerId !== undefined) {
      clearTimeout(timerId);
      this.countdownTimers.delete(code);
    }

    // Notify subscribers
    this.notifySubscribers(code);
  }

  async playAgain(code: RoomCode, playerId: PlayerId): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) {
      throw new BlitzSyncError(BlitzSyncErrorCode.ROOM_NOT_FOUND, `Room ${code} not found`);
    }

    this.checkIsHost(room, playerId);

    // Validate settings before resetting
    const settings: BlitzRoomSettings = {
      wordLength: room.meta.wordLength,
      difficulty: room.meta.difficulty,
      durationMs: room.meta.durationMs,
      timerTier: room.meta.timerTier,
    };
    this.validateSettings(settings);

    // Reset all players
    for (const player of room.players.values()) {
      player.solved = 0;
      player.wrong = 0;
      player.hints = 0;
      player.score = 0;
      player.solvedAt = null;
      player.wrongAt = [];
      player.hintsUsedAt = [];
      (player as any).puzzleResults = [];
    }

    // Reset room state
    room.meta.sessionSeed = generateSessionSeed();
    room.meta.startedAt = null;
    room.meta.endedAt = null;
    (room as any).puzzles = [];
    room.currentPuzzleIndex = 0;
    room.currentPhase = 'lobby';

    // Clear any pending countdown timer
    const timerId = this.countdownTimers.get(code);
    if (timerId !== undefined) {
      clearTimeout(timerId);
      this.countdownTimers.delete(code);
    }

    // Notify subscribers
    this.notifySubscribers(code);
  }

  /**
   * Internal: Validate settings conform to requirements
   */
  private validateSettings(settings: BlitzRoomSettings): void {
    const { wordLength, difficulty, durationMs, timerTier } = settings;

    const validWordLengths = [4, 5, 6];
    if (!validWordLengths.includes(wordLength)) {
      throw new BlitzSyncError(
        BlitzSyncErrorCode.INVALID_SETTINGS,
        `Invalid wordLength: ${wordLength}`
      );
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      throw new BlitzSyncError(
        BlitzSyncErrorCode.INVALID_SETTINGS,
        `Invalid difficulty: ${difficulty}`
      );
    }

    const validDurations = [60000, 90000, 120000];
    if (!validDurations.includes(durationMs)) {
      throw new BlitzSyncError(
        BlitzSyncErrorCode.INVALID_SETTINGS,
        `Invalid durationMs: ${durationMs}`
      );
    }

    const validTiers = ['tier1', 'tier2', 'tier3', 'tier4'];
    if (!validTiers.includes(timerTier)) {
      throw new BlitzSyncError(
        BlitzSyncErrorCode.INVALID_SETTINGS,
        `Invalid timerTier: ${timerTier}`
      );
    }
  }

  /**
   * Internal: Check if player is the host
   */
  private checkIsHost(room: BlitzRoom, playerId: PlayerId): void {
    const hostId = (room.meta as any).hostId;
    if (hostId !== playerId) {
      throw new BlitzSyncError(BlitzSyncErrorCode.NOT_HOST, `Only host can perform this action`);
    }
  }

  /**
   * Internal: Generate a unique player ID
   */
  private generatePlayerId(): PlayerId {
    return createPlayerId(`player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }

  /**
   * Internal: Notify all subscribers of room change
   */
  private notifySubscribers(code: RoomCode): void {
    const room = this.rooms.get(code);
    if (!room) return;

    const subscribers = this.subscribers.get(code);
    if (!subscribers) return;

    const roomCopy = this.deepCopyRoom(room);
    for (const listener of subscribers) {
      listener(roomCopy);
    }
  }

  /**
   * Internal: Deep copy room for snapshot isolation
   * Preserves Map structure for players
   */
  private deepCopyRoom(room: BlitzRoom): BlitzRoom {
    // Create a new Map with deep-copied players
    const playersCopy = new Map<PlayerId, any>();
    for (const [id, player] of room.players) {
      playersCopy.set(id, JSON.parse(JSON.stringify(player)));
    }

    // Deep copy the rest using JSON
    const metaCopy = JSON.parse(JSON.stringify(room.meta));
    const puzzlesCopy = (room as any).puzzles ? JSON.parse(JSON.stringify((room as any).puzzles)) : undefined;

    const copy: BlitzRoom = {
      meta: metaCopy,
      players: playersCopy,
      currentPuzzleIndex: room.currentPuzzleIndex,
      currentPhase: room.currentPhase,
    };

    if (puzzlesCopy) {
      (copy as any).puzzles = puzzlesCopy;
    }

    return copy;
  }
}
