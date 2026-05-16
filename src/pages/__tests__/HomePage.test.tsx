import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '../HomePage';
import { ProgressionPage } from '../ProgressionPage';

describe('HomePage', () => {
  it('should make StatsStrip clickable with cursor-pointer class', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>
    );

    // Find the StatsStrip outer container - the div with border-t and border-b
    const statsStripContainer = container.querySelector('.border-t.border-b');

    expect(statsStripContainer).toBeInTheDocument();
    expect(statsStripContainer).toHaveClass('cursor-pointer');
  });

  it('should have hover:opacity-80 class on StatsStrip', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>
    );

    const statsStripContainer = container.querySelector('.border-t.border-b');
    expect(statsStripContainer).toHaveClass('hover:opacity-80');
  });

  it('should have transition-opacity class on StatsStrip', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>
    );

    const statsStripContainer = container.querySelector('.border-t.border-b');
    expect(statsStripContainer).toHaveClass('transition-opacity');
  });

  it('should navigate to /progression when StatsStrip is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/progression" element={<ProgressionPage />} />
        </Routes>
      </MemoryRouter>
    );

    const statsStripContainer = screen.getByText('Played').closest('.border-t.border-b');
    expect(statsStripContainer).toBeInTheDocument();

    await user.click(statsStripContainer!);

    // Verify navigation by checking if ProgressionPage content is rendered
    expect(screen.getByText(/progression/i)).toBeInTheDocument();
  });
});
