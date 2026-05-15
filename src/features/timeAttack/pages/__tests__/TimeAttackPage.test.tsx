import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TimeAttackPage } from '../TimeAttackPage';
import { LevelUpProvider } from '../../../../components/economy/LevelUpProvider';
import * as useTimeAttackModule from '../../useTimeAttack';

jest.mock('../../useTimeAttack');

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <LevelUpProvider>
        {component}
      </LevelUpProvider>
    </BrowserRouter>
  );
};

describe('TimeAttackPage', () => {
  const mockState = {
    phase: 'idle' as const,
    mode: null,
    tier: null,
    timeRemainingMs: 0,
    isTimeRewardFlashing: false,
    solvedCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    freeSkipsRemaining: 2,
    currentPuzzle: null,
    currentPuzzleIndex: 0,
    currentDifficulty: null,
    bestDifficulty: null,
    runStartedAt: null,
    solveTimings: [],
    lastSolveStartedAt: null,
    previousBestAtRunEnd: null,
    chooseMode: jest.fn(),
    chooseTier: jest.fn(),
    backToModeSelect: jest.fn(),
    startRun: jest.fn(),
    reportSolved: jest.fn(),
    skipPuzzle: jest.fn(),
    endRun: jest.fn(),
    playAgain: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTimeAttackModule.useTimeAttack as jest.Mock).mockReturnValue(mockState);
  });

  it('renders SetupScreen when phase is idle', () => {
    renderWithRouter(<TimeAttackPage />);
    expect(screen.getByText('Time Attack')).toBeInTheDocument();
    expect(screen.getByText('Sprint')).toBeInTheDocument();
  });

  it('renders PlayScreen when phase is playing', () => {
    (useTimeAttackModule.useTimeAttack as jest.Mock).mockReturnValue({
      ...mockState,
      phase: 'playing' as const,
      tier: 60 as const,
      currentPuzzle: {
        start: 'cat',
        end: 'dog',
        optimal: 3,
        chain: ['cat', 'cot', 'dot', 'dog'],
        lockedIndices: [0, 3],
        extraRungs: 0,
      },
    });

    renderWithRouter(<TimeAttackPage />);
    expect(screen.getByText('Solved')).toBeInTheDocument();
    expect(screen.getByText('Streak')).toBeInTheDocument();
  });

  it('renders EndScreen when phase is ended', () => {
    (useTimeAttackModule.useTimeAttack as jest.Mock).mockReturnValue({
      ...mockState,
      phase: 'ended' as const,
      mode: 'sprint' as const,
      tier: 60 as const,
      solvedCount: 5,
      longestStreak: 3,
      bestDifficulty: 'hard' as const,
      runStartedAt: performance.now() - 30000,
      previousBestAtRunEnd: null,
    });

    renderWithRouter(<TimeAttackPage />);
    expect(screen.getByText('Puzzles Solved')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('sets document title', () => {
    renderWithRouter(<TimeAttackPage />);
    expect(document.title).toBe('Time Attack — Word Ladder');
  });
});
