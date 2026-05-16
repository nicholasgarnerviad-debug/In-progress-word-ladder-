import React from 'react';
import { Link } from 'react-router-dom';

type ModeTileProps = {
  name: string;
  description: string;
  comingSoon?: boolean;
  to?: string;
};

export const ModeTile: React.FC<ModeTileProps> = ({
  name,
  description,
  comingSoon = false,
  to = '/puzzle-library',
}) => {
  const baseClasses = 'w-full h-20 rounded-lg border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between transition-colors';
  const contentClasses = 'flex-1';

  if (comingSoon) {
    return (
      <div className={`${baseClasses} opacity-60 cursor-not-allowed bg-white dark:bg-gray-900`}>
        <div className={contentClasses}>
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
            Coming soon
          </span>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={to}
      className={`${baseClasses} bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none`}
    >
      <div className={contentClasses}>
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="flex items-center ml-4 text-gray-400 dark:text-gray-600 text-xl">
        ›
      </div>
    </Link>
  );
};
