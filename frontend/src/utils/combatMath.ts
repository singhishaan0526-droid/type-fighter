/**
 * Combat math and typing calculation utilities.
 * Pure functions designed for deterministic behavior and unit testing.
 */

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
  powerStat: number = 80
): DamageResult {
  // Base damage scales with word length (e.g., 5-letter word = ~10 base)
  const baseDamage = Math.max(5, wordLength * 2);

  // Combo multiplier: +5% per combo point up to +150% (at 30 combo)
  const comboBonus = Math.min(30, currentCombo) * 0.05;
  const comboMultiplier = 1 + comboBonus;

  // Power stat scaling: 70 power -> 0.95x, 100 power -> 1.1x
  const powerScale = 0.6 + (powerStat / 100) * 0.5;

  // Critical strike chance when combo is >= 10
  const isCritical = currentCombo >= 10 && Math.random() < 0.25;
  const critMultiplier = isCritical ? 1.5 : 1.0;

  const rawDamage = baseDamage * comboMultiplier * powerScale * critMultiplier;
  const damage = Math.max(1, Math.round(rawDamage));

  return {
    damage,
    isCritical,
    comboMultiplier: Number(comboMultiplier.toFixed(2))
  };
}

export function applyMistakePenalty(currentCombo: number): number {
  // PRD: "Mistakes reduce combo and damage"
  // Reduces combo by half or resets if low
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
  const score = 0.50 * p + 0.30 * a + 0.20 * h;
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

