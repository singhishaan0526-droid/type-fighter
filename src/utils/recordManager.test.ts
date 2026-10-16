import { describe, it, expect } from 'vitest';
import { computeProfileStats } from './recordManager';
import type { MatchRecord } from '../types/abilities';

describe('Player Profile Stats Computation', () => {
  it('returns default zeros for empty record array', () => {
    const stats = computeProfileStats([]);
    expect(stats.totalMatches).toBe(0);
    expect(stats.wins).toBe(0);
    expect(stats.peakWpm).toBe(0);
    expect(stats.favoriteCharacter).toBe('byte');
  });

  it('accurately aggregates matches, win rate, peak WPM, and favorite character', () => {
    const mockRecords: MatchRecord[] = [
      {
        id: '1',
        timestamp: 1000,
        playerCharacterId: 'glitch',
        opponentCharacterId: 'byte',
        winner: 'player1',
        playerWpm: 70,
        opponentWpm: 55,
        playerAccuracy: 96,
        playerMaxCombo: 12,
        playerDamage: 105,
        difficulty: 'medium',
        mode: 'vs-bot'
      },
      {
        id: '2',
        timestamp: 2000,
        playerCharacterId: 'glitch',
        opponentCharacterId: 'zenko',
        winner: 'player1',
        playerWpm: 90,
        opponentWpm: 60,
        playerAccuracy: 98,
        playerMaxCombo: 18,
        playerDamage: 110,
        difficulty: 'hard',
        mode: 'vs-bot'
      },
      {
        id: '3',
        timestamp: 3000,
        playerCharacterId: 'zenko',
        opponentCharacterId: 'glitch',
        winner: 'player2',
        playerWpm: 60,
        opponentWpm: 75,
        playerAccuracy: 90,
        playerMaxCombo: 8,
        playerDamage: 70,
        difficulty: 'medium',
        mode: 'vs-bot'
      }
    ];

    const stats = computeProfileStats(mockRecords);
    expect(stats.totalMatches).toBe(3);
    expect(stats.wins).toBe(2);
    expect(stats.losses).toBe(1);
    expect(stats.peakWpm).toBe(90);
    expect(stats.averageWpm).toBe(73); // (70 + 90 + 60) / 3 = 73.33
    expect(stats.highestCombo).toBe(18);
    expect(stats.favoriteCharacter).toBe('glitch'); // 2 matches with Glitch
  });
});
