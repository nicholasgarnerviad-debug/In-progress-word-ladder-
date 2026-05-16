import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { canClaimDailyBonus, claimDailyBonus, loadWallet, saveWallet } from '../../../lib/economy/wallet';
import { loadInventory, saveInventory, addConsumable } from '../../../lib/economy/inventory';

export type ClassicGameResultsScreenProps = {
  /** Callback when player wants to return home */
  onHome?: () => void;
};

/**
 * Results screen displayed after a Classic game ends.
 *
 * Features:
 * - Displays game results and earnings
 * - Checks and claims daily login bonus (1 Hint + 1 Undo)
 * - Shows bonus notification if claimed
 * - Navigation to home
 * - Responsive design (desktop + mobile)
 */
export const ClassicGameResultsScreen = ({ onHome }: ClassicGameResultsScreenProps): React.ReactElement => {
  const navigate = useNavigate();
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);

  // Check and claim daily bonus if available
  useEffect(() => {
    const wallet = loadWallet();
    const inventory = loadInventory();

    // Check if player can claim daily bonus
    if (canClaimDailyBonus(wallet)) {
      const updatedWallet = claimDailyBonus(wallet);
      if (updatedWallet) {
        // Add consumables: 1 Hint + 1 Undo
        let updatedInventory = addConsumable(inventory, 'hint', 1);
        updatedInventory = addConsumable(updatedInventory, 'undo_step', 1);

        saveWallet(updatedWallet);
        saveInventory(updatedInventory);

        setDailyBonusClaimed(true);
        setBonusMessage('Daily bonus claimed: 1 Hint + 1 Undo');
        console.log('Daily bonus claimed: 1 Hint + 1 Undo');
      }
    }
  }, []);

  /**
   * Handle Home button click
   */
  const handleHome = () => {
    onHome?.();
    navigate('/');
  };

  return (
    <div
      data-testid="classic-results-container"
      className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 overflow-auto"
    >
      {/* Main content container */}
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
            Game Over
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            Great effort! Keep improving your word ladder skills.
          </p>
        </div>

        {/* Daily Bonus notification */}
        {dailyBonusClaimed && bonusMessage && (
          <div
            className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="text-green-700 dark:text-green-400 font-semibold">
              🎁 {bonusMessage}
            </p>
          </div>
        )}

        {/* Placeholder for game stats - to be filled by parent component */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Game Statistics
          </h2>

          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>Your game results and earnings will appear here.</p>
          </div>
        </div>

        {/* Button group */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Home button */}
          <button
            onClick={handleHome}
            className="
              px-6 py-3 rounded-lg font-semibold
              bg-blue-600 hover:bg-blue-700 text-white
              dark:bg-blue-700 dark:hover:bg-blue-800
              transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              dark:focus:ring-offset-gray-900
            "
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};
