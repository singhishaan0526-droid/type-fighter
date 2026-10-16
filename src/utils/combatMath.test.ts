import { describe, it, expect } from 'vitest';
import {
  calculateWpm,
  calculateAccuracy,
  calculateWordDamage,
  applyMistakePenalty,
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

  describe('evaluateWinner', () => {
    it('declares p1 winner if p2 HP is 0', () => {
      expect(evaluateWinner(50, 95, 0, 80)).toBe('player1');
    });

    it('declares p2 winner if p1 HP is 0', () => {
      expect(evaluateWinner(0, 95, 45, 80)).toBe('player2');
    });

    it('on timeout, player with higher HP wins', () => {
      expect(evaluateWinner(78, 90, 62, 95)).toBe('player1');
      expect(evaluateWinner(40, 90, 80, 85)).toBe('player2');
    });

    it('on timeout with equal HP, player with higher accuracy wins', () => {
      expect(evaluateWinner(50, 98, 50, 89)).toBe('player1');
      expect(evaluateWinner(50, 85, 50, 92)).toBe('player2');
    });

    it('on timeout with equal HP and equal accuracy, results in draw', () => {
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
