import React, { useState, useEffect } from 'react';
import { generatePuzzle } from './generatePuzzle';
import { useGameState } from './useGameState';
import { Rung } from './Rung';
import { GameKeyboard } from './GameKeyboard';
import { WordPuzzle } from './generatePuzzle';

export const App: React.FC = () => {
  const [resetKey, setResetKey] = useState(0);
  const [puzzle, setPuzzle] = useState(() => generatePuzzle(4, 'medium'));
  const [puzzleHistory, setPuzzleHistory] = useState<WordPuzzle[]>([puzzle]);
  const game = useGameState(puzzle);
  const [isGameOver, setIsGameOver] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPuzzleList, setShowPuzzleList] = useState(false);
  const [lastGamePhase, setLastGamePhase] = useState<'playing' | 'won' | 'lost'>('playing');

  // When game ends, immediately load new puzzle and show countdown
  useEffect(() => {
    if ((game.state.phase === 'won' || game.state.phase === 'lost') && lastGamePhase === 'playing') {
      const newPuzzle = generatePuzzle(4, 'medium');
      setPuzzle(newPuzzle);
      setPuzzleHistory(prev => [...prev, newPuzzle]);
      setIsGameOver(true);
      setCountdown(3);
      setResetKey(prev => prev + 1);
      setLastGamePhase(game.state.phase);
    }
  }, [game.state.phase, lastGamePhase]);

  // Countdown effect - decrements every second
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Clear game over state when new game is ready (phase is playing again)
  useEffect(() => {
    if (isGameOver && game.state.phase === 'playing') {
      setIsGameOver(false);
      setLastGamePhase('playing');
    }
  }, [game.state.phase, isGameOver]);

  const loadNewPuzzle = () => {
    const newPuzzle = generatePuzzle(4, 'medium');
    setPuzzle(newPuzzle);
    setPuzzleHistory(prev => [...prev, newPuzzle]);
    setIsGameOver(false);
    setCountdown(-1);
    setResetKey(prev => prev + 1);
  };

  const handleSubmitWord = () => {
    const word = game.state.currentInput.join('');

    if (word.length === 0) {
      return;
    }

    if (word.length !== puzzle.start.length) {
      return;
    }

    const previousWord = game.state.history[game.state.history.length - 1].join('');
    let differences = 0;
    for (let i = 0; i < word.length; i++) {
      if (word[i] !== previousWord[i]) differences++;
    }

    if (differences !== 1) {
      return;
    }

    game.submitWord();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-gray-800">Word Ladder</h1>
          <button
            onClick={() => setShowPuzzleList(!showPuzzleList)}
            className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
          >
            📋
          </button>
        </div>
        <p className="text-center text-sm text-gray-600 mb-6">Change one letter at a time</p>

        {/* Puzzle List Modal */}
        {showPuzzleList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md max-h-96 overflow-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Puzzle History ({puzzleHistory.length})</h2>
                <button
                  onClick={() => setShowPuzzleList(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                {puzzleHistory.map((p, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-2 ${
                      idx === puzzleHistory.length - 1
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-700">Puzzle #{idx + 1}</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {p.optimal.length - 1} steps
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono font-bold text-blue-600">
                        {p.start.toUpperCase()}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-mono font-bold text-green-600">
                        {p.end.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Path: {p.chain.join(' → ').toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div key={resetKey} className="bg-white rounded-lg shadow-lg p-6 mb-4">
          {/* Target word */}
          <div className="text-center mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Get from</p>
            <div className="flex gap-1 justify-center my-2">
              {puzzle.start.split('').map((letter, i) => (
                <div
                  key={i}
                  className="w-8 h-8 flex items-center justify-center bg-blue-100 border border-blue-300 rounded font-bold text-blue-900"
                >
                  {letter.toUpperCase()}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">to</p>
            <div className="flex gap-1 justify-center my-2">
              {puzzle.end.split('').map((letter, i) => (
                <div
                  key={i}
                  className="w-8 h-8 flex items-center justify-center bg-green-100 border border-green-300 rounded font-bold text-green-900"
                >
                  {letter.toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          <hr className="my-4" />

          {/* History */}
          <div className="space-y-2 min-h-20">
            {game.state.history.length > 0 ? (
              game.state.history.map((word, i) => (
                <Rung key={i} word={word} tileStates={word.map(() => 'idle')} />
              ))
            ) : (
              <p className="text-center text-gray-400 text-sm py-4">No guesses yet</p>
            )}
          </div>

          {/* Current input */}
          {game.state.currentInput.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex gap-1">
                {game.state.currentInput.map((letter, i) => (
                  <div
                    key={i}
                    className="flex-1 h-10 flex items-center justify-center bg-white border-2 border-dashed border-blue-400 rounded-md font-bold text-blue-600"
                  >
                    {letter.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Game Over Message with Countdown and Button */}
          {isGameOver && countdown > 0 && (
            <div
              className={`mt-4 p-4 rounded-lg text-center font-semibold ${
                game.state.phase === 'won'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              <div className="text-lg mb-3 font-bold">
                {game.state.phase === 'won' ? '🎉 You Won!' : '💔 Game Over!'}
              </div>
              <div className="text-5xl font-bold animate-pulse mb-3">{countdown}</div>
              <div className="text-sm mb-4">New puzzle loading...</div>
              <button
                onClick={loadNewPuzzle}
                className={`w-full py-2 px-4 rounded font-bold text-white transition-colors ${
                  game.state.phase === 'won'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                New Puzzle Now
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded p-3 text-center">
            <p className="text-xs text-gray-500">Score</p>
            <p className="text-xl font-bold text-gray-800">{game.state.score}</p>
          </div>
          <div className="bg-white rounded p-3 text-center">
            <p className="text-xs text-gray-500">Steps</p>
            <p className="text-xl font-bold text-gray-800">{game.state.history.length - 1}</p>
          </div>
          <div className="bg-white rounded p-3 text-center">
            <p className="text-xs text-gray-500">Best</p>
            <p className="text-xl font-bold text-gray-800">{puzzle.optimal.length - 1}</p>
          </div>
        </div>

        {/* Keyboard */}
        <GameKeyboard
          onPressLetter={game.pressLetter}
          onDeleteLetter={game.deleteLetter}
          onSubmitWord={handleSubmitWord}
          disabled={game.state.phase !== 'playing'}
        />
      </div>
    </div>
  );
};
