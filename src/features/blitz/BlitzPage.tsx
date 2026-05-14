import React, { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBlitzRoom } from './useBlitzRoom';
import { BlitzEntry } from './components/BlitzEntry';
import { CreateRoomForm } from './components/CreateRoomForm';
import { JoinRoomForm } from './components/JoinRoomForm';
import { WaitingRoom } from './components/WaitingRoom';
import { CountdownOverlay } from './components/CountdownOverlay';
import { BlitzGameScreen } from './components/BlitzGameScreen';
import { BlitzResultsScreen } from './components/BlitzResultsScreen';

export const BlitzPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    async (displayName: string, settings: any) => {
      const code = await createRoom(displayName, settings);
      // subscription will trigger room state update
    },
    [createRoom]
  );

  const handleJoinRoom = useCallback(
    async (displayName: string, code: any) => {
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

  // Determine which screen to render based on phase + route
  const renderContent = () => {
    const errorMessage = error ? error.message : null;

    // Error state
    if (error) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">
              Error: {error.code}
            </h2>
            <p className="text-red-800 dark:text-red-300 mb-4">{error.message}</p>
            <button
              onClick={clearError}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    // Loading state
    if (isLoading) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
            <p className="text-lg font-medium">Loading...</p>
          </div>
        </div>
      );
    }

    // No room (idle phase) - show screens based on route
    if (room === null) {

      // CreateRoomForm
      if (location.pathname === '/blitz/create') {
        return (
          <CreateRoomForm
            isLoading={isLoading}
            error={errorMessage}
            onCreateRoom={handleCreateRoom}
            onCancel={handleCreateRoomCancel}
          />
        );
      }

      // JoinRoomForm
      if (location.pathname === '/blitz/join') {
        return (
          <JoinRoomForm
            isLoading={isLoading}
            error={errorMessage}
            onJoinRoom={handleJoinRoom}
            onCancel={handleJoinRoomCancel}
          />
        );
      }

      // Default to BlitzEntry
      return (
        <BlitzEntry
          isLoading={isLoading}
          error={errorMessage}
          onCreateRoom={() => navigate('/blitz/create')}
          onJoinRoom={() => navigate('/blitz/join')}
        />
      );
    }

    // Room exists - show screens based on phase
    const phase = room.currentPhase;

    if (phase === 'lobby') {
      return (
        <WaitingRoom
          room={room}
          myPlayerId={blitzState.myPlayerId!}
          isHost={blitzState.isHost}
          isLoading={isLoading}
          error={errorMessage}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
      );
    }

    if (phase === 'countdown') {
      return (
        <>
          <CountdownOverlay startTime={room.meta.startedAt!} />
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

    // Fallback - should never reach here if all phases are handled
    return null;
  };

  return <>{renderContent()}</>;
};
