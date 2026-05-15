import React, { useState, useEffect, useRef } from 'react';
import { generatePuzzle, Difficulty, generatePuzzleWithRetry, WordPuzzle } from './generatePuzzle';
import { shortestPath } from './wordGraph';
import { useGameState } from './useGameState';
import { PuzzleBoard } from './components/PuzzleBoard';
import { HomeButton } from './components/HomeButton';
import { loadStats, saveStats, recordWin, recordLoss } from './lib/stats';
import { useEconomy } from './lib/economy';
import { useLevelUpQueue } from './components/economy/LevelUpProvider';
import { WalletStrip } from './components/economy/WalletStrip';
import { FirebaseLeaderboardAdapter } from './lib/leaderboard/sync/FirebaseLeaderboardAdapter';
import type { GameResult } from './lib/leaderboard/types';

const XP_REWARDS = {
  puzzleSolve: { easy: 10, medium: 15, hard: 20 },
};

/**
 * Get or create a user ID for leaderboard tracking.
 * Uses a persistent localStorage ID since no auth system is present yet.
 */
function getUserId(): string {
  const STORAGE_KEY = 'wordladder-user-id';
  let userId = localStorage.getItem(STORAGE_KEY);

  if (!userId) {
    // Generate a new user ID (UUID v4)
    userId = 'user-' + Math.random().toString(36).substring(2, 15) +
             Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEY, userId);
  }

  return userId;
}

interface PuzzleRecord {
  puzzle: WordPuzzle;
  playerPath: string[];
  result: 'won' | 'lost';
  coinsDelta: number;
  timestamp: number;
}

