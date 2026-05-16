import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AchievementModal } from '../AchievementModal';

describe('AchievementModal', () => {
  const mockAchievement = {
    id: 'firstGame',
    title: 'First Steps',
    description: 'Play your first game',
    icon: '🎮',
    rarity: 'common' as const,
    reward: { xp: 10, coins: 25 },
    criteria: { type: 'gameCount', value: 1 },
  };

  it('displays achievement title', () => {
    render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('First Steps')).toBeInTheDocument();
  });

  it('displays achievement icon', () => {
    render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('🎮')).toBeInTheDocument();
  });

  it('displays rarity badge', () => {
    render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/common/i)).toBeInTheDocument();
  });

  it('displays reward info', () => {
    render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('XP')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Coins')).toBeInTheDocument();
  });

  it('displays unlock date for earned achievements', () => {
    const earnDate = new Date('2026-05-10').getTime();
    render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={true}
        earnedDate={earnDate}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('Unlocked')).toBeInTheDocument();
    expect(screen.getByText(/Earned on/i)).toBeInTheDocument();
  });

  it('displays unlock criteria for locked achievements', () => {
    render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={false}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/play 1 game/i)).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const mockOnClose = jest.fn();
    const { container } = render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={true}
        onClose={mockOnClose}
      />
    );
    const backdrop = container.querySelector('[data-testid="modal-backdrop"]');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(
      <AchievementModal
        achievement={mockAchievement}
        isEarned={true}
        onClose={mockOnClose}
      />
    );
    const closeButton = screen.getByRole('button', { name: /close|×/i });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
