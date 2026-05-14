import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LevelUpModal } from '../LevelUpModal';
import type { LevelReward } from '../../../lib/economy/types';

describe('LevelUpModal', () => {
  const mockReward: LevelReward = {
    level: 2,
    coins: 50,
    unlocks: [
      { type: 'badge', id: 'sprout', name: 'Sprout' },
      { type: 'consumable', consumableType: 'hint', count: 3 },
    ],
    description: 'Sprout badge + 3 hints!',
  };

  it('renders the level number prominently', () => {
    const onClose = jest.fn();
    render(<LevelUpModal reward={mockReward} onClose={onClose} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders the reward description', () => {
    const onClose = jest.fn();
    render(<LevelUpModal reward={mockReward} onClose={onClose} />);
    expect(screen.getByText('Sprout badge + 3 hints!')).toBeInTheDocument();
  });

  it('renders the coin bonus', () => {
    const onClose = jest.fn();
    render(<LevelUpModal reward={mockReward} onClose={onClose} />);
    expect(screen.getByText('+50 coins')).toBeInTheDocument();
  });

  it('lists each unlock with a label', () => {
    const onClose = jest.fn();
    render(<LevelUpModal reward={mockReward} onClose={onClose} />);
    const badgeItems = screen.getAllByText(/Sprout badge/);
    expect(badgeItems.length).toBeGreaterThan(0); // At least in unlocks list
    const hintItems = screen.getAllByText(/3 hints/);
    expect(hintItems.length).toBeGreaterThan(0); // In unlocks list
  });

  it('calls onClose when clicking the Continue button', () => {
    const onClose = jest.fn();
    render(<LevelUpModal reward={mockReward} onClose={onClose} />);
    fireEvent.click(screen.getByText('Continue'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking the backdrop', () => {
    const onClose = jest.fn();
    render(<LevelUpModal reward={mockReward} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    // The backdrop is the dialog element itself (fixed inset-0 overlay)
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when pressing Escape', () => {
    const onClose = jest.fn();
    render(<LevelUpModal reward={mockReward} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('has role="dialog" and aria-modal="true"', () => {
    const onClose = jest.fn();
    render(<LevelUpModal reward={mockReward} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
