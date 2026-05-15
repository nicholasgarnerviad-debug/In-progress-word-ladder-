import React from 'react';
import { SHADOWS } from '../theme';

export type CardProps = {
  /** Content of the card */
  children: React.ReactNode;
  /** Optional title to display at top */
  title?: string;
  /** Optional description/subtitle */
  description?: string;
  /** Shadow depth */
  shadow?: keyof typeof SHADOWS;
  /** Custom className */
  className?: string;
  /** Padding size */
  padding?: 'sm' | 'md' | 'lg';
};

const paddingMap = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * Reusable card component for consistent layout and styling.
 *
 * Features:
 * - Responsive background and borders
 * - Optional title and description
 * - Configurable shadow depth
 * - Dark mode support
 * - Proper spacing and typography
 */
export const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  shadow = 'md',
  className,
  padding = 'md',
}) => {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg
        ${SHADOWS[shadow]}
        ${paddingMap[padding]}
        transition-all duration-200
        ${className || ''}
      `}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};
