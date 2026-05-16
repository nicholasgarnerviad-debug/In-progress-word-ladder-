import React from 'react';

export interface HintRevealButtonsProps {
  onHint: () => void;
  onReveal: () => void;
  disableHint?: boolean;
  disableReveal?: boolean;
  hintCount?: number;
  revealCount?: number;
  hintCost?: number;
  revealCost?: number;
}

export const HintRevealButtons: React.FC<HintRevealButtonsProps> = ({
  onHint,
  onReveal,
  disableHint = false,
  disableReveal = false,
  hintCount = 0,
  revealCount = 0,
  hintCost = 30,
  revealCost = 60,
}) => {
  return (
    <div className="flex gap-4 justify-center">
      <button
        onClick={onHint}
        disabled={disableHint}
        className="px-4 py-3 min-h-[48px] min-w-[48px] flex items-center justify-center bg-yellow-800 dark:bg-yellow-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-900 dark:hover:bg-yellow-600 transition-colors font-semibold"
        aria-label="Get hint"
      >
        💡 Hint {hintCount > 0 ? hintCount : hintCost + '◎'}
      </button>
      <button
        onClick={onReveal}
        disabled={disableReveal}
        className="px-4 py-3 min-h-[48px] min-w-[48px] flex items-center justify-center bg-purple-700 dark:bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-800 dark:hover:bg-purple-500 transition-colors font-semibold"
        aria-label="Reveal answer"
      >
        👀 Reveal {revealCount > 0 ? revealCount : revealCost + '◎'}
      </button>
    </div>
  );
};
