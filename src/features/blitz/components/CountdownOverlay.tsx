import React, { useEffect, useState } from 'react';

export type CountdownOverlayProps = {
  /** Timestamp when countdown started (used to derive current count) */
  startTime: number;
  /** Optional callback when countdown completes */
  onComplete?: () => void;
};

/**
 * Displays a 3-2-1 countdown overlay before game starts.
 *
 * The countdown runs for 3 seconds total, displaying:
 * - 0-1000ms: "3"
 * - 1000-2000ms: "2"
 * - 2000-3000ms: "1"
 * - 3000ms+: hidden/unmounted
 */
export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  startTime,
  onComplete,
}) => {
  const [currentCount, setCurrentCount] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Initial render: show current count
    const updateCountdown = () => {
      const elapsed = Date.now() - startTime;

      // Countdown duration: 3000ms
      if (elapsed >= 3000) {
        setIsVisible(false);
        onComplete?.();
        return;
      }

      // Derive current count from elapsed time
      const count = 3 - Math.floor(elapsed / 1000);
      setCurrentCount(count);
    };

    // Update immediately
    updateCountdown();

    // Then schedule RAF updates
    const rafId = requestAnimationFrame(updateCountdown);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [startTime, onComplete]);

  if (!isVisible || currentCount === null) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        role="status"
        aria-live="polite"
        className="text-9xl font-bold text-white select-none"
      >
        {currentCount}
      </div>
    </div>
  );
};
