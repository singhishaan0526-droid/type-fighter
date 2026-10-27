import { Peer, type DataConnection } from 'peerjs';
import { BATTLE_SENTENCES, getRandomSentence } from '../data/sentences';
import { calculateWordDamage, evaluateWinner } from './combatMath';
import { getCharacterById } from '../data/characters';
import type { CharacterId, PlayerSlot } from '../types/game';

export interface PeerBattleSnapshot {
  sessionId: string;
  phase: 'waiting' | 'ready' | 'countdown' | 'battle' | 'finished';
  yourSlot: PlayerSlot;
  isHost: boolean;
  p1: {
    characterId: CharacterId;
    isReady: boolean;
    currentHp: number;
    maxHp: number;
    shieldHp: number;
    wpm: number;
    accuracy: number;
    combo: number;
    maxCombo: number;
  };
  p2: {
    characterId: CharacterId;
    isReady: boolean;
    currentHp: number;
    maxHp: number;
    shieldHp: number;
    wpm: number;
    accuracy: number;
    combo: number;
    maxCombo: number;
  };
  challengeText: string;
  challengeId: string;
  timeLeft: number;
}

type EventCallback = (payload: any) => void;

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' }
];

export class PeerBattleClient {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  public isHost: boolean = false;
  public yourSlot: PlayerSlot = 'player1';
  public sessionId: string = '';
  public pingMs: number = 0;

  // Authoritative host state
  private phase: 'waiting' | 'ready' | 'countdown' | 'battle' | 'finished' = 'waiting';
  private p1State = {
    characterId: 'byte' as CharacterId,
    isReady: false,
    currentHp: 500,
    maxHp: 500,
    shieldHp: 0,
    wpm: 0,
    accuracy: 100,
    combo: 0,
    maxCombo: 0,
    correctKeystrokes: 0,
    totalKeystrokes: 0,
    damageDealt: 0
  };
  private p2State = {
    characterId: 'glitch' as CharacterId,
    isReady: false,
    currentHp: 500,
    maxHp: 500,
    shieldHp: 0,
    wpm: 0,
    accuracy: 100,
    combo: 0,
    maxCombo: 0,
    correctKeystrokes: 0,
    totalKeystrokes: 0,
    damageDealt: 0
  };
  private challengeText: string = '';
  private challengeId: string = 'c1';
  private timeLeft: number = 75;
  private matchTimer: ReturnType<typeof setInterval> | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private p1Rematch: boolean = false;
  private p2Rematch: boolean = false;
  private startTime: number = 0;

