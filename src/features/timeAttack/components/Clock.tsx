import React from 'react';

export type ClockProps = {
  remainingMs: number;
  isFlashing?: boolean;
};

export const Clock: React.FC<ClockProps> = ({ remainingMs, isFlashing = false }) => {
  const totalSeconds = Math.max(0, remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds * 10) % 10);

  const isLowTime = totalSeconds < 10;
  const isVeryLowTime = totalSeconds < 5;

  let displayText: string;
  if (totalSeconds >= 10) {
    displayText = `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  } else {
    displayText = `${seconds}.${tenths}`;
  }

  const animationClass = isVeryLowTime ? 'animate-pulse' : isLowTime ? 'animate-pulse' : '';
  const pulseStyle = isVeryLowTime
    ? { animationDuration: '0.5s' }
    : isLowTime
      ? { animationDuration: '1s' }
      : {};

  return (
    <>
      <style>{`
        @keyframes clock-flash {
          0%, 100% { color: inherit; }
          50% { color: rgb(34, 197, 94); }
        }
        .clock-flashing {
          animation: clock-flash 0.6s ease-out;
        }
      `}</style>
      <div
        className={`font-mono text-5xl font-bold text-center transition-colors ${
          isFlashing
            ? 'clock-flashing'
            : isLowTime
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-900 dark:text-gray-100'
        } ${animationClass}`}
        style={pulseStyle}
      >
        {displayText}
      </div>
    </>
  );
};
