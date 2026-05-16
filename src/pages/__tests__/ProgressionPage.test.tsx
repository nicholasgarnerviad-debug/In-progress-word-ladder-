import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProgressionPage } from '../ProgressionPage';

jest.mock('../../components/progression/LevelCard', () => ({
  LevelCard: () => <div data-testid="level-card">Level Card</div>,
}));

jest.mock('../../components/progression/AchievementList', () => ({
  AchievementList: () => <div data-testid="achievement-list">Achievement List</div>,
}));

describe('ProgressionPage', () => {
  const renderPage = () => {
    return render(
      <BrowserRouter>
        <ProgressionPage />
      </BrowserRouter>
    );
  };

  it('renders the progression page with title "Your Progression"', () => {
    renderPage();
    expect(screen.getByText('Your Progression')).toBeInTheDocument();
  });

  it('renders level card', () => {
    renderPage();
    expect(screen.getByTestId('level-card')).toBeInTheDocument();
  });

  it('renders achievement section', () => {
    renderPage();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByTestId('achievement-list')).toBeInTheDocument();
  });

  it('has back button to home', () => {
    renderPage();
    const backButton = screen.getByRole('link', { name: /home/i });
    expect(backButton).toHaveAttribute('href', '/');
  });
});
