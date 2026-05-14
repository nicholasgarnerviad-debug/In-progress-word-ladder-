import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConsumableButton } from './ConsumableButton';

describe('ConsumableButton', () => {
  it('displays label and count when item is available', () => {
    render(
      <ConsumableButton
        type="hint"
        label="Hint"
        count={3}
        cost={30}
        disabled={false}
        onUse={jest.fn()}
        onBuy={jest.fn()}
      />
    );
    expect(screen.getByText('Hint (3)')).toBeInTheDocument();
  });

  it('displays label and cost when item is not available', () => {
    render(
      <ConsumableButton
        type="hint"
        label="Hint"
        count={0}
        cost={30}
        disabled={false}
        onUse={jest.fn()}
        onBuy={jest.fn()}
      />
    );
    expect(screen.getByText(/Hint \(30◎\)/)).toBeInTheDocument();
  });

  it('calls onUse when clicked with available items', () => {
    const onUse = jest.fn();
    const onBuy = jest.fn();
    render(
      <ConsumableButton
        type="hint"
        label="Hint"
        count={3}
        cost={30}
        disabled={false}
        onUse={onUse}
        onBuy={onBuy}
      />
    );
    fireEvent.click(screen.getByText('Hint (3)'));
    expect(onUse).toHaveBeenCalled();
    expect(onBuy).not.toHaveBeenCalled();
  });

  it('calls onBuy when clicked with no items', () => {
    const onUse = jest.fn();
    const onBuy = jest.fn();
    render(
      <ConsumableButton
        type="hint"
        label="Hint"
        count={0}
        cost={30}
        disabled={false}
        onUse={onUse}
        onBuy={onBuy}
      />
    );
    fireEvent.click(screen.getByText(/Hint \(30◎\)/));
    expect(onBuy).toHaveBeenCalled();
    expect(onUse).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <ConsumableButton
        type="hint"
        label="Hint"
        count={3}
        cost={30}
        disabled={true}
        onUse={jest.fn()}
        onBuy={jest.fn()}
      />
    );
    const button = screen.getByText('Hint (3)') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
