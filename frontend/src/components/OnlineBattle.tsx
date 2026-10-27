import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  Character,
  FighterState,
  BattleResult,
  FloatingText,
  Particle,
  PlayerSlot,
  CombatAnimationState
} from '../types/game';
import { CHARACTERS, getCharacterById } from '../data/characters';
import { sound } from '../utils/sound';
import { PeerBattleClient } from '../utils/peerBattleClient';
import { BattleHUD } from './BattleHUD';
import { ShadowArena, type FinishingMoveState } from './ShadowArena';
import { TypingConsole } from './TypingConsole';
import { BattleResultModal } from './BattleResultModal';
import {
  Wifi,
  CheckCircle2,
  RotateCcw,
  Copy,
  Check,
  Share2,
  Swords,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface OnlineBattleProps {
  initialCharacter: Character;
  sessionId: string;
  onExit: () => void;
}

export const OnlineBattle: React.FC<OnlineBattleProps> = ({
  initialCharacter,
  sessionId,
  onExit
}) => {
  const [yourSlot, setYourSlot] = useState<PlayerSlot>('player1');
  const [phase, setPhase] = useState<'connecting' | 'waiting' | 'ready' | 'countdown' | 'battle' | 'finished'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [pingMs, setPingMs] = useState<number>(14);
  const [finishingMove, setFinishingMove] = useState<FinishingMoveState | null>(null);

  // Fighter states
  const [p1State, setP1State] = useState<FighterState>({
    character: initialCharacter,
    maxHp: 500,
    currentHp: 500,
    combo: 0,
    maxCombo: 0,
    animation: 'idle',
    wpm: 0,
    accuracy: 100,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    mistakes: 0,
    damageDealt: 0,
    superMeter: 0,
    shieldHp: 0,
    isFrozen: false,
    hasHasteBuff: false
  });

  const [p2State, setP2State] = useState<FighterState>({
    character: CHARACTERS[1], // Glitch
    maxHp: 500,
    currentHp: 500,
    combo: 0,
    maxCombo: 0,
    animation: 'idle',
    wpm: 0,
    accuracy: 100,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    mistakes: 0,
    damageDealt: 0,
    superMeter: 0,
    shieldHp: 0,
    isFrozen: false,
    hasHasteBuff: false
  });

  // Ready states
  const [p1Ready, setP1Ready] = useState(false);
  const [p2Ready, setP2Ready] = useState(false);

  // Challenge and typing state
  const [currentSentence, setCurrentSentence] = useState('Initializing serverless battle arena...');
  const [userInput, setUserInput] = useState('');
  const [hasInputError, setHasInputError] = useState(false);

  // Match timers & countdown
  const [timeLeft, setTimeLeft] = useState(75);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState(false);

  // FX
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Peer client reference
  const peerClientRef = useRef<PeerBattleClient | null>(null);
  const yourSlotRef = useRef<PlayerSlot>(yourSlot);
  const p1StateRef = useRef<FighterState>(p1State);
  const p2StateRef = useRef<FighterState>(p2State);

  useEffect(() => {
    yourSlotRef.current = yourSlot;
  }, [yourSlot]);

  useEffect(() => {
    p1StateRef.current = p1State;
  }, [p1State]);

  useEffect(() => {
    p2StateRef.current = p2State;
  }, [p2State]);

  // Impact FX generator
  const triggerImpactFX = useCallback((
    target: 'p1' | 'p2',
    text: string,
    type: 'damage' | 'critical' | 'combo' | 'miss',
    color: string
  ) => {
    const textId = `${Date.now()}-${Math.random()}`;
    const xPos = target === 'p2' ? 68 + (Math.random() * 8 - 4) : 28 + (Math.random() * 8 - 4);
    const yPos = 45 + (Math.random() * 10 - 5);

    setFloatingTexts((prev) => [
      ...prev,
      { id: textId, text, type, x: xPos, y: yPos, color }
    ]);

    const sparkCount = type === 'critical' ? 14 : 7;
    const newSparks: Particle[] = [];
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      newSparks.push({
        id: `${textId}-p-${i}`,
        x: xPos,
        y: yPos,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        alpha: 1,
        life: 1
      });
    }
    setParticles((prev) => [...prev.slice(-25), ...newSparks]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== textId));
    }, 900);
  }, []);

  const triggerScreenShake = useCallback(() => {
    setIsScreenShaking(true);
    setTimeout(() => setIsScreenShaking(false), 300);
  }, []);

  // Copy session ID
  const handleCopySessionId = () => {
    try {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Copy full invite link
  const handleCopyInviteLink = () => {
    try {
      const inviteUrl = `${window.location.origin}/?room=${encodeURIComponent(sessionId)}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Initialize WebRTC Peer-to-Peer Client
  useEffect(() => {
    const client = new PeerBattleClient();
    peerClientRef.current = client;

    client.startHost(sessionId, initialCharacter.id);

    // --- REGISTER EVENT LISTENERS ---
    client.on('host:ready', () => {
      setYourSlot('player1');
      setPhase('waiting');
    });

    client.on('peer:connected', (evt: any) => {
      console.log('[OnlineBattle] Connected to peer!', evt);
      setPhase('ready');
      sound.playKeyClick();
    });

    client.on('match:state', (snapshot: any) => {
      setYourSlot(snapshot.yourSlot);
      setPhase(snapshot.phase);

      if (snapshot.p1) {
        const char = getCharacterById(snapshot.p1.characterId);
        setP1State((prev) => ({
          ...prev,
          character: char,
          currentHp: snapshot.p1.currentHp,
          maxHp: snapshot.p1.maxHp,
          shieldHp: snapshot.p1.shieldHp,
          wpm: snapshot.p1.wpm,
          accuracy: snapshot.p1.accuracy,
          combo: snapshot.p1.combo,
          maxCombo: snapshot.p1.maxCombo
        }));
        setP1Ready(snapshot.p1.isReady);
      }

      if (snapshot.p2) {
        const char = getCharacterById(snapshot.p2.characterId);
        setP2State((prev) => ({
          ...prev,
          character: char,
          currentHp: snapshot.p2.currentHp,
          maxHp: snapshot.p2.maxHp,
          shieldHp: snapshot.p2.shieldHp,
          wpm: snapshot.p2.wpm,
          accuracy: snapshot.p2.accuracy,
          combo: snapshot.p2.combo,
          maxCombo: snapshot.p2.maxCombo
        }));
        setP2Ready(snapshot.p2.isReady);
      }

      if (snapshot.challengeText) {
        setCurrentSentence(snapshot.challengeText);
      }
      setTimeLeft(snapshot.timeLeft);
    });

    client.on('player:joined', (evt: any) => {
      const char = getCharacterById(evt.characterId);
      if (evt.slot === 'player1') {
        setP1State((prev) => ({ ...prev, character: char }));
        setP1Ready(evt.isReady);
      } else {
        setP2State((prev) => ({ ...prev, character: char }));
        setP2Ready(evt.isReady);
      }
      setPhase('ready');
      sound.playKeyClick();
    });

    client.on('player:character', (evt: any) => {
      const char = getCharacterById(evt.characterId);
      if (evt.slot === 'player1') {
        setP1State((prev) => ({ ...prev, character: char }));
      } else {
        setP2State((prev) => ({ ...prev, character: char }));
      }
    });

    client.on('player:ready', (evt: any) => {
      if (evt.slot === 'player1') {
        setP1Ready(evt.isReady);
      } else {
        setP2Ready(evt.isReady);
      }
    });

    client.on('match:countdown', (evt: any) => {
      setPhase('countdown');
      setCountdown(evt.secondsRemaining);
      sound.playKeyClick();
    });

    client.on('match:started', (evt: any) => {
      setPhase('battle');
      setCountdown(0);
      setTimeout(() => setCountdown(null), 600);
      setCurrentSentence(evt.challengeText);
      setTimeLeft(evt.durationSeconds);
      setUserInput('');
      setBattleResult(null);
      sound.playAttack('staff');
    });

    client.on('typing:progress', (evt: any) => {
      if (evt.slot === 'player1') {
        setP1State((prev) => ({
          ...prev,
          correctKeystrokes: evt.correctKeystrokes,
          totalKeystrokes: evt.totalKeystrokes,
          combo: evt.combo,
          maxCombo: evt.maxCombo,
          wpm: evt.wpm,
          accuracy: evt.accuracy
        }));
      } else {
        setP2State((prev) => ({
          ...prev,
          correctKeystrokes: evt.correctKeystrokes,
          totalKeystrokes: evt.totalKeystrokes,
          combo: evt.combo,
          maxCombo: evt.maxCombo,
          wpm: evt.wpm,
          accuracy: evt.accuracy
        }));
      }
    });

    client.on('combat:attack', (evt: any) => {
      const isAttackerP1 = evt.attackerSlot === 'player1';
      const attackerState = isAttackerP1 ? p1StateRef.current : p2StateRef.current;
      const targetTag = isAttackerP1 ? 'p2' : 'p1';

      const moveStep = (evt.combo || 1) % 4;
      let anim: CombatAnimationState = 'punch';
      let moveLabel = 'STRIKE';

      sound.playDash();
      if (evt.isCritical || moveStep === 3) {
        anim = 'unique';
        moveLabel = attackerState.character.uniqueMoveName;
        sound.playUltimate();
        sound.playAttack(attackerState.character.weaponType);
      } else if (moveStep === 1) {
        anim = 'kick';
        moveLabel = 'HIGH KICK';
        sound.playKick();
      } else if (moveStep === 2) {
        anim = 'attack';
        moveLabel = attackerState.character.weapon.toUpperCase();
        sound.playAttack(attackerState.character.weaponType);
      } else {
        anim = 'punch';
        moveLabel = 'FIST COMBO';
        sound.playPunch();
      }

      if (evt.combo > 2) sound.playCombo(evt.combo);

      // Animate attacker and victim
      if (isAttackerP1) {
        setP1State((prev) => ({ ...prev, animation: anim }));
        setP2State((prev) => ({ ...prev, animation: 'hit' }));
      } else {
        setP2State((prev) => ({ ...prev, animation: anim }));
        setP1State((prev) => ({ ...prev, animation: 'hit' }));
      }

      triggerImpactFX(
        targetTag,
        evt.isCritical ? `CRIT ${moveLabel} -${evt.damage}` : `${moveLabel} -${evt.damage}`,
        evt.isCritical ? 'critical' : 'damage',
        attackerState.character.themeColor
      );

      if (evt.isCritical || anim === 'unique') triggerScreenShake();

      setTimeout(() => {
        setP1State((prev) => ({ ...prev, animation: 'idle' }));
        setP2State((prev) => ({ ...prev, animation: 'idle' }));
      }, 420);
    });

    client.on('player:health', (evt: any) => {
      if (evt.slot === 'player1') {
        setP1State((prev) => ({
          ...prev,
          currentHp: evt.currentHp,
          maxHp: evt.maxHp,
          shieldHp: evt.shieldHp
        }));
      } else {
        setP2State((prev) => ({
          ...prev,
          currentHp: evt.currentHp,
          maxHp: evt.maxHp,
          shieldHp: evt.shieldHp
        }));
      }
    });

    client.on('match:timer', (evt: any) => {
      setTimeLeft(evt.timeLeft);
    });

    client.on('match:finished', (evt: any) => {
      setPhase('finished');
      setBattleResult({
        winner: evt.winner,
        p1Stats: evt.p1Stats,
        p2Stats: evt.p2Stats,
        elapsedSeconds: evt.elapsedSeconds
      });

      if (evt.winner === yourSlotRef.current) {
        sound.playVictory();
      } else {
        sound.playHit();
      }
    });

    client.on('peer:ping', (evt: any) => {
      setPingMs(evt.pingMs || 15);
    });

    client.on('player:left', () => {
      setP2Ready(false);
      setPhase('waiting');
      setErrorMessage('Opponent disconnected from the duel.');
      setTimeout(() => setErrorMessage(null), 4000);
    });

    client.on('peer:error', (err: any) => {
      setErrorMessage(err.message || 'Connection error.');
      setTimeout(() => setErrorMessage(null), 5000);
    });

    return () => {
      client.cleanup();
      peerClientRef.current = null;
    };
  }, [sessionId, initialCharacter.id, triggerImpactFX, triggerScreenShake]);

  // Clean exit
  const handleExit = useCallback(() => {
    if (peerClientRef.current) {
      peerClientRef.current.cleanup();
    }
    onExit();
  }, [onExit]);

  // Ready toggle
  const handleToggleReady = () => {
    if (!peerClientRef.current) return;
    const isP1 = yourSlot === 'player1';
    const nextReady = isP1 ? !p1Ready : !p2Ready;
    peerClientRef.current.setReady(nextReady);
    sound.playKeyClick();
  };

  // Character Select in Lobby
  const handleSelectCharacter = (char: Character) => {
    if (phase !== 'waiting' && phase !== 'ready') return;
    if (peerClientRef.current) {
      peerClientRef.current.selectCharacter(char.id);
      sound.playKeyClick();
    }
  };

  // Handle typing input
  const handleInputChange = (val: string) => {
    if (phase !== 'battle' || battleResult) return;

    const prevLen = userInput.length;
    const isBackspace = val.length < prevLen;

    if (isBackspace) {
      setUserInput(val);
      setHasInputError(false);
      return;
    }

    const nextCharIndex = userInput.length;
    if (nextCharIndex >= currentSentence.length) return;

    const typedChar = val[nextCharIndex];
    const isCorrect = currentSentence[nextCharIndex] === typedChar;

    setHasInputError(!isCorrect);

    if (!isCorrect) {
      sound.playError();
      triggerImpactFX(yourSlot === 'player1' ? 'p1' : 'p2', 'MISS', 'miss', '#ff2a5f');
      setTimeout(() => setHasInputError(false), 250);
      return;
    }

    sound.playKeyClick();
    const nextInput = val.slice(0, currentSentence.length);
    setUserInput(nextInput);

    // Compute progress & stats
    const correctKeystrokes = nextInput.length;
    const totalKeystrokes = nextInput.length;
    const currentCombo = (yourSlot === 'player1' ? p1State.combo : p2State.combo) + 1;
    const elapsedMinutes = Math.max(0.01, (75 - timeLeft) / 60);
    const liveWpm = Math.round((correctKeystrokes / 5) / elapsedMinutes);
    const liveAccuracy = 100;

    // Send typing progress
    if (peerClientRef.current) {
      peerClientRef.current.sendTypingProgress({
        correctKeystrokes,
        totalKeystrokes,
        combo: currentCombo,
        maxCombo: Math.max(currentCombo, yourSlot === 'player1' ? p1State.maxCombo : p2State.maxCombo),
        wpm: liveWpm,
        accuracy: liveAccuracy
      });
    }

    // Check if word completed (space pressed or end of sentence)
    const isSpace = typedChar === ' ';
    const isSentenceEnd = nextInput.length >= currentSentence.length;

    if (isSpace || isSentenceEnd) {
      const words = nextInput.trim().split(/\s+/);
      const lastWord = words[words.length - 1] || 'strike';
      if (peerClientRef.current) {
        peerClientRef.current.sendAttack(lastWord.length, currentCombo, isSentenceEnd);
      }
    }
  };

  const handleRematch = () => {
    if (peerClientRef.current) {
      peerClientRef.current.requestRematch();
      sound.playKeyClick();
    }
  };

  const isYourSlotReady = yourSlot === 'player1' ? p1Ready : p2Ready;

  return (
    <div className="battle-screen-layout online-screen-layout">
      {/* Top Status Command Bar */}
      <div className="online-status-bar modern-status-bar">
        <div className="online-session-info">
          {/* Room Pill */}
          <div className="online-pill">
            <Wifi size={13} className="text-neon-cyan" />
            <span className="online-room-title">P2P ROOM:</span>
            <code className="online-room-id">{sessionId}</code>
            <button
              type="button"
              className="copy-session-btn"
              onClick={handleCopySessionId}
              title="Copy Room Code"
            >
              {copied ? <Check size={12} color="#00f59b" /> : <Copy size={12} />}
            </button>
          </div>

          {/* Share Link Pill */}
          <button
            type="button"
            className="online-share-link-btn"
            onClick={handleCopyInviteLink}
            title="Copy Direct Invite Link for Laptop 2"
          >
            <Share2 size={12} />
            <span>{copiedLink ? 'INVITE COPIED!' : 'SHARE LINK'}</span>
          </button>

          {/* Slot indicator */}
          <div className="online-slot-tag">
            YOU: <strong>{yourSlot === 'player1' ? 'PLAYER 1 (HOST)' : 'PLAYER 2 (CHALLENGER)'}</strong>
          </div>

          {/* Zero-Backend Vercel P2P Pill */}
          <div className="p2p-badge-pill" title="Direct WebRTC DataChannel (No Render backend required)">
            <span className="p2p-live-dot" />
            <span>DIRECT P2P ({pingMs}ms)</span>
          </div>
        </div>

        {errorMessage && (
          <div className="online-error-toast">
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="button"
          className="navbar-btn outline-btn leave-duel-btn"
          onClick={handleExit}
          title="Leave Online Battle"
        >
          <RotateCcw size={14} />
          <span>LEAVE DUEL</span>
        </button>
      </div>

      {/* Top Combat HUD */}
      <BattleHUD
        p1State={p1State}
        p2State={p2State}
        timeLeft={timeLeft}
      />

      {/* 2D Shadow Arena */}
      <ShadowArena
        p1State={p1State}
        p2State={p2State}
        floatingTexts={floatingTexts}
        particles={particles}
        isScreenShaking={isScreenShaking}
        countdown={countdown}
        finishingMove={finishingMove}
        onSkipFinisher={() => {
          if (finishingMove) {
            setBattleResult({
              winner: finishingMove.winner,
              p1Stats: {
                wpm: p1StateRef.current.wpm,
                accuracy: p1StateRef.current.accuracy,
                maxCombo: p1StateRef.current.maxCombo,
                damageDealt: p1StateRef.current.damageDealt
              },
              p2Stats: {
                wpm: p2StateRef.current.wpm,
                accuracy: p2StateRef.current.accuracy,
                maxCombo: p2StateRef.current.maxCombo,
                damageDealt: p2StateRef.current.damageDealt
              },
              elapsedSeconds: 75
            });
            setFinishingMove(null);
          }
        }}
      />

      {/* Pre-Match Waiting & Ready Chamber Overlay */}
      {(phase === 'connecting' || phase === 'waiting' || phase === 'ready') && (
        <div className="online-lobby-card modern-arcade-lobby">
          <div className="lobby-brand-badge">
            <Swords size={16} />
            <span>VERCEL SERVERLESS COMBAT ARENA</span>
          </div>

          <div className="online-lobby-header">
            <div className="lobby-title-wrap">
              <h3>
                {phase === 'connecting'
                  ? 'ESTABLISHING WEBRTC MESH...'
                  : phase === 'waiting'
                  ? 'WAITING FOR CHALLENGER (LAPTOP 2)...'
                  : 'WARRIORS LOCKED • READY FOR COMBAT'}
              </h3>
              <p>
                {phase === 'waiting'
                  ? 'Open the invite link or type this room code on your second laptop to join directly!'
                  : 'Select your shadow fighter and hit SIGNAL READY.'}
              </p>
            </div>
          </div>

          {/* 1-Click Invite Banner */}
          <div className="lobby-invite-banner modern-invite-banner">
            <div className="invite-meta-left">
              <span className="invite-label">ROOM CODE:</span>
              <span className="invite-code-huge">{sessionId}</span>
            </div>

            <div className="invite-actions-right">
              <button
                type="button"
                className="lobby-action-copy-btn primary-copy"
                onClick={handleCopyInviteLink}
              >
                {copiedLink ? <Check size={16} color="#00f59b" /> : <Share2 size={16} />}
                <span>{copiedLink ? 'LINK COPIED TO CLIPBOARD!' : 'COPY 1-CLICK INVITE LINK'}</span>
              </button>

              <button
                type="button"
                className="lobby-action-copy-btn"
                onClick={handleCopySessionId}
              >
                {copied ? <Check size={14} color="#00f59b" /> : <Copy size={14} />}
                <span>{copied ? 'CODE COPIED' : 'COPY CODE'}</span>
              </button>
            </div>
          </div>

          {/* Zero-Backend Explanation Tip */}
          <div className="lobby-zero-backend-notice">
            <ShieldCheck size={16} className="text-neon-green" />
            <span>
              <strong>Zero Backend Required:</strong> This duel runs 100% on Vercel via direct WebRTC
              DataChannels between your two laptops. No Render sleeping or disconnection issues!
            </span>
          </div>

          {/* In-Lobby Fighter Picker */}
          <div className="lobby-char-selector">
            <span className="lobby-selector-title">SELECT YOUR SHADOW FIGHTER:</span>
            <div className="lobby-char-pills">
              {CHARACTERS.map((char) => {
                const isSelected =
                  (yourSlot === 'player1' ? p1State.character.id : p2State.character.id) === char.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    className={`lobby-char-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectCharacter(char)}
                    style={{
                      borderColor: isSelected ? char.themeColor : 'rgba(255,255,255,0.08)',
                      boxShadow: isSelected ? `0 0 15px ${char.accentGlow}` : 'none'
                    }}
                  >
                    <img src={char.avatarUrl} alt={char.name} className="mini-char-thumb" />
                    <div className="mini-char-info">
                      <span className="char-btn-name">{char.name}</span>
                      <span className="char-btn-weapon">{char.weapon}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Readiness Dashboard */}
          <div className="lobby-readiness-row">
            <div className={`readiness-badge ${p1Ready ? 'ready' : 'waiting'}`}>
              <CheckCircle2 size={16} />
              <span>PLAYER 1: {p1Ready ? 'READY!' : 'CHOOSING...'}</span>
            </div>

            <button
              type="button"
              id="online-ready-toggle-btn"
              className={`online-ready-btn ${isYourSlotReady ? 'btn-is-ready' : 'pulse-ready'}`}
              onClick={handleToggleReady}
            >
              <Zap size={16} />
              <span>{isYourSlotReady ? 'CANCEL READY' : 'SIGNAL READY'}</span>
            </button>

            <div className={`readiness-badge ${p2Ready ? 'ready' : 'waiting'}`}>
              <CheckCircle2 size={16} />
              <span>PLAYER 2: {p2Ready ? 'READY!' : 'WAITING FOR OPPONENT...'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Typing Console during countdown, battle, and finished */}
      {(phase === 'battle' || phase === 'countdown' || phase === 'finished') && (
        <TypingConsole
          sentence={currentSentence}
          userInput={userInput}
          onInputChange={handleInputChange}
          p1State={p1State}
          p2State={p2State}
          hasError={hasInputError}
          disabled={phase !== 'battle' || !!battleResult}
        />
      )}

      {/* Battle Results Modal */}
      {battleResult && (
        <BattleResultModal
          result={battleResult}
          p1State={p1State}
          p2State={p2State}
          onRematch={handleRematch}
          onCharacterSelect={handleExit}
        />
      )}
    </div>
  );
};
