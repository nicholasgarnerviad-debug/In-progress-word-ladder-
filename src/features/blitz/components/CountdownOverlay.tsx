import React, { useCallback, useEffect, useState } from 'react';
import { BLITZ_ACCENT } from '../theme';

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

  // Wrap onComplete in useCallback to ensure stable dependency
  const stableOnComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    // Initial render: show current count
    const updateCountdown = () => {
      const elapsed = Date.now() - startTime;

      // Countdown duration: 3000ms
      if (elapsed >= 3000) {
        setIsVisible(false);
        stableOnComplete();
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
  }, [startTime, stableOnComplete]);

  if (!isVisible || currentCount === null) {
    return null;
  }

  // Color transitions: 3 (normal) → 2 (accent) → 1 (accent)
  const getColorClass = () => {
    if (currentCount === 3) {
      return 'text-white';
    }
    return BLITZ_ACCENT.text;
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn"
      role="presentation"
      aria-hidden="false"
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`
          select-none font-black tracking-tighter
          animate-countdownScale
          ${getColorClass()}
          text-9xl
        `}
        style={{
          textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          letterSpacing: '-0.02em',
        }}
      >
        {currentCount}
      </div>
    </div>
  );
};
