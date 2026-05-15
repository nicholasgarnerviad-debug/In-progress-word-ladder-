import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SettingsButton } from '../SettingsButton';
import * as router from 'react-router-dom';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('SettingsButton', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders settings button', () => {
    render(
      <BrowserRouter>
        <SettingsButton />
      </BrowserRouter>
    );
    const button = screen.getByRole('button', { name: /go to settings/i });
    expect(button).toBeInTheDocument();
  });

  test('navigates to /settings on click', () => {
    render(
      <BrowserRouter>
        <SettingsButton />
      </BrowserRouter>
    );
    const button = screen.getByRole('button', { name: /go to settings/i });
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  test('has proper accessibility attributes', () => {
    render(
      <BrowserRouter>
        <SettingsButton />
      </BrowserRouter>
    );
    const button = screen.getByRole('button', { name: /go to settings/i });
    expect(button).toHaveAttribute('aria-label', 'Go to settings');

    const svg = button.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  test('has focus-visible styling', () => {
    render(
      <BrowserRouter>
        <SettingsButton />
      </BrowserRouter>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus-visible:ring-2');
  });
});