export const ClassicGame: React.FC = () => {
  const [resetKey, setResetKey] = useState(0);
  const [puzzle, setPuzzle] = useState(() => generatePuzzleWithRetry(4, 'medium') || {
    start: 'cat',
    end: 'dog',
    optimal: 3,
    chain: ['cat', 'cot', 'cog', 'dog'],
    lockedIndices: [],
    extraRungs: 0,
  });
  const [puzzleDifficulty, setPuzzleDifficulty] = useState<Difficulty>('medium');
  const game = useGameState(puzzle);
  const [puzzleBoardKey, setPuzzleBoardKey] = useState(0);
  const gameStartTimeRef = useRef(Date.now());

  useEffect(() => {
    document.title = 'Word Ladder — Classic';
  }, []);
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

  const economy = useEconomy();
  const { push: pushLevelUpRewards } = useLevelUpQueue();
  const xpAwardedRef = useRef(false);

  const [roundResult, setRoundResult] = useState<{
    type: 'won' | 'lost';
    coinsDelta: number;
    xp?: number;
  } | null>(null);

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

        economy.earnCoins(winReward, 'classic_solve');

        // Calculate XP to award
        const xpReward = Math.floor(winReward / 2);

        setRoundResult({ type: 'won', coinsDelta: winReward, xp: xpReward });

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
        if (!economy.spend(lossPenalty)) return;
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

      // Record result to leaderboard (fire and forget, don't block game flow)
      const leaderboardAdapter = new FirebaseLeaderboardAdapter();
      leaderboardAdapter.initialize().then(() => {
        const userId = getUserId();
        const gameDuration = Date.now() - gameStartTimeRef.current;
        const isWon = game.state.phase === 'won';

        // Create result object - timestamp will be replaced by serverTimestamp() on the server
        const result = {
          userId,
          mode: 'classic' as const,
          score: isWon ? (game.state.history.length - 1) : 0, // Use steps as score for classic mode
          solved: isWon, // true if puzzle was solved
          wrong: game.state.failedSubmissions || 0,
          duration: gameDuration,
          difficulty: puzzleDifficulty,
          wordLength: puzzle.start.length,
          timestamp: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 }, // Placeholder, will be replaced server-side
        } as GameResult;

        leaderboardAdapter.recordGameResult(userId, result).catch(err => {
          console.error('Failed to record game result:', err);
          // Don't show error to user - leaderboard recording is non-critical
        });
      }).catch(err => {
        console.error('Failed to initialize leaderboard adapter:', err);
        // Don't show error to user - leaderboard is non-critical
      });

      const newPuzzle = generatePuzzleWithRetry(4, 'medium');
      if (newPuzzle) {
        setPuzzle(newPuzzle);
      }
      setIsGameOver(true);
      setCountdown(3);
      setResetKey(prev => prev + 1);
      setPuzzleBoardKey(prev => prev + 1);
      setLastGamePhase(game.state.phase);
    }
  }, [game.state.phase, lastGamePhase, puzzle.optimal, game.state.history.length, game.state.failedSubmissions]);

  // Award XP when game is won (single-fire guard prevents double-awarding)
  useEffect(() => {
    // Reset the guard if game is not in 'won' state
    if (game.state.phase !== 'won') {
      xpAwardedRef.current = false;
      return;
    }

    // Guard: if already awarded, don't award again
    if (xpAwardedRef.current) return;

    // Calculate XP to award based on difficulty
    const xpAmount = XP_REWARDS.puzzleSolve[puzzleDifficulty] || 10;

    // Award XP and handle level-ups
    const result = economy.addXp(xpAmount, `puzzle_solve_${puzzleDifficulty}`);

    if (result.leveledUp) {
      pushLevelUpRewards(result.rewards);
    }

    xpAwardedRef.current = true;
  }, [game.state.phase, puzzleDifficulty, economy, pushLevelUpRewards]);

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
    const difficulty: Difficulty = 'medium';
    const newPuzzle = generatePuzzleWithRetry(4, difficulty) || puzzle;
    setPuzzle(newPuzzle);
    setPuzzleDifficulty(difficulty);
    setIsGameOver(false);
    setCountdown(-1);
    setResetKey(prev => prev + 1);
    setPuzzleBoardKey(prev => prev + 1);
    gameStartTimeRef.current = Date.now();
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
    const hintCount = economy.getCount('hint');
    if (game.state.phase !== 'playing') return;

    const hintIndex = getHintIndex();
    if (hintIndex === null) return;

    if (hintCount > 0) {
      // Use from inventory
      economy.useItem('hint');
    } else {
      // Buy new hints (5-pack for 30 coins)
      if (!economy.buyConsumable('hint', 30, 5)) {
        return; // Not enough coins
      }
    }

    game.applyHint(hintIndex);
  };

  const handleRevealStep = () => {
    const revealCount = economy.getCount('reveal_next_word');
    if (game.state.phase !== 'playing') return;
    const currentWord = game.state.history[game.state.history.length - 1].join('');
    if (currentWord === puzzle.end) return;
    const path = shortestPath(currentWord, puzzle.end);
    if (!path || path.length < 2) return;

    if (revealCount > 0) {
      // Use from inventory
      economy.useItem('reveal_next_word');
    } else {
      // Buy new reveals (3-pack for 60 coins)
      if (!economy.buyConsumable('reveal_next_word', 60, 3)) {
        return; // Not enough coins
      }
    }

    game.applyReveal(path[1].split(''));
  };

  const handleResetCoins = () => {
    const difference = 150 - economy.coins;
    if (difference > 0) {
      economy.earnCoins(difference, 'admin_grant');
    }
  };

  const handleUndoStep = () => {
    const undoCount = economy.getCount('undo_step');
    if (game.state.phase !== 'playing') return;

    const historyLength = game.state.history.length;
    if (historyLength <= 1) return;

    if (undoCount > 0) {
      // Use from inventory
      economy.useItem('undo_step');
    } else {
      // Buy new undos (3-pack for 25 coins)
      if (!economy.buyConsumable('undo_step', 25, 3)) {
        return; // Not enough coins
      }
    }

    game.undoStep();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-start pt-8 pb-12">
      <div className="fixed top-4 right-4 z-50">
        <WalletStrip compact={true} />
      </div>
      <div className="w-full max-w-md px-4">
        <header className="border-b border-gray-200 dark:border-gray-800 pb-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <HomeButton isGameInProgress={game.state.phase === 'playing'} />
              <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white">Word Ladder</h1>
            </div>
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
        </header>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-1">
            <span className="text-2xl">◎</span>
            <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{economy.coins}</span>
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
                <div className="p-3 rounded-lg border-2 border-gray-200 bg-blue-50 dark:bg-blue-900/30 dark:border-gray-800">
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
                      <span key={i} className="font-mono bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 px-2 py-0.5 rounded">
                        {word.join('').toUpperCase()}
                      </span>
                    ))}
                    {Array.from({ length: Math.max(0, puzzle.optimal - 1 - game.state.history.length) }).map((_, i) => (
                      <span key={`lock-${i}`} className="font-mono bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-800 px-2 py-0.5 rounded">
                        ???
                      </span>
                    ))}
                    <span className="font-mono bg-green-100 dark:bg-green-900/50 dark:text-green-400 border border-gray-200 dark:border-gray-800 px-2 py-0.5 rounded">
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
                        ? 'border-gray-200 bg-green-50 dark:bg-green-900/20 dark:border-gray-800'
                        : 'border-gray-200 bg-red-50 dark:bg-red-900/20 dark:border-gray-800'
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
                          <span key={i} className="font-mono text-xs bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 px-2 py-0.5 rounded">
                            {word.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Optimal ({record.puzzle.optimal} steps)</p>
                      <div className="flex flex-wrap gap-1">
                        {record.puzzle.chain.map((word, i) => (
                          <span key={i} className="font-mono text-xs bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300 border border-gray-200 dark:border-gray-800 px-2 py-0.5 rounded">
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

                <hr className="border-gray-200 dark:border-gray-800" />

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

        <div key={puzzleBoardKey} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
          <PuzzleBoard
            puzzle={puzzle}
            onSolved={() => {
              // ClassicGame tracks the win via game.state.phase
            }}
            hideScore={false}
          />
        </div>

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
            {roundResult.type === 'won' && roundResult.xp !== undefined && (
              <div className="text-lg font-bold mb-2 text-blue-600 dark:text-blue-400">
                +{roundResult.xp} XP
              </div>
            )}
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

        {/* Power-ups */}
        <div className="flex gap-2 mb-6">
          {/* Hint button */}
          {(() => {
            const hintCount = economy.getCount('hint');
            const canUseHint = hintCount > 0 && game.state.phase === 'playing' && game.state.lastHintedIndex === null;
            const canBuyHint = economy.coins >= 30 && game.state.phase === 'playing' && game.state.lastHintedIndex === null;

            return (
              <button
                onClick={handleUseHint}
                disabled={!canUseHint && !canBuyHint}
                className={`flex-1 py-2 px-3 rounded font-semibold text-sm transition-colors ${
                  !canUseHint && !canBuyHint
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                    : canUseHint
                      ? 'bg-amber-400 text-amber-900 hover:bg-amber-500'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
                }`}
              >
                Hint {hintCount > 0 ? `(${hintCount})` : '(30◎)'}
              </button>
            );
          })()}

          {/* Reveal button */}
          {(() => {
            const revealCount = economy.getCount('reveal_next_word');
            const canUseReveal = revealCount > 0 && game.state.phase === 'playing' && game.state.lastRevealedWord === null;
            const canBuyReveal = economy.coins >= 60 && game.state.phase === 'playing' && game.state.lastRevealedWord === null;

            return (
              <button
                onClick={handleRevealStep}
                disabled={!canUseReveal && !canBuyReveal}
                className={`flex-1 py-2 px-3 rounded font-semibold text-sm transition-colors ${
                  !canUseReveal && !canBuyReveal
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                    : canUseReveal
                      ? 'bg-cyan-400 text-cyan-900 hover:bg-cyan-500'
                      : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200'
                }`}
              >
                Reveal {revealCount > 0 ? `(${revealCount})` : '(60◎)'}
              </button>
            );
          })()}
          {/* Undo button */}
          {(() => {
            const undoCount = economy.getCount('undo_step');
            const canUseUndo = undoCount > 0 && game.state.history.length > 1 && game.state.phase === 'playing';
            const canBuyUndo = economy.coins >= 25 && game.state.history.length > 1 && game.state.phase === 'playing';

            return (
              <button
                onClick={handleUndoStep}
                disabled={!canUseUndo && !canBuyUndo}
                className={`flex-1 py-2 px-3 rounded font-semibold text-sm transition-colors ${
                  !canUseUndo && !canBuyUndo
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                    : canUseUndo
                      ? 'bg-purple-400 text-purple-900 hover:bg-purple-500'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200'
                }`}
              >
                Undo {undoCount > 0 ? `(${undoCount})` : '(25◎)'}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
