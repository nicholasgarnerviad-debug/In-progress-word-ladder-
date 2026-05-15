import React from 'react';

export interface HintRevealButtonsProps {
  onHint: () => void;
  onReveal: () => void;
  disableHint?: boolean;
  disableReveal?: boolean;
}

export const HintRevealButtons: React.FC<HintRevealButtonsProps> = ({
  onHint,
  onReveal,
  disableHint = false,
  disableReveal = false,
}) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={onHint}
        disabled={disableHint}
        className="px-4 py-2 bg-yellow-500 dark:bg-yellow-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-600 dark:hover:bg-yellow-700 transition-colors"
        aria-label="Get hint"
      >
        💡 Hint
      </button>
      <button
        onClick={onReveal}
        disabled={disableReveal}
        className="px-4 py-2 bg-purple-500 dark:bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 dark:hover:bg-purple-700 transition-colors"
        aria-label="Reveal answer"
      >
        👀 Reveal
      </button>
    </div>
  );
};
