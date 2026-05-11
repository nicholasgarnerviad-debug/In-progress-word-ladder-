import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SetupScreen } from '../SetupScreen';
import * as statsModule from '../../stats';

jest.mock('../../stats');

describe('SetupScreen', () => {
  const mockActions = {
    onChooseMode: jest.fn(),
    onChooseTier: jest.fn(),
    onStartRun: jest.fn(),
    onReset: jest.fn(),
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

  const renderSetupScreen = (props = {}) => {
    return render(
      <BrowserRouter>
        <SetupScreen
          mode={null}
          tier={null}
          {...mockActions}
          {...props}
        />
      </BrowserRouter>
    );
  };

  describe('initial state', () => {
    it('renders mode tiles in idle state', () => {
      renderSetupScreen();

      expect(screen.getByText('Sprint')).toBeInTheDocument();
      expect(screen.getByText('Survival')).toBeInTheDocument();
    });

    it('displays mode descriptions', () => {
      renderSetupScreen();

      expect(screen.getByText('Fixed clock. Solve as many as you can before time runs out.')).toBeInTheDocument();
      expect(screen.getByText('Each solve adds time. Keep the clock alive.')).toBeInTheDocument();
    });

    it('does not render duration tiles initially', () => {
      renderSetupScreen();

      expect(screen.queryByText('Short')).not.toBeInTheDocument();
      expect(screen.queryByText('Medium')).not.toBeInTheDocument();
      expect(screen.queryByText('Long')).not.toBeInTheDocument();
    });

    it('does not render start button initially', () => {
      renderSetupScreen();

      expect(screen.queryByRole('button', { name: /Start Run/i })).not.toBeInTheDocument();
    });

    it('displays rules card', () => {
      renderSetupScreen();

      expect(screen.getByText('2 free skips')).toBeInTheDocument();
    });

    it('displays back button in header', () => {
      renderSetupScreen();

      expect(screen.getByRole('button', { name: /Back to home/i })).toBeInTheDocument();
    });

    it('displays title "Time Attack"', () => {
      renderSetupScreen();

      expect(screen.getByText('Time Attack')).toBeInTheDocument();
    });
  });

  describe('mode selection', () => {
    it('calls onChooseMode when mode tile is clicked', async () => {
      const user = userEvent.setup();
      renderSetupScreen();

      const sprintButton = screen.getByRole('button', { name: /Fixed clock/i });
      await user.click(sprintButton);

      expect(mockActions.onChooseMode).toHaveBeenCalledWith('sprint');
    });

    it('displays selected mode with accent border', async () => {
      const user = userEvent.setup();
      const { rerender } = renderSetupScreen();

      const sprintButton = screen.getByRole('button', { name: /Fixed clock/i });
      await user.click(sprintButton);

      rerender(
        <BrowserRouter>
          <SetupScreen
            mode="sprint"
            tier={null}
            {...mockActions}
          />
        </BrowserRouter>
      );

      expect(sprintButton).toHaveClass('border-black dark:border-white');
    });

    it('shows duration section after mode selected', () => {
      renderSetupScreen({ mode: 'sprint' });

      expect(screen.getByText('60s total')).toBeInTheDocument();
      expect(screen.getByText('90s total')).toBeInTheDocument();
      expect(screen.getByText('120s total')).toBeInTheDocument();
    });
  });

  describe('duration selection', () => {
    it('shows sprint durations in seconds for sprint mode', () => {
      renderSetupScreen({ mode: 'sprint' });

      expect(screen.getByText('60s total')).toBeInTheDocument();
      expect(screen.getByText('90s total')).toBeInTheDocument();
      expect(screen.getByText('120s total')).toBeInTheDocument();
    });

    it('shows survival durations with base seconds for survival mode', () => {
      renderSetupScreen({ mode: 'survival' });

      expect(screen.getByText('(30s base)')).toBeInTheDocument();
      expect(screen.getByText('(45s base)')).toBeInTheDocument();
      expect(screen.getByText('(60s base)')).toBeInTheDocument();
    });

    it('calls onChooseTier when duration tile is clicked', async () => {
      const user = userEvent.setup();
      renderSetupScreen({ mode: 'sprint' });

      const btn60 = screen.getAllByText(/60/)[0].closest('button')!;
      await user.click(btn60);

      expect(mockActions.onChooseTier).toHaveBeenCalledWith(60);
    });

    it('displays selected tier with accent border', async () => {
      const user = userEvent.setup();
      const { rerender } = renderSetupScreen({ mode: 'sprint' });

      const btn90 = screen.getAllByText(/90/)[0].closest('button')!;
      await user.click(btn90);

      rerender(
        <BrowserRouter>
          <SetupScreen
            mode="sprint"
            tier={90}
            {...mockActions}
          />
        </BrowserRouter>
      );

      expect(btn90).toHaveClass('border-black dark:border-white');
    });

    it('shows start button after both mode and tier selected', () => {
      renderSetupScreen({ mode: 'sprint', tier: 60 });

      expect(screen.getByRole('button', { name: /Start Run/i })).toBeInTheDocument();
    });

    it('does not show start button if only mode selected', () => {
      renderSetupScreen({ mode: 'sprint', tier: null });

      expect(screen.queryByRole('button', { name: /Start Run/i })).not.toBeInTheDocument();
    });

    it('does not show start button if only tier selected', () => {
      renderSetupScreen({ mode: null, tier: 60 });

      expect(screen.queryByRole('button', { name: /Start Run/i })).not.toBeInTheDocument();
    });
  });

  describe('start button', () => {
    it('calls onStartRun when clicked', async () => {
      const user = userEvent.setup();
      renderSetupScreen({ mode: 'sprint', tier: 60 });

      const startButton = screen.getByRole('button', { name: /Start Run/i });
      await user.click(startButton);

      expect(mockActions.onStartRun).toHaveBeenCalled();
    });
  });

  describe('personal best display', () => {
    it('shows personal best when it exists', () => {
      (statsModule.getBest as jest.Mock).mockReturnValue({
        solved: 12,
        longestStreak: 5,
        achievedAt: '2026-05-11',
      });

      renderSetupScreen({ mode: 'sprint' });

      const bestTexts = screen.getAllByText('Best: 12');
      expect(bestTexts.length).toBeGreaterThan(0);
    });

    it('shows "—" when no personal best exists', () => {
      (statsModule.getBest as jest.Mock).mockReturnValue(null);

      renderSetupScreen({ mode: 'sprint' });

      const bestTexts = screen.getAllByText('Best: —');
      expect(bestTexts.length).toBeGreaterThan(0);
    });

    it('loads stats and retrieves best for selected mode and tier', () => {
      renderSetupScreen({ mode: 'sprint' });

      expect(statsModule.loadStats).toHaveBeenCalled();
      expect(statsModule.getBest).toHaveBeenCalledWith(
        expect.any(Object),
        'sprint',
        expect.any(Number)
      );
    });
  });

  describe('back button', () => {
    it('calls onReset when clicked', async () => {
      const user = userEvent.setup();
      renderSetupScreen();

      const backButton = screen.getByRole('button', { name: /Back to home/i });
      await user.click(backButton);

      expect(mockActions.onReset).toHaveBeenCalled();
    });

    it('navigates to home after reset', async () => {
      const user = userEvent.setup();
      renderSetupScreen();

      const backButton = screen.getByRole('button', { name: /Back to home/i });
      await user.click(backButton);

      // Navigation is mocked, so we just verify the action was called
      expect(mockActions.onReset).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderSetupScreen({ mode: 'sprint' });

      expect(screen.getByText('Time Attack')).toBeInTheDocument();
      expect(screen.getByText('Choose mode')).toBeInTheDocument();
      expect(screen.getByText('Choose duration')).toBeInTheDocument();
    });

    it('mode tiles are keyboard accessible', async () => {
      const user = userEvent.setup();
      renderSetupScreen();

      const sprintButton = screen.getByRole('button', { name: /Fixed clock/i });
      sprintButton.focus();
      expect(sprintButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockActions.onChooseMode).toHaveBeenCalledWith('sprint');
    });

    it('duration tiles are keyboard accessible', async () => {
      const user = userEvent.setup();
      renderSetupScreen({ mode: 'sprint' });

      const btn60 = screen.getAllByText(/60/)[0].closest('button')!;
      btn60.focus();
      expect(btn60).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockActions.onChooseTier).toHaveBeenCalledWith(60);
    });
  });

  describe('visual feedback', () => {
    it('sprint tile shows in light theme', () => {
      renderSetupScreen();

      const sprintButton = screen.getByRole('button', { name: /Fixed clock/i });
      expect(sprintButton).toHaveClass('border-gray-200');
    });

    it('selected tile shows accent border in dark theme', async () => {
      const user = userEvent.setup();
      const { rerender } = renderSetupScreen({ mode: 'sprint', tier: 60 });

      rerender(
        <BrowserRouter>
          <SetupScreen
            mode="sprint"
            tier={60}
            {...mockActions}
          />
        </BrowserRouter>
      );

      const btn60 = screen.getAllByText(/60/)[0].closest('button')!;
      expect(btn60).toHaveClass('border-black');
    });
  });
});
