import { useState, useRef, useEffect, useCallback } from 'react';
import { getBlitzSyncAdapter, BlitzSyncError } from './sync';
import type { BlitzSyncAdapter } from './sync';
import type { PlayerId, RoomCode, BlitzRoom, BlitzRoomSettings, BlitzPlayer } from './types';

const ACTIVITY_PING_INTERVAL_MS = 5000;

/**
 * State returned by useBlitzRoom
 */
export type UseBlitzRoomState = {
  room: BlitzRoom | null;
  myPlayerId: PlayerId | null;
  me: BlitzPlayer | null;
  isHost: boolean;
  error: { code: string; message: string } | null;
  isLoading: boolean;
};

/**
 * Actions provided by useBlitzRoom
 */
export type UseBlitzRoomActions = {
  createRoom: (displayName: string, settings: BlitzRoomSettings) => Promise<RoomCode | null>;
  joinRoom: (code: RoomCode, displayName: string) => Promise<boolean>;
  updateSettings: (settings: BlitzRoomSettings) => Promise<boolean>;
  startGame: () => Promise<boolean>;
  postPuzzleResult: (result: any) => Promise<void>;
  updateMyState: (patch: Partial<any>) => Promise<void>;
  leaveRoom: () => Promise<void>;
  endGame: () => Promise<void>;
  playAgain: () => Promise<boolean>;
  clearError: () => void;
};

/**
 * React hook for Blitz room management.
 * Wraps BlitzSyncAdapter to provide component-friendly state and actions.
 */
