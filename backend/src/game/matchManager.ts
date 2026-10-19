import crypto from 'crypto';
import type {
  MatchSession,
  PlayerSessionState,
  PlayerSlot,
  CharacterId,
  TypingInputPayload,
  MatchPhase,
  MatchStateSnapshot,
  PlayerStatsSnapshot,
  CombatAttackEvent,
  PlayerHealthEvent
} from '@type-fighter/shared';
import {
  CHARACTER_POWERS,
  calculateWpm,
  calculateAccuracy,
  calculateWordDamage,
  applyMistakePenalty,
  evaluateWinner,
  getRandomChallenge
} from './combatEngine.js';

const RATE_LIMIT_WINDOW_MS = 1000;
const MAX_INPUTS_PER_WINDOW = 30; // Max 30 keystrokes/sec
const RECONNECT_GRACE_MS = 15000; // 15 seconds grace period
const MATCH_DURATION_SECS = 180;

export class MatchManager {
  private sessions = new Map<string, MatchSession>();
  private socketToSession = new Map<string, { sessionId: string; slot: PlayerSlot }>();

  public getSession(sessionId: string): MatchSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getSessionBySocket(socketId: string): { session: MatchSession; slot: PlayerSlot } | undefined {
    const mapping = this.socketToSession.get(socketId);
    if (!mapping) return undefined;
    const session = this.sessions.get(mapping.sessionId);
    if (!session) return undefined;
    return { session, slot: mapping.slot };
  }

