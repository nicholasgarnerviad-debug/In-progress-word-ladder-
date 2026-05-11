import React, { useState } from 'react';
import { ModeTile } from '../components/ModeTile';
import { StatsStrip } from '../components/StatsStrip';

export const ComponentsPreview: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="max-w-md mx-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Components Preview</h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-1 rounded text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          <div className="space-y-8">
            {/* ModeTile Examples */}
            <section>
              <h2 className="text-lg font-semibold mb-4">ModeTile Component</h2>
              <div className="space-y-3">
                <ModeTile
                  name="Classic"
                  description="The original word ladder experience"
                  to="/play/classic"
                />
                <ModeTile
                  name="Timed Mode"
                  description="Race against the clock"
                  comingSoon
                />
                <ModeTile
                  name="Daily Challenge"
                  description="One puzzle per day"
                  comingSoon
                />
              </div>
            </section>

            {/* StatsStrip Example */}
            <section>
              <h2 className="text-lg font-semibold mb-4">StatsStrip Component</h2>
              <StatsStrip />
            </section>

            {/* Info */}
            <section className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-4">
              <p>
                <strong>ModeTile:</strong> Active tiles use Link navigation and show a chevron.
                Coming-soon tiles are disabled with reduced opacity.
              </p>
              <p className="mt-2">
                <strong>StatsStrip:</strong> Reads stats from localStorage. Win % is calculated
                from played/won counts. All values update when stats change.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
