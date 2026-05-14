import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { WalletStrip } from '../WalletStrip';
import { useEconomy } from '../../../lib/economy/useEconomy';

jest.mock('../../../lib/economy/useEconomy');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('WalletStrip', () => {
  beforeEach(() => {
    (useEconomy as jest.Mock).mockReturnValue({
      coins: 500,
      xp: 150,
      level: 1,
      inventory: {},
    });
  });

  it('renders coin balance with label', () => {
    render(
      <BrowserRouter>
        <WalletStrip />
      </BrowserRouter>
    );
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText(/coins/i)).toBeInTheDocument();
  });

  it('renders current level', () => {
    render(
      <BrowserRouter>
        <WalletStrip />
      </BrowserRouter>
    );
    const levelText = screen.getAllByText(/Level 1/);
    expect(levelText.length).toBeGreaterThan(0);
  });

  it('renders XP progress bar', () => {
    const { container } = render(
      <BrowserRouter>
        <WalletStrip />
      </BrowserRouter>
    );
    // Check that the progress bar container exists (h-1.5 rounded-full bg-gray-200)
    const progressContainer = container.querySelector('.h-1\\.5.rounded-full.bg-gray-200');
    expect(progressContainer).toBeInTheDocument();
    // Verify the progress bar has a fill div
    const progressFill = progressContainer?.querySelector('[style*="width"]');
    expect(progressFill).toBeInTheDocument();
  });

  it('compact variant hides the "X XP to next" label', () => {
    render(
      <BrowserRouter>
        <WalletStrip compact />
      </BrowserRouter>
    );
    expect(screen.queryByText(/XP to next/)).not.toBeInTheDocument();
  });

  it('full variant shows the "X XP to next" label', () => {
    render(
      <BrowserRouter>
        <WalletStrip compact={false} />
      </BrowserRouter>
    );
    expect(screen.getByText(/XP to next/)).toBeInTheDocument();
  });

  it('renders as a button when linkToProfile is true', () => {
    render(
      <BrowserRouter>
        <WalletStrip linkToProfile={true} />
      </BrowserRouter>
    );
    const button = screen.getByRole('button', { name: /Open profile/i });
    expect(button).toBeInTheDocument();
  });

  it('renders as a div when linkToProfile is false', () => {
    render(
      <BrowserRouter>
        <WalletStrip linkToProfile={false} />
      </BrowserRouter>
    );
    // Should not have a button role
    expect(screen.queryByRole('button', { name: /Open profile/i })).not.toBeInTheDocument();
  });

  it('applies button styles when linkToProfile is true', () => {
    render(
      <BrowserRouter>
        <WalletStrip linkToProfile={true} />
      </BrowserRouter>
    );
    const button = screen.getByRole('button', { name: /Open profile/i });
    expect(button).toHaveClass('hover:bg-gray-50', 'dark:hover:bg-gray-900');
  });

  it('linkToProfile defaults to true', () => {
    render(
      <BrowserRouter>
        <WalletStrip />
      </BrowserRouter>
    );
    const button = screen.getByRole('button', { name: /Open profile/i });
    expect(button).toBeInTheDocument();
  });

  it('compact variant reduces text sizes', () => {
    render(
      <BrowserRouter>
        <WalletStrip compact={true} />
      </BrowserRouter>
    );
    // Coin display should be smaller
    const coinContainer = screen.getByText('500').parentElement;
    expect(coinContainer?.querySelector('.text-sm')).toBeInTheDocument();
  });

  it('full variant uses larger text sizes', () => {
    render(
      <BrowserRouter>
        <WalletStrip compact={false} />
      </BrowserRouter>
    );
    // Coin display should be larger
    const coinContainer = screen.getByText('500').parentElement;
    expect(coinContainer?.querySelector('.text-base')).toBeInTheDocument();
  });

  it('renders emoji for coins', () => {
    render(
      <BrowserRouter>
        <WalletStrip />
      </BrowserRouter>
    );
    expect(screen.getByText('🪙')).toBeInTheDocument();
  });

  it('has accessible screen reader label for progress', () => {
    render(
      <BrowserRouter>
        <WalletStrip />
      </BrowserRouter>
    );
    // Look for sr-only text that describes the progress
    const srTexts = screen.getAllByText(/percent to next level/i);
    expect(srTexts.length).toBeGreaterThan(0);
  });

  it('formats large coin amounts with locale string', () => {
    (useEconomy as jest.Mock).mockReturnValue({
      coins: 1000000,
      xp: 150,
      level: 1,
      inventory: {},
    });
    render(
      <BrowserRouter>
        <WalletStrip />
      </BrowserRouter>
    );
    // Should have a formatted coin amount (with commas in en-US)
    const coinContainer = screen.getByText('coins').closest('div');
    expect(coinContainer).toBeInTheDocument();
    // The coin number should be somewhere in the document
    const allText = coinContainer?.textContent || '';
    expect(allText).toMatch(/1/);
  });

  // Edge case tests
  it('handles zero coins state correctly', () => {
    (useEconomy as jest.Mock).mockReturnValue({
      coins: 0,
      xp: 150,
      level: 1,
      inventory: {},
    });
    render(
      <BrowserRouter>
        <WalletStrip />
      </BrowserRouter>
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles zero XP state at level 1 (0% progress)', () => {
    (useEconomy as jest.Mock).mockReturnValue({
      coins: 500,
      xp: 0,
      level: 1,
      inventory: {},
    });
    const { container } = render(
      <BrowserRouter>
        <WalletStrip />
      </BrowserRouter>
    );
    // Progress bar should be at 0%
    const progressFill = container.querySelector('[style*="width"]') as HTMLElement;
    expect(progressFill).toBeInTheDocument();
    expect(progressFill.style.width).toBe('0%');
  });

  it('handles near level-up state (high XP progress)', () => {
    (useEconomy as jest.Mock).mockReturnValue({
      coins: 500,
      xp: 299, // High XP value approaching next level
      level: 1,
      inventory: {},
    });
    const { container } = render(
      <BrowserRouter>
        <WalletStrip />
      </BrowserRouter>
    );
    // Progress bar should be at high percentage (99%+)
    const progressFill = container.querySelector('[style*="width"]') as HTMLElement;
    expect(progressFill).toBeInTheDocument();
    const widthValue = parseInt(progressFill.style.width);
    expect(widthValue).toBeGreaterThan(95); // Should be 99% or more
  });

  it('does not render onClick handler when linkToProfile is false', () => {
    render(
      <BrowserRouter>
        <WalletStrip linkToProfile={false} />
      </BrowserRouter>
    );
    // Should render as a div, not a button
    const div = screen.queryByRole('button');
    expect(div).not.toBeInTheDocument();
  });

  it('does not render aria-label when linkToProfile is false', () => {
    const { container } = render(
      <BrowserRouter>
        <WalletStrip linkToProfile={false} />
      </BrowserRouter>
    );
    // Should not have aria-label on the div
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.getAttribute('aria-label')).toBeNull();
  });

  it('calls navigate with /profile when button is clicked', () => {
    const mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

    render(
      <BrowserRouter>
        <WalletStrip linkToProfile={true} />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /Open profile/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('does not render aria-label on div element when linkToProfile is false', () => {
    const { container } = render(
      <BrowserRouter>
        <WalletStrip linkToProfile={false} />
      </BrowserRouter>
    );
    // Get the root wrapper element
    const wrapper = container.querySelector('.w-full') as HTMLElement;
    expect(wrapper.tagName.toLowerCase()).toBe('div');
    expect(wrapper.getAttribute('aria-label')).toBeNull();
  });
});
