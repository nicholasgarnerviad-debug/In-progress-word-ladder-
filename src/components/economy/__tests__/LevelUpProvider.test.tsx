import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LevelUpProvider, useLevelUpQueue } from '../LevelUpProvider';
import type { LevelReward } from '../../../lib/economy/types';

describe('LevelUpProvider', () => {
  const mockReward1: LevelReward = {
    level: 1,
    coins: 25,
    unlocks: [],
    description: 'First reward',
  };

  const mockReward2: LevelReward = {
    level: 2,
    coins: 50,
    unlocks: [{ type: 'badge', id: 'sprout', name: 'Sprout' }],
    description: 'Second reward',
  };

  const mockReward3: LevelReward = {
    level: 3,
    coins: 75,
    unlocks: [],
    description: 'Third reward',
  };

  /**
   * Test 1: Provider renders children correctly
   */
  it('renders children', () => {
    render(
      <LevelUpProvider>
        <div data-testid="test-child">Test Content</div>
      </LevelUpProvider>
    );
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  /**
   * Test 2: Pushing one reward displays the modal
   */
  it('displays a modal when a reward is pushed', async () => {
    function TestComponent() {
      const { push } = useLevelUpQueue();
      return (
        <div>
          <button onClick={() => push([mockReward1])}>Add Reward</button>
        </div>
      );
    }

    render(
      <LevelUpProvider>
        <TestComponent />
      </LevelUpProvider>
    );

    const button = screen.getByText('Add Reward');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('First reward')).toBeInTheDocument();
    });
  });

  /**
   * Test 3: Pushing multiple rewards queues them (FIFO order)
   */
  it('queues multiple rewards and displays them in order', async () => {
    function TestComponent() {
      const { push } = useLevelUpQueue();
      return (
        <div>
          <button onClick={() => push([mockReward1, mockReward2, mockReward3])}>
            Add Multiple Rewards
          </button>
        </div>
      );
    }

    render(
      <LevelUpProvider>
        <TestComponent />
      </LevelUpProvider>
    );

    const button = screen.getByText('Add Multiple Rewards');
    fireEvent.click(button);

    // First reward should be displayed
    await waitFor(() => {
      expect(screen.getByText('First reward')).toBeInTheDocument();
    });

    // Close the first modal by clicking Continue
    const continueButtons = screen.getAllByText('Continue');
    fireEvent.click(continueButtons[0]);

    // Second reward should now be displayed
    await waitFor(() => {
      expect(screen.getByText('Second reward')).toBeInTheDocument();
    });

    // Close the second modal
    fireEvent.click(screen.getByText('Continue'));

    // Third reward should now be displayed
    await waitFor(() => {
      expect(screen.getByText('Third reward')).toBeInTheDocument();
    });
  });

  /**
   * Test 4: Dismissing a modal shows the next reward in queue
   */
  it('shows next reward when current modal is dismissed', async () => {
    function TestComponent() {
      const { push } = useLevelUpQueue();
      return (
        <div>
          <button onClick={() => push([mockReward1, mockReward2])}>
            Add Rewards
          </button>
        </div>
      );
    }

    render(
      <LevelUpProvider>
        <TestComponent />
      </LevelUpProvider>
    );

    const button = screen.getByText('Add Rewards');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('First reward')).toBeInTheDocument();
    });

    // Dismiss by clicking Continue
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    // Second reward should appear
    await waitFor(() => {
      expect(screen.getByText('Second reward')).toBeInTheDocument();
    });
  });

  /**
   * Test 5: useLevelUpQueue throws error when used outside provider
   */
  it('throws error when useLevelUpQueue is used outside provider', () => {
    function BadComponent() {
      useLevelUpQueue();
      return <div>Bad</div>;
    }

    // Suppress error output during test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<BadComponent />);
    }).toThrow('useLevelUpQueue must be used inside <LevelUpProvider>');

    spy.mockRestore();
  });

  /**
   * Test 6: Empty reward list does not queue
   */
  it('does not queue when pushing empty reward list', async () => {
    let queueLength = 0;

    function TestComponent() {
      const { push } = useLevelUpQueue();
      return (
        <div>
          <button
            onClick={() => {
              push([]);
              // After push, modal should not appear
              queueLength = 0;
            }}
          >
            Push Empty
          </button>
        </div>
      );
    }

    render(
      <LevelUpProvider>
        <TestComponent />
      </LevelUpProvider>
    );

    const button = screen.getByText('Push Empty');
    fireEvent.click(button);

    // Give some time for any modal to appear (it shouldn't)
    await waitFor(
      () => {
        // No modal should be displayed
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  /**
   * Test 7: Can dismiss modal with Escape key
   */
  it('dismisses modal when Escape key is pressed and shows next', async () => {
    function TestComponent() {
      const { push } = useLevelUpQueue();
      return (
        <div>
          <button onClick={() => push([mockReward1, mockReward2])}>
            Add Rewards
          </button>
        </div>
      );
    }

    render(
      <LevelUpProvider>
        <TestComponent />
      </LevelUpProvider>
    );

    const button = screen.getByText('Add Rewards');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('First reward')).toBeInTheDocument();
    });

    // Press Escape to dismiss
    fireEvent.keyDown(window, { key: 'Escape' });

    // Second reward should appear
    await waitFor(() => {
      expect(screen.getByText('Second reward')).toBeInTheDocument();
    });
  });
});
