import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { ComponentsPreview } from './pages/ComponentsPreview';
import { ProgressionPage } from './pages/ProgressionPage';
import { LevelUpProvider } from './components/economy/LevelUpProvider';

// Lazy load game mode pages
const PuzzleLibraryMode = lazy(() => import('./features/classic/PuzzleLibraryMode').then(m => ({ default: m.PuzzleLibraryMode })));
const TimeAttackPage = lazy(() => import('./features/timeAttack/pages/TimeAttackPage'));
const BlitzPage = lazy(() => import('./features/blitz/BlitzPage'));

// Lazy load leaderboard screens
const PlayerProfileScreen = lazy(() => import('./components/leaderboard/PlayerProfileScreen'));
const LeaderboardScreen = lazy(() => import('./components/leaderboard/LeaderboardScreen'));
const AchievementsScreen = lazy(() => import('./components/leaderboard/AchievementsScreen'));

// Lazy load shop
const ShopPage = lazy(() => import('./pages/ShopPage'));

const GameLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="text-lg font-semibold mb-2">Loading game...</div>
      <div className="animate-spin inline-block">⏳</div>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LevelUpProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/progression" element={<ProgressionPage />} />
          <Route
            path="/puzzle-library"
            element={
              <Suspense fallback={<GameLoadingFallback />}>
                <PuzzleLibraryMode />
              </Suspense>
            }
          />
          <Route
            path="/play/time-attack"
            element={
              <Suspense fallback={<GameLoadingFallback />}>
                <TimeAttackPage />
              </Suspense>
            }
          />
          <Route
            path="/blitz/*"
            element={
              <Suspense fallback={<GameLoadingFallback />}>
                <BlitzPage />
              </Suspense>
            }
          />
          <Route path="/_preview" element={<ComponentsPreview />} />
          <Route
            path="/profile/:userId"
            element={
              <Suspense fallback={<GameLoadingFallback />}>
                <PlayerProfileScreen />
              </Suspense>
            }
          />
          <Route
            path="/leaderboards"
            element={
              <Suspense fallback={<GameLoadingFallback />}>
                <LeaderboardScreen />
              </Suspense>
            }
          />
          <Route
            path="/achievements"
            element={
              <Suspense fallback={<GameLoadingFallback />}>
                <AchievementsScreen earnedAchievements={[]} />
              </Suspense>
            }
          />
          <Route
            path="/shop"
            element={
              <Suspense fallback={<GameLoadingFallback />}>
                <ShopPage />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LevelUpProvider>
    </BrowserRouter>
  );
};
