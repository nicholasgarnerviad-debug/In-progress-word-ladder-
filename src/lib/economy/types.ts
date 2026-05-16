/**
 * Shared types for the economy system.
 */

export type CoinSource =
  | 'classic_solve'
  | 'classic_solve_under_par'
  | 'time_attack_solve'
  | 'time_attack_personal_best'
  | 'blitz_participation'
  | 'blitz_win'
  | 'blitz_solve'
  | 'daily_bonus'
  | 'achievement'
  | 'level_reward'
  | 'admin_grant'
  | 'shop_purchase';

export type XpSource =
  | 'puzzle_solve_easy'
  | 'puzzle_solve_medium'
  | 'puzzle_solve_hard'
  | 'time_attack_run'
  | 'blitz_win'
  | 'achievement'
  | 'daily_bonus'
  | 'admin_grant';

export type LevelRewardUnlock =
  | { type: 'badge'; id: string; name: string }
  | { type: 'consumable'; consumableType: string; count: number }
  | { type: 'mode'; modeId: string; name: string }
  | { type: 'dictionary_voucher'; count: number };

export type LevelReward = {
  level: number;
  coins: number;
  unlocks: LevelRewardUnlock[];
  description: string;
};
