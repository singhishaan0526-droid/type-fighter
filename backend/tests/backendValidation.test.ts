import { describe, it, expect } from 'vitest';
import {
  validateSessionId,
  validateCharacterId,
  validateJoinPayload,
  validateTypingInputPayload,
  validateResumePayload
} from '../src/validation/inputValidation.js';

describe('Backend Input Validation', () => {
  describe('validateSessionId', () => {
    it('accepts valid alphanumeric session IDs with hyphens or underscores', () => {
      const res = validateSessionId('arena-123_abc');
      expect(res.isValid).toBe(true);
      expect(res.data).toBe('arena-123_abc');
    });

    it('rejects empty, non-string, or too long session IDs', () => {
      expect(validateSessionId('').isValid).toBe(false);
      expect(validateSessionId('   ').isValid).toBe(false);
      expect(validateSessionId(12345).isValid).toBe(false);
      expect(validateSessionId('a'.repeat(51)).isValid).toBe(false);
    });

    it('rejects illegal characters like spaces, quotes, or script tags', () => {
      expect(validateSessionId('arena 1').isValid).toBe(false);
      expect(validateSessionId('<script>').isValid).toBe(false);
      expect(validateSessionId('arena"test').isValid).toBe(false);
    });
  });

  describe('validateCharacterId', () => {
    it('accepts all 6 canonical characters', () => {
      const canonical = ['byte', 'glitch', 'zenko', 'nova', 'zephyr', 'raven'];
      for (const char of canonical) {
        const res = validateCharacterId(char);
        expect(res.isValid).toBe(true);
        expect(res.data).toBe(char);
      }
    });

    it('rejects unrecognized characters', () => {
      expect(validateCharacterId('pikachu').isValid).toBe(false);
      expect(validateCharacterId('').isValid).toBe(false);
      expect(validateCharacterId(null).isValid).toBe(false);
    });
  });

  describe('validateTypingInputPayload', () => {
    it('accepts valid keystroke payloads', () => {
      const res = validateTypingInputPayload({
        seq: 1,
        challengeId: 'sc-1',
        index: 0,
        char: 'T',
        timestamp: 1700000000000
      });
      expect(res.isValid).toBe(true);
      expect(res.data?.char).toBe('T');
      expect(res.data?.seq).toBe(1);
    });

    it('rejects non-safe-integer or non-positive sequence numbers', () => {
      expect(validateTypingInputPayload({ seq: 0, challengeId: 'c1', index: 0, char: 'a' }).isValid).toBe(false);
      expect(validateTypingInputPayload({ seq: -1, challengeId: 'c1', index: 0, char: 'a' }).isValid).toBe(false);
      expect(validateTypingInputPayload({ seq: 1.5, challengeId: 'c1', index: 0, char: 'a' }).isValid).toBe(false);
      expect(validateTypingInputPayload({ seq: '1', challengeId: 'c1', index: 0, char: 'a' }).isValid).toBe(false);
    });

    it('rejects non-safe-integer or negative indexes', () => {
      expect(validateTypingInputPayload({ seq: 1, challengeId: 'c1', index: -1, char: 'a' }).isValid).toBe(false);
      expect(validateTypingInputPayload({ seq: 1, challengeId: 'c1', index: 2.2, char: 'a' }).isValid).toBe(false);
      expect(validateTypingInputPayload({ seq: 1, challengeId: 'c1', index: '0', char: 'a' }).isValid).toBe(false);
    });

    it('rejects multi-character strings or empty character strings', () => {
      expect(validateTypingInputPayload({ seq: 1, challengeId: 'c1', index: 0, char: '' }).isValid).toBe(false);
      expect(validateTypingInputPayload({ seq: 1, challengeId: 'c1', index: 0, char: 'ab' }).isValid).toBe(false);
      expect(validateTypingInputPayload({ seq: 1, challengeId: 'c1', index: 0, char: 5 }).isValid).toBe(false);
    });

    it('rejects missing or invalid challenge IDs', () => {
      expect(validateTypingInputPayload({ seq: 1, challengeId: '', index: 0, char: 'a' }).isValid).toBe(false);
      expect(validateTypingInputPayload({ seq: 1, challengeId: '   ', index: 0, char: 'a' }).isValid).toBe(false);
      expect(validateTypingInputPayload({ seq: 1, challengeId: null, index: 0, char: 'a' }).isValid).toBe(false);
    });
  });

  describe('validateJoinPayload and validateResumePayload', () => {
    it('validates join payloads correctly', () => {
      const res = validateJoinPayload({
        sessionId: 'arena-5',
        characterId: 'glitch',
        playerName: 'ShinobiPlayer'
      });
      expect(res.isValid).toBe(true);
      expect(res.data?.sessionId).toBe('arena-5');
      expect(res.data?.characterId).toBe('glitch');
      expect(res.data?.playerName).toBe('ShinobiPlayer');
    });

    it('rejects join payloads with invalid character or missing session', () => {
      expect(validateJoinPayload({ sessionId: 'arena-5', characterId: 'fake' }).isValid).toBe(false);
      expect(validateJoinPayload({ sessionId: '', characterId: 'byte' }).isValid).toBe(false);
    });

    it('validates resume payloads correctly', () => {
      const res = validateResumePayload({
        sessionId: 'arena-5',
        reconnectToken: 'valid-token-123'
      });
      expect(res.isValid).toBe(true);
      expect(res.data?.sessionId).toBe('arena-5');
      expect(res.data?.reconnectToken).toBe('valid-token-123');
    });

    it('rejects resume payloads with missing token or session', () => {
      expect(validateResumePayload({ sessionId: 'arena-5' }).isValid).toBe(false);
      expect(validateResumePayload({ sessionId: '', reconnectToken: 'token' }).isValid).toBe(false);
    });
  });
});
