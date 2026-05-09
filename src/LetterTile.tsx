import React from 'react';

export type TileState = 'idle' | 'changed' | 'locked' | 'burned' | 'input' | 'selected';

interface LetterTileProps {
  letter: string;
  state: TileState;
}

const stateClasses: Record<TileState, string> = {
  idle: 'bg-gray-100 text-gray-900 border border-gray-200',
  changed: 'bg-blue-100 border-2 border-blue-400 text-blue-900 font-semibold',
  locked: 'bg-amber-100 border-2 border-amber-400 text-amber-900 font-semibold',
  burned: 'bg-red-100 border-2 border-red-400 text-red-900 font-semibold',
  input: 'bg-white border-2 border-dashed border-gray-300 text-gray-900',
  selected: 'bg-blue-50 border-2 border-blue-500 text-blue-900 font-semibold ring-2 ring-blue-200'
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
