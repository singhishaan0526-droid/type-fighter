import type { CharacterId } from '../types/game.js';

export const CHARACTER_POWERS: Record<CharacterId, number> = {
  byte: 70,
  glitch: 88,
  zenko: 100,
  nova: 80,
  zephyr: 85,
  raven: 90
};

export const TIMEOUT_SCORE_WEIGHTS = {
  PROGRESS: 0.50,
  ACCURACY: 0.30,
  HEALTH: 0.20
} as const;

export const COMBAT_CONSTANTS = {
  DEFAULT_MAX_HP: 100,
  MATCH_DURATION_SECONDS: 60,
  COUNTDOWN_SECONDS: 3,
  GRACE_PERIOD_MS: 15000,
  RATE_LIMIT_WINDOW_MS: 1000,
  MAX_INPUTS_PER_WINDOW: 30,
  MAX_COMBO_BONUS_CAP: 30,
  COMBO_BONUS_PER_POINT: 0.05
} as const;