  // Event subscription
  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public emit(event: string, payload: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`Error in event callback for ${event}:`, e);
        }
      });
    }
  }

  private sendOverDataChannel(message: any) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(message);
      } catch (err) {
        console.warn('[PeerBattle] send error:', err);
      }
    }
  }

  /**
   * Normalize user room code to a valid, clean PeerJS ID
   */
  public static sanitizeRoomCode(raw: string): string {
    const clean = raw.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
    return clean || 'arena-1';
  }

  public static getPeerIdForRoom(roomCode: string): string {
    return `tf26-room-${this.sanitizeRoomCode(roomCode)}`;
  }

  /**
   * Start hosting a room as Player 1
   */
  public startHost(roomCode: string, initialCharId: CharacterId) {
    this.cleanup();
    this.sessionId = PeerBattleClient.sanitizeRoomCode(roomCode);
    this.isHost = true;
    this.yourSlot = 'player1';
    this.p1State.characterId = initialCharId;
    this.challengeText = getRandomSentence() || BATTLE_SENTENCES[0].text;
    this.challengeId = `c-${Date.now()}`;

    const hostPeerId = PeerBattleClient.getPeerIdForRoom(this.sessionId);

    this.peer = new Peer(hostPeerId, {
      config: { iceServers: ICE_SERVERS },
      debug: 1
    });

    this.peer.on('open', (id) => {
      console.log('[PeerBattle Host] Created room successfully, Peer ID:', id);
      this.emit('host:ready', { sessionId: this.sessionId, peerId: id });
      this.emit('match:state', this.createSnapshot('player1'));
    });

    this.peer.on('connection', (connection) => {
      console.log('[PeerBattle Host] Guest challenger connected!');
      this.conn = connection;
      this.setupConnection(connection);
    });

    this.peer.on('error', (err: any) => {
      console.warn('[PeerBattle Host] Peer error:', err?.type, err?.message);
      if (err?.type === 'unavailable-id') {
        // ID is already taken - either another laptop is hosting this code or previous session didn't unregister yet.
        // Try connecting as challenger instead!
        console.log('[PeerBattle] Room already hosted by another peer. Attempting to join as challenger...');
        this.joinRoom(this.sessionId, initialCharId);
      } else {
        this.emit('peer:error', { type: err?.type, message: err?.message || 'Connection error' });
      }
    });

    this.startPingLoop();
  }

  /**
   * Join an existing room as Player 2
   */
  public joinRoom(roomCode: string, initialCharId: CharacterId) {
    this.cleanup();
    this.sessionId = PeerBattleClient.sanitizeRoomCode(roomCode);
    this.isHost = false;
    this.yourSlot = 'player2';
    this.p2State.characterId = initialCharId;

    const hostPeerId = PeerBattleClient.getPeerIdForRoom(this.sessionId);

    // Guest gets an auto-generated random Peer ID
    this.peer = new Peer({
      config: { iceServers: ICE_SERVERS },
      debug: 1
    });

    this.peer.on('open', () => {
      console.log(`[PeerBattle Guest] Connecting to host: ${hostPeerId}...`);
      const connection = this.peer!.connect(hostPeerId, {
        reliable: true
      });
      this.conn = connection;
      this.setupConnection(connection);
    });

    this.peer.on('error', (err: any) => {
      console.warn('[PeerBattle Guest] Peer error:', err?.type, err?.message);
      this.emit('peer:error', {
        type: err?.type,
        message: err?.type === 'peer-unavailable'
          ? `Could not find room "${this.sessionId}". Make sure Laptop 1 has hosted the room first!`
          : err?.message || 'Connection error'
      });
    });

    this.startPingLoop();
  }

  private setupConnection(connection: DataConnection) {
    connection.on('open', () => {
      console.log('[PeerBattle] WebRTC DataChannel connection established!');
      this.emit('peer:connected', { slot: this.yourSlot });

      if (this.isHost) {
        // Send state snapshot to joining guest
        this.phase = 'ready';
        this.sendOverDataChannel({
          type: 'match:state',
          snapshot: this.createSnapshot('player2')
        });

        this.emit('player:joined', {
          slot: 'player2',
          characterId: this.p2State.characterId,
          isReady: false
        });
        this.emit('match:state', this.createSnapshot('player1'));
      } else {
        // Guest sends handshake join payload
        this.sendOverDataChannel({
          type: 'match:join',
          characterId: this.p2State.characterId
        });
      }
    });

    connection.on('data', (data: any) => {
      this.handleIncomingData(data);
    });

    connection.on('close', () => {
      console.log('[PeerBattle] Connection closed by remote peer.');
      this.emit('player:left', { slot: this.yourSlot === 'player1' ? 'player2' : 'player1' });
    });

    connection.on('error', (err) => {
      console.warn('[PeerBattle] DataConnection error:', err);
      this.emit('peer:error', { type: 'datachannel-error', message: String(err) });
    });
  }

  private handleIncomingData(data: any) {
    if (!data || typeof data !== 'object') return;

    // Ping / Pong measurement
    if (data.type === 'ping') {
      this.sendOverDataChannel({ type: 'pong', timestamp: data.timestamp });
      return;
    }
    if (data.type === 'pong') {
      this.pingMs = Math.max(1, Date.now() - data.timestamp);
      this.emit('peer:ping', { pingMs: this.pingMs });
      return;
    }

    if (this.isHost) {
      this.handleHostIncoming(data);
    } else {
      this.handleGuestIncoming(data);
    }
  }

  // --- HOST-SIDE LOGIC ---
  private handleHostIncoming(data: any) {
    switch (data.type) {
      case 'match:join': {
        if (data.characterId) {
          this.p2State.characterId = data.characterId;
        }
        this.phase = 'ready';
        this.sendOverDataChannel({
          type: 'match:state',
          snapshot: this.createSnapshot('player2')
        });
        this.emit('player:joined', {
          slot: 'player2',
          characterId: this.p2State.characterId,
          isReady: false
        });
        this.emit('match:state', this.createSnapshot('player1'));
        break;
      }

      case 'player:character': {
        if (data.characterId) {
          this.p2State.characterId = data.characterId;
          this.p2State.isReady = false;
          this.emit('player:character', { slot: 'player2', characterId: data.characterId });
          this.sendOverDataChannel({
            type: 'player:character',
            slot: 'player2',
            characterId: data.characterId
          });
        }
        break;
      }

      case 'player:ready': {
        this.p2State.isReady = !!data.ready;
        this.emit('player:ready', { slot: 'player2', isReady: this.p2State.isReady });
        this.sendOverDataChannel({
          type: 'player:ready',
          slot: 'player2',
          isReady: this.p2State.isReady
        });

        this.checkBothReady();
        break;
      }

      case 'typing:progress': {
        this.p2State.correctKeystrokes = data.correctKeystrokes || 0;
        this.p2State.totalKeystrokes = data.totalKeystrokes || 0;
        this.p2State.combo = data.combo || 0;
        this.p2State.maxCombo = Math.max(this.p2State.maxCombo, data.combo || 0);
        this.p2State.wpm = data.wpm || 0;
        this.p2State.accuracy = data.accuracy || 100;

        this.emit('typing:progress', {
          slot: 'player2',
          ...data
        });
        break;
      }

      case 'combat:attack': {
        this.processCombatAttack('player2', data);
        break;
      }

      case 'match:rematch': {
        this.p2Rematch = true;
        this.emit('player:rematch', { slot: 'player2' });
        if (this.p1Rematch && this.p2Rematch) {
          this.startCountdown();
        }
        break;
      }
    }
  }

  // --- GUEST-SIDE LOGIC ---
  private handleGuestIncoming(data: any) {
    switch (data.type) {
      case 'match:state': {
        if (data.snapshot) {
          this.emit('match:state', data.snapshot);
        }
        break;
      }

      case 'player:character': {
        this.emit('player:character', data);
        break;
      }

      case 'player:ready': {
        this.emit('player:ready', data);
        break;
      }

      case 'match:countdown': {
        this.emit('match:countdown', data);
        break;
      }

      case 'match:started': {
        this.emit('match:started', data);
        break;
      }

      case 'typing:progress': {
        this.emit('typing:progress', data);
        break;
      }

      case 'combat:attack': {
        this.emit('combat:attack', data);
        break;
      }

      case 'player:health': {
        this.emit('player:health', data);
        break;
      }

      case 'match:timer': {
        this.emit('match:timer', data);
        break;
      }

      case 'match:finished': {
        this.emit('match:finished', data);
        break;
      }

      case 'player:rematch': {
        this.emit('player:rematch', data);
        break;
      }
    }
  }

  // --- PUBLIC ACTIONS (Triggered by React UI) ---
  public selectCharacter(characterId: CharacterId) {
    if (this.isHost) {
      this.p1State.characterId = characterId;
      this.p1State.isReady = false;
      this.emit('player:character', { slot: 'player1', characterId });
      this.sendOverDataChannel({
        type: 'player:character',
        slot: 'player1',
        characterId
      });
    } else {
      this.p2State.characterId = characterId;
      this.emit('player:character', { slot: 'player2', characterId });
      this.sendOverDataChannel({
        type: 'player:character',
        characterId
      });
    }
  }

  public setReady(ready: boolean) {
    if (this.isHost) {
      this.p1State.isReady = ready;
      this.emit('player:ready', { slot: 'player1', isReady: ready });
      this.sendOverDataChannel({
        type: 'player:ready',
        slot: 'player1',
        isReady: ready
      });
      this.checkBothReady();
    } else {
      this.p2State.isReady = ready;
      this.emit('player:ready', { slot: 'player2', isReady: ready });
      this.sendOverDataChannel({
        type: 'player:ready',
        ready
      });
    }
  }

  public sendTypingProgress(progress: {
    correctKeystrokes: number;
    totalKeystrokes: number;
    combo: number;
    maxCombo: number;
    wpm: number;
    accuracy: number;
  }) {
    if (this.isHost) {
      this.p1State.correctKeystrokes = progress.correctKeystrokes;
      this.p1State.totalKeystrokes = progress.totalKeystrokes;
      this.p1State.combo = progress.combo;
      this.p1State.maxCombo = Math.max(this.p1State.maxCombo, progress.combo);
      this.p1State.wpm = progress.wpm;
      this.p1State.accuracy = progress.accuracy;

      this.sendOverDataChannel({
        type: 'typing:progress',
        slot: 'player1',
        ...progress
      });
    } else {
      this.sendOverDataChannel({
        type: 'typing:progress',
        slot: 'player2',
        ...progress
      });
    }
  }

  public sendAttack(wordLength: number, combo: number, isEndOfSentence: boolean = false) {
    const attackerChar = getCharacterById(
      this.isHost ? this.p1State.characterId : this.p2State.characterId
    );
    const damageCalc = calculateWordDamage(
      wordLength,
      combo,
      attackerChar.stats.power,
      isEndOfSentence
    );

    const attackData = {
      attackerSlot: this.yourSlot,
      damage: damageCalc.damage,
      isCritical: damageCalc.isCritical,
      comboMultiplier: damageCalc.comboMultiplier,
      combo
    };

    if (this.isHost) {
      this.processCombatAttack('player1', attackData);
    } else {
      this.sendOverDataChannel({
        type: 'combat:attack',
        ...attackData
      });
    }
  }

  public requestRematch() {
    if (this.isHost) {
      this.p1Rematch = true;
      this.emit('player:rematch', { slot: 'player1' });
      this.sendOverDataChannel({ type: 'player:rematch', slot: 'player1' });
      if (this.p1Rematch && this.p2Rematch) {
        this.startCountdown();
      }
    } else {
      this.p2Rematch = true;
      this.emit('player:rematch', { slot: 'player2' });
      this.sendOverDataChannel({ type: 'match:rematch', slot: 'player2' });
    }
  }

  // --- HOST COMBAT AUTHORITY ---
  private checkBothReady() {
    if (this.p1State.isReady && this.p2State.isReady && (this.phase === 'ready' || this.phase === 'finished')) {
      this.startCountdown();
    }
  }

  private startCountdown() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.matchTimer) clearInterval(this.matchTimer);

    this.phase = 'countdown';
    this.p1Rematch = false;
    this.p2Rematch = false;
    this.p1State.currentHp = 500;
    this.p2State.currentHp = 500;
    this.p1State.combo = 0;
    this.p2State.combo = 0;
    this.p1State.damageDealt = 0;
    this.p2State.damageDealt = 0;
    this.timeLeft = 75;

    const sentence = getRandomSentence() || BATTLE_SENTENCES[0].text;
    this.challengeText = sentence;
    this.challengeId = `c-${Date.now()}`;

    let seconds = 3;
    const tick = () => {
      this.emit('match:countdown', { secondsRemaining: seconds });
      this.sendOverDataChannel({ type: 'match:countdown', secondsRemaining: seconds });

      if (seconds <= 0) {
        clearInterval(this.countdownTimer!);
        this.startBattle();
      }
      seconds--;
    };

    tick();
    this.countdownTimer = setInterval(tick, 1000);
  }

  private startBattle() {
    this.phase = 'battle';
    this.startTime = Date.now();

    const startPayload = {
      challengeId: this.challengeId,
      challengeText: this.challengeText,
      durationSeconds: 75,
      startTime: this.startTime
    };

    this.emit('match:started', startPayload);
    this.sendOverDataChannel({ type: 'match:started', ...startPayload });

    // Start 1-second match countdown tick
    this.matchTimer = setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      this.emit('match:timer', { timeLeft: this.timeLeft });
      this.sendOverDataChannel({ type: 'match:timer', timeLeft: this.timeLeft });

      if (this.timeLeft <= 0) {
        this.finishBattle('timeout');
      }
    }, 1000);
  }

  private processCombatAttack(attackerSlot: PlayerSlot, attack: any) {
    const isP1 = attackerSlot === 'player1';
    const targetSlot = isP1 ? 'player2' : 'player1';
    const damage = Math.max(1, attack.damage || 8);

    if (isP1) {
      this.p1State.damageDealt += damage;
      this.p2State.currentHp = Math.max(0, this.p2State.currentHp - damage);
    } else {
      this.p2State.damageDealt += damage;
      this.p1State.currentHp = Math.max(0, this.p1State.currentHp - damage);
    }

    const payload = {
      attackerSlot,
      targetSlot,
      damage,
      isCritical: !!attack.isCritical,
      combo: attack.combo || 1
    };

    this.emit('combat:attack', payload);
    this.sendOverDataChannel({ type: 'combat:attack', ...payload });

    // Broadcast updated health
    const healthP1 = {
      slot: 'player1',
      currentHp: this.p1State.currentHp,
      maxHp: this.p1State.maxHp,
      shieldHp: this.p1State.shieldHp
    };
    const healthP2 = {
      slot: 'player2',
      currentHp: this.p2State.currentHp,
      maxHp: this.p2State.maxHp,
      shieldHp: this.p2State.shieldHp
    };

    this.emit('player:health', healthP1);
    this.emit('player:health', healthP2);
    this.sendOverDataChannel({ type: 'player:health', ...healthP1 });
    this.sendOverDataChannel({ type: 'player:health', ...healthP2 });

    // Check knockout
    if (this.p1State.currentHp <= 0 || this.p2State.currentHp <= 0) {
      this.finishBattle('knockout');
    }
  }

  private finishBattle(finishReason: 'knockout' | 'timeout') {
    if (this.phase === 'finished') return;
    this.phase = 'finished';

    if (this.matchTimer) {
      clearInterval(this.matchTimer);
      this.matchTimer = null;
    }

    const winner = evaluateWinner(
      this.p1State.currentHp,
      this.p1State.accuracy,
      this.p2State.currentHp,
      this.p2State.accuracy,
      this.p1State.correctKeystrokes,
      this.p2State.correctKeystrokes,
      this.p1State.maxHp,
      this.p2State.maxHp
    );

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

    const resultPayload = {
      winner,
      finishReason,
      elapsedSeconds,
      p1Stats: {
        wpm: this.p1State.wpm,
        accuracy: this.p1State.accuracy,
        maxCombo: this.p1State.maxCombo,
        damageDealt: this.p1State.damageDealt
      },
      p2Stats: {
        wpm: this.p2State.wpm,
        accuracy: this.p2State.accuracy,
        maxCombo: this.p2State.maxCombo,
        damageDealt: this.p2State.damageDealt
      }
    };

    this.emit('match:finished', resultPayload);
    this.sendOverDataChannel({ type: 'match:finished', ...resultPayload });
  }

  private createSnapshot(targetSlot: PlayerSlot): PeerBattleSnapshot {
    return {
      sessionId: this.sessionId,
      phase: this.phase,
      yourSlot: targetSlot,
      isHost: this.isHost,
      p1: {
        characterId: this.p1State.characterId,
        isReady: this.p1State.isReady,
        currentHp: this.p1State.currentHp,
        maxHp: this.p1State.maxHp,
        shieldHp: this.p1State.shieldHp,
        wpm: this.p1State.wpm,
        accuracy: this.p1State.accuracy,
        combo: this.p1State.combo,
        maxCombo: this.p1State.maxCombo
      },
      p2: {
        characterId: this.p2State.characterId,
        isReady: this.p2State.isReady,
        currentHp: this.p2State.currentHp,
        maxHp: this.p2State.maxHp,
        shieldHp: this.p2State.shieldHp,
        wpm: this.p2State.wpm,
        accuracy: this.p2State.accuracy,
        combo: this.p2State.combo,
        maxCombo: this.p2State.maxCombo
      },
      challengeText: this.challengeText,
      challengeId: this.challengeId,
      timeLeft: this.timeLeft
    };
  }

  private startPingLoop() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.conn && this.conn.open) {
        this.sendOverDataChannel({ type: 'ping', timestamp: Date.now() });
      }
    }, 2000);
  }

  public cleanup() {
    if (this.matchTimer) clearInterval(this.matchTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.conn) {
      try {
        this.conn.close();
      } catch {}
      this.conn = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
    this.listeners.clear();
  }
}
