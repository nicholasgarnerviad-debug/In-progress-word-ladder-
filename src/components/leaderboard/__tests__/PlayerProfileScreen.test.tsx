import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import * as ReactRouter from 'react-router-dom';
import { PlayerProfileScreen } from '../PlayerProfileScreen';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ userId: 'user123' }),
}));

jest.mock('../../../lib/leaderboard/sync/FirebaseLeaderboardAdapter', () => ({
  FirebaseLeaderboardAdapter: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    getPlayerProfile: jest.fn().mockResolvedValue({
      userId: 'user123',
      name: 'Test Player',
      avatar: 'T',
      joinedAt: { toDate: () => new Date('2026-01-01') },
      level: 5,
      xp: 1250,
      totalGames: 42,
      totalScore: 2500,
      stats: {
        classic: {
          gamesPlayed: 20,
          bestScore: 100,
          totalScore: 1500,
          averageScore: 75,
        },
      },
      achievements: ['firstGame'],
    }),
  })),
}));

jest.mock('../../../lib/leaderboard/achievements/achievements', () => ({
  getAllAchievements: jest.fn(() => [
    {
      id: 'firstGame',
      title: 'First Steps',
      description: 'Play your first game',
      icon: '🎮',
      rarity: 'common',
      reward: { xp: 10, coins: 25 },
      criteria: { type: 'gameCount', value: 1 },
    },
  ]),
}));

describe('PlayerProfileScreen', () => {
  const renderWithRouter = () => {
    return render(
      <BrowserRouter>
        <PlayerProfileScreen />
      </BrowserRouter>
    );
  };

  it('displays player level', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText(/current level/i)).toBeInTheDocument();
    });
  });

  it('displays XP progress', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/1250 xp/i)).toBeInTheDocument();
    });
  });

  it('displays achievement count', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/achievements \(1\)/i)).toBeInTheDocument();
    });
  });
});
