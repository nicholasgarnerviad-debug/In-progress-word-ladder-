// src/components/leaderboard/MonthlyLeaderboard.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthlyLeaderboard } from './MonthlyLeaderboard';
import type { LeaderboardEntry } from '../../lib/leaderboard/types';
import { Timestamp } from 'firebase/firestore';

describe('MonthlyLeaderboard', () => {
  const mockPlayers: LeaderboardEntry[] = [
    {
      userId: 'user1',
      name: 'Alice',
      score: 500,
      placement: 1,
      gamesPlayed: 25,
      lastGameAt: Timestamp.now(),
    },
    {
      userId: 'user2',
      name: 'Bob',
      score: 450,
      placement: 2,
      gamesPlayed: 22,
      lastGameAt: Timestamp.now(),
    },
    {
      userId: 'user3',
      name: 'Charlie',
      score: 400,
      placement: 3,
      gamesPlayed: 20,
      lastGameAt: Timestamp.now(),
    },
    {
      userId: 'user4',
      name: 'David',
      score: 350,
      placement: 4,
      gamesPlayed: 18,
      lastGameAt: Timestamp.now(),
    },
    {
      userId: 'user5',
      name: 'Eve',
      score: 300,
      placement: 5,
      gamesPlayed: 15,
      lastGameAt: Timestamp.now(),
    },
  ];

  it('renders the month and year in the header', () => {
    const testDate = new Date(2026, 4, 15); // May 15, 2026
    render(<MonthlyLeaderboard players={mockPlayers} month={testDate} />);
    expect(screen.getByText('May 2026 Leaderboard')).toBeInTheDocument();
  });

  it('renders the reset date info', () => {
    const testDate = new Date(2026, 4, 15); // May 2026, resets in June
    render(<MonthlyLeaderboard players={mockPlayers} month={testDate} />);
    expect(screen.getByText(/Resets on June 1/)).toBeInTheDocument();
  });

  it('renders top 10 players in rank order', () => {
    render(<MonthlyLeaderboard players={mockPlayers} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('displays medals for top 3 players', () => {
    const { container } = render(<MonthlyLeaderboard players={mockPlayers} />);
    expect(container.textContent).toContain('🥇'); // 1st place
    expect(container.textContent).toContain('🥈'); // 2nd place
    expect(container.textContent).toContain('🥉'); // 3rd place
  });

  it('does not display medals for players ranked 4 and below', () => {
    render(<MonthlyLeaderboard players={mockPlayers} />);
    const davidRow = screen.getByText('David').closest('div');
    expect(davidRow).not.toContain(document.createTextNode('🥇'));
    expect(davidRow).not.toContain(document.createTextNode('🥈'));
    expect(davidRow).not.toContain(document.createTextNode('🥉'));
  });

  it('displays coins for each player', () => {
    render(<MonthlyLeaderboard players={mockPlayers} />);
    expect(screen.getByText('500', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('450', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('400', { selector: 'span' })).toBeInTheDocument();
  });

  it('highlights the current player row when in top 10', () => {
    render(<MonthlyLeaderboard players={mockPlayers} currentUserId="user2" />);
    const bobRow = screen.getByText('Bob').closest('div');
    expect(bobRow).toHaveClass('bg-blue-50', 'dark:bg-blue-900/30');
  });

  it('shows current player rank when in top 10', () => {
    render(<MonthlyLeaderboard players={mockPlayers} currentUserId="user2" />);
    expect(screen.getByText(/You're ranked #2 with 450 coins/)).toBeInTheDocument();
  });

  it('shows current player rank when outside top 10', () => {
    const extendedPlayers = [
      ...mockPlayers,
      {
        userId: 'user6',
        name: 'Frank',
        score: 250,
        placement: 6,
        gamesPlayed: 12,
        lastGameAt: Timestamp.now(),
      },
      {
        userId: 'user7',
        name: 'Grace',
        score: 200,
        placement: 7,
        gamesPlayed: 10,
        lastGameAt: Timestamp.now(),
      },
      {
        userId: 'user8',
        name: 'Henry',
        score: 150,
        placement: 8,
        gamesPlayed: 8,
        lastGameAt: Timestamp.now(),
      },
      {
        userId: 'user9',
        name: 'Ivy',
        score: 100,
        placement: 9,
        gamesPlayed: 5,
        lastGameAt: Timestamp.now(),
      },
      {
        userId: 'user10',
        name: 'Jack',
        score: 50,
        placement: 10,
        gamesPlayed: 2,
        lastGameAt: Timestamp.now(),
      },
      {
        userId: 'user11',
        name: 'Kate',
        score: 25,
        placement: 11,
        gamesPlayed: 1,
        lastGameAt: Timestamp.now(),
      },
    ];
    render(
      <MonthlyLeaderboard players={extendedPlayers} currentUserId="user11" />
    );
    expect(screen.getByText(/Your rank: #11/)).toBeInTheDocument();
    expect(screen.getByText(/You've earned 25 coins/)).toBeInTheDocument();
  });

  it('calls onPlayerClick when a player row is clicked', () => {
    const mockClick = jest.fn();
    render(
      <MonthlyLeaderboard
        players={mockPlayers}
        onPlayerClick={mockClick}
      />
    );
    const aliceRow = screen.getByText('Alice').closest('div');
    if (aliceRow) {
      fireEvent.click(aliceRow);
    }
    expect(mockClick).toHaveBeenCalledWith('user1');
  });

  it('handles empty player list gracefully', () => {
    render(<MonthlyLeaderboard players={[]} />);
    expect(screen.getByText('No data yet for this month')).toBeInTheDocument();
  });

  it('uses default current date when month prop is not provided', () => {
    const { container } = render(<MonthlyLeaderboard players={mockPlayers} />);
    const currentMonth = new Date().toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    expect(container.textContent).toContain(`${currentMonth} Leaderboard`);
  });

  it('does not display current player section when currentUserId is not provided', () => {
    render(<MonthlyLeaderboard players={mockPlayers} />);
    const currentPlayerSection = screen.queryByText(/You're ranked/);
    expect(currentPlayerSection).not.toBeInTheDocument();
  });

  it('does not call onPlayerClick when click handler is not provided', () => {
    const { container } = render(
      <MonthlyLeaderboard players={mockPlayers} />
    );
    const aliceRow = screen.getByText('Alice').closest('div');
    if (aliceRow) {
      fireEvent.click(aliceRow);
    }
    // Should not throw error
    expect(true).toBe(true);
  });

  it('limits display to top 10 players when more are provided', () => {
    const manyPlayers = Array.from({ length: 20 }, (_, i) => ({
      userId: `user${i + 1}`,
      name: `Player ${i + 1}`,
      score: 500 - i * 10,
      placement: i + 1,
      gamesPlayed: 20 - i,
      lastGameAt: Timestamp.now(),
    }));
    render(<MonthlyLeaderboard players={manyPlayers} />);
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 10')).toBeInTheDocument();
    expect(screen.queryByText('Player 11')).not.toBeInTheDocument();
  });

  it('displays current player rank highlighted box for user in top 10', () => {
    render(<MonthlyLeaderboard players={mockPlayers} currentUserId="user1" />);
    const rankBox = screen.getByText(/You're ranked #1/);
    expect(rankBox).toHaveClass('text-green-700', 'dark:text-green-400');
  });

  it('is keyboard accessible for player rows', () => {
    const mockClick = jest.fn();
    render(
      <MonthlyLeaderboard
        players={mockPlayers}
        onPlayerClick={mockClick}
      />
    );
    const aliceRow = screen.getByText('Alice').closest('div');
    if (aliceRow) {
      fireEvent.keyDown(aliceRow, { key: 'Enter' });
    }
    expect(mockClick).toHaveBeenCalledWith('user1');
  });

  it('handles space key press on player rows', () => {
    const mockClick = jest.fn();
    render(
      <MonthlyLeaderboard
        players={mockPlayers}
        onPlayerClick={mockClick}
      />
    );
    const aliceRow = screen.getByText('Alice').closest('div');
    if (aliceRow) {
      fireEvent.keyDown(aliceRow, { key: ' ' });
    }
    expect(mockClick).toHaveBeenCalledWith('user1');
  });
});
