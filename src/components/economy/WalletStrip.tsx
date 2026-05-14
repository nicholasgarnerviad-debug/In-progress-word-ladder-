import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEconomy } from '../../lib/economy/useEconomy';
import { xpProgressInLevel, xpToNextLevel } from '../../lib/economy/levels';

export type WalletStripProps = {
  compact?: boolean;
  /** If true, the entire strip is a clickable link to /profile. Default true. */
  linkToProfile?: boolean;
};

export function WalletStrip({ compact = false, linkToProfile = true }: WalletStripProps) {
  const { coins, xp, level } = useEconomy();
  const navigate = useNavigate();

  const progress = xpProgressInLevel(xp);
  const toNext = xpToNextLevel(xp);

  const handleClick = linkToProfile ? () => navigate('/profile') : undefined;

  const Wrapper = linkToProfile ? 'button' : 'div';

  return (
    <Wrapper
      onClick={handleClick}
      className={[
        'w-full text-left flex items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-800',
        compact ? 'px-3 py-2' : 'px-4 py-3',
        linkToProfile
          ? 'hover:bg-gray-50 dark:hover:bg-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition cursor-pointer'
          : '',
      ].join(' ')}
      aria-label={linkToProfile ? 'Open profile' : undefined}
    >
      <CoinDisplay coins={coins} compact={compact} />
      <LevelDisplay level={level} xpToNext={toNext} progress={progress} compact={compact} />
    </Wrapper>
  );
}

function CoinDisplay({ coins, compact }: { coins: number; compact: boolean }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span aria-hidden className={compact ? 'text-base' : 'text-lg'}>
        🪙
      </span>
      <span className={`font-semibold tabular-nums ${compact ? 'text-sm' : 'text-base'}`}>
        {coins.toLocaleString()}
      </span>
      {!compact && (
        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 ml-1">
          coins
        </span>
      )}
    </div>
  );
}

function LevelDisplay({
  level,
  xpToNext,
  progress,
  compact,
}: {
  level: number;
  xpToNext: number;
  progress: number;
  compact: boolean;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
          Level {level}
        </span>
        {!compact && (
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {xpToNext} XP to next
          </span>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <div
          className="h-full bg-blue-500 dark:bg-blue-400 transition-[width] duration-500 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
          aria-hidden
        />
      </div>
      <span className="sr-only">
        Level {level}, {Math.round(progress * 100)} percent to next level
      </span>
    </div>
  );
}
