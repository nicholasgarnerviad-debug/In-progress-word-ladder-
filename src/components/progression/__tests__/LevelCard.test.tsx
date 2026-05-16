import React from 'react';
import { render, screen } from '@testing-library/react';
import { LevelCard } from '../LevelCard';
import * as useEconomyModule from '../../../lib/economy/useEconomy';

describe('LevelCard', () => {
  beforeEach(() => {
    jest.spyOn(useEconomyModule, 'useEconomy').mockReturnValue({
      coins: 0,
      xp: 1750,
      level: 5,
      inventory: {},
      earnCoins: jest.fn(),
      spend: jest.fn(),
      addXp: jest.fn(),
      buyConsumable: jest.fn(),
      useItem: jest.fn(),
      getCount: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('displays current level', () => {
    render(<LevelCard />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Current Level')).toBeInTheDocument();
  });

  it('displays XP progress', () => {
    render(<LevelCard />);
    expect(screen.getByText(/1750.*2100/)).toBeInTheDocument();
  });

  it('renders XP progress bar with role="progressbar"', () => {
    render(<LevelCard />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '1750');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '2100');
  });

  it('displays progress percentage', () => {
    render(<LevelCard />);
    // 1750 XP is 42% through level 5 (1500-2100)
    expect(screen.getByText(/42% to Level 6/)).toBeInTheDocument();
  });

  it('displays next reward preview', () => {
    render(<LevelCard />);
    expect(screen.getByText('Next Reward')).toBeInTheDocument();
    expect(screen.getByText(/Level 7:/)).toBeInTheDocument();
  });
});
