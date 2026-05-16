import React, { useEffect } from 'react';

interface PurchaseToastProps {
  message: string;
  icon: string;
  duration?: number;
  onClose: () => void;
}

export const PurchaseToast = React.memo(
  ({ message, icon, duration = 3000, onClose }: PurchaseToastProps) => {
    useEffect(() => {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="bg-green-500 dark:bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap">
          <span className="text-lg">{icon}</span>
          <span className="font-medium">{message}</span>
        </div>
      </div>
    );
  }
);

PurchaseToast.displayName = 'PurchaseToast';
