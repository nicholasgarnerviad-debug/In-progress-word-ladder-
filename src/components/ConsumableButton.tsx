import React from 'react';
import { ConsumableType } from '../lib/economy';

export interface ConsumableButtonProps {
  type: ConsumableType;
  label: string;
  count: number;
  cost: number;
  disabled: boolean;
  onUse: () => void;
  onBuy: () => void;
}

export const ConsumableButton: React.FC<ConsumableButtonProps> = ({
  label,
  count,
  cost,
  disabled,
  onUse,
  onBuy
}) => {
  const hasItem = count > 0;

  const handleClick = () => {
    if (hasItem) {
      onUse();
    } else {
      onBuy();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={hasItem ? `Use ${label}` : `Buy ${label} for ${cost} coins`}
      className={`px-4 py-3 min-h-[48px] min-w-[48px] rounded-lg text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none flex items-center justify-center ${
        disabled
          ? 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed'
          : hasItem
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
      }`}
      title={hasItem ? `Use ${label}` : `Buy ${label} for ${cost} coins`}
    >
      {label} {hasItem ? `(${count})` : `(${cost}◎)`}
    </button>
  );
};
