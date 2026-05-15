// src/components/leaderboard/PlayerProfileScreen.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { PlayerProfile } from '../../lib/leaderboard/types';
import { FirebaseLeaderboardAdapter } from '../../lib/leaderboard/sync/FirebaseLeaderboardAdapter';

const adapter = new FirebaseLeaderboardAdapter();

export const PlayerProfileScreen: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    adapter.initialize().then(async () => {
      try {
        const p = await adapter.getPlayerProfile(userId);
        setProfile(p);
      } catch (err) {
        setError(`Failed to load profile: ${err}`);
      } finally {
        setLoading(false);
      }
    });
  }, [userId]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!profile) return <div className="p-8">Profile not found</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-2xl">
              {profile.avatar || profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Joined {new Date(profile.joinedAt.toDate()).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Games</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{profile.totalGames}</div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Score</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{profile.totalScore}</div>
          </div>
        </div>

        {/* Mode Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Mode Stats</h2>
          <div className="space-y-4">
            {Object.entries(profile.stats).map(([mode, stats]) => {
              const modeStats = stats as any;
              const formatTime = (ms: number) => {
                const totalSeconds = Math.floor(ms / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                if (hours > 0) {
                  return `${hours}h ${minutes}m ${seconds}s`;
                } else if (minutes > 0) {
                  return `${minutes}m ${seconds}s`;
                } else {
                  return `${seconds}s`;
                }
              };

              return (
                <div key={mode} className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 capitalize">{mode}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Games:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{modeStats.gamesPlayed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Best Score:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{modeStats.bestScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Score:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{modeStats.totalScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Average:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{modeStats.averageScore.toFixed(1)}</span>
                    </div>
                    {modeStats.wins !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Wins:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{modeStats.wins}</span>
                      </div>
                    )}
                    {modeStats.totalTime !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Time:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{formatTime(modeStats.totalTime)}</span>
                      </div>
                    )}
                    {modeStats.bestTime !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Best Time:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{formatTime(modeStats.bestTime)}</span>
                      </div>
                    )}
                    {modeStats.completedPuzzles !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{modeStats.completedPuzzles}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Achievements ({profile.achievements.length})</h2>
          <div className="grid grid-cols-4 gap-2">
            {profile.achievements.map((achievementId) => (
              <div key={achievementId} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                <div className="text-3xl mb-1">🏆</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{achievementId}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/leaderboards')}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            View Leaderboards
          </button>
          <button
            onClick={() => navigate('/achievements')}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            View All Achievements
          </button>
        </div>
      </div>
    </div>
  );
};
