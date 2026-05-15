import React, { useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useBlitzRoom } from './useBlitzRoom';
import { BlitzEntry } from './components/BlitzEntry';
import { CreateRoomForm } from './components/CreateRoomForm';
import { JoinRoomForm } from './components/JoinRoomForm';
import { WaitingRoom } from './components/WaitingRoom';
import { CountdownOverlay } from './components/CountdownOverlay';
import { BlitzGameScreen } from './components/BlitzGameScreen';
import { BlitzResultsScreen } from './components/BlitzResultsScreen';
import { BlitzRoomSettings, RoomCode } from './types';

export const BlitzPage: React.FC = () => {
  const navigate = useNavigate();
  const blitzState = useBlitzRoom();
  const { room, error, isLoading, clearError, createRoom, joinRoom, leaveRoom, startGame } = blitzState;

  // Set page title
  useEffect(() => {
    document.title = 'Blitz — Word Ladder';
  }, []);

  // Handlers for form navigation
  const handleCreateRoomCancel = useCallback(() => {
    navigate('/blitz');
  }, [navigate]);

  const handleJoinRoomCancel = useCallback(() => {
    navigate('/blitz');
  }, [navigate]);

  const handleCreateRoom = useCallback(
    async (displayName: string, settings: BlitzRoomSettings) => {
      const code = await createRoom(displayName, settings);
      // subscription will trigger room state update
    },
    [createRoom]
  );

  const handleJoinRoom = useCallback(
    async (displayName: string, code: RoomCode) => {
      await joinRoom(code, displayName);
      // subscription will trigger room state update
    },
    [joinRoom]
  );

  const handleLeaveRoom = useCallback(async () => {
    await leaveRoom();
    navigate('/blitz');
  }, [leaveRoom, navigate]);

  const handleStartGame = useCallback(async () => {
    await startGame();
  }, [startGame]);

  // Render error state wrapper
  const renderError = (message: string, code?: string) => (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">
          Error: {code || 'ERROR'}
        </h2>
        <p className="text-red-800 dark:text-red-300 mb-4">{message}</p>
        <button
          onClick={clearError}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  // Render loading state
  const renderLoading = () => (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
        <p className="text-lg font-medium">Loading...</p>
      </div>
    </div>
  );

  // Render game content based on phase
  const renderGameContent = () => {
    if (!room) return null;

    const phase = room.currentPhase;
    const errorMessage = error ? error.message : null;

    if (phase === 'lobby') {
      // Validate myPlayerId exists before rendering
      if (!blitzState.myPlayerId) {
        return renderError('Player ID not initialized', 'PLAYER_ID_NOT_SET');
      }

      return (
        <WaitingRoom
          room={room}
          myPlayerId={blitzState.myPlayerId}
          isHost={blitzState.isHost}
          isLoading={isLoading}
          error={errorMessage}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
      );
    }

    if (phase === 'countdown') {
      // Validate startedAt exists before rendering
      if (!room.meta.startedAt) {
        return renderError('Game start time not set', 'GAME_START_TIME_NOT_SET');
      }

      return (
        <>
          <CountdownOverlay startTime={room.meta.startedAt} />
          <BlitzGameScreen onGameEnd={handleLeaveRoom} />
        </>
      );
    }

    if (phase === 'playing') {
      return <BlitzGameScreen onGameEnd={handleLeaveRoom} />;
    }

    if (phase === 'finished') {
      return <BlitzResultsScreen onLeaveRoom={handleLeaveRoom} />;
    }

    // Exhaustive error handling for unknown phases
    return renderError(`Unknown game phase: ${phase}`, 'UNKNOWN_PHASE');
  };

  // Handle top-level error state
  if (error) {
    return renderError(error.message, error.code);
  }

  // Handle loading state
  if (isLoading) {
    return renderLoading();
  }

  // If room exists, show game content (no route-based switching)
  if (room !== null) {
    return <>{renderGameContent()}</>;
  }

  // No room: use nested Routes for idle phase navigation
  const errorMessage = null; // error already handled above

  return (
    <Routes>
      <Route index element={
        <BlitzEntry
          isLoading={isLoading}
          error={errorMessage}
          onCreateRoom={() => navigate('create')}
          onJoinRoom={() => navigate('join')}
        />
      } />
      <Route path="create" element={
        <CreateRoomForm
          isLoading={isLoading}
          error={errorMessage}
          onCreateRoom={handleCreateRoom}
          onCancel={handleCreateRoomCancel}
        />
      } />
      <Route path="join" element={
        <JoinRoomForm
          isLoading={isLoading}
          error={errorMessage}
          onJoinRoom={handleJoinRoom}
          onCancel={handleJoinRoomCancel}
        />
      } />
    </Routes>
  );
};

export default BlitzPage;
