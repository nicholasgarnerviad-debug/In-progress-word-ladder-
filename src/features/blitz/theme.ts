/**
 * Word Blitz visual theme and design tokens
 *
 * The Blitz aesthetic is "the rest of the app, but with one striking accent."
 * Electric yellow accent suggests speed, energy, and competitive racing.
 *
 * All colors have light and dark mode variants via Tailwind classes.
 */

/** Blitz accent color tokens for consistent branding */
export const BLITZ_ACCENT = {
  /** Text color for accent elements */
  text: 'text-yellow-600 dark:text-yellow-300',

  /** Subtle background for hints or secondary info */
  bgSubtle: 'bg-yellow-50 dark:bg-yellow-950/30',

  /** Background for pill-style badges (used sparingly) */
  bgPill: 'bg-yellow-100 dark:bg-yellow-900/30',

  /** Text color for pill-style elements */
  textPill: 'text-yellow-900 dark:text-yellow-200',

  /** Border color for accent emphasis */
  border: 'border-yellow-400 dark:border-yellow-300',

  /** Ring/focus color (outline on interaction) */
  ring: 'ring-yellow-500 dark:ring-yellow-400',
} as const;

/** Status colors for game states and feedback */
export const STATUS_COLORS = {
  /** Success state (solve, correct, win) */
  success: 'text-green-600 dark:text-green-400',
  successBg: 'bg-green-50 dark:bg-green-900/20',

  /** Error/failure state (wrong, failed, lose) */
  error: 'text-red-600 dark:text-red-400',
  errorBg: 'bg-red-50 dark:bg-red-900/20',

  /** Warning state (countdown, low time, skipped) */
  warning: 'text-red-600 dark:text-red-400',
  warningBg: 'bg-red-50 dark:bg-red-900/20',

  /** Neutral/disabled state */
  neutral: 'text-gray-500 dark:text-gray-400',
  neutralBg: 'bg-gray-100 dark:bg-gray-800',
} as const;

/** Reward colors for earnings display */
export const REWARD_COLORS = {
  /** Coins (gold/currency) */
  coins: 'text-yellow-600 dark:text-yellow-300',

  /** Experience/XP (purple/mystique) */
  xp: 'text-purple-600 dark:text-purple-300',

  /** Level up (vibrant yellow) */
  levelUp: 'text-yellow-500 dark:text-yellow-300',
} as const;

/** Button sizing for consistent UI */
export const BUTTON_SIZES = {
  small: 'px-3 py-2 text-sm',
  medium: 'px-4 py-2 text-base',
  large: 'px-6 py-3 text-lg',
} as const;

/** Spacing tokens for consistent layout */
export const SPACING = {
  /** Tight spacing for related elements */
  tight: 'gap-2',

  /** Normal spacing between sections */
  normal: 'gap-4',

  /** Generous spacing for visual separation */
  generous: 'gap-6',
} as const;

/** Animation timings */
export const ANIMATION_TIMING = {
  /** Quick feedback animations */
  fast: 'duration-150',

  /** Standard transitions */
  normal: 'duration-300',

  /** Longer animations for emphasis */
  slow: 'duration-500',
} as const;

/** Button styling for different variants and states */
export const BUTTON_STYLES = {
  /** Primary action button (yellow accent) */
  primary: `
    px-4 py-2 rounded-lg font-semibold
    bg-yellow-500 hover:bg-yellow-600 active:scale-95
    text-white
    dark:bg-yellow-600 dark:hover:bg-yellow-700
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500
    dark:focus:ring-offset-gray-900
  `,

  /** Secondary action button */
  secondary: `
    px-4 py-2 rounded-lg font-semibold
    bg-blue-500 hover:bg-blue-600 active:scale-95
    text-white
    dark:bg-blue-600 dark:hover:bg-blue-700
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    dark:focus:ring-offset-gray-900
  `,

  /** Danger/destructive action button */
  danger: `
    px-4 py-2 rounded-lg font-semibold
    bg-red-500 hover:bg-red-600 active:scale-95
    text-white
    dark:bg-red-600 dark:hover:bg-red-700
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
    dark:focus:ring-offset-gray-900
  `,

  /** Ghost/outline button */
  ghost: `
    px-4 py-2 rounded-lg font-semibold
    bg-transparent border-2 border-gray-300 hover:bg-gray-100
    text-gray-700
    dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-100
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
    dark:focus:ring-offset-gray-900
  `,
} as const;

/** Loading spinner sizes */
export const SPINNER_SIZES = {
  small: 'w-4 h-4',
  medium: 'w-6 h-6',
  large: 'w-8 h-8',
} as const;

/** Timer display variants for different states */
export const TIMER_STYLES = {
  /** Normal timer display */
  normal: 'text-gray-800 dark:text-gray-100',

  /** Warning state (< 10s) - prominent red with pulse */
  warning: 'text-red-600 dark:text-red-400 animate-pulse',

  /** Critical state (< 5s) - bright red with more intense pulse */
  critical: 'text-red-600 dark:text-red-400 animate-pulse',
} as const;

/** Rank medal styles for leaderboard */
export const RANK_MEDALS = {
  '1': '🥇',
  '2': '🥈',
  '3': '🥉',
} as const;

/** Focus and accessibility styles */
export const FOCUS_STYLES = {
  /** Standard focus ring for keyboard navigation */
  ring: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-offset-gray-900',

  /** Alternative focus ring (blue) */
  ringAlt: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900',
} as const;

/** Responsive breakpoint utilities */
export const RESPONSIVE = {
  /** Mobile first (< 640px) */
  mobileContainer: 'w-full px-4',

  /** Tablet (>= 768px) */
  tabletContainer: 'md:w-full md:px-6',

  /** Desktop (>= 1024px) */
  desktopContainer: 'lg:max-w-6xl lg:mx-auto',

  /** Touch target minimum (44x44px per WCAG) */
  touchTarget: 'min-h-[44px] min-w-[44px]',
} as const;

/** Shadow utilities for depth */
export const SHADOWS = {
  /** Subtle shadow for light elevation */
  sm: 'shadow-sm',

  /** Standard shadow for cards/containers */
  md: 'shadow-md',

  /** Prominent shadow for modals/overlays */
  lg: 'shadow-lg',

  /** Extra large shadow for floating elements */
  xl: 'shadow-xl',
} as const;
