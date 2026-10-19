import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Character, FighterState, BattleResult, FloatingText, Particle, PlayerSlot, CombatAnimationState } from '../types/game';
import { CHARACTERS, getCharacterById } from '../data/characters';
import { sound } from '../utils/sound';
import {
  connectSocket,
  getSocket,
  disconnectSocket,
  getServerUrl,
  setServerUrl,
  REMOTE_PRODUCTION_BACKEND,
  LOCAL_DEV_BACKEND
} from '../utils/socketClient';
import { BattleHUD } from './BattleHUD';
import { ShadowArena, type FinishingMoveState } from './ShadowArena';
import { TypingConsole } from './TypingConsole';
import { BattleResultModal } from './BattleResultModal';
import { Wifi, Users, CheckCircle2, RotateCcw, AlertTriangle, Copy, Check, Globe } from 'lucide-react';

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
  const [currentServerUrl, setCurrentServerUrl] = useState<string>(getServerUrl());
  const [finishingMove, setFinishingMove] = useState<FinishingMoveState | null>(null);

  // Fighter states
  const [p1State, setP1State] = useState<FighterState>({
    character: initialCharacter,
    maxHp: 100,
    currentHp: 100,
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
    character: CHARACTERS[1],
    maxHp: 100,
    currentHp: 100,
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
  const [currentSentence, setCurrentSentence] = useState('Connecting to online duel arena...');
  const [challengeId, setChallengeId] = useState('');
  const [userInput, setUserInput] = useState('');
  const [hasInputError, setHasInputError] = useState(false);

  // Match timers & countdown
  const [timeLeft, setTimeLeft] = useState(75);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState(false);

  // Opponent connection status / Grace period
  const [opponentConnected, setOpponentConnected] = useState(true);
  const [graceSeconds, setGraceSeconds] = useState<number | null>(null);

  // FX
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Sequence number ref
  const seqRef = useRef<number>(1);
  const socketRef = useRef(getSocket());
  const yourSlotRef = useRef<PlayerSlot>(yourSlot);
  yourSlotRef.current = yourSlot;
  const p1StateRef = useRef<FighterState>(p1State);
  p1StateRef.current = p1State;
  const p2StateRef = useRef<FighterState>(p2State);
  p2StateRef.current = p2State;

  const hasPlayedFinisherRef = useRef<boolean>(false);
  const finisherTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (finisherTimerRef.current) clearTimeout(finisherTimerRef.current);
    };
  }, []);

  // Spawn visual FX helper
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
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Toggle server between local/LAN and cloud Render
  const isCloudServer = currentServerUrl === REMOTE_PRODUCTION_BACKEND;
  const toggleServerUrl = () => {
    const newTarget = isCloudServer
      ? (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
          ? `http://${window.location.hostname}:3001`
          : LOCAL_DEV_BACKEND)
      : REMOTE_PRODUCTION_BACKEND;
    setServerUrl(newTarget);
    setCurrentServerUrl(newTarget);
  };

  // Listen for server URL changes (e.g. from failover or toggle)
  useEffect(() => {
    const handleUrlChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCurrentServerUrl(customEvent.detail);
      }
    };
    window.addEventListener('server-url-changed', handleUrlChange);
    return () => window.removeEventListener('server-url-changed', handleUrlChange);
  }, []);

  // Connect to Socket.IO and register events
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    const performJoinOrResume = () => {
      setErrorMessage(null);
      const savedToken = sessionStorage.getItem(`typing_reconnect_${sessionId}`);
      if (savedToken) {
        socket.emit('match:resume', { sessionId, reconnectToken: savedToken });
      } else {
        socket.emit('match:join', {
          sessionId,
          characterId: initialCharacter.id
        });
      }
    };

    if (socket.connected) {
      performJoinOrResume();
    } else {
      socket.on('connect', performJoinOrResume);
    }

    // 1. Authoritative Match State Snapshot
    socket.on('match:state', (snapshot: any) => {
      setYourSlot(snapshot.yourSlot);
      setPhase(snapshot.phase);
      if (snapshot.reconnectToken) {
        sessionStorage.setItem(`typing_reconnect_${sessionId}`, snapshot.reconnectToken);
      }

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
        setChallengeId(snapshot.challengeId);
      }
      setTimeLeft(snapshot.timeLeft);
    });

    // 2. Player Joined
    socket.on('player:joined', (evt: any) => {
      const char = getCharacterById(evt.characterId);
      if (evt.slot === 'player1') {
        setP1State((prev) => ({ ...prev, character: char }));
        setP1Ready(evt.isReady);
      } else {
        setP2State((prev) => ({ ...prev, character: char }));
        setP2Ready(evt.isReady);
        setPhase('ready');
      }
    });

    // 3. Player Character Selected
    socket.on('player:character', (evt: any) => {
      const char = getCharacterById(evt.characterId);
      if (evt.slot === 'player1') {
        setP1State((prev) => ({ ...prev, character: char }));
      } else {
        setP2State((prev) => ({ ...prev, character: char }));
      }
    });

    // 4. Player Ready Status
    socket.on('player:ready', (evt: any) => {
      if (evt.slot === 'player1') {
        setP1Ready(evt.isReady);
      } else {
        setP2Ready(evt.isReady);
      }
    });

    // 5. Countdown Tick
    socket.on('match:countdown', (evt: any) => {
      setPhase('countdown');
      setCountdown(evt.secondsRemaining);
      sound.playKeyClick();
    });

    // 6. Match Started
    socket.on('match:started', (evt: any) => {
      setPhase('battle');
      setCountdown(0);
      setTimeout(() => setCountdown(null), 600);
      setCurrentSentence(evt.challengeText);
      setChallengeId(evt.challengeId);
      setTimeLeft(evt.durationSeconds);
      setUserInput('');
      sound.playAttack('staff');
    });

    // 7. Authoritative Typing Progress
    socket.on('typing:progress', (evt: any) => {
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

    // 8. Combat Attack Event
    socket.on('combat:attack', (evt: any) => {
      const isAttackerP1 = evt.attackerSlot === 'player1';
      const attackerState = isAttackerP1 ? p1StateRef.current : p2StateRef.current;
      const targetTag = isAttackerP1 ? 'p2' : 'p1';

      const moveStep = (evt.combo || 1) % 4;
      let anim: CombatAnimationState = 'punch';
      let moveLabel = 'PUNCH';

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
        moveLabel = 'FIST STRIKE';
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

    // 9. Authoritative Player Health Update
    socket.on('player:health', (evt: any) => {
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

    // 10. Match Finished
    socket.on('match:finished', (evt: any) => {
      setPhase('finished');
      sessionStorage.removeItem(`typing_reconnect_${sessionId}`);

      const finalizeResult = () => {
        setFinishingMove(null);
        setBattleResult({
          winner: evt.winner,
          p1Stats: evt.p1Stats,
          p2Stats: evt.p2Stats,
          elapsedSeconds: evt.elapsedSeconds
        });

        if (evt.winner === yourSlotRef.current) {
          sound.playVictory();
        } else if (evt.winner !== 'draw') {
          sound.playError();
        }
      };

      if (evt.winner !== 'draw' && !hasPlayedFinisherRef.current) {
        hasPlayedFinisherRef.current = true;
        const winningChar = evt.winner === 'player1' ? p1StateRef.current.character : p2StateRef.current.character;
        const losingChar = evt.winner === 'player1' ? p2StateRef.current.character : p1StateRef.current.character;

        sound.playFinisher(winningChar.id);
        sound.playFinisherImpact();
        triggerScreenShake();

        if (evt.winner === 'player1') {
          setP1State((prev) => ({ ...prev, animation: 'finisher' }));
          setP2State((prev) => ({ ...prev, animation: 'defeat' }));
        } else {
          setP2State((prev) => ({ ...prev, animation: 'finisher' }));
          setP1State((prev) => ({ ...prev, animation: 'defeat' }));
        }

        setFinishingMove({
          winner: evt.winner,
          winnerChar: winningChar,
          loserChar: losingChar,
          step: 'strike',
          finisherName: winningChar.finisherName,
          quote: winningChar.finisherQuote
        });

        finisherTimerRef.current = setTimeout(() => {
          sound.playVictory();
          setFinishingMove((prev) => (prev ? { ...prev, step: 'dialogue' } : null));

          finisherTimerRef.current = setTimeout(() => {
            finalizeResult();
          }, 2800);
        }, 1500);
      } else {
        setP1State((prev) => ({
          ...prev,
          animation: evt.winner === 'player1' ? 'victory' : evt.winner === 'player2' ? 'defeat' : 'idle'
        }));
        setP2State((prev) => ({
          ...prev,
          animation: evt.winner === 'player2' ? 'victory' : evt.winner === 'player1' ? 'defeat' : 'idle'
        }));
        finalizeResult();
      }
    });

    // 11. Connection Status (Disconnect & Reconnect Grace)
    socket.on('connection:status', (evt: any) => {
      const isOpponent = evt.slot !== yourSlotRef.current;
      if (isOpponent) {
        if (evt.status === 'disconnected') {
          setOpponentConnected(false);
          setGraceSeconds(evt.graceSecondsRemaining || 15);
        } else if (evt.status === 'reconnected') {
          setOpponentConnected(true);
          setGraceSeconds(null);
        }
      }
    });

    // 12. Auto-advancing Challenge on Sentence Completion
    socket.on('challenge:next', (evt: any) => {
      if (evt.slot === yourSlotRef.current) {
        setCurrentSentence(evt.challengeText);
        setChallengeId(evt.challengeId);
        setUserInput('');
        setHasInputError(false);
      }
    });

    // 13. Match Errors / Auto-Recovery
    socket.on('match:error', (err: any) => {
      // If resume token failed or session not found, automatically clear stale token and join clean
      if (
        err.code === 'RESUME_FAILED' ||
        err.code === 'INVALID_RECONNECT_TOKEN' ||
        err.code === 'BAD_RESUME_PAYLOAD' ||
        err.message?.includes('RECONNECT') ||
        err.message?.includes('SESSION_NOT_FOUND')
      ) {
        sessionStorage.removeItem(`typing_reconnect_${sessionId}`);
        socket.emit('match:join', {
          sessionId,
          characterId: initialCharacter.id
        });
        return;
      }

      setErrorMessage(`${err.code}: ${err.message}`);
      setTimeout(() => setErrorMessage(null), 4000);
    });

    // 14. Player Left / Disconnected from Lobby
    socket.on('player:left', (evt: any) => {
      if (evt.slot === 'player1') {
        setP1Ready(false);
      } else {
        setP2Ready(false);
      }
      setPhase('waiting');
    });

    // 15. Connection Error Notification
    socket.on('connect_error', () => {
      setErrorMessage(`Connecting to duel server (${getServerUrl()})...`);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('match:state');
      socket.off('player:joined');
      socket.off('player:character');
      socket.off('player:ready');
      socket.off('player:left');
      socket.off('match:countdown');
      socket.off('match:started');
      socket.off('typing:progress');
      socket.off('combat:attack');
      socket.off('player:health');
      socket.off('challenge:next');
      socket.off('match:finished');
      socket.off('connection:status');
      socket.off('match:error');
    };
  }, [sessionId, initialCharacter.id, currentServerUrl, triggerImpactFX, triggerScreenShake]);

  // Clean exit helper
  const handleExit = useCallback(() => {
    try {
      if (socketRef.current) {
        socketRef.current.emit('match:leave');
      }
      sessionStorage.removeItem(`typing_reconnect_${sessionId}`);
      disconnectSocket();
    } catch {
      // safe guard
    }
    onExit();
  }, [sessionId, onExit]);

  // Handle Ready Toggle
  const handleToggleReady = () => {
    hasPlayedFinisherRef.current = false;
    if (finisherTimerRef.current) clearTimeout(finisherTimerRef.current);
    const nextReady = yourSlot === 'player1' ? !p1Ready : !p2Ready;
    socketRef.current.emit('match:ready', { ready: nextReady });
    sound.playKeyClick();
  };

  // Handle Character Change in Lobby
  const handleSelectCharacter = (char: Character) => {
    if (phase !== 'waiting' && phase !== 'ready') return;
    socketRef.current.emit('player:character', { characterId: char.id });
    sound.playKeyClick();
  };

  // Handle Live Keystrokes & Incremental Sequence Submission
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

    const seq = seqRef.current++;
    socketRef.current.emit('typing:input', {
      seq,
      challengeId,
      index: nextCharIndex,
      char: typedChar,
      timestamp: Date.now()
    });

    const isCorrect = currentSentence[nextCharIndex] === typedChar;
    setHasInputError(!isCorrect);
    if (!isCorrect) {
      sound.playError();
      triggerImpactFX(yourSlot === 'player1' ? 'p1' : 'p2', 'MISS', 'miss', '#ff2a5f');
      setTimeout(() => setHasInputError(false), 250);
    } else {
      sound.playKeyClick();
    }

    const nextInput = val.slice(0, currentSentence.length);
    setUserInput(nextInput);
  };

  return (
    <div className="battle-screen-layout online-screen-layout">
      {/* Online Session Top Navigation & Status Bar */}
      <div className="online-status-bar">
        <div className="online-session-info">
          <div className="online-pill">
            <Wifi size={13} className="text-neon-cyan" />
            <span className="online-room-title">ROOM:</span>
            <code className="online-room-id">{sessionId}</code>
            <button className="copy-session-btn" onClick={handleCopySessionId} title="Copy Session ID">
              {copied ? <Check size={12} color="#00f59b" /> : <Copy size={12} />}
            </button>
          </div>

          <div className="online-slot-tag">
            YOU: <strong>{yourSlot === 'player1' ? 'PLAYER 1 (LEFT)' : 'PLAYER 2 (RIGHT)'}</strong>
          </div>

          <button
            type="button"
            className="online-server-pill-btn"
            onClick={toggleServerUrl}
            title="Click to toggle combat server"
          >
            <Globe size={12} className="text-neon-cyan" />
            <span className="server-dot" />
            <span className="server-label">{isCloudServer ? 'CLOUD ARENA' : 'LOCAL WI-FI'}</span>
          </button>
        </div>

        {/* Reconnection Grace Period Warning */}
        {!opponentConnected && graceSeconds !== null && (
          <div className="reconnect-grace-alert">
            <AlertTriangle size={15} />
            <span>OPPONENT DISCONNECTED. GRACE: {graceSeconds}s</span>
          </div>
        )}

        {errorMessage && (
          <div className="online-error-toast">
            <span>{errorMessage}</span>
          </div>
        )}

        <button className="navbar-btn outline-btn leave-duel-btn" onClick={handleExit} title="Leave Online Battle">
          <RotateCcw size={14} />
          <span>LEAVE DUEL</span>
        </button>
      </div>

      {/* Top HUD with HP Bars & Server Match Timer */}
      <BattleHUD
        p1State={p1State}
        p2State={p2State}
        timeLeft={timeLeft}
      />

      {/* 2D Side-View Shadow Arena */}
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

      {/* Connecting Chamber Overlay */}
      {phase === 'connecting' && (
        <div className="online-lobby-card connecting-card">
          <div className="online-lobby-header">
            <Wifi size={28} className="text-neon-cyan animate-pulse" />
            <div>
              <h3>CONNECTING TO COMBAT ARENA</h3>
              <p>Contacting server: {currentServerUrl}...</p>
            </div>
          </div>
          <div className="online-room-badge-row">
            <span className="room-label">ROOM SESSION:</span>
            <code className="room-code">{sessionId}</code>
            <button className="copy-session-btn" onClick={handleCopySessionId}>
              {copied ? 'COPIED!' : 'COPY CODE'}
            </button>
          </div>
          <div className="connecting-tips">
            <span>Make sure both players are on the same server &amp; room code.</span>
            <button type="button" className="switch-server-link" onClick={toggleServerUrl}>
              Switch to {isCloudServer ? 'Local Wi-Fi Server' : 'Cloud Arena'}
            </button>
          </div>
        </div>
      )}

      {/* Pre-Match Ready Lobby Overlay if waiting for players */}
      {(phase === 'waiting' || phase === 'ready') && (
        <div className="online-lobby-card">
          <div className="online-lobby-header">
            <Users size={22} className="text-neon-cyan" />
            <div>
              <h3>
                {phase === 'waiting'
                  ? 'WAITING FOR OPPONENT...'
                  : 'WARRIORS ASSEMBLED &bull; PREPARE FOR BATTLE'}
              </h3>
              <p>
                {phase === 'waiting'
                  ? `Share room code "${sessionId}" with Player 2 to join!`
                  : 'Select your shadow warrior and tap Signal Ready.'}
              </p>
            </div>
          </div>

          {/* Room Invite Share Box */}
          {phase === 'waiting' && (
            <div className="lobby-invite-banner">
              <span className="invite-title">ROOM CODE:</span>
              <span className="invite-code">{sessionId}</span>
              <button className="lobby-invite-copy-btn" onClick={handleCopySessionId}>
                {copied ? <Check size={14} color="#00f59b" /> : <Copy size={14} />}
                <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
              </button>
            </div>
          )}

          {/* Character selection quick pills */}
          <div className="lobby-char-selector">
            <span className="lobby-selector-title">SELECT YOUR WARRIOR</span>
            <div className="lobby-char-pills">
              {CHARACTERS.map((char) => {
                const isSelected = (yourSlot === 'player1' ? p1State.character.id : p2State.character.id) === char.id;
                return (
                  <button
                    key={char.id}
                    className={`lobby-char-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectCharacter(char)}
                    style={{ borderColor: isSelected ? char.themeColor : 'transparent' }}
                  >
                    <img src={char.avatarUrl} alt={char.name} className="mini-char-thumb" />
                    <span className="char-btn-name">{char.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Readiness Controls */}
          <div className="lobby-readiness-row">
            <div className={`readiness-badge ${p1Ready ? 'ready' : 'waiting'}`}>
              <CheckCircle2 size={16} />
              <span>PLAYER 1: {p1Ready ? 'READY' : 'CHOOSING...'}</span>
            </div>

            <button
              id="online-ready-toggle-btn"
              className={`online-ready-btn ${(yourSlot === 'player1' ? p1Ready : p2Ready) ? 'btn-is-ready' : ''}`}
              onClick={handleToggleReady}
            >
              {(yourSlot === 'player1' ? p1Ready : p2Ready) ? 'CANCEL READY' : 'SIGNAL READY'}
            </button>

            <div className={`readiness-badge ${p2Ready ? 'ready' : 'waiting'}`}>
              <CheckCircle2 size={16} />
              <span>PLAYER 2: {p2Ready ? 'READY' : 'CHOOSING...'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Typing Console - only during countdown, battle, and finished */}
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
          onRematch={handleToggleReady}
          onCharacterSelect={handleExit}
        />
      )}
    </div>
  );
};
