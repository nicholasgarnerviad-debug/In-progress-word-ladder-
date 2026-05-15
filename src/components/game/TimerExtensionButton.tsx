import React from 'react';

export interface TimerExtensionButtonProps {
  onAddTime: () => void;
  disabled?: boolean;
  secondsToAdd?: number;
}

export const TimerExtensionButton: React.FC<TimerExtensionButtonProps> = ({
  onAddTime,
  disabled = false,
  secondsToAdd = 15,
}) => {
  return (
    <button
      onClick={onAddTime}
      disabled={disabled}
      className="px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
      aria-label={`Add ${secondsToAdd} seconds`}
    >
      ⏱️ +{secondsToAdd}s
    </button>
  );
};
