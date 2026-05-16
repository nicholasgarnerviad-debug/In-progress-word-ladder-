// src/components/leaderboard/PlayerProfileScreen.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { PlayerProfile, AchievementConfig } from '../../lib/leaderboard/types';
import { FirebaseLeaderboardAdapter } from '../../lib/leaderboard/sync/FirebaseLeaderboardAdapter';
import { AchievementModal } from './AchievementModal';
import { getAllAchievements } from '../../lib/leaderboard/achievements/achievements';
import { Timestamp } from 'firebase/firestore';

const adapter = new FirebaseLeaderboardAdapter();

function createDefaultProfile(userId: string): PlayerProfile {
  return {
    userId,
    name: userId.replace(/^user-/, '').substring(0, 12),
    joinedAt: Timestamp.now(),
    level: 1,
    xp: 0,
    totalGames: 0,
    totalScore: 0,
    stats: {
      classic: { gamesPlayed: 0, bestScore: 0, totalScore: 0, averageScore: 0, wins: 0 },
      timeAttack: { gamesPlayed: 0, bestScore: 0, totalScore: 0, averageScore: 0, bestTime: 0, completedPuzzles: 0 },
      blitz: { gamesPlayed: 0, bestScore: 0, totalScore: 0, averageScore: 0, wins: 0, totalTime: 0 },
    },
    achievements: [],
  };
}

export const PlayerProfileScreen: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
  const [achievementMap, setAchievementMap] = useState<Record<string, AchievementConfig>>({});

  useEffect(() => {
    if (!userId) return;

    adapter.initialize().then(async () => {
      try {
        const p = await adapter.getPlayerProfile(userId);
        setProfile(p);
      } catch (err) {
        // If profile doesn't exist, create a default one
        if (err instanceof Error && err.message.includes('PROFILE_NOT_FOUND')) {
          const defaultProfile = createDefaultProfile(userId);
          setProfile(defaultProfile);
        } else {
          setError(`Failed to load profile: ${err}`);
        }
      } finally {
        setLoading(false);
      }
    });
  }, [userId]);

  useEffect(() => {
    const achievements = getAllAchievements();
    const map: Record<string, AchievementConfig> = {};
    achievements.forEach((achievement) => {
      map[achievement.id] = achievement;
    });
    setAchievementMap(map);
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-900 dark:text-white">Loading...</div>;
  if (error) return <div className="p-8 text-red-500 dark:text-red-400">{error}</div>;
  if (!profile) return <div className="p-8 text-gray-900 dark:text-white">Profile not found</div>;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-6 md:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 border-b border-gray-200 dark:border-gray-700 pb-4 md:pb-6">
          <div className="flex items-center gap-3 md:gap-4 mb-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-xl md:text-2xl flex-shrink-0">
              {profile.avatar || profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">{profile.name}</h1>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Joined {new Date(profile.joinedAt.toDate()).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Level Display */}
        <div className="mb-6 md:mb-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
              {profile.level}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Current Level</p>
          </div>

          {/* XP Bar */}
          <div className="mb-4">
            <div className="relative w-full bg-gray-300 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-500 dark:bg-blue-400 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (profile.xp % 300) / 3)}%` }}
                role="progressbar"
                aria-valuenow={Math.min(100, (profile.xp % 300) / 3)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
              {profile.xp} XP
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Total Games</div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1 md:mt-2">{profile.totalGames}</div>
          </div>
          <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Total Score</div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1 md:mt-2">{profile.totalScore}</div>
          </div>
        </div>

        {/* Mode Stats */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">Mode Stats</h2>
          <div className="space-y-3 md:space-y-4">
            {Object.entries(profile.stats).map(([mode, stats]) => {
              const modeStats = stats;
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
                <div key={mode} className="p-3 md:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 md:mb-3 capitalize text-sm md:text-base">{mode}</h3>
                  <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                    <div className="flex justify-between min-h-[32px] md:min-h-[36px] items-center">
                      <span className="text-gray-600 dark:text-gray-400">Games:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{modeStats.gamesPlayed}</span>
                    </div>
                    <div className="flex justify-between min-h-[32px] md:min-h-[36px] items-center">
                      <span className="text-gray-600 dark:text-gray-400">Best Score:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{modeStats.bestScore}</span>
                    </div>
                    <div className="flex justify-between min-h-[32px] md:min-h-[36px] items-center">
                      <span className="text-gray-600 dark:text-gray-400">Total Score:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{modeStats.totalScore}</span>
                    </div>
                    <div className="flex justify-between min-h-[32px] md:min-h-[36px] items-center">
                      <span className="text-gray-600 dark:text-gray-400">Average:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{modeStats.averageScore.toFixed(1)}</span>
                    </div>
                    {modeStats.wins !== undefined && (
                      <div className="flex justify-between min-h-[32px] md:min-h-[36px] items-center">
                        <span className="text-gray-600 dark:text-gray-400">Wins:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{modeStats.wins}</span>
                      </div>
                    )}
                    {'totalTime' in modeStats && (
                      <div className="flex justify-between min-h-[32px] md:min-h-[36px] items-center">
                        <span className="text-gray-600 dark:text-gray-400">Total Time:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{formatTime((modeStats as any).totalTime)}</span>
                      </div>
                    )}
                    {'bestTime' in modeStats && (
                      <div className="flex justify-between min-h-[32px] md:min-h-[36px] items-center">
                        <span className="text-gray-600 dark:text-gray-400">Best Time:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{formatTime((modeStats as any).bestTime)}</span>
                      </div>
                    )}
                    {'completedPuzzles' in modeStats && (
                      <div className="flex justify-between min-h-[32px] md:min-h-[36px] items-center">
                        <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{(modeStats as any).completedPuzzles}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
            Achievements ({profile.achievements.length})
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 md:gap-3">
            {profile.achievements.map((achievementId) => (
              <button
                key={achievementId}
                onClick={() => setSelectedAchievementId(achievementId)}
                className="p-2 md:p-3 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded-lg text-center min-h-[70px] md:min-h-[90px] flex flex-col items-center justify-center transition-colors cursor-pointer"
                title={achievementId}
              >
                <div className="text-2xl md:text-3xl mb-1">🏆</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 break-words line-clamp-1 hover:line-clamp-2">
                  {achievementId}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Achievement Modal */}
        {selectedAchievementId && achievementMap[selectedAchievementId] && (
          <AchievementModal
            achievement={achievementMap[selectedAchievementId]}
            isEarned={true}
            onClose={() => setSelectedAchievementId(null)}
          />
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <button
            onClick={() => navigate('/leaderboards')}
            className="flex-1 px-4 py-2.5 md:py-3 min-h-[44px] md:min-h-[48px] bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            View Leaderboards
          </button>
          <button
            onClick={() => navigate('/achievements')}
            className="flex-1 px-4 py-2.5 md:py-3 min-h-[44px] md:min-h-[48px] bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            View All Achievements
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfileScreen;
