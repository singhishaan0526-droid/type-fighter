import type { CharacterId } from './types.js';

export const CHARACTER_POWERS: Record<CharacterId, number> = {
  byte: 70,
  glitch: 88,
  zenko: 100,
  nova: 80,
  zephyr: 85,
  raven: 90
};

export const SERVER_CHALLENGES = [
  {
    id: 'sc-1',
    text: 'The quick brown fox jumps over the lazy dog.'
  },
  {
    id: 'sc-2',
    text: 'Shadows dance beneath the neon moon as sharp steel slices the silence.'
  },
  {
    id: 'sc-3',
    text: 'A swift keystroke strikes true before the rival blade can even draw breath.'
  },
  {
    id: 'sc-4',
    text: 'Master your rhythm, breathe through the storm, and unleash the fatal combination.'
  },
  {
    id: 'sc-5',
    text: 'Speed is mere illusion without flawless precision and unyielding focus.'
  },
  {
    id: 'sc-6',
    text: 'The cybernetic staff spins at sonic velocity, shattering digital barriers into dust.'
  },
  {
    id: 'sc-7',
    text: 'Twin blades ignite in crimson embers, cutting through the darkness with ruthless intent.'
  },
  {
    id: 'sc-8',
    text: 'Heavy spirit hammers shatter mountain stone, reverberating ancient thunder through the realm.'
  }
];

export function getRandomChallenge(excludeId?: string): { id: string; text: string } {
  const pool = excludeId ? SERVER_CHALLENGES.filter((c) => c.id !== excludeId) : SERVER_CHALLENGES;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return picked || SERVER_CHALLENGES[0];
}

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

export function calculateWordDamage(
  wordLength: number,
  currentCombo: number,
  powerStat: number = 80,
  isEndOfSentence: boolean = false
): { damage: number; isCritical: boolean; comboMultiplier: number } {
  const baseDamage = Math.max(5, wordLength * 2);
  const comboBonus = Math.min(30, currentCombo) * 0.05;
  const comboMultiplier = 1 + comboBonus;
  const powerScale = 0.6 + (powerStat / 100) * 0.5;

  // Predictable/deterministic crit threshold on server
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

export function evaluateWinner(
  p1Hp: number,
  p1Accuracy: number,
  p2Hp: number,
  p2Accuracy: number
): 'player1' | 'player2' | 'draw' {
  if (p1Hp <= 0 && p2Hp <= 0) return 'draw';
  if (p1Hp <= 0) return 'player2';
  if (p2Hp <= 0) return 'player1';

  if (p1Hp > p2Hp) return 'player1';
  if (p2Hp > p1Hp) return 'player2';

  if (p1Accuracy > p2Accuracy) return 'player1';
  if (p2Accuracy > p1Accuracy) return 'player2';

  return 'draw';
}
