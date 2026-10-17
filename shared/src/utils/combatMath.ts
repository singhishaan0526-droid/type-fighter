import { TIMEOUT_SCORE_WEIGHTS, COMBAT_CONSTANTS } from '../constants/combat.js';

export function calculateWpm(correctChars: number, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0 || correctChars <= 0) return 0;
  const minutes = elapsedSeconds / 60;
  const words = correctChars / 5;
  return Math.max(0, Math.round(words / minutes));
}

export function calculateAccuracy(correctChars: number, totalKeystrokes: number): number {
  if (totalKeystrokes <= 0) return 100;
  const percentage = (correctChars / totalKeystrokes) * 100;
  return Math.min(100, Math.max(0, Math.round(percentage)));
}

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  comboMultiplier: number;
}

export function calculateWordDamage(
  wordLength: number,
  currentCombo: number,
  powerStat: number = 80,
  isEndOfSentence: boolean = false
): DamageResult {
  const baseDamage = Math.max(5, wordLength * 2);
  const comboBonus = Math.min(COMBAT_CONSTANTS.MAX_COMBO_BONUS_CAP, currentCombo) * COMBAT_CONSTANTS.COMBO_BONUS_PER_POINT;
  const comboMultiplier = 1 + comboBonus;
  const powerScale = 0.6 + (powerStat / 100) * 0.5;

  const isCritical = currentCombo >= 10;
  const critMultiplier = isCritical ? 1.35 : 1.0;
  const sentenceBonus = isEndOfSentence ? 10 : 0;

  const rawDamage = (baseDamage + sentenceBonus) * comboMultiplier * powerScale * critMultiplier * 0.5;
  const damage = Math.max(3, Math.round(rawDamage));

  return {
    damage,
    isCritical,
    comboMultiplier: Number(comboMultiplier.toFixed(2))
  };
}

export function applyMistakePenalty(currentCombo: number): number {
  if (currentCombo <= 3) return 0;
  return Math.floor(currentCombo / 2);
}

export function calculateTimeoutScore(
  progressPercent: number,
  accuracy: number,
  healthPercent: number
): number {
  const p = Math.min(100, Math.max(0, progressPercent));
  const a = Math.min(100, Math.max(0, accuracy));
  const h = Math.min(100, Math.max(0, healthPercent));
  const score = TIMEOUT_SCORE_WEIGHTS.PROGRESS * p + TIMEOUT_SCORE_WEIGHTS.ACCURACY * a + TIMEOUT_SCORE_WEIGHTS.HEALTH * h;
  return Math.round(score * 10000) / 10000;
}

export function evaluateWinner(
  p1Hp: number,
  p1Accuracy: number,
  p2Hp: number,
  p2Accuracy: number,
  p1Progress: number = 0,
  p2Progress: number = 0,
  p1MaxHp: number = 100,
  p2MaxHp: number = 100
): 'player1' | 'player2' | 'draw' {
  if (p1Hp <= 0 && p2Hp <= 0) return 'draw';
  if (p1Hp <= 0) return 'player2';
  if (p2Hp <= 0) return 'player1';

  // Timeout scoring: S = 0.50P + 0.30A + 0.20H
  const p1HpPercent = p1MaxHp > 0 ? (p1Hp / p1MaxHp) * 100 : 0;
  const p2HpPercent = p2MaxHp > 0 ? (p2Hp / p2MaxHp) * 100 : 0;

  const score1 = calculateTimeoutScore(p1Progress, p1Accuracy, p1HpPercent);
  const score2 = calculateTimeoutScore(p2Progress, p2Accuracy, p2HpPercent);

  if (score1 > score2) return 'player1';
  if (score2 > score1) return 'player2';
  return 'draw';
}