  public getOrCreateSession(sessionId: string): MatchSession {
    let session = this.sessions.get(sessionId);
    if (!session) {
      const challenge = getRandomChallenge();
      session = {
        sessionId,
        phase: 'waiting',
        p1: null,
        p2: null,
        challengeId: challenge.id,
        challengeText: challenge.text,
        startTime: null,
        durationSeconds: MATCH_DURATION_SECS,
        timeLeft: MATCH_DURATION_SECS,
        winner: null,
        finishReason: null,
        countdownTimer: null,
        matchTimer: null,
        graceTimerP1: null,
        graceTimerP2: null
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  public joinSession(
    sessionId: string,
    socketId: string,
    characterId: CharacterId,
    reconnectToken?: string
  ): { session: MatchSession; slot: PlayerSlot; reconnectToken: string } {
    const session = this.getOrCreateSession(sessionId);

    // If reconnectToken was provided, check if this is an existing disconnected player returning
    if (reconnectToken) {
      if (session.p1 && session.p1.reconnectToken === reconnectToken) {
        return this.resumeSession(sessionId, reconnectToken, socketId);
      }
      if (session.p2 && session.p2.reconnectToken === reconnectToken) {
        return this.resumeSession(sessionId, reconnectToken, socketId);
      }
    }

    // Check if THIS socket is already registered in this session (idempotent join / StrictMode protection)
    if (session.p1 && session.p1.socketId === socketId) {
      session.p1.characterId = characterId;
      session.p1.isConnected = true;
      this.socketToSession.set(socketId, { sessionId, slot: 'player1' });
      return { session, slot: 'player1', reconnectToken: session.p1.reconnectToken };
    }
    if (session.p2 && session.p2.socketId === socketId) {
      session.p2.characterId = characterId;
      session.p2.isConnected = true;
      this.socketToSession.set(socketId, { sessionId, slot: 'player2' });
      return { session, slot: 'player2', reconnectToken: session.p2.reconnectToken };
    }

    // If session was finished, reset it for a fresh match and clear any disconnected players
    if (session.phase === 'finished') {
      this.resetSessionForRematch(session);
      if (session.p1 && !session.p1.isConnected) {
        this.socketToSession.delete(session.p1.socketId);
        session.p1 = null;
      }
      if (session.p2 && !session.p2.isConnected) {
        this.socketToSession.delete(session.p2.socketId);
        session.p2 = null;
      }
      session.phase = session.p1 && session.p2 ? 'ready' : 'waiting';
    }

    // If session is waiting or ready, clean up disconnected players whose socket is gone
    if (session.phase === 'waiting' || session.phase === 'ready') {
      if (session.p1 && !session.p1.isConnected) {
        this.socketToSession.delete(session.p1.socketId);
        session.p1 = null;
        session.phase = 'waiting';
      }
      if (session.p2 && !session.p2.isConnected) {
        this.socketToSession.delete(session.p2.socketId);
        session.p2 = null;
        session.phase = 'waiting';
      }
    }

    // New join check
    if (session.phase !== 'waiting' && session.phase !== 'ready') {
      throw new Error('MATCH_ALREADY_IN_PROGRESS');
    }

    let slot: PlayerSlot;
    const token = crypto.randomUUID();

    if (!session.p1) {
      slot = 'player1';
      session.p1 = this.createPlayerState(slot, socketId, token, characterId);
    } else if (!session.p2) {
      slot = 'player2';
      session.p2 = this.createPlayerState(slot, socketId, token, characterId);
    } else {
      throw new Error('SESSION_FULL');
    }

    if (session.p1 && session.p2) {
      session.phase = 'ready'; // Both players are in the lobby
    }

    this.socketToSession.set(socketId, { sessionId, slot });
    return { session, slot, reconnectToken: token };
  }

  private createPlayerState(
    slot: PlayerSlot,
    socketId: string,
    reconnectToken: string,
    characterId: CharacterId
  ): PlayerSessionState {
    return {
      slot,
      socketId,
      reconnectToken,
      characterId,
      isReady: false,
      isConnected: true,
      currentHp: 100,
      maxHp: 100,
      shieldHp: 0,
      combo: 0,
      maxCombo: 0,
      correctKeystrokes: 0,
      totalKeystrokes: 0,
      mistakes: 0,
      damageDealt: 0,
      wpm: 0,
      accuracy: 100,
      currentTypedIndex: 0,
      lastSeq: 0,
      lastInputTimestamp: 0,
      inputCountWindow: 0,
      windowStartTime: Date.now()
    };
  }

  public selectCharacter(socketId: string, characterId: CharacterId): { session: MatchSession; slot: PlayerSlot } {
    const mapping = this.getSessionBySocket(socketId);
    if (!mapping) throw new Error('NOT_IN_SESSION');
    const { session, slot } = mapping;

    if (session.phase !== 'waiting' && session.phase !== 'ready') {
      throw new Error('CANNOT_CHANGE_CHARACTER_IN_BATTLE');
    }

    const player = slot === 'player1' ? session.p1 : session.p2;
    if (!player) throw new Error('PLAYER_NOT_FOUND');

    player.characterId = characterId;
    return { session, slot };
  }

  public setReady(
    socketId: string,
    isReady: boolean
  ): { session: MatchSession; slot: PlayerSlot; bothReady: boolean } {
    const mapping = this.getSessionBySocket(socketId);
    if (!mapping) throw new Error('NOT_IN_SESSION');
    const { session, slot } = mapping;

    if (session.phase === 'finished') {
      this.resetSessionForRematch(session);
    }

    if (session.phase !== 'waiting' && session.phase !== 'ready') {
      throw new Error('INVALID_SESSION_STATE');
    }

    const player = slot === 'player1' ? session.p1 : session.p2;
    if (!player) throw new Error('PLAYER_NOT_FOUND');

    player.isReady = isReady;

    const bothReady = !!(session.p1?.isReady && session.p2?.isReady);
    return { session, slot, bothReady };
  }

  public resetSessionForRematch(session: MatchSession): void {
    const nextChallenge = getRandomChallenge(session.challengeId);
    session.challengeId = nextChallenge.id;
    session.challengeText = nextChallenge.text;
    session.phase = session.p1 && session.p2 ? 'ready' : 'waiting';
    session.winner = null;
    session.finishReason = null;
    session.startTime = null;
    session.timeLeft = session.durationSeconds;

    if (session.countdownTimer) {
      clearInterval(session.countdownTimer);
      session.countdownTimer = null;
    }
    if (session.matchTimer) {
      clearInterval(session.matchTimer);
      session.matchTimer = null;
    }

    const resetPlayer = (p: PlayerSessionState) => {
      p.isReady = false;
      p.currentHp = p.maxHp;
      p.shieldHp = 0;
      p.combo = 0;
      p.maxCombo = 0;
      p.correctKeystrokes = 0;
      p.totalKeystrokes = 0;
      p.mistakes = 0;
      p.damageDealt = 0;
      p.wpm = 0;
      p.accuracy = 100;
      p.currentTypedIndex = 0;
      p.lastSeq = 0;
      p.lastInputTimestamp = 0;
      p.inputCountWindow = 0;
      p.windowStartTime = Date.now();
    };

    if (session.p1) resetPlayer(session.p1);
    if (session.p2) resetPlayer(session.p2);
  }

  public startCountdown(
    sessionId: string,
    onTick: (secondsRemaining: number) => void,
    onStart: (session: MatchSession) => void
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.countdownTimer) clearInterval(session.countdownTimer);

    session.phase = 'countdown';
    let remaining = 3;
    onTick(remaining);

    session.countdownTimer = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        onTick(remaining);
      } else {
        if (session.countdownTimer) clearInterval(session.countdownTimer);
        session.countdownTimer = null;
        session.phase = 'battle';
        session.startTime = Date.now();
        onStart(session);
      }
    }, 1000);
  }

  public startBattleTimer(
    sessionId: string,
    onTick: (timeLeft: number) => void,
    onTimeOut: (session: MatchSession) => void
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.matchTimer) clearInterval(session.matchTimer);

    session.timeLeft = session.durationSeconds;

    session.matchTimer = setInterval(() => {
      if (session.phase !== 'battle') {
        if (session.matchTimer) clearInterval(session.matchTimer);
        return;
      }

      session.timeLeft -= 1;
      onTick(session.timeLeft);

      if (session.timeLeft <= 0) {
        if (session.matchTimer) clearInterval(session.matchTimer);
        session.matchTimer = null;
        onTimeOut(session);
      }
    }, 1000);
  }

  public processTypingInput(
    socketId: string,
    payload: TypingInputPayload
  ): {
    valid: boolean;
    errorCode?: string;
    errorMessage?: string;
    isMatch?: boolean;
    slot?: PlayerSlot;
    session?: MatchSession;
    attackEvent?: CombatAttackEvent;
    healthEvents?: PlayerHealthEvent[];
    matchFinished?: boolean;
    nextChallenge?: { id: string; text: string };
  } {
    const mapping = this.getSessionBySocket(socketId);
    if (!mapping) {
      return { valid: false, errorCode: 'UNAUTHORIZED', errorMessage: 'Sender not part of an active session.' };
    }

    const { session, slot } = mapping;

    if (session.phase !== 'battle') {
      return { valid: false, errorCode: 'INVALID_STATE', errorMessage: 'Match is not in active battle phase.' };
    }

    const player = slot === 'player1' ? session.p1 : session.p2;
    const opponent = slot === 'player1' ? session.p2 : session.p1;
    const opponentSlot = slot === 'player1' ? 'player2' : 'player1';

    if (!player || !opponent) {
      return { valid: false, errorCode: 'PLAYER_MISSING', errorMessage: 'Players not populated.' };
    }

    const activeChallengeId = player.challengeId || session.challengeId;
    const activeChallengeText = player.challengeText || session.challengeText;

    if (payload.challengeId !== activeChallengeId && payload.challengeId !== session.challengeId) {
      return { valid: false, errorCode: 'INVALID_CHALLENGE', errorMessage: 'Challenge ID does not match active challenge.' };
    }

    // Monotonic Sequence validation
    if (payload.seq <= player.lastSeq) {
      return { valid: false, errorCode: 'STALE_SEQUENCE', errorMessage: 'Duplicate or out-of-order sequence received.' };
    }
    player.lastSeq = payload.seq;

    // Rate Limiting
    const now = Date.now();
    if (now - player.windowStartTime > RATE_LIMIT_WINDOW_MS) {
      player.windowStartTime = now;
      player.inputCountWindow = 1;
    } else {
      player.inputCountWindow += 1;
      if (player.inputCountWindow > MAX_INPUTS_PER_WINDOW) {
        return { valid: false, errorCode: 'RATE_LIMITED', errorMessage: 'Keystroke input rate limit exceeded.' };
      }
    }

    // Progression index validation (cannot skip ahead or go backwards)
    if (payload.index !== player.currentTypedIndex) {
      return { valid: false, errorCode: 'IMPOSSIBLE_PROGRESS', errorMessage: 'Submitted position does not match expected position.' };
    }

    const expectedChar = activeChallengeText[payload.index];
    const isCharCorrect = payload.char === expectedChar;

    const elapsedSeconds = session.startTime ? Math.max(1, (now - session.startTime) / 1000) : 1;

    let attackEvent: CombatAttackEvent | undefined;
    const healthEvents: PlayerHealthEvent[] = [];
    let matchFinished = false;
    let nextChallenge: { id: string; text: string } | undefined;

    // Advance progression with every accepted keystroke (never block on errors!)
    player.currentTypedIndex += 1;
    player.totalKeystrokes += 1;

    if (isCharCorrect) {
      player.correctKeystrokes += 1;
      player.combo += 1;
      player.maxCombo = Math.max(player.maxCombo, player.combo);
    } else {
      player.mistakes += 1;
      player.combo = applyMistakePenalty(player.combo);
    }

    player.accuracy = calculateAccuracy(player.correctKeystrokes, player.totalKeystrokes);
    player.wpm = calculateWpm(player.correctKeystrokes, elapsedSeconds);

    // Check for word completion or full sentence completion
    const isEndOfSentence = player.currentTypedIndex >= activeChallengeText.length;
    const isWordBoundary = payload.char === ' ' || isEndOfSentence;

    if (isWordBoundary) {
      const words = activeChallengeText.slice(0, player.currentTypedIndex).trim().split(/\s+/);
      const lastWord = words[words.length - 1] || 'strike';
      const powerStat = CHARACTER_POWERS[player.characterId] || 80;

      const { damage, isCritical } = calculateWordDamage(
        lastWord.length,
        player.combo,
        powerStat,
        isEndOfSentence
      );

      player.damageDealt += damage;

      // Apply damage to opponent with shield absorption
      let damageToHp = damage;
      let newShield = opponent.shieldHp;
      if (newShield > 0) {
        if (newShield >= damage) {
          newShield -= damage;
          damageToHp = 0;
        } else {
          damageToHp = damage - newShield;
          newShield = 0;
        }
      }

      opponent.shieldHp = newShield;
      opponent.currentHp = Math.max(0, opponent.currentHp - damageToHp);

      attackEvent = {
        attackerSlot: slot,
        targetSlot: opponentSlot,
        word: lastWord,
        damage,
        isCritical,
        combo: player.combo
      };

      healthEvents.push({
        slot: opponentSlot,
        currentHp: opponent.currentHp,
        maxHp: opponent.maxHp,
        shieldHp: opponent.shieldHp,
        damageTaken: damageToHp
      });

      // Knockout check
      if (opponent.currentHp <= 0) {
        matchFinished = true;
        this.finishMatch(session.sessionId, slot, 'knockout');
      }
    }

    // Auto-advance to next sentence on completion if match not finished
    if (isEndOfSentence && !matchFinished) {
      const picked = getRandomChallenge(activeChallengeId);
      player.challengeId = picked.id;
      player.challengeText = picked.text;
      player.currentTypedIndex = 0;
      nextChallenge = { id: picked.id, text: picked.text };
    }

    return {
      valid: true,
      isMatch: isCharCorrect,
      slot,
      session,
      attackEvent,
      healthEvents,
      matchFinished,
      nextChallenge
    };
  }

  public handleDisconnect(
    socketId: string,
    onGraceExpired: (session: MatchSession, disconnectedSlot: PlayerSlot) => void
  ): { session: MatchSession; slot: PlayerSlot } | null {
    const mapping = this.getSessionBySocket(socketId);
    if (!mapping) return null;
    const { session, slot } = mapping;

    this.socketToSession.delete(socketId);

    const player = slot === 'player1' ? session.p1 : session.p2;
    if (!player) return null;

    player.isConnected = false;

    // If match was waiting or ready in lobby, remove player
    if (session.phase === 'waiting' || session.phase === 'ready') {
      if (slot === 'player1') {
        session.p1 = null;
      } else {
        session.p2 = null;
      }
      session.phase = 'waiting';
      if (!session.p1 && !session.p2) {
        this.cleanupSession(session.sessionId);
      }
      return { session, slot };
    }

    // If match was active (countdown or battle), start grace period
    if (session.phase === 'countdown' || session.phase === 'battle') {
      const graceTimer = setTimeout(() => {
        // If player still hasn't reconnected, forfeit
        if (!player.isConnected && session.phase === 'battle') {
          onGraceExpired(session, slot);
        }
      }, RECONNECT_GRACE_MS);

      if (slot === 'player1') {
        session.graceTimerP1 = graceTimer;
      } else {
        session.graceTimerP2 = graceTimer;
      }
    }

    return { session, slot };
  }

  public resumeSession(
    sessionId: string,
    reconnectToken: string,
    newSocketId: string
  ): { session: MatchSession; slot: PlayerSlot; reconnectToken: string } {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('SESSION_NOT_FOUND');

    let player: PlayerSessionState | null = null;
    let slot: PlayerSlot;

    if (session.p1 && session.p1.reconnectToken === reconnectToken) {
      player = session.p1;
      slot = 'player1';
      if (session.graceTimerP1) {
        clearTimeout(session.graceTimerP1);
        session.graceTimerP1 = null;
      }
    } else if (session.p2 && session.p2.reconnectToken === reconnectToken) {
      player = session.p2;
      slot = 'player2';
      if (session.graceTimerP2) {
        clearTimeout(session.graceTimerP2);
        session.graceTimerP2 = null;
      }
    } else {
      throw new Error('INVALID_RECONNECT_TOKEN');
    }

    player.socketId = newSocketId;
    player.isConnected = true;
    this.socketToSession.set(newSocketId, { sessionId, slot });

    return { session, slot, reconnectToken };
  }

  public finishMatch(
    sessionId: string,
    winner: 'player1' | 'player2' | 'draw',
    reason: 'knockout' | 'timeout' | 'forfeit' | 'completion'
  ): MatchSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (session.phase === 'finished') {
      return session;
    }

    if (session.countdownTimer) {
      clearInterval(session.countdownTimer);
      session.countdownTimer = null;
    }
    if (session.matchTimer) {
      clearInterval(session.matchTimer);
      session.matchTimer = null;
    }
    if (session.graceTimerP1) {
      clearTimeout(session.graceTimerP1);
      session.graceTimerP1 = null;
    }
    if (session.graceTimerP2) {
      clearTimeout(session.graceTimerP2);
      session.graceTimerP2 = null;
    }

    session.phase = 'finished';
    session.winner = winner;
    session.finishReason = reason;

    return session;
  }

  public evaluateTimeoutWinner(sessionId: string): MatchSession | null {
    const session = this.sessions.get(sessionId);
    if (!session || !session.p1 || !session.p2 || session.phase === 'finished') return null;

    const p1SentenceLen = session.p1.challengeText?.length || session.challengeText.length || 1;
    const p2SentenceLen = session.p2.challengeText?.length || session.challengeText.length || 1;
    const p1Progress = (session.p1.currentTypedIndex / p1SentenceLen) * 100;
    const p2Progress = (session.p2.currentTypedIndex / p2SentenceLen) * 100;

    const winner = evaluateWinner(
      session.p1.currentHp,
      session.p1.accuracy,
      session.p2.currentHp,
      session.p2.accuracy,
      p1Progress,
      p2Progress,
      session.p1.maxHp,
      session.p2.maxHp
    );

    return this.finishMatch(sessionId, winner, 'timeout');
  }

  public createSnapshot(session: MatchSession, playerSlot: PlayerSlot): MatchStateSnapshot {
    const player = playerSlot === 'player1' ? session.p1 : session.p2;
    return {
      sessionId: session.sessionId,
      phase: session.phase,
      yourSlot: playerSlot,
      reconnectToken: player ? player.reconnectToken : '',
      p1: session.p1
        ? {
            characterId: session.p1.characterId,
            isReady: session.p1.isReady,
            isConnected: session.p1.isConnected,
            currentHp: session.p1.currentHp,
            maxHp: session.p1.maxHp,
            shieldHp: session.p1.shieldHp,
            wpm: session.p1.wpm,
            accuracy: session.p1.accuracy,
            combo: session.p1.combo,
            maxCombo: session.p1.maxCombo,
            currentTypedIndex: session.p1.currentTypedIndex
          }
        : null,
      p2: session.p2
        ? {
            characterId: session.p2.characterId,
            isReady: session.p2.isReady,
            isConnected: session.p2.isConnected,
            currentHp: session.p2.currentHp,
            maxHp: session.p2.maxHp,
            shieldHp: session.p2.shieldHp,
            wpm: session.p2.wpm,
            accuracy: session.p2.accuracy,
            combo: session.p2.combo,
            maxCombo: session.p2.maxCombo,
            currentTypedIndex: session.p2.currentTypedIndex
          }
        : null,
      challengeId: session.challengeId,
      challengeText: session.challengeText,
      durationSeconds: session.durationSeconds,
      timeLeft: session.timeLeft,
      winner: session.winner,
      finishReason: session.finishReason
    };
  }

  public getStatsSnapshot(player: PlayerSessionState): PlayerStatsSnapshot {
    return {
      wpm: player.wpm,
      accuracy: player.accuracy,
      maxCombo: player.maxCombo,
      damageDealt: player.damageDealt
    };
  }

  public leaveSession(socketId: string): { session: MatchSession; slot: PlayerSlot } | null {
    const mapping = this.getSessionBySocket(socketId);
    if (!mapping) return null;
    const { session, slot } = mapping;

    this.socketToSession.delete(socketId);

    if (slot === 'player1') {
      session.p1 = null;
    } else {
      session.p2 = null;
    }

    if (session.phase === 'waiting' || session.phase === 'ready') {
      session.phase = 'waiting';
    }

    if (!session.p1 && !session.p2) {
      this.cleanupSession(session.sessionId);
    }

    return { session, slot };
  }

  public cleanupSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.countdownTimer) clearInterval(session.countdownTimer);
    if (session.matchTimer) clearInterval(session.matchTimer);
    if (session.graceTimerP1) clearTimeout(session.graceTimerP1);
    if (session.graceTimerP2) clearTimeout(session.graceTimerP2);

    if (session.p1) this.socketToSession.delete(session.p1.socketId);
    if (session.p2) this.socketToSession.delete(session.p2.socketId);

    this.sessions.delete(sessionId);
  }
}
