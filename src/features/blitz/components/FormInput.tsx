import React from 'react';
import { STATUS_COLORS, FOCUS_STYLES } from '../theme';

export type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** Label text for the input */
  label: string;
  /** Error message to display below input */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Show success state */
  success?: boolean;
};

/**
 * Form input field with validation feedback and accessibility support.
 *
 * Features:
 * - Label with proper association
 * - Error/success states with clear feedback
 * - Helper text for guidance
 * - Proper spacing and touch targets
 * - Full keyboard navigation support
 */
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, success, className, ...props }, ref) => {
    const hasError = !!error;
    const id = props.id || `input-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const descriptionId = `${id}-description`;

    return (
      <div className="w-full">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-describedby={error || helperText ? descriptionId : undefined}
          aria-invalid={hasError}
          className={`
            w-full px-4 py-2 border-2 rounded-lg
            transition-all duration-200
            font-base text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            ${FOCUS_STYLES.ring}
            min-h-[44px]
            ${
              hasError
                ? `border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-red-500`
                : success
                  ? `border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20 focus:ring-green-500`
                  : `border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-yellow-500`
            }
            ${className || ''}
          `}
          {...props}
        />
        {(error || helperText) && (
          <p
            id={descriptionId}
            className={`mt-2 text-sm ${
              hasError
                ? `${STATUS_COLORS.error}`
                : `text-gray-600 dark:text-gray-400`
            }`}
            role={hasError ? 'alert' : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
