import type { MatchRecord, PlayerProfileStats } from '../types/abilities';
import type { CharacterId } from '../types/game';

const STORAGE_KEY = 'typing_battle_records_v1';

export function getSavedMatchRecords(): MatchRecord[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveMatchRecord(record: Omit<MatchRecord, 'id' | 'timestamp'>): MatchRecord {
  const newRecord: MatchRecord = {
    ...record,
    id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now()
  };

  try {
    const existing = getSavedMatchRecords();
    const updated = [newRecord, ...existing].slice(0, 50); // Store up to 50 recent matches
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // LocalStorage quota safe guard
  }

  return newRecord;
}

export function clearMatchRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // safe guard
  }
}

export function computeProfileStats(records: MatchRecord[]): PlayerProfileStats {
  if (records.length === 0) {
    return {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      peakWpm: 0,
      averageWpm: 0,
      averageAccuracy: 100,
      highestCombo: 0,
      favoriteCharacter: 'byte'
    };
  }

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let peakWpm = 0;
  let totalWpm = 0;
  let totalAccuracy = 0;
  let highestCombo = 0;
  const characterCounts: Record<string, number> = {};

  records.forEach((r) => {
    if (r.winner === 'player1') wins += 1;
    else if (r.winner === 'player2') losses += 1;
    else draws += 1;

    if (r.playerWpm > peakWpm) peakWpm = r.playerWpm;
    if (r.playerMaxCombo > highestCombo) highestCombo = r.playerMaxCombo;

    totalWpm += r.playerWpm;
    totalAccuracy += r.playerAccuracy;

    characterCounts[r.playerCharacterId] = (characterCounts[r.playerCharacterId] || 0) + 1;
  });

  // Calculate favorite character
  let favoriteCharacter: CharacterId = 'byte';
  let maxCount = 0;
  for (const [charId, count] of Object.entries(characterCounts)) {
    if (count > maxCount) {
      maxCount = count;
      favoriteCharacter = charId as CharacterId;
    }
  }

  return {
    totalMatches: records.length,
    wins,
    losses,
    draws,
    peakWpm,
    averageWpm: Math.round(totalWpm / records.length),
    averageAccuracy: Math.round(totalAccuracy / records.length),
    highestCombo,
    favoriteCharacter
  };
}