export function useBlitzRoom(): UseBlitzRoomState & UseBlitzRoomActions {
  // State
  const [room, setRoom] = useState<BlitzRoom | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<PlayerId | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for stable identity across renders
  const adapterRef = useRef<BlitzSyncAdapter | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const activityIntervalRef = useRef<number | null>(null);

  // Initialize adapter once
  if (!adapterRef.current) {
    adapterRef.current = getBlitzSyncAdapter();
  }

  const adapter = adapterRef.current;

  // Derived state
  const me = room && myPlayerId ? (room.players.get(myPlayerId) ?? null) : null;
  const isHost = me?.id ? (room?.meta as any)?.hostId === me.id : false;

  /**
   * Clear activity ping interval
   */
  const clearActivityInterval = useCallback(() => {
    if (activityIntervalRef.current !== null) {
      clearInterval(activityIntervalRef.current);
      activityIntervalRef.current = null;
    }
  }, []);

  /**
   * Clear subscription
   */
  const clearSubscription = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  /**
   * Start activity ping interval
   */
  const startActivityPing = useCallback(() => {
    clearActivityInterval();

    activityIntervalRef.current = window.setInterval(async () => {
      // Only ping if not in finished phase
      if (room && room.currentPhase !== 'finished' && myPlayerId) {
        try {
          await adapter.updateMyState(room.meta.roomCode, myPlayerId, {
            lastActivity: Date.now(),
          });
        } catch {
          // Suppress errors - just a ping
        }
      }
    }, ACTIVITY_PING_INTERVAL_MS);
  }, [room, myPlayerId, adapter, clearActivityInterval]);

  /**
   * Start activity ping when in a room
   */
  useEffect(() => {
    if (!room || !myPlayerId) {
      clearActivityInterval();
      return;
    }

    startActivityPing();

    return () => {
      clearActivityInterval();
    };
  }, [room?.meta.roomCode, myPlayerId, startActivityPing, clearActivityInterval]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearActivityInterval();
      clearSubscription();
    };
  }, [clearActivityInterval, clearSubscription]);

  /**
   * Convert error to standardized format
   */
  const formatError = (err: unknown): { code: string; message: string } => {
    if (err instanceof BlitzSyncError) {
      return { code: err.code, message: err.message };
    }
    if (err instanceof Error) {
      return { code: 'NETWORK_ERROR', message: err.message };
    }
    return { code: 'NETWORK_ERROR', message: 'Unknown error occurred' };
  };

  /**
   * Create a new room
   */
  const createRoom = useCallback(
    async (displayName: string, settings: BlitzRoomSettings): Promise<RoomCode | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const { code, playerId } = await adapter.createRoom(displayName, settings);

        // Subscribe to room immediately
        const unsubscribe = adapter.subscribe(code, (updatedRoom) => {
          setRoom(updatedRoom);
        });
        unsubscribeRef.current = unsubscribe;

        setMyPlayerId(playerId);

        return code;
      } catch (err) {
        const formattedError = formatError(err);
        setError(formattedError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [adapter]
  );

  /**
   * Join an existing room
   */
  const joinRoom = useCallback(
    async (code: RoomCode, displayName: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const { playerId } = await adapter.joinRoom(code, displayName);
        setMyPlayerId(playerId);

        // Subscribe to room
        const unsubscribe = adapter.subscribe(code, (updatedRoom) => {
          setRoom(updatedRoom);
        });
        unsubscribeRef.current = unsubscribe;

        return true;
      } catch (err) {
        const formattedError = formatError(err);
        setError(formattedError);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [adapter]
  );

  /**
   * Update room settings (host only)
   */
  const updateSettings = useCallback(
    async (settings: BlitzRoomSettings): Promise<boolean> => {
      if (!room || !myPlayerId) {
        setError({ code: 'NOT_IN_ROOM', message: 'Not in a room' });
        return false;
      }

      try {
        setError(null);
        await adapter.updateSettings(room.meta.roomCode, myPlayerId, settings);
        return true;
      } catch (err) {
        const formattedError = formatError(err);
        setError(formattedError);
        return false;
      }
    },
    [room, myPlayerId, adapter]
  );

  /**
   * Start the game (host only)
   */
  const startGame = useCallback(async (): Promise<boolean> => {
    if (!room || !myPlayerId) {
      setError({ code: 'NOT_IN_ROOM', message: 'Not in a room' });
      return false;
    }

    try {
      setError(null);
      await adapter.startGame(room.meta.roomCode, myPlayerId);
      return true;
    } catch (err) {
      const formattedError = formatError(err);
      setError(formattedError);
      return false;
    }
  }, [room, myPlayerId, adapter]);

  /**
   * Post a puzzle result
   */
  const postPuzzleResult = useCallback(
    async (result: any): Promise<void> => {
      if (!room || !myPlayerId) {
        throw new Error('Not in a room');
      }

      try {
        setError(null);
        await adapter.postPuzzleResult(room.meta.roomCode, myPlayerId, result);
      } catch (err) {
        const formattedError = formatError(err);
        setError(formattedError);
        throw err;
      }
    },
    [room, myPlayerId, adapter]
  );

  /**
   * Update current player's state
   */
  const updateMyState = useCallback(
    async (patch: Partial<any>): Promise<void> => {
      if (!room || !myPlayerId) {
        throw new Error('Not in a room');
      }

      try {
        setError(null);
        await adapter.updateMyState(room.meta.roomCode, myPlayerId, patch);
      } catch (err) {
        const formattedError = formatError(err);
        setError(formattedError);
        throw err;
      }
    },
    [room, myPlayerId, adapter]
  );

  /**
   * Leave the room
   */
  const leaveRoom = useCallback(async (): Promise<void> => {
    if (!room || !myPlayerId) {
      return;
    }

    try {
      setError(null);
      clearActivityInterval();
      clearSubscription();
      await adapter.leaveRoom(room.meta.roomCode, myPlayerId);
      setRoom(null);
      setMyPlayerId(null);
    } catch (err) {
      const formattedError = formatError(err);
      setError(formattedError);
      throw err;
    }
  }, [room, myPlayerId, adapter, clearActivityInterval, clearSubscription]);

  /**
   * End the game
   */
  const endGame = useCallback(async (): Promise<void> => {
    if (!room || !myPlayerId) {
      throw new Error('Not in a room');
    }

    try {
      setError(null);
      await adapter.endGame(room.meta.roomCode, myPlayerId);
    } catch (err) {
      const formattedError = formatError(err);
      setError(formattedError);
      throw err;
    }
  }, [room, myPlayerId, adapter]);

  /**
   * Play again (host only, resets game to lobby)
   */
  const playAgain = useCallback(async (): Promise<boolean> => {
    if (!room || !myPlayerId) {
      setError({ code: 'NOT_IN_ROOM', message: 'Not in a room' });
      return false;
    }

    try {
      setError(null);
      await adapter.playAgain(room.meta.roomCode, myPlayerId);
      return true;
    } catch (err) {
      const formattedError = formatError(err);
      setError(formattedError);
      return false;
    }
  }, [room, myPlayerId, adapter]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    room,
    myPlayerId,
    me,
    isHost,
    error,
    isLoading,
    // Actions
    createRoom,
    joinRoom,
    updateSettings,
    startGame,
    postPuzzleResult,
    updateMyState,
    leaveRoom,
    endGame,
    playAgain,
    clearError,
  };
}
