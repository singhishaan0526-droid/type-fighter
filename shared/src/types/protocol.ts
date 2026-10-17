import type { CharacterId, PlayerSlot } from './game.js';

export type MatchPhase = 'waiting' | 'ready' | 'countdown' | 'battle' | 'finished';

export interface PlayerStatsSnapshot {
  wpm: number;
  accuracy: number;
  maxCombo: number;
  damageDealt: number;
}

export interface PlayerSessionState {
  slot: PlayerSlot;
  socketId: string;
  reconnectToken: string;
  characterId: CharacterId;
  isReady: boolean;
  isConnected: boolean;
  currentHp: number;
  maxHp: number;
  shieldHp: number;
  combo: number;
  maxCombo: number;
  correctKeystrokes: number;
  totalKeystrokes: number;
  mistakes: number;
  damageDealt: number;
  wpm: number;
  accuracy: number;
  currentTypedIndex: number;
  lastSeq: number;
  lastInputTimestamp: number;
  inputCountWindow: number;
  windowStartTime: number;
  challengeId?: string;
  challengeText?: string;
}

export interface MatchSession {
  sessionId: string;
  phase: MatchPhase;
  p1: PlayerSessionState | null;
  p2: PlayerSessionState | null;
  challengeId: string;
  challengeText: string;
  startTime: number | null;
  durationSeconds: number;
  timeLeft: number;
  winner: 'player1' | 'player2' | 'draw' | null;
  finishReason: 'knockout' | 'timeout' | 'forfeit' | 'completion' | null;
  countdownTimer: ReturnType<typeof setInterval> | null;
  matchTimer: ReturnType<typeof setInterval> | null;
  graceTimerP1: ReturnType<typeof setTimeout> | null;
  graceTimerP2: ReturnType<typeof setTimeout> | null;
}

// Client -> Server Payloads
export interface JoinPayload {
  sessionId: string;
  characterId: CharacterId;
  reconnectToken?: string;
  playerName?: string;
}

export interface SelectCharacterPayload {
  characterId: CharacterId;
}

export interface SetReadyPayload {
  ready: boolean;
}

export interface TypingInputPayload {
  seq: number;
  challengeId: string;
  index: number;
  char: string;
  timestamp: number;
}

export interface ResumePayload {
  sessionId: string;
  reconnectToken: string;
}

// Server -> Client Payloads
export interface MatchStateSnapshot {
  sessionId: string;
  phase: MatchPhase;
  yourSlot: PlayerSlot;
  reconnectToken: string;
  p1: {
    characterId: CharacterId;
    isReady: boolean;
    isConnected: boolean;
    currentHp: number;
    maxHp: number;
    shieldHp: number;
    wpm: number;
    accuracy: number;
    combo: number;
    maxCombo: number;
    currentTypedIndex: number;
  } | null;
  p2: {
    characterId: CharacterId;
    isReady: boolean;
    isConnected: boolean;
    currentHp: number;
    maxHp: number;
    shieldHp: number;
    wpm: number;
    accuracy: number;
    combo: number;
    maxCombo: number;
    currentTypedIndex: number;
  } | null;
  challengeId: string;
  challengeText: string;
  durationSeconds: number;
  timeLeft: number;
  winner: 'player1' | 'player2' | 'draw' | null;
  finishReason: string | null;
}

export interface PlayerJoinedEvent {
  slot: PlayerSlot;
  characterId: CharacterId;
  isReady: boolean;
}

export interface PlayerReadyEvent {
  slot: PlayerSlot;
  isReady: boolean;
}

export interface CountdownEvent {
  secondsRemaining: number;
}

export interface MatchStartedEvent {
  challengeId: string;
  challengeText: string;
  durationSeconds: number;
  startTime: number;
}

export interface ChallengeNextEvent {
  slot: PlayerSlot;
  challengeId: string;
  challengeText: string;
}

export interface TypingProgressEvent {
  slot: PlayerSlot;
  index: number;
  correctKeystrokes: number;
  totalKeystrokes: number;
  combo: number;
  maxCombo: number;
  wpm: number;
  accuracy: number;
}

export interface CombatAttackEvent {
  attackerSlot: PlayerSlot;
  targetSlot: PlayerSlot;
  word: string;
  damage: number;
  isCritical: boolean;
  combo: number;
}

export interface PlayerHealthEvent {
  slot: PlayerSlot;
  currentHp: number;
  maxHp: number;
  shieldHp: number;
  damageTaken: number;
}

export interface MatchFinishedEvent {
  winner: 'player1' | 'player2' | 'draw';
  p1Stats: PlayerStatsSnapshot;
  p2Stats: PlayerStatsSnapshot;
  reason: 'knockout' | 'timeout' | 'forfeit' | 'completion';
  elapsedSeconds: number;
}

export interface MatchErrorEvent {
  code: string;
  message: string;
}

export interface ConnectionStatusEvent {
  slot: PlayerSlot;
  status: 'connected' | 'disconnected' | 'reconnected';
  graceSecondsRemaining?: number;
}
