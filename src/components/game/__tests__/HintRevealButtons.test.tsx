import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HintRevealButtons } from '../HintRevealButtons';

describe('HintRevealButtons', () => {
  it('calls onHint when hint button clicked', () => {
    const onHint = jest.fn();
    const onReveal = jest.fn();

    render(<HintRevealButtons onHint={onHint} onReveal={onReveal} />);

    const hintButton = screen.getByText(/hint/i);
    fireEvent.click(hintButton);

    expect(onHint).toHaveBeenCalled();
  });

  it('calls onReveal when reveal button clicked', () => {
    const onHint = jest.fn();
    const onReveal = jest.fn();

    render(<HintRevealButtons onHint={onHint} onReveal={onReveal} />);

    const revealButton = screen.getByText(/reveal/i);
    fireEvent.click(revealButton);

    expect(onReveal).toHaveBeenCalled();
  });

  it('disables buttons when disabled prop true', () => {
    const onHint = jest.fn();
    const onReveal = jest.fn();

    render(
      <HintRevealButtons
        onHint={onHint}
        onReveal={onReveal}
        disableHint={true}
        disableReveal={true}
      />
    );

    expect(screen.getByText(/hint/i)).toBeDisabled();
    expect(screen.getByText(/reveal/i)).toBeDisabled();
  });
});
