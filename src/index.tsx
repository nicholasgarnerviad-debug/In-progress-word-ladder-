import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { App } from './App';
import { loadTheme, applyTheme } from './lib/theme';

// Apply theme on startup
const theme = loadTheme();
applyTheme(theme);

// Listen for system theme changes if using system preference
if (theme === 'system') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = loadTheme();
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
