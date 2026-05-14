import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface HomeButtonProps {
  isGameInProgress?: boolean;
  onConfirm?: () => void;
}

export const HomeButton: React.FC<HomeButtonProps> = ({
  isGameInProgress = false,
  onConfirm
}) => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  // Handle escape key to dismiss confirmation dialog
  useEffect(() => {
    if (!showConfirm) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowConfirm(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showConfirm]);

  const handleClick = () => {
    if (isGameInProgress) {
      setShowConfirm(true);
    } else {
      goHome();
    }
  };

  const goHome = () => {
    onConfirm?.();
    navigate('/');
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
        aria-label="Home"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-600 dark:text-gray-400"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">
              Leave game?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your progress will be lost.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={goHome}
                className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
