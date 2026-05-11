import React, { useState, useEffect, useRef } from 'react';
import { WordPuzzle } from '../generatePuzzle';
import { useGameState } from '../useGameState';
import { Rung } from '../Rung';
import { GameKeyboard } from '../GameKeyboard';

export type PuzzleBoardProps = {
  puzzle: WordPuzzle;
  /** Called when the player successfully completes the ladder (reaches end word). */
  onSolved?: () => void;
  /** Optional: called whenever a wrong/invalid word is submitted. Useful for mode-specific feedback. */
  onWrongGuess?: () => void;
  /** Optional: hide elements that don't belong in alternate modes. Defaults to false. */
  hideScore?: boolean;
  /** Optional: disable input (used during pause / transition between puzzles). */
  disabled?: boolean;
};

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  puzzle,
  onSolved,
  onWrongGuess,
  hideScore = false,
  disabled = false,
}) => {
  const game = useGameState(puzzle);
  const [submissionError, setSubmissionError] = useState(false);
  const prevFailedRef = useRef(game.state.failedSubmissions);

  // Show error message when a word is rejected
  useEffect(() => {
    if (game.state.failedSubmissions > prevFailedRef.current) {
      prevFailedRef.current = game.state.failedSubmissions;
      setSubmissionError(true);
      onWrongGuess?.();
      const timer = setTimeout(() => setSubmissionError(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [game.state.failedSubmissions, onWrongGuess]);

  // Detect when puzzle is solved and call callback
  useEffect(() => {
    if (game.state.phase === 'won') {
      onSolved?.();
    }
  }, [game.state.phase, onSolved]);

  const handleSubmitWord = () => {
    if (disabled) return;

    const word = game.state.currentInput.join('');

    if (word.length === 0) {
      return;
    }

    game.submitWord();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Target word */}
      <div className="text-center mb-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Get from</p>
        <div className="flex gap-1 justify-center my-2">
          {puzzle.start.split('').map((letter, i) => (
            <div
              key={i}
              className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-600 rounded font-bold text-blue-900 dark:text-blue-200"
            >
              {letter.toUpperCase()}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">to</p>
        <div className="flex gap-1 justify-center my-2">
          {puzzle.end.split('').map((letter, i) => (
            <div
              key={i}
              className="w-8 h-8 flex items-center justify-center bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-600 rounded font-bold text-green-900 dark:text-green-200"
            >
              {letter.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      <hr className="my-4 border-gray-200 dark:border-gray-600" />

      {/* History */}
      <div className="space-y-2 min-h-20">
        {game.state.history.length > 0 ? (
          game.state.history.map((word, i) => {
            const isLastWord = i === game.state.history.length - 1;
            const prevWord = i > 0 ? game.state.history[i - 1] : null;
            const tileStates = word.map((letter, j) => {
              if (isLastWord && game.state.lastHintedIndex === j) return 'hinted';
              if (prevWord && letter !== prevWord[j]) return 'changed';
              return 'idle';
            });
            return <Rung key={i} word={word} tileStates={tileStates} />;
          })
        ) : (
          <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">No guesses yet</p>
        )}
      </div>

      {/* Revealed word ghost row */}
      {game.state.lastRevealedWord && (
        <Rung
          word={game.state.lastRevealedWord}
          tileStates={game.state.lastRevealedWord.map(() => 'locked')}
          status="neutral"
        />
      )}

      {/* Current input */}
      {game.state.currentInput.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex gap-1">
            {game.state.currentInput.map((letter, i) => (
              <div
                key={i}
                className="flex-1 h-10 flex items-center justify-center rounded-md font-bold transition-colors bg-white dark:bg-gray-700 border-2 border-dashed border-blue-400 text-blue-600 dark:text-blue-400"
              >
                {letter.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {submissionError && (
        <p className="text-center text-red-500 dark:text-red-400 text-sm mt-2 font-semibold">
          Not a valid word
        </p>
      )}

      {!hideScore && (
        <div className="grid grid-cols-2 gap-2 my-4">
          <div className="bg-white dark:bg-gray-800 rounded p-3 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Steps</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{game.state.history.length - 1}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded p-3 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Best</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{puzzle.optimal - 1}</p>
          </div>
        </div>
      )}

      {/* Keyboard */}
      <GameKeyboard
        onPressLetter={game.pressLetter}
        onDeleteLetter={game.deleteLetter}
        onSubmitWord={handleSubmitWord}
        disabled={disabled || game.state.phase !== 'playing'}
      />
    </div>
  );
};
