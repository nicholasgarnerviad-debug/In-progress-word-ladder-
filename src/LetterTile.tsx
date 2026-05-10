import React from 'react';

export type TileState = 'idle' | 'changed' | 'locked' | 'burned' | 'input' | 'selected' | 'hinted';

interface LetterTileProps {
  letter: string;
  state: TileState;
}

const stateClasses: Record<TileState, string> = {
  idle: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600',
  changed: 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-500 text-blue-900 dark:text-blue-200 font-semibold',
  locked: 'bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-400 dark:border-amber-500 text-amber-900 dark:text-amber-200 font-semibold',
  burned: 'bg-red-100 dark:bg-red-900/40 border-2 border-red-400 dark:border-red-500 text-red-900 dark:text-red-200 font-semibold',
  input: 'bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100',
  selected: 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 text-blue-900 dark:text-blue-200 font-semibold ring-2 ring-blue-200 dark:ring-blue-700',
  hinted: 'bg-white dark:bg-gray-700 border-2 border-amber-400 dark:border-amber-400 text-gray-900 dark:text-gray-100 ring-2 ring-amber-300 dark:ring-amber-500'
};

export const LetterTile: React.FC<LetterTileProps> = ({ letter, state }) => {
  return (
    <div
      className={`
        w-12 h-12 flex items-center justify-center rounded-lg
        text-lg font-bold uppercase transition-all duration-200
        ${stateClasses[state]}
      `}
      role="img"
      aria-label={`Letter ${letter}, ${state} state`}
    >
      {letter}
    </div>
  );
};
