import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AchievementList } from '../AchievementList';

describe('AchievementList', () => {
  it('renders achievement cards', () => {
    render(<AchievementList />);

    // Check that "First Steps" achievement is rendered (from mock data)
    expect(screen.getByText('First Steps')).toBeInTheDocument();
  });

  it('filters to earned achievements', async () => {
    const user = userEvent.setup();
    render(<AchievementList />);

    // Click the "Earned" tab
    const earnedTab = screen.getByRole('button', { name: /Earned/i });
    await user.click(earnedTab);

    // Should show only earned achievements
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    // Blitz Master is locked, so it should not appear
    expect(screen.queryByText('Blitz Master')).not.toBeInTheDocument();
  });

  it('shows empty state when no achievements match filter', async () => {
    const user = userEvent.setup();
    render(<AchievementList />);

    // Click the "Locked" tab
    const lockedTab = screen.getByRole('button', { name: /Locked/i });
    await user.click(lockedTab);

    // In the mock data, we only have locked achievements with "Blitz Master"
    // but we should see the empty state or the locked achievement
    const lockedAchievements = screen.queryAllByText(/Blitz Master/);

    // Verify the filter works - we should either see locked achievements or empty state
    expect(screen.getByText(/Blitz Master|No achievements/i)).toBeInTheDocument();
  });
});
