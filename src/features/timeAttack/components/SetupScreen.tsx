import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TimeAttackMode, DurationTier } from '../types';
import { getSurvivalBaseSeconds } from '../difficulty';
import { loadStats, getBest } from '../stats';

export type SetupScreenProps = {
  mode: TimeAttackMode | null;
  tier: DurationTier | null;
  onChooseMode: (mode: TimeAttackMode) => void;
  onChooseTier: (tier: DurationTier) => void;
  onStartRun: () => void;
  onReset: () => void;
};

const MODES = [
  {
    id: 'sprint' as const,
    name: 'Sprint',
    description: 'Fixed clock. Solve as many as you can before time runs out.',
  },
  {
    id: 'survival' as const,
    name: 'Survival',
    description: 'Each solve adds time. Keep the clock alive.',
  },
];

const DURATIONS: DurationTier[] = [60, 90, 120];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  mode,
  tier,
  onChooseMode,
  onChooseTier,
  onStartRun,
  onReset,
}) => {
  const navigate = useNavigate();
  const stats = loadStats();

  const handleBack = () => {
    onReset();
    navigate('/');
  };

  const getDurationLabel = (duration: DurationTier): string => {
    if (!mode) return '';
    if (mode === 'sprint') {
      return `${duration}s total`;
    } else {
      const base = getSurvivalBaseSeconds(duration);
      return `(${base}s base)`;
    }
  };

  const getDurationTitle = (duration: DurationTier): string => {
    if (!mode) return '';
    if (mode === 'sprint') {
      return `${duration}s`;
    } else {
      const labels = { 60: 'Short', 90: 'Medium', 120: 'Long' };
      return labels[duration];
    }
  };

  const getPersonalBest = (m: TimeAttackMode, t: DurationTier): string => {
    const best = getBest(stats, m, t);
    return best ? `Best: ${best.solved}` : 'Best: —';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header strip */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center px-4">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none -ml-2"
          aria-label="Back to home"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-600 dark:text-gray-400"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">Time Attack</h1>
        <div className="w-12" />
      </div>

      {/* Main content */}
      <div className="max-w-md mx-auto px-4">
        {/* Step 1: Mode Selection */}
        <div className="pt-8 pb-6">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
            Choose mode
          </p>
          <div className="space-y-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => onChooseMode(m.id)}
                className={`w-full h-20 rounded-lg border-2 p-4 flex items-center justify-between transition-colors text-left focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none ${
                  mode === m.id
                    ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-900'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <div>
                  <h3 className="font-bold text-lg">{m.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{m.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Duration Selection */}
        {mode && (
          <div className="pb-6">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
              Choose duration
            </p>
            <div className="grid grid-cols-3 gap-3">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => onChooseTier(d)}
                  className={`rounded-lg border-2 p-3 min-h-[48px] flex flex-col items-center justify-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none ${
                    tier === d
                      ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-900'
                      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  <div className="font-bold text-lg">{getDurationTitle(d)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {getDurationLabel(d)}
                  </div>
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {getPersonalBest(mode, d)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Start Button */}
        {mode && tier && (
          <div className="pb-8">
            <button
              onClick={onStartRun}
              className="w-full py-3 px-4 min-h-[48px] rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold transition-colors hover:bg-gray-800 dark:hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
            >
              Start Run
            </button>
          </div>
        )}

        {/* Rules Card */}
        <div className="pb-8">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              You get <strong>2 free skips</strong>. After that, skipping costs time. Difficulty ramps up as you solve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
