import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AchievementFilter } from '../AchievementFilter';

describe('AchievementFilter', () => {
  it('renders all filter tabs', () => {
    const handleChange = jest.fn();
    render(
      <AchievementFilter active="all" onChange={handleChange} />
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Earned')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('calls onChange when tab is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <AchievementFilter active="all" onChange={handleChange} />
    );

    const earnedButton = screen.getByText('Earned');
    await user.click(earnedButton);

    expect(handleChange).toHaveBeenCalledWith('earned');
  });

  it('highlights active tab', () => {
    const handleChange = jest.fn();
    render(
      <AchievementFilter active="earned" onChange={handleChange} />
    );

    const earnedButton = screen.getByText('Earned');
    expect(earnedButton).toHaveClass('border-blue-500');
  });
});
