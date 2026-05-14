import React, { useState } from 'react';
import type { RoomCode } from '../types';
import { createRoomCode } from '../types';

export type JoinRoomFormProps = {
  isLoading: boolean;
  error: string | null;
  onJoinRoom: (displayName: string, roomCode: RoomCode) => Promise<void>;
  onCancel: () => void;
};

export const JoinRoomForm: React.FC<JoinRoomFormProps> = ({
  isLoading,
  error,
  onJoinRoom,
  onCancel,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const isFormValid = displayName.trim().length > 0 && roomCode.trim().length === 6;

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    setRoomCode(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      const code = createRoomCode(roomCode.trim());
      await onJoinRoom(displayName.trim(), code);
      setDisplayName('');
      setRoomCode('');
    } catch (err) {
      // Error is handled by parent component
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header strip */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center px-4">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none -ml-2"
          aria-label="Back"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-600 dark:text-gray-400"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">Join Room</h1>
        <div className="w-12" />
      </div>

      {/* Main content */}
      <div className="max-w-md mx-auto px-4 pt-6 pb-8">
        {/* Error display */}
        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your name"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
            />
          </div>

          {/* Room Code */}
          <div>
            <label
              htmlFor="roomCode"
              className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
            >
              Room Code
            </label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={handleRoomCodeChange}
              disabled={isLoading}
              placeholder="XXXXXX"
              maxLength={6}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none font-mono text-center text-lg tracking-widest"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {roomCode.length}/6 characters
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-lg border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 disabled:border-gray-300 dark:disabled:border-gray-700 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="flex-1 py-3 px-4 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold transition-colors hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
            >
              {isLoading ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
