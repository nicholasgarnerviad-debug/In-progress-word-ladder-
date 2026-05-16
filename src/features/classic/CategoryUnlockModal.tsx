// src/features/classic/CategoryUnlockModal.tsx

import React, { useEffect } from 'react';

/**
 * Props for the CategoryUnlockModal component.
 */
interface CategoryUnlockModalProps {
  /** The length of the word category that was just completed */
  completedWordLength: number;
  /** The length of the word category that is now unlocked */
  nextWordLength: number;
  /** Callback fired when user chooses to continue with current category */
  onContinue: () => void;
  /** Callback fired when user chooses to advance to the next category */
  onAdvance: () => void;
}

export const CategoryUnlockModal: React.FC<CategoryUnlockModalProps> = ({
  completedWordLength,
  nextWordLength,
  onContinue,
  onAdvance,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onContinue();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onContinue]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-complete-heading"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-sm mx-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="category-complete-heading"
          className="text-3xl font-bold mb-2"
        >
          🎉 Category Complete!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You've completed all {completedWordLength}-letter puzzles.
        </p>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
          {nextWordLength}-letter puzzles are now unlocked!
        </p>

        <div className="space-y-3">
          <button
            autoFocus
            onClick={onAdvance}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            Start {nextWordLength}-Letter
          </button>
          <button
            onClick={onContinue}
            className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-semibold"
          >
            Continue {completedWordLength}-Letter
          </button>
        </div>
      </div>
    </div>
  );
};
