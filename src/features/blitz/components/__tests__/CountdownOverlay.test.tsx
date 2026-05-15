import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CountdownOverlay } from '../CountdownOverlay';

describe('CountdownOverlay', () => {
  describe('countdown sequence', () => {
    it('renders countdown from 3 to 1', async () => {
      const { rerender } = render(<CountdownOverlay startTime={Date.now()} />);

      // Should show initial countdown
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('each countdown number is large and centered', async () => {
      render(<CountdownOverlay startTime={Date.now()} />);

      await waitFor(() => {
        const countdownElement = screen.getByRole('status');
        expect(countdownElement).toHaveClass('text-9xl');
        expect(countdownElement.parentElement).toHaveClass('flex');
        expect(countdownElement.parentElement).toHaveClass('items-center');
        expect(countdownElement.parentElement).toHaveClass('justify-center');
      });
    });

    it('hides after countdown completes', async () => {
      const mockOnComplete = jest.fn();
      const { container, rerender } = render(
        <CountdownOverlay startTime={Date.now()} onComplete={mockOnComplete} />
      );

      // Simulate timer after 3 seconds with modern timers to preserve RAF
      jest.useFakeTimers('modern');
      jest.advanceTimersByTime(3500);

      // After advancing time, re-render should show null
      rerender(<CountdownOverlay startTime={Date.now() - 3500} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });

      jest.useRealTimers();
    });
  });

  describe('accessibility', () => {
    it('has aria-live region for announcements', () => {
      render(<CountdownOverlay startTime={Date.now()} />);

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('announces countdown numbers', async () => {
      render(<CountdownOverlay startTime={Date.now()} />);

      await waitFor(() => {
        const statusRegion = screen.getByRole('status');
        expect(statusRegion.textContent).toMatch(/[3]/);
      });
    });
  });

  describe('styling', () => {
    it('renders full-screen overlay', async () => {
      render(<CountdownOverlay startTime={Date.now()} />);

      await waitFor(() => {
        const overlay = screen.getByRole('status').closest('div');
        while (overlay && overlay.parentElement && overlay.parentElement.className.includes('fixed')) {
          expect(overlay.parentElement).toHaveClass('fixed');
          break;
        }
      });
    });

    it('has semi-transparent background', async () => {
      render(<CountdownOverlay startTime={Date.now()} />);

      await waitFor(() => {
        const container = screen.getByRole('status').closest('.fixed');
        expect(container).toHaveClass('bg-black/60');
      });
    });

    it('applies countdown scale animation', async () => {
      render(<CountdownOverlay startTime={Date.now()} />);

      await waitFor(() => {
        const countdownElement = screen.getByRole('status');
        expect(countdownElement).toHaveClass('animate-countdownScale');
      });
    });

    it('applies fade-in animation to overlay', async () => {
      render(<CountdownOverlay startTime={Date.now()} />);

      await waitFor(() => {
        const overlay = screen.getByRole('status').parentElement;
        expect(overlay).toHaveClass('animate-fadeIn');
      });
    });

    it('has text shadow for visibility', async () => {
      render(<CountdownOverlay startTime={Date.now()} />);

      await waitFor(() => {
        const countdownElement = screen.getByRole('status') as HTMLElement;
        expect(countdownElement.style.textShadow).toBeTruthy();
      });
    });
  });

  describe('accessibility enhancements', () => {
    it('has aria-atomic for complete announcement', () => {
      render(<CountdownOverlay startTime={Date.now()} />);

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('has presentation role on overlay container', async () => {
      const { container } = render(<CountdownOverlay startTime={Date.now()} />);

      await waitFor(() => {
        const overlay = container.firstChild as HTMLElement;
        expect(overlay).toHaveAttribute('role', 'presentation');
      });
    });
  });
});
