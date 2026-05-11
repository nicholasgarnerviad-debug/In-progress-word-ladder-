import React, { useState, useEffect, useRef } from 'react';
import { generatePuzzle } from './generatePuzzle';
import { shortestPath } from './wordGraph';
import { useGameState } from './useGameState';
import { Rung } from './Rung';
import { GameKeyboard } from './GameKeyboard';
import { WordPuzzle } from './generatePuzzle';
import { loadStats, saveStats, recordWin, recordLoss } from './lib/stats';

interface PuzzleRecord {
  puzzle: WordPuzzle;
  playerPath: string[];
  result: 'won' | 'lost';
  coinsDelta: number;
  timestamp: number;
}

export const ClassicGame: React.FC = () => {
  const [resetKey, setResetKey] = useState(0);
  const [puzzle, setPuzzle] = useState(() => generatePuzzle(4, 'medium'));
  const game = useGameState(puzzle);
  const [isGameOver, setIsGameOver] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPuzzleList, setShowPuzzleList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastGamePhase, setLastGamePhase] = useState<'playing' | 'won' | 'lost'>('playing');

  const [puzzleRecords, setPuzzleRecords] = useState<PuzzleRecord[]>(() => {
    const saved = localStorage.getItem('wordladder-records');
    return saved ? JSON.parse(saved) : [];
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('wordladder-dark') === 'true';
  });

  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('wordladder-coins');
    return saved ? parseInt(saved, 10) : 150;
  });

  const [roundResult, setRoundResult] = useState<{
    type: 'won' | 'lost';
    coinsDelta: number;
  } | null>(null);

  const [submissionError, setSubmissionError] = useState(false);
  const prevFailedRef = useRef(game.state.failedSubmissions);

  useEffect(() => {
    localStorage.setItem('wordladder-coins', String(coins));
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('wordladder-records', JSON.stringify(puzzleRecords));
  }, [puzzleRecords]);

  useEffect(() => {
    localStorage.setItem('wordladder-dark', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Calculate coin changes and record stats when game ends
  useEffect(() => {
    if ((game.state.phase === 'won' || game.state.phase === 'lost') && lastGamePhase === 'playing') {
      let stats = loadStats();

      if (game.state.phase === 'won') {
        const extraSteps = (game.state.history.length - 1) - (puzzle.optimal - 1);
        const mistakes = game.state.failedSubmissions;
        const baseReward = 100;
        const efficiency = Math.max(0, baseReward - (extraSteps * 15));
        const mistakePenalty = mistakes * 20;
        const winReward = Math.max(20, efficiency - mistakePenalty);

        setCoins(prev => prev + winReward);
        setRoundResult({ type: 'won', coinsDelta: winReward });

        const wonRecord: PuzzleRecord = {
          puzzle,
          playerPath: game.state.history.map(w => w.join('')),
          result: 'won',
          coinsDelta: winReward,
          timestamp: Date.now()
        };
        setPuzzleRecords(prev => [...prev, wonRecord]);

        stats = recordWin(stats);
        saveStats(stats);
      } else {
        const lossPenalty = 50;
        setCoins(prev => Math.max(0, prev - lossPenalty));
        setRoundResult({ type: 'lost', coinsDelta: -lossPenalty });

        const lostRecord: PuzzleRecord = {
          puzzle,
          playerPath: game.state.history.map(w => w.join('')),
          result: 'lost',
          coinsDelta: -50,
          timestamp: Date.now()
        };
        setPuzzleRecords(prev => [...prev, lostRecord]);

        stats = recordLoss(stats);
        saveStats(stats);
      }

      const newPuzzle = generatePuzzle(4, 'medium');
      setPuzzle(newPuzzle);
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

  // Show error message when a word is rejected
  useEffect(() => {
    if (game.state.failedSubmissions > prevFailedRef.current) {
      prevFailedRef.current = game.state.failedSubmissions;
      setSubmissionError(true);
      const timer = setTimeout(() => setSubmissionError(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [game.state.failedSubmissions]);

  const loadNewPuzzle = () => {
    const newPuzzle = generatePuzzle(4, 'medium');
    setPuzzle(newPuzzle);
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
    const currentWord = game.state.history[game.state.history.length - 1].join('');
    if (currentWord === puzzle.end) return null;
    const path = shortestPath(currentWord, puzzle.end);
    if (!path || path.length < 2) return null;
    const nextWord = path[1];
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
    const currentWord = game.state.history[game.state.history.length - 1].join('');
    if (currentWord === puzzle.end) return;
    const path = shortestPath(currentWord, puzzle.end);
    if (!path || path.length < 2) return;
    setCoins(prev => prev - 60);
    game.applyReveal(path[1].split(''));
  };

  const handleResetCoins = () => {
    setCoins(150);
  };

  const handleUndoStep = () => {
    if (coins < 20 || game.state.history.length <= 1 || game.state.phase !== 'playing') return;

    setCoins(prev => prev - 20);
    game.undoStep();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Word Ladder</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPuzzleList(!showPuzzleList)}
              className="text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-3 py-1 rounded"
            >
              📋
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-3 py-1 rounded"
            >
              ⚙️
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-1">
            <span className="text-2xl">◎</span>
            <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{coins}</span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span key={i} className={game.state.lives > i ? 'text-red-500 text-lg' : 'text-gray-300 text-lg'}>
                ❤
              </span>
            ))}
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">Change one letter at a time</p>

        {/* Puzzle History Modal */}
        {showPuzzleList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Puzzle History ({puzzleRecords.length} completed)
                </h2>
                <button
                  onClick={() => setShowPuzzleList(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* IN PROGRESS CARD */}
                <div className="p-3 rounded-lg border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">▶ In Progress</span>
                    <span className="text-xs bg-blue-200 dark:bg-blue-700 dark:text-blue-200 px-2 py-1 rounded">
                      {puzzle.optimal - 1} steps optimal
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-300">{puzzle.start.toUpperCase()}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-mono font-bold text-green-600 dark:text-green-400">{puzzle.end.toUpperCase()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-xs">
                    {game.state.history.map((word, i) => (
                      <span key={i} className="font-mono bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-2 py-0.5 rounded">
                        {word.join('').toUpperCase()}
                      </span>
                    ))}
                    {Array.from({ length: Math.max(0, puzzle.optimal - 1 - game.state.history.length) }).map((_, i) => (
                      <span key={`lock-${i}`} className="font-mono bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-500 px-2 py-0.5 rounded">
                        ???
                      </span>
                    ))}
                    <span className="font-mono bg-green-100 dark:bg-green-900/50 dark:text-green-400 border border-green-300 dark:border-green-600 px-2 py-0.5 rounded">
                      {puzzle.end.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* COMPLETED RECORDS — newest first */}
                {[...puzzleRecords].reverse().map((record, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-2 ${
                      record.result === 'won'
                        ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                        : 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">
                          #{puzzleRecords.length - idx}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          record.result === 'won'
                            ? 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-200'
                            : 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-200'
                        }`}>
                          {record.result === 'won' ? 'WON' : 'LOST'}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${record.coinsDelta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {record.coinsDelta >= 0 ? '+' : ''}{record.coinsDelta}◎
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm mb-3">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-300">{record.puzzle.start.toUpperCase()}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-mono font-bold text-green-600 dark:text-green-400">{record.puzzle.end.toUpperCase()}</span>
                    </div>

                    <div className="mb-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your path ({record.playerPath.length - 1} steps)</p>
                      <div className="flex flex-wrap gap-1">
                        {record.playerPath.map((word, i) => (
                          <span key={i} className="font-mono text-xs bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-2 py-0.5 rounded">
                            {word.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Optimal ({record.puzzle.optimal} steps)</p>
                      <div className="flex flex-wrap gap-1">
                        {record.puzzle.chain.map((word, i) => (
                          <span key={i} className="font-mono text-xs bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700 px-2 py-0.5 rounded">
                            {word.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {puzzleRecords.length === 0 && (
                  <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">
                    Complete a puzzle to unlock your history!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">Dark Mode</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Switch to dark color theme</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDarkMode(prev => !prev)}
                    className={`w-14 h-7 rounded-full transition-colors relative flex items-center cursor-pointer ${
                      darkMode ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                    aria-label="Toggle dark mode"
                  >
                    <span className="w-6 h-6 bg-white rounded-full shadow m-0.5 flex items-center justify-center text-sm leading-none">
                      {darkMode ? '🌙' : '☀️'}
                    </span>
                  </button>
                </div>

                <hr className="border-gray-200 dark:border-gray-600" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">Reset Coins</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Restore balance to 150◎</p>
                  </div>
                  <button
                    onClick={handleResetCoins}
                    className="bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-300 text-red-700 font-semibold text-sm px-3 py-1.5 rounded"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div key={resetKey} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4">
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

          {/* Game Over Message with Countdown and Button */}
          {isGameOver && countdown > 0 && roundResult && (
            <div
              className={`mt-4 p-4 rounded-lg text-center font-semibold ${
                roundResult.type === 'won'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}
            >
              <div className="text-lg mb-3 font-bold">
                {roundResult.type === 'won' ? '🎉 You Won!' : '💔 Game Over!'}
              </div>
              <div className={`text-lg font-bold mb-2 ${roundResult.coinsDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roundResult.coinsDelta >= 0 ? '+' : ''}{roundResult.coinsDelta} ◎
              </div>
              <div className="text-5xl font-bold animate-pulse mb-3">{countdown}</div>
              <div className="text-sm mb-4 dark:text-gray-300">New puzzle loading...</div>
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
              {puzzle.alternativePaths && puzzle.alternativePaths.length > 0 && (
                <div className="mt-3 text-left">
                  <p className="text-xs font-semibold mb-1 opacity-70">Other valid paths:</p>
                  {puzzle.alternativePaths.slice(0, 3).map((path, i) => (
                    <p key={i} className="text-xs font-mono opacity-60">
                      {path.join(' → ')}
                    </p>
                  ))}
                </div>
              )}
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
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
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
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
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
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                : 'bg-purple-400 text-purple-900 hover:bg-purple-500'
            }`}
          >
            Undo (20◎)
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded p-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Steps</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{game.state.history.length - 1}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded p-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Best</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{puzzle.optimal - 1}</p>
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
