import React from 'react';
import { render, screen } from '@testing-library/react';
import { AchievementCard } from '../AchievementCard';
import { Achievement } from '../AchievementCard';

describe('AchievementCard', () => {
  const mockAchievement: Achievement = {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first puzzle',
    icon: '🎮',
    rarity: 'common',
    reward: {
      xp: 10,
      coins: 25
    },
    criteria: 'Complete 1 puzzle',
    isEarned: false,
    earnedDate: undefined
  };

  it('displays achievement icon', () => {
    render(<AchievementCard achievement={mockAchievement} />);
    expect(screen.getByText('🎮')).toBeInTheDocument();
  });

  it('displays achievement title', () => {
    render(<AchievementCard achievement={mockAchievement} />);
    expect(screen.getByText('First Steps')).toBeInTheDocument();
  });

  it('displays rarity badge', () => {
    render(<AchievementCard achievement={mockAchievement} />);
    expect(screen.getByText('common')).toBeInTheDocument();
  });

  it('displays reward info', () => {
    render(<AchievementCard achievement={mockAchievement} />);
    const text = screen.getByText(/\+10.*xp/i);
    expect(text).toBeInTheDocument();
    expect(screen.getByText(/\+25.*coins/i)).toBeInTheDocument();
  });

  it('shows earned checkmark for earned achievements', () => {
    const earnedAchievement: Achievement = {
      ...mockAchievement,
      isEarned: true,
      earnedDate: '2026-05-16'
    };
    render(<AchievementCard achievement={earnedAchievement} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('shows unlock criteria for locked achievements', () => {
    render(<AchievementCard achievement={mockAchievement} />);
    expect(screen.getByText(/Complete 1 puzzle/)).toBeInTheDocument();
  });
});
