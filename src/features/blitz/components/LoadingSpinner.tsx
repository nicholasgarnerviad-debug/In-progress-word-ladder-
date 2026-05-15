import React from 'react';
import { SPINNER_SIZES } from '../theme';

export type LoadingSpinnerProps = {
  /** Size of the spinner */
  size?: keyof typeof SPINNER_SIZES;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
};

/**
 * Loading spinner for async operations.
 *
 * Displays an animated spinning circle with accessibility support.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  ariaLabel = 'Loading',
}) => {
  return (
    <div
      className={`animate-spin ${SPINNER_SIZES[size]}`}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <svg
        className="w-full h-full text-yellow-600 dark:text-yellow-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};
