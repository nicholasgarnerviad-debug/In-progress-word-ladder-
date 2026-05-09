import React, { useState, useEffect } from 'react';
import { LetterTile, TileState } from './LetterTile';

interface RungProps {
  word: string[];
  tileStates: TileState[];
  status?: 'correct' | 'wrong' | 'neutral';
  showShake?: boolean;
  onShakeComplete?: () => void;
}

const StatusIcon: React.FC<{ status?: 'correct' | 'wrong' | 'neutral' }> = ({ status }) => {
  switch (status) {
    case 'correct':
      return (
        <div className="w-6 h-6 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case 'wrong':
      return (
        <div className="w-6 h-6 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    default:
      return <div className="w-6 h-6" />;
  }
};

export const Rung: React.FC<RungProps> = ({
  word,
  tileStates,
  status = 'neutral',
  showShake = false,
  onShakeComplete
}) => {
  const [isShaking, setIsShaking] = useState(showShake);

  useEffect(() => {
    if (showShake) {
      setIsShaking(true);
      const timer = setTimeout(() => {
        setIsShaking(false);
        onShakeComplete?.();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showShake, onShakeComplete]);

  return (
    <>
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
          }

          .shake-animation {
            animation: shake 300ms ease-in-out;
          }
        `}
      </style>
      <div
        className={`
          flex items-center gap-3 p-4 rounded-lg
          transition-all duration-200
          ${isShaking ? 'shake-animation' : ''}
          ${status === 'wrong' ? 'bg-red-50' : status === 'correct' ? 'bg-green-50' : 'bg-white'}
        `}
      >
        <div className="flex gap-2">
          {word.map((letter, index) => (
            <LetterTile
              key={index}
              letter={letter}
              state={tileStates[index] || 'idle'}
            />
          ))}
        </div>

        <div className="ml-auto">
          <StatusIcon status={status} />
        </div>
      </div>
    </>
  );
};
