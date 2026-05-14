import React from 'react';
import type { BlitzRoom, PlayerId } from '../types';

export type WaitingRoomProps = {
  room: BlitzRoom;
  myPlayerId: PlayerId;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  onStartGame: () => Promise<void>;
  onLeaveRoom: () => void;
};

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  room,
  myPlayerId,
  isHost,
  isLoading,
  error,
  onStartGame,
  onLeaveRoom,
}) => {
  const playersList = Array.from(room.players.values());

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header strip */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center px-4">
        <h1 className="flex-1 text-center text-xl font-bold">Room {room.meta.roomCode}</h1>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-8">
        {/* Error display */}
        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200"
          >
            {error}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" />
            <span>Starting game...</span>
          </div>
        )}

        {/* Game Settings */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4">Game Settings</h2>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Difficulty</p>
              <p className="font-semibold capitalize">{room.meta.difficulty}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Word Length</p>
              <p className="font-semibold">{room.meta.wordLength} letters</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Timer</p>
              <p className="font-semibold">{room.meta.durationMs / 1000}s</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Players</p>
              <p className="font-semibold">{room.players.size} joined</p>
            </div>
          </div>
        </section>

        {/* Player List */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4">Players</h2>
          <div className="space-y-2">
            {playersList.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {player.name}
                      {player.id === myPlayerId && ' (You)'}
                    </p>
                    {player.id === myPlayerId && isHost && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Host</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Status Message */}
        {!isHost && (
          <div className="mb-8 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-200">
            Waiting for host to start the game...
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          {isHost && (
            <button
              onClick={onStartGame}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold transition-colors hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
            >
              {isLoading ? 'Starting...' : 'Start Game'}
            </button>
          )}

          <button
            onClick={onLeaveRoom}
            disabled={isLoading}
            className={`${
              isHost ? 'flex-0 px-6' : 'flex-1'
            } py-3 px-4 rounded-lg border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 disabled:border-gray-300 dark:disabled:border-gray-700 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none`}
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};
