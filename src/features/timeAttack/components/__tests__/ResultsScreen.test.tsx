import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ResultsScreen } from '../ResultsScreen';
import * as statsModule from '../../stats';

jest.mock('../../stats');

describe('ResultsScreen', () => {
  const mockActions = {
    onPlayAgain: jest.fn(),
    onBackToHome: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (statsModule.loadStats as jest.Mock).mockReturnValue({
      bests: {},
      totalRuns: 0,
      totalSolved: 0,
    });
    (statsModule.getBest as jest.Mock).mockReturnValue(null);
  });

  const renderResultsScreen = (props = {}) => {
    return render(
      <BrowserRouter>
        <ResultsScreen
          mode="sprint"
          tier={60}
          solvedCount={5}
          longestStreak={3}
          timeTakenMs={45000}
          averageSolveMs={5000}
          bestDifficulty="hard"
          {...mockActions}
          {...props}
        />
      </BrowserRouter>
    );
  };

  it('renders run stats', () => {
    renderResultsScreen();

    expect(screen.getByText('Run Complete')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // solvedCount
    expect(screen.getByText('3')).toBeInTheDocument(); // longestStreak
  });

  it('formats time correctly', () => {
    renderResultsScreen();

    expect(screen.getByText('0:45')).toBeInTheDocument(); // 45s formatted
  });

  it('displays personal best when available', () => {
    (statsModule.getBest as jest.Mock).mockReturnValue({
      solved: 4,
      tier: 60,
      mode: 'sprint',
    });

    renderResultsScreen();

    expect(screen.getByText('4 solved')).toBeInTheDocument();
  });

  it('shows best run banner when no prior best exists', () => {
    // First run ever (no prior personal best)
    (statsModule.getBest as jest.Mock).mockReturnValue(null);
    renderResultsScreen();

    // Should show the "New Personal Best!" banner since this is the first run
    expect(screen.getByText('🎉 New Personal Best!')).toBeInTheDocument();
  });

  it('shows best run indicator when solvedCount beats personal best', () => {
    (statsModule.getBest as jest.Mock).mockReturnValue({
      solved: 3,
      tier: 60,
      mode: 'sprint',
    });

    renderResultsScreen({ solvedCount: 5 });

    expect(screen.getByText('🎉 New Personal Best!')).toBeInTheDocument();
  });

  it('calls onPlayAgain when Play Again button clicked', async () => {
    const user = userEvent.setup();
    renderResultsScreen();

    const playAgainButton = screen.getByRole('button', { name: /Play Again/i });
    await user.click(playAgainButton);

    expect(mockActions.onPlayAgain).toHaveBeenCalled();
  });

  it('calls onBackToHome when Back to Home button clicked', async () => {
    const user = userEvent.setup();
    renderResultsScreen();

    const backButton = screen.getByRole('button', { name: /Back to Home/i });
    await user.click(backButton);

    expect(mockActions.onBackToHome).toHaveBeenCalled();
  });

  it('displays "—" for average when no solveTimings', () => {
    renderResultsScreen({ averageSolveMs: null });

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('displays mode and duration correctly for survival', () => {
    renderResultsScreen({ mode: 'survival', tier: 90 });

    expect(screen.getByText('survival')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });
});
