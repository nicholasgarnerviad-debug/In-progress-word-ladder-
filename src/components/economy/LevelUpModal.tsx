import React, { useEffect } from 'react';
import type { LevelReward } from '../../lib/economy/types';

export type LevelUpModalProps = {
  reward: LevelReward;
  onClose: () => void;
};

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ reward, onClose }) => {
  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body overflow while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scale-in 200ms ease-out' }}
      >
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Level Up
          </p>
          <p
            id="level-up-title"
            className="text-6xl font-bold tracking-tight mb-4 text-gray-900 dark:text-gray-100"
          >
            {reward.level}
          </p>
          <p className="text-base text-gray-700 dark:text-gray-300 mb-6">
            {reward.description}
          </p>

          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-4 py-1.5 text-sm font-semibold text-yellow-900 dark:text-yellow-200">
            +{reward.coins} coins
          </div>

          {reward.unlocks.length > 0 && (
            <ul className="mt-6 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {reward.unlocks.map((unlock, i) => (
                <li key={i}>{describeUnlock(unlock)}</li>
              ))}
            </ul>
          )}

          <button
            onClick={onClose}
            className="mt-8 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-3 font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 transition"
          >
            Continue
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
};

function describeUnlock(unlock: LevelReward['unlocks'][number]): string {
  switch (unlock.type) {
    case 'badge':
      return `🏅 ${unlock.name} badge`;
    case 'consumable':
      return `+${unlock.count} ${unlock.consumableType.replace(/_/g, ' ')}${unlock.count > 1 ? 's' : ''}`;
    case 'mode':
      return `🔓 ${unlock.name} unlocked`;
    case 'dictionary_voucher':
      return `🎟️ ${unlock.count} dictionary ${unlock.count > 1 ? 'vouchers' : 'voucher'}`;
    default:
      return '';
  }
}
