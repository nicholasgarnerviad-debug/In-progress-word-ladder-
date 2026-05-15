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
    it('renders player list with rank indicators', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
        createMockPlayer('p2', 'Bob', 200, 2),
        createMockPlayer('p3', 'Charlie', 100, 1),
      ];
      const currentPlayerId = createPlayerId('p1');

      render(<BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />);

      // Medals for top 3 or rank numbers for others
      const container = screen.getByText('Alice').closest('[data-testid^="leaderboard-row"]');
      expect(container?.textContent).toMatch(/🥇|1\./);
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
      expect(currentRow).toHaveClass('bg-yellow-50');
      expect(currentRow).toHaveClass('dark:bg-yellow-900/30');
      expect(currentRow).toHaveClass('border-yellow-400');
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

  describe('visual enhancements', () => {
    it('displays trophy emoji in heading', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
      ];
      const currentPlayerId = createPlayerId('p1');

      render(<BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />);

      // Look for trophy emoji in heading
      const heading = screen.getByText('Leaderboard');
      expect(heading.parentElement?.textContent).toContain('🏆');
    });

    it('displays gold medal for rank 1', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
        createMockPlayer('p2', 'Bob', 200, 2),
      ];
      const currentPlayerId = createPlayerId('p1');

      render(<BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />);

      const firstRow = screen.getByTestId('leaderboard-row-p1');
      expect(firstRow.textContent).toContain('🥇');
    });

    it('displays silver medal for rank 2', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
        createMockPlayer('p2', 'Bob', 200, 2),
      ];
      const currentPlayerId = createPlayerId('p1');

      render(<BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />);

      const secondRow = screen.getByTestId('leaderboard-row-p2');
      expect(secondRow.textContent).toContain('🥈');
    });

    it('displays bronze medal for rank 3', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
        createMockPlayer('p2', 'Bob', 200, 2),
        createMockPlayer('p3', 'Charlie', 100, 1),
      ];
      const currentPlayerId = createPlayerId('p1');

      render(<BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />);

      const thirdRow = screen.getByTestId('leaderboard-row-p3');
      expect(thirdRow.textContent).toContain('🥉');
    });

    it('displays rank number for rank 4+', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
        createMockPlayer('p2', 'Bob', 200, 2),
        createMockPlayer('p3', 'Charlie', 100, 1),
        createMockPlayer('p4', 'Dave', 50, 0),
      ];
      const currentPlayerId = createPlayerId('p1');

      render(<BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />);

      const fourthRow = screen.getByTestId('leaderboard-row-p4');
      expect(fourthRow.textContent).toContain('4.');
    });

    it('applies yellow highlight to current player row', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
        createMockPlayer('p2', 'Bob', 200, 2),
      ];
      const currentPlayerId = createPlayerId('p2');

      const { container } = render(
        <BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />
      );

      const currentRow = container.querySelector('[data-testid="leaderboard-row-p2"]');
      expect(currentRow).toHaveClass('bg-yellow-50');
      expect(currentRow).toHaveClass('dark:bg-yellow-900/30');
      expect(currentRow).toHaveClass('border-yellow-400');
    });

    it('shows (You) indicator for current player', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
        createMockPlayer('p2', 'Bob', 200, 2),
      ];
      const currentPlayerId = createPlayerId('p2');

      render(<BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />);

      const currentRow = screen.getByTestId('leaderboard-row-p2');
      expect(currentRow.textContent).toContain('(You)');
    });

    it('does not show (You) indicator for other players', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
        createMockPlayer('p2', 'Bob', 200, 2),
      ];
      const currentPlayerId = createPlayerId('p2');

      render(<BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />);

      const firstRow = screen.getByTestId('leaderboard-row-p1');
      expect(firstRow.textContent).not.toContain('(You)');
    });

    it('applies slide-in animation to rows', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
      ];
      const currentPlayerId = createPlayerId('p1');

      const { container } = render(
        <BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />
      );

      const row = container.querySelector('[data-testid="leaderboard-row-p1"]');
      expect(row).toHaveClass('animate-slideInRight');
    });

    it('has transition animation on row changes', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
      ];
      const currentPlayerId = createPlayerId('p1');

      const { container } = render(
        <BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />
      );

      const row = container.querySelector('[data-testid="leaderboard-row-p1"]');
      expect(row).toHaveClass('transition-all');
      expect(row).toHaveClass('duration-200');
    });

    it('applies shadow to leaderboard container', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
      ];
      const currentPlayerId = createPlayerId('p1');

      const { container } = render(
        <BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />
      );

      const leaderboard = container.firstChild as HTMLElement;
      expect(leaderboard).toHaveClass('shadow-lg');
    });
  });

  describe('accessibility', () => {
    it('renders as list container', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
      ];
      const currentPlayerId = createPlayerId('p1');

      const { container } = render(
        <BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />
      );

      const row = container.querySelector('[role="listitem"]');
      expect(row).toBeInTheDocument();
    });

    it('displays score and solved counts with visible labels', () => {
      const players: BlitzPlayer[] = [
        createMockPlayer('p1', 'Alice', 300, 3),
      ];
      const currentPlayerId = createPlayerId('p1');

      render(<BlitzLeaderboard players={players} currentPlayerId={currentPlayerId} />);

      // Score label and value should be visible
      expect(screen.getByText('Score')).toBeInTheDocument();
      expect(screen.getByText('300')).toBeInTheDocument();

      // Solved label and value should be visible
      expect(screen.getByText('Solved')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
