import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useBlitzRoom } from '../useBlitzRoom';
import { useEconomy } from '../../../lib/economy';
import { useLevelUpQueue } from '../../../components/economy/LevelUpProvider';
import { calculateBlitzCoins as calculatePlacementCoins } from '../../../lib/economy/coinEarning';
import { calculateBlitzXP } from '../economy';
import type { BlitzPlayer, PlayerId } from '../types';
import { FirebaseLeaderboardAdapter } from '../../../lib/leaderboard/sync/FirebaseLeaderboardAdapter';
import type { GameResult } from '../../../lib/leaderboard/types';
import { Timestamp } from 'firebase/firestore';
import { addConsumable, loadInventory, saveInventory } from '../../../lib/economy/inventory';

export type BlitzResultsScreenProps = {
  /** Optional callback when leaving room */
  onLeaveRoom?: () => void;
};

/**
 * Get or create a user ID for leaderboard tracking
 */
const getUserId = (): string => {
  const stored = localStorage.getItem('wordladder-user-id');
  if (stored) return stored;
  const id = `user-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('wordladder-user-id', id);
  return id;
};

/**
 * Get player's placement in final rankings
 */
const getPlayerPlacement = (players: Map<PlayerId, BlitzPlayer>, playerId: PlayerId): number => {
  const sortedPlayers = [...players.values()].sort((a, b) => b.score - a.score);
  return sortedPlayers.findIndex((p) => p.id === playerId) + 1;
};

/**
 * Results screen displayed after a Blitz game ends.
 *
 * Features:
 * - Displays "Game Over" or "You Won!" based on current player's rank
 * - Shows confetti animation on mount
 * - Displays final leaderboard with all players sorted by score
 * - Shows medal icons (🥇🥈🥉) for top 3 players
 * - Highlights current player's row
 * - "Play Again" button (host only) resets to lobby
 * - "Leave Room" button (all players) exits the game
 * - "Home" button (all players) navigates to home
 * - Loading states and error handling
 * - Responsive design (desktop + mobile)
 */
export const BlitzResultsScreen = ({ onLeaveRoom }: BlitzResultsScreenProps): React.ReactElement | null => {
  const navigate = useNavigate();
  const room = useBlitzRoom();
  const economy = useEconomy();
  const { push: pushLevelUpRewards } = useLevelUpQueue();

  const [showConfetti, setShowConfetti] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);

  // Ref to track current room without causing re-renders
  const roomRef = useRef(room);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // Auto-hide confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Calculate and apply economy rewards on mount
  useEffect(() => {
    if (!room.room || !room.me) return;

    const me = room.me;

    // Get player's placement based on final rankings
    const sortedPlayers = [...room.room.players.values()].sort((a, b) => b.score - a.score);
    const placement = sortedPlayers.findIndex((p) => p.id === me.id) + 1;

    // Calculate placement-based coins (not puzzle-completion based)
    const coins = calculatePlacementCoins(placement);

    const xp = calculateBlitzXP({
      solved: me.solved,
      wrong: me.wrong,
      hints: me.hints,
      score: me.score,
      difficulty: room.room.meta.difficulty,
    });

    // Apply rewards
    economy.earnCoins(coins, 'blitz_win');
    const xpResult = economy.addXp(xp, 'blitz_win');

    // Award time extension for winning Blitz
    if (placement === 1) {
      const inventory = loadInventory();
      const updatedInventory = addConsumable(inventory, 'time_extension_15s', 1);
      saveInventory(updatedInventory);
      console.log('Victory bonus! +1 Time Extension ⏱️');
    }

    // Store for display
    setEarnedCoins(coins);
    setEarnedXP(xp);
    setLeveledUp(xpResult.leveledUp);

    // Trigger level-up modal if leveled up
    if (xpResult.leveledUp) {
      pushLevelUpRewards(xpResult.rewards);
    }
  }, [room.room, room.me, economy, pushLevelUpRewards]);

  // Record game result to leaderboard on mount
  useEffect(() => {
    if (!room.room || !room.me) return;

    const recordLeaderboardResult = async () => {
      try {
        const leaderboardAdapter = new FirebaseLeaderboardAdapter();
        await leaderboardAdapter.initialize();

        if (!room.room || !room.me) {
          console.error('Cannot record blitz result: room or player not available');
          return;
        }

        const userId = getUserId();
        const placement = getPlayerPlacement(room.room.players, room.me.id);
        const duration = room.room.meta.endedAt
          ? room.room.meta.endedAt - (room.room.meta.startedAt || 0)
          : 0;

        const result: GameResult = {
          userId,
          mode: 'blitz',
          score: room.me.score,
          solved: room.me.solved > 0,
          wrong: room.me.wrong,
          duration,
          difficulty: room.room.meta.difficulty,
          wordLength: room.room.meta.wordLength,
          placement,
          totalPlayers: room.room.players.size,
          timestamp: Timestamp.now(),
        };

        await leaderboardAdapter.recordGameResult(userId, result);

        // Check for newly unlocked achievements
        const newAchievements = await leaderboardAdapter.checkAndGrantAchievements(userId);
        if (newAchievements && newAchievements.length > 0) {
          // Display achievement notifications
          newAchievements.forEach(achievementId => {
            console.log(`Achievement unlocked: ${achievementId}`);
          });

          // Award coins from achievement rewards
          const achievements = await leaderboardAdapter.getAchievements();
          let totalCoinsEarned = 0;
          for (const achievementId of newAchievements) {
            const config = achievements.find(a => a.id === achievementId);
            if (config?.reward?.coins) {
              totalCoinsEarned += config.reward.coins;
            }
          }
          if (totalCoinsEarned > 0) {
            economy.earnCoins(totalCoinsEarned, 'achievement');
          }
        }
      } catch (err) {
        console.error('Failed to record blitz result or check achievements:', err);
      }
    };

    recordLeaderboardResult();
  }, [room.room, room.me, economy]);

  // Get current player's final rank
  const finalRank = useMemo(() => {
    if (!room.room || !room.me) return null;

    const sortedPlayers = [...room.room.players.values()].sort((a, b) => b.score - a.score);
    return sortedPlayers.findIndex((p) => p.id === room.me!.id) + 1;
  }, [room.room, room.me]);

  // Get total players
  const totalPlayers = useMemo(() => {
    return room.room?.players.size ?? 0;
  }, [room.room]);

  // Sorted players for leaderboard
  const sortedPlayers = useMemo(() => {
    if (!room.room) return [];
    return [...room.room.players.values()].sort((a, b) => b.score - a.score);
  }, [room.room]);

  /**
   * Handle Play Again button click
   */
  const handlePlayAgain = useCallback(async () => {
    setIsProcessing(true);
    setLocalError(null);

    try {
      const success = await roomRef.current.playAgain();
      if (!success && roomRef.current.error) {
        setLocalError(roomRef.current.error.message);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to play again');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Handle Leave Room button click
   */
  const handleLeaveRoom = useCallback(async () => {
    setIsProcessing(true);
    setLocalError(null);

    try {
      await roomRef.current.leaveRoom();
      onLeaveRoom?.();
      navigate('/');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to leave room');
    } finally {
      setIsProcessing(false);
    }
  }, [onLeaveRoom, navigate]);

  /**
   * Handle Home button click
   */
  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  /**
   * Get medal emoji for rank
   */
  const getMedal = (rank: number): string => {
    if (rank === 1) return '🥇 ';
    if (rank === 2) return '🥈 ';
    if (rank === 3) return '🥉 ';
    return '';
  };

  // Loading state
  if (!room.room || !room.me) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400">Loading results...</p>
      </div>
    );
  }

  const isWinner = finalRank === 1;

  return (
    <div
      data-testid="results-container"
      className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 overflow-auto"
    >
      {/* Confetti animation */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          gravity={0.4}
          wind={0}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      {/* Main content container */}
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1
            className={`
              text-5xl md:text-6xl font-bold tracking-tight
              transition-colors duration-300
            `}
          >
            {isWinner ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 dark:from-yellow-300 dark:to-yellow-500">
                You Won!
              </span>
            ) : (
              <span className="text-gray-800 dark:text-gray-100">Game Over</span>
            )}
          </h1>

          {/* Final score */}
          <div className="space-y-2">
            <p className="text-lg text-gray-600 dark:text-gray-400">Your Final Score</p>
            <p className="text-5xl font-bold text-blue-600 dark:text-blue-400">{room.me.score}</p>
          </div>

          {/* Rank message */}
          {finalRank && (
            <p className="text-xl text-gray-700 dark:text-gray-300 font-semibold">
              You placed #{finalRank} out of {totalPlayers}
            </p>
          )}
        </div>

        {/* Error message */}
        {(localError || room.error) && (
          <div
            className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="text-red-700 dark:text-red-400">
              {localError || room.error?.message}
            </p>
          </div>
        )}

        {/* Final Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Final Rankings
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Final leaderboard rankings">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <th scope="col" className="font-semibold text-gray-600 dark:text-gray-400 pb-3">
                    Rank
                  </th>
                  <th scope="col" className="font-semibold text-gray-600 dark:text-gray-400 pb-3">
                    Player
                  </th>
                  <th scope="col" className="font-semibold text-gray-600 dark:text-gray-400 pb-3 text-right">
                    Score
                  </th>
                  <th scope="col" className="font-semibold text-gray-600 dark:text-gray-400 pb-3 text-right">
                    Solved
                  </th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {sortedPlayers.map((player, index) => {
                  const rank = index + 1;
                  const isCurrentPlayer = player.id === room.me!.id;

                  return (
                    <tr
                      key={player.id}
                      data-testid={`leaderboard-row-${player.id}`}
                      className={`
                        transition-colors py-3 px-3 rounded
                        ${
                          isCurrentPlayer
                            ? 'bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-600'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }
                      `}
                    >
                      <td className="font-bold text-gray-700 dark:text-gray-300 w-12">
                        {getMedal(rank)}
                        {rank}.
                      </td>
                      <td className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                        {player.name}
                      </td>
                      <td className="text-right font-bold text-gray-800 dark:text-gray-100">
                        {player.score}
                      </td>
                      <td className="text-right font-bold text-gray-800 dark:text-gray-100">
                        {player.solved}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="mt-8 rounded-lg bg-blue-50 dark:bg-blue-900 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Earnings Summary</h3>
          <div className="flex gap-8 flex-wrap">
            <div className="coin-reward flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
              <span>💰</span>
              <span>+{earnedCoins} coins</span>
            </div>
            <div className="xp-reward flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
              <span>⭐</span>
              <span>+{earnedXP} XP</span>
            </div>
          </div>
          {leveledUp && (
            <div className="mt-4 p-3 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 font-semibold">
              🎉 Congratulations! You reached level {economy.level}!
            </div>
          )}
        </div>

        {/* Button group */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Play Again button (host only) */}
          {room.isHost && (
            <button
              onClick={handlePlayAgain}
              disabled={isProcessing || room.isLoading}
              className="
                px-6 py-3 rounded-lg font-semibold
                bg-blue-500 hover:bg-blue-600 text-white
                dark:bg-blue-600 dark:hover:bg-blue-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                dark:focus:ring-offset-gray-900
              "
            >
              {isProcessing ? 'Loading...' : 'Play Again'}
            </button>
          )}

          {/* Leave Room button */}
          <button
            onClick={handleLeaveRoom}
            disabled={isProcessing || room.isLoading}
            className="
              px-6 py-3 rounded-lg font-semibold
              bg-red-500 hover:bg-red-600 text-white
              dark:bg-red-600 dark:hover:bg-red-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              dark:focus:ring-offset-gray-900
            "
          >
            {isProcessing ? 'Loading...' : 'Leave Room'}
          </button>

          {/* Home button */}
          <button
            onClick={handleHome}
            disabled={isProcessing || room.isLoading}
            className="
              px-6 py-3 rounded-lg font-semibold
              bg-gray-600 hover:bg-gray-700 text-white
              dark:bg-gray-700 dark:hover:bg-gray-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              dark:focus:ring-offset-gray-900
            "
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};
