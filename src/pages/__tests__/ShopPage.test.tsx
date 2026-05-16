import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ShopPage } from '../ShopPage';
import { SHOP_ITEMS } from '../../lib/economy/shop';
import { getDefaultWallet } from '../../lib/economy/wallet';
import { getDefaultInventory } from '../../lib/economy/inventory';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

describe('ShopPage', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  test('renders shop page with all items', async () => {
    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Shop')).toBeInTheDocument();
    });

    expect(screen.getByText(/💰 \d+ coins/i)).toBeInTheDocument();

    // Check all items are rendered
    SHOP_ITEMS.forEach(item => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    });
  });

  test('displays live coin balance in header', async () => {
    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/💰 150 coins/i)).toBeInTheDocument();
    });
  });

  test('opens confirmation modal when buy clicked', async () => {
    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    // Wait for shop to load
    await waitFor(() => {
      expect(screen.getByText('Shop')).toBeInTheDocument();
    });

    const buyButtons = screen.getAllByRole('button', { name: /buy/i });
    fireEvent.click(buyButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  test('closes modal when cancel clicked', async () => {
    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    // Wait for shop to load
    await waitFor(() => {
      expect(screen.getByText('Shop')).toBeInTheDocument();
    });

    const buyButtons = screen.getAllByRole('button', { name: /buy/i });
    fireEvent.click(buyButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
