import { describe, it, expect } from 'vitest';
import {
  calculateWpm,
  calculateAccuracy,
  calculateWordDamage,
  applyMistakePenalty,
  calculateTimeoutScore,
  evaluateWinner,
  getRandomChallenge,
  SERVER_CHALLENGES
} from '../src/combatEngine.js';

describe('Server Combat Engine', () => {
  describe('calculateWpm', () => {
    it('returns 0 if elapsed time is zero or negative', () => {
      expect(calculateWpm(50, 0)).toBe(0);
      expect(calculateWpm(50, -5)).toBe(0);
    });

    it('returns 0 if correct characters are 0', () => {
      expect(calculateWpm(0, 30)).toBe(0);
    });

    it('calculates standard WPM correctly (5 chars = 1 word)', () => {
      // 100 characters in 60 seconds = 20 words / 1 min = 20 WPM
      expect(calculateWpm(100, 60)).toBe(20);
      // 250 characters in 30 seconds = 50 words / 0.5 min = 100 WPM
      expect(calculateWpm(250, 30)).toBe(100);
    });
  });

  describe('calculateAccuracy', () => {
    it('returns 100% when no keystrokes have been made', () => {
      expect(calculateAccuracy(0, 0)).toBe(100);
    });

    it('calculates correct percentages accurately', () => {
      expect(calculateAccuracy(90, 100)).toBe(90);
      expect(calculateAccuracy(95, 100)).toBe(95);
      expect(calculateAccuracy(50, 100)).toBe(50);
    });

    it('clamps values between 0 and 100', () => {
      expect(calculateAccuracy(-10, 100)).toBe(0);
      expect(calculateAccuracy(110, 100)).toBe(100);
    });
  });

  describe('calculateWordDamage', () => {
    it('scales damage with word length', () => {
      const shortWord = calculateWordDamage(3, 0, 80);
      const longWord = calculateWordDamage(10, 0, 80);
      expect(longWord.damage).toBeGreaterThan(shortWord.damage);
    });

    it('applies combo multiplier', () => {
      const zeroCombo = calculateWordDamage(5, 0, 80);
      const highCombo = calculateWordDamage(5, 20, 80);
      expect(highCombo.damage).toBeGreaterThan(zeroCombo.damage);
      expect(highCombo.comboMultiplier).toBeGreaterThan(zeroCombo.comboMultiplier);
    });

    it('activates critical strike at combo >= 10', () => {
      const crit = calculateWordDamage(5, 10, 80);
      expect(crit.isCritical).toBe(true);
    });

    it('adds bonus damage at end of sentence', () => {
      const regular = calculateWordDamage(5, 5, 80, false);
      const endOfSentence = calculateWordDamage(5, 5, 80, true);
      expect(endOfSentence.damage).toBeGreaterThan(regular.damage);
    });
  });

  describe('applyMistakePenalty', () => {
    it('resets combo to 0 when combo is 3 or less', () => {
      expect(applyMistakePenalty(0)).toBe(0);
      expect(applyMistakePenalty(2)).toBe(0);
      expect(applyMistakePenalty(3)).toBe(0);
    });

    it('halves combo when combo is greater than 3', () => {
      expect(applyMistakePenalty(10)).toBe(5);
      expect(applyMistakePenalty(15)).toBe(7);
      expect(applyMistakePenalty(20)).toBe(10);
    });
  });

  describe('calculateTimeoutScore', () => {
    it('calculates weighted score S = 0.50P + 0.30A + 0.20H accurately', () => {
      expect(calculateTimeoutScore(100, 100, 100)).toBe(100);
      expect(calculateTimeoutScore(60, 90, 50)).toBe(67);
      expect(calculateTimeoutScore(0, 0, 0)).toBe(0);
    });

    it('clamps P, A, and H inputs to [0, 100]', () => {
      expect(calculateTimeoutScore(150, 120, 200)).toBe(100);
      expect(calculateTimeoutScore(-20, -50, -10)).toBe(0);
    });
  });

  describe('evaluateWinner', () => {
    it('awards win to player 1 when player 2 is knocked out', () => {
      expect(evaluateWinner(50, 95, 0, 90)).toBe('player1');
      expect(evaluateWinner(10, 50, 0, 100, 20, 99)).toBe('player1');
    });

    it('awards win to player 2 when player 1 is knocked out', () => {
      expect(evaluateWinner(0, 90, 45, 95)).toBe('player2');
      expect(evaluateWinner(0, 100, 10, 50, 99, 20)).toBe('player2');
    });

    it('returns draw if both players are knocked out simultaneously', () => {
      expect(evaluateWinner(0, 90, 0, 95)).toBe('draw');
    });

    it('evaluates winner using weighted score S = 0.50P + 0.30A + 0.20H rather than pure HP', () => {
      // P1: HP 30, Acc 90, Progress 80 -> S1 = 40 + 27 + 6 = 73
      // P2: HP 90, Acc 70, Progress 20 -> S2 = 10 + 21 + 18 = 49
      expect(evaluateWinner(30, 90, 90, 70, 80, 20)).toBe('player1');
      expect(evaluateWinner(90, 70, 30, 90, 20, 80)).toBe('player2');
    });

    it('returns draw on timeout when weighted scores are equal', () => {
      expect(evaluateWinner(50, 80, 50, 80, 50, 50)).toBe('draw');
    });

    it('supports backward-compatible 4-arg calls', () => {
      expect(evaluateWinner(80, 90, 60, 95)).toBe('player1');
      expect(evaluateWinner(30, 95, 75, 90)).toBe('player2');
      expect(evaluateWinner(50, 98, 50, 92)).toBe('player1');
      expect(evaluateWinner(50, 85, 50, 94)).toBe('player2');
      expect(evaluateWinner(50, 95, 50, 95)).toBe('draw');
    });
  });

  describe('getRandomChallenge', () => {
    it('returns a valid challenge from pool', () => {
      const challenge = getRandomChallenge();
      expect(challenge).toBeDefined();
      expect(challenge.text.length).toBeGreaterThan(10);
    });

    it('respects excludeId when provided', () => {
      const excluded = SERVER_CHALLENGES[0].id;
      const picked = getRandomChallenge(excluded);
      expect(picked.id).not.toBe(excluded);
    });
  });
});
