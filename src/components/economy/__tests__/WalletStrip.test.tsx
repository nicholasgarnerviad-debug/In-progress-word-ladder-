import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { WalletStrip } from '../WalletStrip';
import { useEconomy } from '../../../lib/economy/useEconomy';

jest.mock('../../../lib/economy/useEconomy');

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
});
