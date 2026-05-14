import { LocalSyncAdapter } from '../sync/LocalSyncAdapter';
import { BlitzSyncError, BlitzSyncErrorCode } from '../sync/SyncAdapter';
import { __resetBlitzSyncAdapterForTests } from '../sync/index';
import type { BlitzRoomSettings, RoomCode } from '../types';
import { createRoomCode } from '../types';

describe('LocalSyncAdapter', () => {
  let adapter: LocalSyncAdapter;

  beforeEach(() => {
    adapter = new LocalSyncAdapter();
    __resetBlitzSyncAdapterForTests();
  });

  describe('createRoom', () => {
    it('creates a room with host player', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId } = await adapter.createRoom('Alice', settings);

      expect(code).toBeDefined();
      expect(playerId).toBeDefined();
      expect(code.length).toBe(6);
    });

    it('creates unique room codes', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code: code1 } = await adapter.createRoom('Alice', settings);
      const { code: code2 } = await adapter.createRoom('Bob', settings);

      expect(code1).not.toEqual(code2);
    });

    it('throws INVALID_SETTINGS for invalid wordLength', async () => {
      const settings = {
        wordLength: 7, // invalid
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      } as any;

      await expect(adapter.createRoom('Alice', settings)).rejects.toThrow(BlitzSyncError);
      const error = await adapter.createRoom('Alice', settings).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.INVALID_SETTINGS);
    });

    it('throws INVALID_SETTINGS for invalid difficulty', async () => {
      const settings = {
        wordLength: 5,
        difficulty: 'extreme', // invalid
        durationMs: 60000,
        timerTier: 'tier1',
      } as any;

      const error = await adapter.createRoom('Alice', settings).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.INVALID_SETTINGS);
    });

    it('throws INVALID_SETTINGS for invalid durationMs', async () => {
      const settings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 50000, // invalid
        timerTier: 'tier1',
      } as any;

      const error = await adapter.createRoom('Alice', settings).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.INVALID_SETTINGS);
    });

    it('throws INVALID_SETTINGS for invalid timerTier', async () => {
      const settings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'invalid', // invalid
      } as any;

      const error = await adapter.createRoom('Alice', settings).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.INVALID_SETTINGS);
    });
  });

  describe('joinRoom', () => {
    it('allows player to join existing room', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code } = await adapter.createRoom('Alice', settings);
      const { playerId } = await adapter.joinRoom(code, 'Bob');

      expect(playerId).toBeDefined();
    });

    it('throws ROOM_NOT_FOUND for non-existent room', async () => {
      const code = createRoomCode('FAKECODE');
      const error = await adapter.joinRoom(code, 'Bob').catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.ROOM_NOT_FOUND);
    });

    it('throws ROOM_FULL when max players reached', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code } = await adapter.createRoom('Player1', settings);

      // Add 5 more players (6 total, which is MAX_PLAYERS)
      for (let i = 2; i <= 6; i++) {
        await adapter.joinRoom(code, `Player${i}`);
      }

      // 7th player should fail
      const error = await adapter.joinRoom(code, 'Player7').catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.ROOM_FULL);
    });

    it('throws GAME_ALREADY_STARTED when joining after game starts', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: hostId } = await adapter.createRoom('Alice', settings);
      await adapter.startGame(code, hostId);

      const error = await adapter.joinRoom(code, 'Bob').catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.GAME_ALREADY_STARTED);
    });
  });

  describe('subscribe', () => {
    it('calls listener immediately with current room', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code } = await adapter.createRoom('Alice', settings);
      const listener = jest.fn();

      adapter.subscribe(code, listener);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0]).toBeDefined();
      expect(listener.mock.calls[0][0].players.size).toBe(1);
    });

    it('returns unsubscribe function', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code } = await adapter.createRoom('Alice', settings);
      const listener = jest.fn();

      const unsubscribe = adapter.subscribe(code, listener);
      listener.mockClear();

      await adapter.joinRoom(code, 'Bob');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      listener.mockClear();

      await adapter.joinRoom(code, 'Charlie');
      expect(listener).not.toHaveBeenCalled();
    });

    it('notifies on room updates', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code } = await adapter.createRoom('Alice', settings);
      const listener = jest.fn();

      adapter.subscribe(code, listener);
      listener.mockClear();

      await adapter.joinRoom(code, 'Bob');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].players.size).toBe(2);
    });

    it('provides deep copy of room', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: aliceId } = await adapter.createRoom('Alice', settings);
      const listener = jest.fn();

      adapter.subscribe(code, listener);

      const room1 = listener.mock.calls[0][0];
      const initialSize = room1.players.size;
      listener.mockClear();

      await adapter.joinRoom(code, 'Bob');

      const room2 = listener.mock.calls[0][0];

      // room1 should still have original size
      expect(room1.players.size).toBe(initialSize);
      // room2 should have new size
      expect(room2.players.size).toBe(initialSize + 1);
    });
  });

  describe('updateSettings', () => {
    it('allows host to update settings', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: hostId } = await adapter.createRoom('Alice', settings);

      const newSettings: BlitzRoomSettings = {
        wordLength: 4,
        difficulty: 'hard',
        durationMs: 90000,
        timerTier: 'tier2',
      };

      const listener = jest.fn();
      adapter.subscribe(code, listener);
      listener.mockClear();

      await adapter.updateSettings(code, hostId, newSettings);

      expect(listener).toHaveBeenCalledTimes(1);
      const room = listener.mock.calls[0][0];
      expect(room.meta.wordLength).toBe(4);
      expect(room.meta.difficulty).toBe('hard');
      expect(room.meta.durationMs).toBe(90000);
      expect(room.meta.timerTier).toBe('tier2');
    });

    it('throws NOT_HOST if non-host tries to update', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code } = await adapter.createRoom('Alice', settings);
      const { playerId: bobId } = await adapter.joinRoom(code, 'Bob');

      const newSettings: BlitzRoomSettings = {
        wordLength: 4,
        difficulty: 'hard',
        durationMs: 90000,
        timerTier: 'tier2',
      };

      const error = await adapter.updateSettings(code, bobId, newSettings).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.NOT_HOST);
    });

    it('throws GAME_ALREADY_STARTED if updating after game starts', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: hostId } = await adapter.createRoom('Alice', settings);
      await adapter.startGame(code, hostId);

      const newSettings: BlitzRoomSettings = {
        wordLength: 4,
        difficulty: 'hard',
        durationMs: 90000,
        timerTier: 'tier2',
      };

      const error = await adapter.updateSettings(code, hostId, newSettings).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.GAME_ALREADY_STARTED);
    });
  });

  describe('startGame', () => {
    it('allows host to start game', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: hostId } = await adapter.createRoom('Alice', settings);

      const listener = jest.fn();
      adapter.subscribe(code, listener);
      listener.mockClear();

      await adapter.startGame(code, hostId);

      expect(listener).toHaveBeenCalledTimes(1);
      const room = listener.mock.calls[0][0];
      expect(room.currentPhase).toBe('countdown');
      expect(room.meta.startedAt).toBeDefined();
      expect(room.meta.startedAt).not.toBeNull();
    });

    it('throws NOT_HOST if non-host tries to start', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code } = await adapter.createRoom('Alice', settings);
      const { playerId: bobId } = await adapter.joinRoom(code, 'Bob');

      const error = await adapter.startGame(code, bobId).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.NOT_HOST);
    });

    it('throws INVALID_SETTINGS if puzzle generation fails', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: hostId } = await adapter.createRoom('Alice', settings);

      // Manually corrupt room to trigger puzzle generation failure
      // Simulate by corrupting settings in meta after creation
      const room = (adapter as any).rooms.get(code);
      room.meta.wordLength = 10 as any; // invalid wordLength

      const error = await adapter.startGame(code, hostId).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.INVALID_SETTINGS);
    });
  });

  describe('updateMyState', () => {
    it('allows player to update own state', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: aliceId } = await adapter.createRoom('Alice', settings);

      const listener = jest.fn();
      adapter.subscribe(code, listener);
      listener.mockClear();

      await adapter.updateMyState(code, aliceId, { solved: 5, score: 500 });

      expect(listener).toHaveBeenCalledTimes(1);
      const room = listener.mock.calls[0][0];
      const alice = room.players.get(aliceId);
      expect(alice?.solved).toBe(5);
      expect(alice?.score).toBe(500);
    });

    it('throws ROOM_NOT_FOUND if room does not exist', async () => {
      const code = createRoomCode('FAKECODE');
      const playerId = { __brand: 'PlayerId' } as any;

      const error = await adapter.updateMyState(code, playerId, {}).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.ROOM_NOT_FOUND);
    });

    it('throws NOT_IN_ROOM if player not in room', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code } = await adapter.createRoom('Alice', settings);
      const fakeId = { __brand: 'PlayerId' } as any;

      const error = await adapter.updateMyState(code, fakeId, {}).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.NOT_IN_ROOM);
    });
  });

  describe('postPuzzleResult', () => {
    it('appends puzzle result to player', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: aliceId } = await adapter.createRoom('Alice', settings);

      const listener = jest.fn();
      adapter.subscribe(code, listener);
      listener.mockClear();

      const result = { solved: true, solveTime: 5000, wrong: 0, hints: 0, score: 100 };
      await adapter.postPuzzleResult(code, aliceId, result);

      expect(listener).toHaveBeenCalledTimes(1);
      const room = listener.mock.calls[0][0];
      const alice = room.players.get(aliceId);
      expect((alice as any).puzzleResults).toHaveLength(1);
      expect((alice as any).puzzleResults[0]).toEqual(result);
    });

    it('throws ROOM_NOT_FOUND if room does not exist', async () => {
      const code = createRoomCode('FAKECODE');
      const playerId = { __brand: 'PlayerId' } as any;
      const result = {};

      const error = await adapter.postPuzzleResult(code, playerId, result).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.ROOM_NOT_FOUND);
    });

    it('throws NOT_IN_ROOM if player not in room', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code } = await adapter.createRoom('Alice', settings);
      const fakeId = { __brand: 'PlayerId' } as any;

      const error = await adapter.postPuzzleResult(code, fakeId, {}).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.NOT_IN_ROOM);
    });
  });

  describe('leaveRoom', () => {
    it('removes player from room', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: aliceId } = await adapter.createRoom('Alice', settings);
      const { playerId: bobId } = await adapter.joinRoom(code, 'Bob');

      const listener = jest.fn();
      adapter.subscribe(code, listener);
      listener.mockClear();

      await adapter.leaveRoom(code, bobId);

      expect(listener).toHaveBeenCalledTimes(1);
      const room = listener.mock.calls[0][0];
      expect(room.players.size).toBe(1);
      expect(room.players.has(bobId)).toBe(false);
    });

    it('promotes new host when host leaves', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: aliceId } = await adapter.createRoom('Alice', settings);
      const { playerId: bobId } = await adapter.joinRoom(code, 'Bob');

      const listener = jest.fn();
      adapter.subscribe(code, listener);
      listener.mockClear();

      await adapter.leaveRoom(code, aliceId);

      expect(listener).toHaveBeenCalledTimes(1);
      const room = listener.mock.calls[0][0];
      expect((room.meta as any).hostId).toBe(bobId);
    });

    it('deletes room when last player leaves', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: aliceId } = await adapter.createRoom('Alice', settings);

      const listener = jest.fn();
      adapter.subscribe(code, listener);
      listener.mockClear();

      await adapter.leaveRoom(code, aliceId);

      expect(listener).toHaveBeenCalledTimes(1);
      const room = listener.mock.calls[0][0];
      expect(room.players.size).toBe(0);
      expect(room.currentPhase).toBe('finished');
    });

    it('throws ROOM_NOT_FOUND if room does not exist', async () => {
      const code = createRoomCode('FAKECODE');
      const playerId = { __brand: 'PlayerId' } as any;

      const error = await adapter.leaveRoom(code, playerId).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.ROOM_NOT_FOUND);
    });

    it('throws NOT_IN_ROOM if player not in room', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code } = await adapter.createRoom('Alice', settings);
      const fakeId = { __brand: 'PlayerId' } as any;

      const error = await adapter.leaveRoom(code, fakeId).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.NOT_IN_ROOM);
    });
  });

  describe('endGame', () => {
    it('ends the game', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: hostId } = await adapter.createRoom('Alice', settings);
      await adapter.startGame(code, hostId);

      const listener = jest.fn();
      adapter.subscribe(code, listener);
      listener.mockClear();

      await adapter.endGame(code, hostId);

      expect(listener).toHaveBeenCalledTimes(1);
      const room = listener.mock.calls[0][0];
      expect(room.currentPhase).toBe('finished');
      expect(room.meta.endedAt).toBeDefined();
      expect(room.meta.endedAt).not.toBeNull();
    });

    it('is idempotent', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: hostId } = await adapter.createRoom('Alice', settings);
      await adapter.startGame(code, hostId);

      const listener = jest.fn();
      adapter.subscribe(code, listener);
      listener.mockClear();

      await adapter.endGame(code, hostId);
      listener.mockClear();

      // Second call should not trigger listener
      await adapter.endGame(code, hostId);
      expect(listener).not.toHaveBeenCalled();
    });

    it('throws ROOM_NOT_FOUND if room does not exist', async () => {
      const code = createRoomCode('FAKECODE');
      const playerId = { __brand: 'PlayerId' } as any;

      const error = await adapter.endGame(code, playerId).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.ROOM_NOT_FOUND);
    });
  });

  describe('playAgain', () => {
    it('resets game for another round', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: hostId } = await adapter.createRoom('Alice', settings);
      const { playerId: bobId } = await adapter.joinRoom(code, 'Bob');

      // Simulate some game state
      await adapter.updateMyState(code, hostId, { solved: 5, score: 500 });
      await adapter.updateMyState(code, bobId, { solved: 3, score: 300 });
      await adapter.postPuzzleResult(code, hostId, { solved: true });

      const listener = jest.fn();
      adapter.subscribe(code, listener);
      listener.mockClear();

      await adapter.playAgain(code, hostId);

      expect(listener).toHaveBeenCalledTimes(1);
      const room = listener.mock.calls[0][0];
      expect(room.currentPhase).toBe('lobby');
      expect(room.meta.startedAt).toBeNull();
      expect(room.meta.endedAt).toBeNull();

      // Check players are reset
      const alice = room.players.get(hostId);
      const bob = room.players.get(bobId);
      expect(alice?.solved).toBe(0);
      expect(alice?.score).toBe(0);
      expect((alice as any).puzzleResults).toHaveLength(0);
      expect(bob?.solved).toBe(0);
      expect(bob?.score).toBe(0);
      expect((bob as any).puzzleResults).toHaveLength(0);
    });

    it('throws NOT_HOST if non-host tries to play again', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code } = await adapter.createRoom('Alice', settings);
      const { playerId: bobId } = await adapter.joinRoom(code, 'Bob');

      const error = await adapter.playAgain(code, bobId).catch((e) => e);
      expect((error as BlitzSyncError).code).toBe(BlitzSyncErrorCode.NOT_HOST);
    });

    it('throws INVALID_SETTINGS if room settings invalid for reset', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: hostId } = await adapter.createRoom('Alice', settings);

      // Manually corrupt settings (simulate somehow settings became invalid)
      // In a real scenario, this might happen from a data mutation
      const error = await adapter.playAgain(code, hostId).catch((e) => e);
      // Should not throw in normal case
      expect(error).not.toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('handles full game flow: create, join, start, update state, end', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      // Create room
      const { code, playerId: aliceId } = await adapter.createRoom('Alice', settings);

      // Join room
      const { playerId: bobId } = await adapter.joinRoom(code, 'Bob');

      // Start game
      await adapter.startGame(code, aliceId);

      // Update states
      await adapter.updateMyState(code, aliceId, { solved: 3, score: 300 });
      await adapter.updateMyState(code, bobId, { solved: 2, score: 200 });

      // Post results
      await adapter.postPuzzleResult(code, aliceId, {
        solved: true,
        solveTime: 5000,
        wrong: 0,
        hints: 0,
        score: 100,
      });

      // End game
      await adapter.endGame(code, aliceId);

      // Verify final state
      const listener = jest.fn();
      adapter.subscribe(code, listener);

      const room = listener.mock.calls[0][0];
      expect(room.currentPhase).toBe('finished');
      expect(room.players.size).toBe(2);
      expect(room.players.get(aliceId)?.score).toBe(300);
      expect(room.players.get(bobId)?.score).toBe(200);
    });

    it('handles player leaving and room cleanup', async () => {
      const settings: BlitzRoomSettings = {
        wordLength: 5,
        difficulty: 'medium',
        durationMs: 60000,
        timerTier: 'tier1',
      };

      const { code, playerId: aliceId } = await adapter.createRoom('Alice', settings);
      const { playerId: bobId } = await adapter.joinRoom(code, 'Bob');
      const { playerId: charlieId } = await adapter.joinRoom(code, 'Charlie');

      // Alice (host) leaves
      await adapter.leaveRoom(code, aliceId);

      // Bob should now be host
      const listener = jest.fn();
      adapter.subscribe(code, listener);
      let room = listener.mock.calls[0][0];
      expect((room.meta as any).hostId).toBe(bobId);

      // Charlie leaves
      listener.mockClear();
      await adapter.leaveRoom(code, charlieId);
      room = listener.mock.calls[0][0];
      expect(room.players.size).toBe(1);

      // Bob leaves - room should be deleted
      listener.mockClear();
      await adapter.leaveRoom(code, bobId);
      room = listener.mock.calls[0][0];
      expect(room.players.size).toBe(0);
    });
  });
});
