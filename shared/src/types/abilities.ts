import type { CharacterId } from './game.js';

export interface UltimateAbility {
  name: string;
  description: string;
  flavorText: string;
  requiredMeter: number; // 100
  cooldownSeconds: number;
  effectType: 'burst_damage' | 'combo_freeze' | 'life_steal' | 'super_crit' | 'shield' | 'haste';
}

export const CHARACTER_ULTIMATES: Record<CharacterId, UltimateAbility> = {
  byte: {
    name: 'OVERCLOCK SURGE',
    description: 'Discharges electric currents from the energy staff, dealing 25 bonus damage and freezing the opponent for 2.5s.',
    flavorText: 'System overdrive engaged. Strike at lightspeed!',
    requiredMeter: 100,
    cooldownSeconds: 15,
    effectType: 'combo_freeze'
  },
  glitch: {
    name: 'CRIMSON CROSS-SLASH',
    description: 'Unleashes a flurry of dual-blade cross strikes dealing massive 35 damage with 100% critical impact.',
    flavorText: 'Two blades, zero mercy. Taste the red edge!',
    requiredMeter: 100,
    cooldownSeconds: 18,
    effectType: 'super_crit'
  },
  zenko: {
    name: 'SEISMIC SPIRIT SLAM',
    description: 'Brings the spirit hammer crashing down, dealing 30 damage and shattering the opponent\'s combo.',
    flavorText: 'Earth heaves under the weight of focused mind.',
    requiredMeter: 100,
    cooldownSeconds: 20,
    effectType: 'burst_damage'
  },
  nova: {
    name: 'PHANTOM SNARE',
    description: 'Flings the chain sickle in a spiraling vortex, entangling the opponent and granting a 30 HP barrier.',
    flavorText: 'Silken chains bind your fate in purple twilight.',
    requiredMeter: 100,
    cooldownSeconds: 18,
    effectType: 'shield'
  },
  zephyr: {
    name: 'CYCLONE SPEAR THRUST',
    description: 'Spins the jade wind spear creating a gale that deals 28 damage and boosts your next 5 strikes by +50%.',
    flavorText: 'Ride the turbulent tempest straight through your foe.',
    requiredMeter: 100,
    cooldownSeconds: 16,
    effectType: 'haste'
  },
  raven: {
    name: 'SOUL REAP DRAIN',
    description: 'Sweeps the spectral soul scythe across the arena, dealing 25 damage and siphoning 18 HP back to self.',
    flavorText: 'Every lost letter is nourishment for the abyss.',
    requiredMeter: 100,
    cooldownSeconds: 20,
    effectType: 'life_steal'
  }
};

export interface MatchRecord {
  id: string;
  timestamp: number;
  playerCharacterId: CharacterId;
  opponentCharacterId: CharacterId;
  winner: 'player1' | 'player2' | 'draw';
  playerWpm: number;
  opponentWpm: number;
  playerAccuracy: number;
  playerMaxCombo: number;
  playerDamage: number;
  difficulty: string;
  mode: string;
}

export interface PlayerProfileStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  peakWpm: number;
  averageWpm: number;
  averageAccuracy: number;
  highestCombo: number;
  favoriteCharacter: CharacterId;
}
