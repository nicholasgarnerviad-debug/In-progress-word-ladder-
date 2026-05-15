import React, { useEffect } from 'react';

interface GameKeyboardProps {
  onPressLetter: (letter: string) => void;
  onDeleteLetter: () => void;
  onSubmitWord: () => void;
  disabled?: boolean;
}

const rows = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

const KeyButton: React.FC<{
  letter: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'letter' | 'delete' | 'submit';
}> = ({ letter, onClick, disabled = false, variant = 'letter' }) => {
  const baseClasses = `
    h-10 rounded-md font-semibold text-sm uppercase
    transition-all duration-100 select-none
    active:scale-95 active:brightness-90
  `;

  const variantClasses = {
    letter: `
      flex-1 min-w-0 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100
      hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    delete: `
      flex-1 min-w-0 bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-300 border border-red-300 dark:border-red-700
      hover:bg-red-200 dark:hover:bg-red-900/60 active:bg-red-300
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    submit: `
      flex-1 min-w-0 bg-green-800 text-white font-bold
      hover:bg-green-900 active:bg-green-950
      disabled:opacity-50 disabled:cursor-not-allowed
    `
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]}`}
      onPointerDown={(e) => {
        if (disabled) return;
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      aria-label={variant === 'delete' ? 'Delete letter' : variant === 'submit' ? 'Submit word' : `Letter ${letter}`}
      type="button"
    >
      {letter}
    </button>
  );
};

export const GameKeyboard: React.FC<GameKeyboardProps> = ({
  onPressLetter,
  onDeleteLetter,
  onSubmitWord,
  disabled = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      const key = e.key.toUpperCase();

      if (/^[A-Z]$/.test(key)) {
        e.preventDefault();
        onPressLetter(key);
        return;
      }

      switch (e.key) {
        case 'Backspace':
          e.preventDefault();
          onDeleteLetter();
          break;
        case 'Enter':
          e.preventDefault();
          onSubmitWord();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPressLetter, onDeleteLetter, onSubmitWord, disabled]);

  return (
    <div className="w-full space-y-2 p-2">
      {/* Row 1: QWERTY */}
      <div className="flex gap-1">
        {rows[0].map((letter) => (
          <KeyButton
            key={letter}
            letter={letter}
            onClick={() => onPressLetter(letter)}
            disabled={disabled}
            variant="letter"
          />
        ))}
      </div>

      {/* Row 2: ASDF... */}
      <div className="flex gap-1">
        <div className="w-5" />
        {rows[1].map((letter) => (
          <KeyButton
            key={letter}
            letter={letter}
            onClick={() => onPressLetter(letter)}
            disabled={disabled}
            variant="letter"
          />
        ))}
        <div className="w-5" />
      </div>

      {/* Row 3: ZXCV... with Delete and Submit */}
      <div className="flex gap-1">
        <KeyButton
          letter="⌫"
          onClick={onDeleteLetter}
          disabled={disabled}
          variant="delete"
        />
        {rows[2].map((letter) => (
          <KeyButton
            key={letter}
            letter={letter}
            onClick={() => onPressLetter(letter)}
            disabled={disabled}
            variant="letter"
          />
        ))}
        <KeyButton
          letter="GO"
          onClick={onSubmitWord}
          disabled={disabled}
          variant="submit"
        />
      </div>
    </div>
  );
};
