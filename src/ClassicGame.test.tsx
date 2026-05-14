import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClassicGame } from './ClassicGame';
import { useEconomy } from './lib/economy';

jest.mock('./lib/economy', () => ({
  useEconomy: jest.fn(),
}));

jest.mock('./components/PuzzleBoard', () => ({
  PuzzleBoard: () => <div data-testid="puzzle-board">Puzzle Board</div>,
}));

jest.mock('./components/HomeButton', () => ({
  HomeButton: () => <div>Home Button</div>,
}));

describe('ClassicGame Power-ups with Inventory', () => {
  const mockEconomy = {
    coins: 500,
    xp: 100,
    level: 1,
    inventory: {},
    earnCoins: jest.fn(),
    spend: jest.fn(),
    addXp: jest.fn(),
    buyConsumable: jest.fn(),
    useItem: jest.fn(),
    getCount: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useEconomy as jest.Mock).mockReturnValue(mockEconomy);
  });

  describe('Hint button behavior', () => {
    it('should use hint from inventory if available', async () => {
      mockEconomy.getCount.mockReturnValue(3);
      render(<ClassicGame />);
      const hintButton = screen.getByRole('button', { name: /Hint/i });
      fireEvent.click(hintButton);
      await waitFor(() => {
        expect(mockEconomy.useItem).toHaveBeenCalledWith('hint');
      });
    });

    it('should show hint count when items available', () => {
      mockEconomy.getCount.mockReturnValue(5);
      render(<ClassicGame />);
      expect(screen.getByRole('button', { name: /Hint.*5/ })).toBeInTheDocument();
    });

    it('should show cost when no inventory items', () => {
      mockEconomy.getCount.mockReturnValue(0);
      render(<ClassicGame />);
      expect(screen.getByRole('button', { name: /Hint.*30/ })).toBeInTheDocument();
    });
  });

  describe('Undo button behavior', () => {
    it('should use undo from inventory if available', async () => {
      mockEconomy.getCount.mockImplementation((type) => type === 'undo_step' ? 2 : 0);
      render(<ClassicGame />);
      const undoButton = screen.getByRole('button', { name: /Undo/i });
      fireEvent.click(undoButton);
      await waitFor(() => {
        expect(mockEconomy.useItem).toHaveBeenCalledWith('undo_step');
      });
    });

    it('should show undo count when items available', () => {
      mockEconomy.getCount.mockImplementation((type) => type === 'undo_step' ? 3 : 0);
      render(<ClassicGame />);
      expect(screen.getByRole('button', { name: /Undo.*3/ })).toBeInTheDocument();
    });
  });

  describe('Reveal button behavior', () => {
    it('should use reveal from inventory if available', async () => {
      mockEconomy.getCount.mockImplementation((type) => type === 'reveal_next_word' ? 2 : 0);
      render(<ClassicGame />);
      const revealButton = screen.getByRole('button', { name: /Reveal/i });
      fireEvent.click(revealButton);
      await waitFor(() => {
        expect(mockEconomy.useItem).toHaveBeenCalledWith('reveal_next_word');
      });
    });

    it('should show reveal count when items available', () => {
      mockEconomy.getCount.mockImplementation((type) => type === 'reveal_next_word' ? 1 : 0);
      render(<ClassicGame />);
      expect(screen.getByRole('button', { name: /Reveal.*1/ })).toBeInTheDocument();
    });
  });
});
