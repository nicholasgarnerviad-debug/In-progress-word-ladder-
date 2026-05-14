import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { ClassicGame } from './ClassicGame';
import { ComponentsPreview } from './pages/ComponentsPreview';
import { TimeAttackPage } from './features/timeAttack/pages/TimeAttackPage';
import { BlitzPage } from './features/blitz/BlitzPage';
import { LevelUpProvider } from './components/economy/LevelUpProvider';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LevelUpProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/play/classic" element={<ClassicGame />} />
          <Route path="/play/time-attack" element={<TimeAttackPage />} />
          <Route path="/blitz/*" element={<BlitzPage />} />
          <Route path="/_preview" element={<ComponentsPreview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LevelUpProvider>
    </BrowserRouter>
  );
};
