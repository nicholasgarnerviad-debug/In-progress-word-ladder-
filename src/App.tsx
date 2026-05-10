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

  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('wordladder-coins');
    return saved ? parseInt(saved, 10) : 150;
  });

  const [roundResult, setRoundResult] = useState<{
    type: 'won' | 'lost';
    coinsDelta: number;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem('wordladder-coins', String(coins));
  }, [coins]);

  // Calculate coin changes when game ends
  useEffect(() => {
    if ((game.state.phase === 'won' || game.state.phase === 'lost') && lastGamePhase === 'playing') {
      if (game.state.phase === 'won') {
        const extraSteps = (game.state.history.length - 1) - puzzle.optimal;
        const mistakes = game.state.failedSubmissions;
        const baseReward = 100;
        const efficiency = Math.max(0, baseReward - (extraSteps * 15));
        const mistakePenalty = mistakes * 20;
        const winReward = Math.max(20, efficiency - mistakePenalty);

        setCoins(prev => prev + winReward);
        setRoundResult({ type: 'won', coinsDelta: winReward });
      } else {
        const lossPenalty = 50;
        setCoins(prev => Math.max(0, prev - lossPenalty));
        setRoundResult({ type: 'lost', coinsDelta: -lossPenalty });
      }

      const newPuzzle = generatePuzzle(4, 'medium');
      setPuzzle(newPuzzle);
      setPuzzleHistory(prev => [...prev, newPuzzle]);
      setIsGameOver(true);
      setCountdown(3);
      setResetKey(prev => prev + 1);
      setLastGamePhase(game.state.phase);
    }
  }, [game.state.phase, lastGamePhase, puzzle.optimal, game.state.history.length, game.state.failedSubmissions]);

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

  const getHintIndex = (): number | null => {
    const nextWordIndex = game.state.history.length;
    if (nextWordIndex >= puzzle.chain.length) return null;

    const nextWord = puzzle.chain[nextWordIndex];
    const currentWord = game.state.history[game.state.history.length - 1].join('');

    for (let i = 0; i < nextWord.length; i++) {
      if (nextWord[i] !== currentWord[i]) return i;
    }
    return null;
  };

  const handleUseHint = () => {
    if (coins < 30 || game.state.phase !== 'playing') return;

    const hintIndex = getHintIndex();
    if (hintIndex === null) return;

    setCoins(prev => prev - 30);
    game.applyHint(hintIndex);
  };

  const handleRevealStep = () => {
    if (coins < 60 || game.state.phase !== 'playing') return;

    const nextWordIndex = game.state.history.length;
    if (nextWordIndex >= puzzle.chain.length) return;

    const nextWord = puzzle.chain[nextWordIndex].split('');
    setCoins(prev => prev - 60);
    game.applyReveal(nextWord);
  };

  const handleUndoStep = () => {
    if (coins < 20 || game.state.history.length <= 1 || game.state.phase !== 'playing') return;

    setCoins(prev => prev - 20);
    game.undoStep();
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
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-1">
            <span className="text-2xl">◎</span>
            <span className="text-lg font-bold text-gray-800">{coins}</span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span key={i} className={game.state.lives > i ? 'text-red-500 text-lg' : 'text-gray-300 text-lg'}>
                ❤
              </span>
            ))}
          </div>
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
                        {p.optimal} steps
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
              game.state.history.map((word, i) => {
                const isLastWord = i === game.state.history.length - 1;
                const tileStates = word.map((_, j) =>
                  isLastWord && game.state.lastHintedIndex === j ? 'hinted' : 'idle'
                );
                return <Rung key={i} word={word} tileStates={tileStates} />;
              })
            ) : (
              <p className="text-center text-gray-400 text-sm py-4">No guesses yet</p>
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
                    className="flex-1 h-10 flex items-center justify-center rounded-md font-bold transition-colors bg-white border-2 border-dashed border-blue-400 text-blue-600"
                  >
                    {letter.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Game Over Message with Countdown and Button */}
          {isGameOver && countdown > 0 && roundResult && (
            <div
              className={`mt-4 p-4 rounded-lg text-center font-semibold ${
                roundResult.type === 'won'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              <div className="text-lg mb-3 font-bold">
                {roundResult.type === 'won' ? '🎉 You Won!' : '💔 Game Over!'}
              </div>
              <div className={`text-lg font-bold mb-2 ${roundResult.coinsDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roundResult.coinsDelta >= 0 ? '+' : ''}{roundResult.coinsDelta} ◎
              </div>
              <div className="text-5xl font-bold animate-pulse mb-3">{countdown}</div>
              <div className="text-sm mb-4">New puzzle loading...</div>
              <button
                onClick={loadNewPuzzle}
                className={`w-full py-2 px-4 rounded font-bold text-white transition-colors ${
                  roundResult.type === 'won'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                New Puzzle Now
              </button>
            </div>
          )}
        </div>

        {/* Power-ups */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleUseHint}
            disabled={coins < 30 || game.state.phase !== 'playing' || game.state.lastHintedIndex !== null}
            className={`flex-1 py-2 px-3 rounded font-semibold text-sm transition-colors ${
              coins < 30 || game.state.phase !== 'playing' || game.state.lastHintedIndex !== null
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-amber-400 text-amber-900 hover:bg-amber-500'
            }`}
          >
            Hint (30◎)
          </button>
          <button
            onClick={handleRevealStep}
            disabled={coins < 60 || game.state.phase !== 'playing' || game.state.lastRevealedWord !== null}
            className={`flex-1 py-2 px-3 rounded font-semibold text-sm transition-colors ${
              coins < 60 || game.state.phase !== 'playing' || game.state.lastRevealedWord !== null
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-cyan-400 text-cyan-900 hover:bg-cyan-500'
            }`}
          >
            Reveal (60◎)
          </button>
          <button
            onClick={handleUndoStep}
            disabled={coins < 20 || game.state.history.length <= 1 || game.state.phase !== 'playing'}
            className={`flex-1 py-2 px-3 rounded font-semibold text-sm transition-colors ${
              coins < 20 || game.state.history.length <= 1 || game.state.phase !== 'playing'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-400 text-purple-900 hover:bg-purple-500'
            }`}
          >
            Undo (20◎)
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white rounded p-3 text-center">
            <p className="text-xs text-gray-500">Steps</p>
            <p className="text-xl font-bold text-gray-800">{game.state.history.length - 1}</p>
          </div>
          <div className="bg-white rounded p-3 text-center">
            <p className="text-xs text-gray-500">Best</p>
            <p className="text-xl font-bold text-gray-800">{puzzle.optimal}</p>
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
