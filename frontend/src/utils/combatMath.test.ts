import { describe, it, expect } from 'vitest';
import {
  calculateWpm,
  calculateAccuracy,
  calculateWordDamage,
  applyMistakePenalty,
  calculateTimeoutScore,
  evaluateWinner
} from './combatMath';
import { CHARACTERS, getCharacterById } from '../data/characters';

describe('Typing Combat Engine - combatMath', () => {
  describe('calculateWpm', () => {
    it('returns 0 when time is zero or negative', () => {
      expect(calculateWpm(50, 0)).toBe(0);
      expect(calculateWpm(50, -5)).toBe(0);
    });

    it('returns 0 when correct characters is zero', () => {
      expect(calculateWpm(0, 30)).toBe(0);
    });

    it('calculates standard 60 WPM for 300 correct chars in 60 seconds', () => {
      // 300 chars / 5 = 60 words in 1 minute -> 60 WPM
      expect(calculateWpm(300, 60)).toBe(60);
    });

    it('scales proportionally for elapsed seconds', () => {
      // 150 chars in 30 seconds -> 60 WPM
      expect(calculateWpm(150, 30)).toBe(60);
    });
  });

  describe('calculateAccuracy', () => {
    it('returns 100 when total keystrokes is 0', () => {
      expect(calculateAccuracy(0, 0)).toBe(100);
    });

    it('calculates exact percentage', () => {
      expect(calculateAccuracy(95, 100)).toBe(95);
      expect(calculateAccuracy(50, 100)).toBe(50);
      expect(calculateAccuracy(88, 100)).toBe(88);
    });

    it('clamps output between 0 and 100', () => {
      expect(calculateAccuracy(120, 100)).toBe(100);
      expect(calculateAccuracy(-5, 100)).toBe(0);
    });
  });

  describe('calculateWordDamage', () => {
    it('calculates damage scaling with word length and power', () => {
      const res5 = calculateWordDamage(5, 0, 80);
      const res10 = calculateWordDamage(10, 0, 80);
      expect(res10.damage).toBeGreaterThan(res5.damage);
    });

    it('applies combo multiplier bonus up to cap', () => {
      const baseRes = calculateWordDamage(5, 0, 80);
      const comboRes = calculateWordDamage(5, 20, 80);
      expect(comboRes.comboMultiplier).toBeGreaterThan(baseRes.comboMultiplier);
      expect(comboRes.damage).toBeGreaterThan(baseRes.damage);
    });
  });

  describe('applyMistakePenalty', () => {
    it('resets low combo to 0', () => {
      expect(applyMistakePenalty(2)).toBe(0);
      expect(applyMistakePenalty(3)).toBe(0);
    });

    it('cuts high combo in half', () => {
      expect(applyMistakePenalty(10)).toBe(5);
      expect(applyMistakePenalty(25)).toBe(12);
    });
  });

  describe('calculateTimeoutScore', () => {
    it('calculates weighted score S = 0.50P + 0.30A + 0.20H accurately', () => {
      // P = 100, A = 100, H = 100 -> 50 + 30 + 20 = 100
      expect(calculateTimeoutScore(100, 100, 100)).toBe(100);
      // P = 60, A = 90, H = 50 -> 30 + 27 + 10 = 67
      expect(calculateTimeoutScore(60, 90, 50)).toBe(67);
      // P = 0, A = 0, H = 0 -> 0
      expect(calculateTimeoutScore(0, 0, 0)).toBe(0);
    });

    it('clamps P, A, and H inputs to [0, 100]', () => {
      // Over 100 clamped to 100
      expect(calculateTimeoutScore(150, 120, 200)).toBe(100);
      // Negative clamped to 0
      expect(calculateTimeoutScore(-20, -50, -10)).toBe(0);
    });
  });

  describe('evaluateWinner', () => {
    it('declares p1 winner immediately if p2 is knocked out (HP <= 0)', () => {
      expect(evaluateWinner(50, 95, 0, 80)).toBe('player1');
      // Even if p2 has higher progress and accuracy, knockout is immediate loss
      expect(evaluateWinner(10, 50, 0, 100, 20, 99)).toBe('player1');
    });

    it('declares p2 winner immediately if p1 is knocked out (HP <= 0)', () => {
      expect(evaluateWinner(0, 95, 45, 80)).toBe('player2');
      // Even if p1 has higher progress and accuracy, knockout is immediate loss
      expect(evaluateWinner(0, 100, 10, 50, 99, 20)).toBe('player2');
    });

    it('declares draw if both players reach 0 HP simultaneously', () => {
      expect(evaluateWinner(0, 95, 0, 90)).toBe('draw');
    });

    it('on timeout, uses weighted score S = 0.50P + 0.30A + 0.20H rather than pure HP', () => {
      // P1: HP = 30, Acc = 90, Progress = 80% -> S1 = 0.50*80 + 0.30*90 + 0.20*30 = 40 + 27 + 6 = 73
      // P2: HP = 90, Acc = 70, Progress = 20% -> S2 = 0.50*20 + 0.30*70 + 0.20*90 = 10 + 21 + 18 = 49
      // P1 wins despite having 1/3 the HP of P2!
      expect(evaluateWinner(30, 90, 90, 70, 80, 20)).toBe('player1');

      // P2 has higher weighted score:
      expect(evaluateWinner(90, 70, 30, 90, 20, 80)).toBe('player2');
    });

    it('on timeout with equal weighted scores, results in a draw', () => {
      // P1: HP = 50, Acc = 80, Progress = 50% -> 25 + 24 + 10 = 59
      // P2: HP = 50, Acc = 80, Progress = 50% -> 25 + 24 + 10 = 59
      expect(evaluateWinner(50, 80, 50, 80, 50, 50)).toBe('draw');
    });

    it('supports backward-compatible 4-arg calls', () => {
      expect(evaluateWinner(78, 90, 62, 95)).toBe('player1');
      expect(evaluateWinner(40, 90, 80, 85)).toBe('player2');
      expect(evaluateWinner(50, 98, 50, 89)).toBe('player1');
      expect(evaluateWinner(50, 85, 50, 92)).toBe('player2');
      expect(evaluateWinner(50, 90, 50, 90)).toBe('draw');
    });
  });

  describe('Character Roster Verification', () => {
    it('has all 6 unique characters from PRD', () => {
      expect(CHARACTERS).toHaveLength(6);
      const ids = CHARACTERS.map(c => c.id);
      expect(ids).toContain('byte');
      expect(ids).toContain('glitch');
      expect(ids).toContain('zenko');
      expect(ids).toContain('nova');
      expect(ids).toContain('zephyr');
      expect(ids).toContain('raven');
    });

    it('all characters have non-gun weapons', () => {
      const gunKeywords = ['gun', 'rifle', 'pistol', 'laser gun', 'blaster', 'shotgun'];
      CHARACTERS.forEach(char => {
        gunKeywords.forEach(gun => {
          expect(char.weapon.toLowerCase()).not.toContain(gun);
        });
        expect(char.weaponType).toBeTruthy();
        expect(char.stats.speed).toBeGreaterThan(0);
        expect(char.stats.power).toBeGreaterThan(0);
        expect(char.stats.agility).toBeGreaterThan(0);
      });
    });

    it('retrieves character by id safely with fallback', () => {
      expect(getCharacterById('glitch').name).toBe('GLITCH');
      expect(getCharacterById('unknown').id).toBe('byte');
    });
  });
});
