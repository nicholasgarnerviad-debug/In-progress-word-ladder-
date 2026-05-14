import type { PlayerId, RoomCode, BlitzRoom, BlitzRoomSettings } from '../types';

/**
 * Sync adapter error codes
 */
export enum BlitzSyncErrorCode {
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_FULL = 'ROOM_FULL',
  GAME_ALREADY_STARTED = 'GAME_ALREADY_STARTED',
  NOT_HOST = 'NOT_HOST',
  NOT_IN_ROOM = 'NOT_IN_ROOM',
  INVALID_SETTINGS = 'INVALID_SETTINGS',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

/**
 * Sync adapter error with code for structured error handling
 */
export class BlitzSyncError extends Error {
  constructor(
    public code: BlitzSyncErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'BlitzSyncError';
  }
}

export type RoomListener = (room: BlitzRoom) => void;

/**
 * Interface for sync adapters.
 * Implementations handle room management, subscriptions, and state updates.
 * All methods are async (return Promises) even if in-memory for consistency with future Firebase adapter.
 */
export interface BlitzSyncAdapter {
  /**
   * Creates a new room with the host.
   * Retries up to 5 times if room code collision occurs.
   *
   * @param hostDisplayName - Display name of the host
   * @param settings - Initial room settings
   * @returns Promise resolving to {code, playerId} for the host
   * @throws BlitzSyncError with INVALID_SETTINGS if settings are invalid
   */
  createRoom(
    hostDisplayName: string,
    settings: BlitzRoomSettings
  ): Promise<{ code: RoomCode; playerId: PlayerId }>;

  /**
   * Joins an existing room.
   *
   * @param code - Room code
   * @param displayName - Display name of joining player
   * @returns Promise resolving to {playerId}
   * @throws BlitzSyncError with ROOM_NOT_FOUND, ROOM_FULL, or GAME_ALREADY_STARTED
   */
  joinRoom(code: RoomCode, displayName: string): Promise<{ playerId: PlayerId }>;

  /**
   * Subscribes to room updates.
   * Listener is immediately called with current room snapshot (if room exists).
   * On each room update, listener is called with a fresh deep copy of the room.
   *
   * @param code - Room code
   * @param listener - Function called with updated room
   * @returns Unsubscribe function
   */
  subscribe(code: RoomCode, listener: RoomListener): () => void;

  /**
   * Updates room settings.
   * Only the host can update settings, and only when in 'lobby' phase.
   *
   * @param code - Room code
   * @param playerId - Player ID (must be host)
   * @param settings - Updated settings
   * @throws BlitzSyncError with NOT_HOST or GAME_ALREADY_STARTED
   */
  updateSettings(code: RoomCode, playerId: PlayerId, settings: BlitzRoomSettings): Promise<void>;

  /**
   * Starts the game.
   * Only the host can start, generates puzzles, and schedules countdown to 'playing'.
   *
   * @param code - Room code
   * @param playerId - Player ID (must be host)
   * @returns Promise resolving when countdown is set up (game starts async)
   * @throws BlitzSyncError with NOT_HOST or INVALID_SETTINGS
   */
  startGame(code: RoomCode, playerId: PlayerId): Promise<void>;

  /**
   * Updates a player's state with a patch.
   * Shallow merge with player's current state.
   *
   * @param code - Room code
   * @param playerId - Player ID
   * @param patch - Partial player state to merge
   * @throws BlitzSyncError with ROOM_NOT_FOUND or NOT_IN_ROOM
   */
  updateMyState(code: RoomCode, playerId: PlayerId, patch: Partial<any>): Promise<void>;

  /**
   * Records a puzzle result for a player.
   *
   * @param code - Room code
   * @param playerId - Player ID
   * @param result - Puzzle result (appended to player.puzzleResults)
   * @throws BlitzSyncError with ROOM_NOT_FOUND or NOT_IN_ROOM
   */
  postPuzzleResult(code: RoomCode, playerId: PlayerId, result: any): Promise<void>;

  /**
   * Removes a player from the room.
   * If host leaves, promotes the earliest-joined remaining player to host.
   * If last player leaves, ends the game and cleans up the room.
   *
   * @param code - Room code
   * @param playerId - Player ID
   * @throws BlitzSyncError with ROOM_NOT_FOUND or NOT_IN_ROOM
   */
  leaveRoom(code: RoomCode, playerId: PlayerId): Promise<void>;

  /**
   * Ends the game (idempotent).
   * Sets status to 'finished' and clears countdown timer if running.
   *
   * @param code - Room code
   * @param playerId - Player ID
   * @throws BlitzSyncError with ROOM_NOT_FOUND
   */
  endGame(code: RoomCode, playerId: PlayerId): Promise<void>;

  /**
   * Resets the game for another round.
   * Only the host can reset; resets all players and shuffles puzzles.
   *
   * @param code - Room code
   * @param playerId - Player ID (must be host)
   * @throws BlitzSyncError with NOT_HOST or INVALID_SETTINGS
   */
  playAgain(code: RoomCode, playerId: PlayerId): Promise<void>;
}
