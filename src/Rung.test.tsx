import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Rung } from './Rung';
import { TileState } from './LetterTile';

describe('Rung', () => {
  const mockWord = ['C', 'A', 'T'];
  const mockStates: TileState[] = ['idle', 'idle', 'idle'];

  it('should render word letters', () => {
    render(<Rung word={mockWord} tileStates={mockStates} />);

    mockWord.forEach((letter) => {
      expect(screen.getByText(letter)).toBeInTheDocument();
    });
  });

  it('should render correct number of tiles', () => {
    const { container } = render(<Rung word={mockWord} tileStates={mockStates} />);
    const tiles = container.querySelectorAll('[role="img"]');

    expect(tiles).toHaveLength(mockWord.length);
  });

  it('should apply tile states to each letter', () => {
    const states: TileState[] = ['idle', 'changed', 'locked'];
    const { container } = render(
      <Rung word={['A', 'B', 'C']} tileStates={states} />
    );

    const tiles = container.querySelectorAll('[role="img"]');
    expect(tiles[0]).toHaveClass('bg-gray-100');
    expect(tiles[1]).toHaveClass('bg-blue-100');
    expect(tiles[2]).toHaveClass('bg-amber-100');
  });

  describe('status icons', () => {
    it('should show checkmark for correct status', () => {
      const { container } = render(
        <Rung word={mockWord} tileStates={mockStates} status="correct" />
      );

      const checkmark = container.querySelector('svg');
      expect(checkmark).toBeInTheDocument();
      expect(checkmark?.parentElement).toHaveClass('bg-green-100');
      expect(checkmark?.parentElement).toHaveClass('border-green-500');
    });

    it('should show X for wrong status', () => {
      const { container } = render(
        <Rung word={mockWord} tileStates={mockStates} status="wrong" />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon?.parentElement).toHaveClass('bg-red-100');
      expect(icon?.parentElement).toHaveClass('border-red-500');
    });

    it('should show empty icon for neutral status', () => {
      const { container } = render(
        <Rung word={mockWord} tileStates={mockStates} status="neutral" />
      );

      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('should default to neutral status', () => {
      const { container } = render(
        <Rung word={mockWord} tileStates={mockStates} />
      );

      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('background colors', () => {
    it('should have neutral white background by default', () => {
      const { container } = render(
        <Rung word={mockWord} tileStates={mockStates} />
      );

      const rung = container.querySelector('[class*="rounded-lg"]');
      expect(rung).toHaveClass('bg-white');
    });

    it('should have green background for correct status', () => {
      const { container } = render(
        <Rung word={mockWord} tileStates={mockStates} status="correct" />
      );

      const rung = container.querySelector('[class*="rounded-lg"]');
      expect(rung).toHaveClass('bg-green-50');
    });

    it('should have red background for wrong status', () => {
      const { container } = render(
        <Rung word={mockWord} tileStates={mockStates} status="wrong" />
      );

      const rung = container.querySelector('[class*="rounded-lg"]');
      expect(rung).toHaveClass('bg-red-50');
    });
  });

  describe('shake animation', () => {
    jest.useFakeTimers();

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should add shake class when showShake is true', () => {
      const { container } = render(
        <Rung word={mockWord} tileStates={mockStates} showShake={true} />
      );

      const rung = container.querySelector('[class*="rounded-lg"]');
      expect(rung).toHaveClass('shake-animation');
    });

    it('should set shake flag when showShake prop is true', () => {
      const { container } = render(
        <Rung word={mockWord} tileStates={mockStates} showShake={true} />
      );

      const rung = container.querySelector('[class*="rounded-lg"]');
      expect(rung).toHaveClass('shake-animation');
    });

    it('should call onShakeComplete callback after 300ms', async () => {
      const onShakeComplete = jest.fn();

      render(
        <Rung
          word={mockWord}
          tileStates={mockStates}
          showShake={true}
          onShakeComplete={onShakeComplete}
        />
      );

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(onShakeComplete).toHaveBeenCalled();
      });
    });

    it('should not call callback if animation not triggered', () => {
      const onShakeComplete = jest.fn();

      render(
        <Rung
          word={mockWord}
          tileStates={mockStates}
          showShake={false}
          onShakeComplete={onShakeComplete}
        />
      );

      jest.runAllTimers();

      expect(onShakeComplete).not.toHaveBeenCalled();
    });
  });

  it('should handle variable word lengths', () => {
    const longWord = ['L', 'A', 'D', 'D', 'E', 'R'];
    const states = Array(longWord.length).fill('idle') as TileState[];

    const { container } = render(
      <Rung word={longWord} tileStates={states} />
    );

    const tiles = container.querySelectorAll('[role="img"]');
    expect(tiles).toHaveLength(longWord.length);
  });

  it('should apply flex layout with proper spacing', () => {
    const { container } = render(
      <Rung word={mockWord} tileStates={mockStates} />
    );

    const tilesContainer = container.querySelector('[class*="flex"][class*="gap-2"]');
    expect(tilesContainer).toBeInTheDocument();
  });

  it('should have transition effects', () => {
    const { container } = render(
      <Rung word={mockWord} tileStates={mockStates} />
    );

    const rung = container.querySelector('[class*="rounded-lg"]');
    expect(rung).toHaveClass('transition-all');
    expect(rung).toHaveClass('duration-200');
  });

  it('should render status icon on right side with margin-left auto', () => {
    const { container } = render(
      <Rung word={mockWord} tileStates={mockStates} status="correct" />
    );

    const statusContainer = container.querySelector('.ml-auto');
    expect(statusContainer).toBeInTheDocument();
    expect(statusContainer?.querySelector('div')).toHaveClass('bg-green-100');
  });
});
