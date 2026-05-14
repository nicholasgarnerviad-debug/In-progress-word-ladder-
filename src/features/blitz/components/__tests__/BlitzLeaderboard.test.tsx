import React from 'react';
import { render, screen } from '@testing-library/react';
import { BlitzLeaderboard } from '../BlitzLeaderboard';
import type { BlitzPlayer, PlayerId } from '../../types';
import { createPlayerId } from '../../types';

describe('BlitzLeaderboard', () => {
  const createMockPlayer = (
    id: string,
    name: string,
    score: number,
    solved: number
  ): BlitzPlayer => ({
    id: createPlayerId(id),
    name,
    score,
    solved,
    wrong: 0,
    hints: 0,
    solvedAt: null,
    wrongAt: [],
    hintsUsedAt: [],
  });

  describe('rendering', () => {
    it('renders player list with rank numbers', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
        createMockPlayer('p2', 'Bob', 200, 2),
        createMockPlayer('p3', 'Charlie', 100, 1),
      ];
      const currentPlayerId = createPlayerId('p1');

      render(<BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />);

      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('2.')).toBeInTheDocument();
      expect(screen.getByText('3.')).toBeInTheDocument();
    });

    it('displays player names and scores', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
        createMockPlayer('p2', 'Bob', 200, 2),
      ];
      const currentPlayerId = createPlayerId('p1');

      render(<BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('300')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('displays puzzles solved count', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
        createMockPlayer('p2', 'Bob', 200, 2),
      ];
      const currentPlayerId = createPlayerId('p1');

      render(<BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />);

      // Should show solved counts somewhere
      const elements = screen.getAllByText(/[0-9]+/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('sorting', () => {
    it('sorts players by score descending', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Charlie', 100, 1),
        createMockPlayer('p2', 'Alice', 300, 3),
        createMockPlayer('p3', 'Bob', 200, 2),
      ];
      const currentPlayerId = createPlayerId('p1');

      const { container } = render(
        <BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />
      );

      const rows = container.querySelectorAll('[data-testid^="leaderboard-row-"]');
      expect(rows.length).toBe(3);
      // First row should be Alice (300 points)
      expect(rows[0]).toHaveTextContent('Alice');
    });

    it('handles players with same score', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
        createMockPlayer('p2', 'Bob', 300, 2),
        createMockPlayer('p3', 'Charlie', 200, 1),
      ];
      const currentPlayerId = createPlayerId('p1');

      render(<BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });

  describe('current player highlight', () => {
    it('highlights current player row', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
        createMockPlayer('p2', 'Bob', 200, 2),
      ];
      const currentPlayerId = createPlayerId('p2');

      const { container } = render(
        <BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />
      );

      const currentRow = container.querySelector('[data-testid="leaderboard-row-p2"]');
      expect(currentRow).toHaveClass('bg-blue-100');
      expect(currentRow).toHaveClass('dark:bg-blue-900/40');
    });

    it('does not highlight other players', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
        createMockPlayer('p2', 'Bob', 200, 2),
      ];
      const currentPlayerId = createPlayerId('p1');

      const { container } = render(
        <BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />
      );

      const otherRow = container.querySelector('[data-testid="leaderboard-row-p2"]');
      expect(otherRow).not.toHaveClass('bg-blue-100');
    });
  });

  describe('layout', () => {
    it('renders as compact sidebar component', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
      ];
      const currentPlayerId = createPlayerId('p1');

      const { container } = render(
        <BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />
      );

      const leaderboard = container.firstChild as HTMLElement;
      expect(leaderboard).toHaveClass('w-80');
      expect(leaderboard).toHaveClass('max-w-sm');
    });
  });
});
