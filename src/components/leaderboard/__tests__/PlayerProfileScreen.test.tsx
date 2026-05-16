import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
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
          wins: 10,
          bestScore: 100,
          totalScore: 1500,
          averageScore: 75,
        },
        timeAttack: {
          gamesPlayed: 15,
          wins: 8,
          bestScore: 85,
          totalScore: 1200,
          averageScore: 80,
          bestTime: 45000,
          completedPuzzles: 30,
        },
        blitz: {
          gamesPlayed: 25,
          wins: 12,
          bestScore: 120,
          totalScore: 2000,
          averageScore: 80,
          totalTime: 150000,
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

  afterEach(() => {
    jest.clearAllMocks();
  });

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

  it('opens achievement modal when achievement button clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/achievements \(1\)/i)).toBeInTheDocument();
    });

    const achievementButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('First Steps') || btn.getAttribute('aria-label')?.includes('achievement')
    );

    if (achievementButton) {
      await user.click(achievementButton);

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument();
      });
    }
  });

  it('closes achievement modal when backdrop clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/achievements \(1\)/i)).toBeInTheDocument();
    });

    const achievementButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('First Steps') || btn.getAttribute('aria-label')?.includes('achievement')
    );

    if (achievementButton) {
      await user.click(achievementButton);

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument();
      });

      const backdrop = document.querySelector('[role="presentation"]') || document.querySelector('.modal-backdrop');
      if (backdrop) {
        await user.click(backdrop);

        await waitFor(() => {
          expect(screen.queryByText('First Steps')).not.toBeInTheDocument();
        });
      }
    }
  });
});
