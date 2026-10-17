import {
  CHARACTER_POWERS,
  calculateWpm,
  calculateAccuracy,
  calculateWordDamage,
  applyMistakePenalty,
  calculateTimeoutScore,
  evaluateWinner,
  BATTLE_SENTENCES
} from '@type-fighter/shared';
import type { CharacterId } from '@type-fighter/shared';

export {
  CHARACTER_POWERS,
  calculateWpm,
  calculateAccuracy,
  calculateWordDamage,
  applyMistakePenalty,
  calculateTimeoutScore,
  evaluateWinner
};

export const SERVER_CHALLENGES = BATTLE_SENTENCES.map((s, index) => ({
  id: `sc-${index + 1}`,
  text: s.text
}));

export function getRandomChallenge(excludeId?: string): { id: string; text: string } {
  const pool = excludeId ? SERVER_CHALLENGES.filter((c) => c.id !== excludeId) : SERVER_CHALLENGES;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return picked || SERVER_CHALLENGES[0];
}
