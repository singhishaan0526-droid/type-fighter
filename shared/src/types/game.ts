export type CharacterId = 'byte' | 'glitch' | 'zenko' | 'nova' | 'zephyr' | 'raven';

export interface CharacterStats {
  speed: number;       // 1 - 100
  power: number;       // 1 - 100
  agility: number;     // 1 - 100
}

export type WeaponType = 'staff' | 'dual_blades' | 'hammer' | 'chain_sickle' | 'spear' | 'scythe';

export interface Character {
  id: CharacterId;
  name: string;
  title: string;
  weapon: string;
  tagline: string;
  themeColor: string;
  accentGlow: string;
  secondaryColor: string;
  avatarUrl: string;
  stats: CharacterStats;
  weaponType: WeaponType;
  attackDescription: string;
  finisherName: string;
  finisherQuote: string;
  defeatQuote: string;
  uniqueMoveName: string;
  uniqueMoveDesc: string;
}

export type CombatAnimationState =
  | 'idle'
  | 'walk'
  | 'dash'
  | 'attack'
  | 'punch'
  | 'kick'
  | 'unique'
  | 'hit'
  | 'dodge'
  | 'finisher'
  | 'victory'
  | 'defeat';

export interface FloatingText {
  id: string;
  text: string;
  type: 'damage' | 'critical' | 'combo' | 'miss' | 'finisher';
  x: number; // percentage in arena
  y: number; // percentage in arena
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export interface FighterState {
  character: Character;
  maxHp: number;
  currentHp: number;
  combo: number;
  maxCombo: number;
  animation: CombatAnimationState;
  wpm: number;
  accuracy: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  mistakes: number;
  damageDealt: number;
  superMeter: number;     // 0 - 100
  shieldHp: number;       // Barrier absorption
  isFrozen: boolean;      // Freeze debuff from Byte
  hasHasteBuff: boolean;  // Zephyr speed strike buff
}

export type GamePhase = 'select' | 'battle' | 'ended';

export type GameMode = 'vs-bot' | 'local-duel' | 'practice' | 'online-duel';

export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'master';

export type PlayerSlot = 'player1' | 'player2';

export interface BattleResult {
  winner: 'player1' | 'player2' | 'draw';
  p1Stats: {
    wpm: number;
    accuracy: number;
    maxCombo: number;
    damageDealt: number;
  };
  p2Stats: {
    wpm: number;
    accuracy: number;
    maxCombo: number;
    damageDealt: number;
  };
  elapsedSeconds: number;
  finishReason?: string;
}
