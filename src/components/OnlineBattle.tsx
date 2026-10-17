import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Character, FighterState, BattleResult, FloatingText, Particle, PlayerSlot } from '../types/game';
import { CHARACTERS, getCharacterById } from '../data/characters';
import { sound } from '../utils/sound';
import { connectSocket, getSocket } from '../utils/socketClient';
import { BattleHUD } from './BattleHUD';
import { ShadowArena } from './ShadowArena';
import { TypingConsole } from './TypingConsole';
import { BattleResultModal } from './BattleResultModal';
import { Wifi, Users, CheckCircle2, RotateCcw, AlertTriangle, Copy, Check } from 'lucide-react';

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
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Connect to Socket.IO and register events
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    // Check for existing reconnection token
    const savedToken = sessionStorage.getItem(`typing_reconnect_${sessionId}`);

    const handleConnect = () => {
      setErrorMessage(null);
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
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
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

      sound.playAttack(attackerState.character.weaponType);
      if (evt.combo > 2) sound.playCombo(evt.combo);

      // Animate attacker and victim
      if (isAttackerP1) {
        setP1State((prev) => ({ ...prev, animation: 'attack' }));
        setP2State((prev) => ({ ...prev, animation: 'hit' }));
      } else {
        setP2State((prev) => ({ ...prev, animation: 'attack' }));
        setP1State((prev) => ({ ...prev, animation: 'hit' }));
      }

      triggerImpactFX(
        targetTag,
        evt.isCritical ? `CRIT -${evt.damage}` : `-${evt.damage}`,
        evt.isCritical ? 'critical' : 'damage',
        attackerState.character.themeColor
      );

      if (evt.isCritical) triggerScreenShake();

      setTimeout(() => {
        setP1State((prev) => ({ ...prev, animation: 'idle' }));
        setP2State((prev) => ({ ...prev, animation: 'idle' }));
      }, 350);
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
      setBattleResult({
        winner: evt.winner,
        p1Stats: evt.p1Stats,
        p2Stats: evt.p2Stats,
        elapsedSeconds: evt.elapsedSeconds
      });

      setP1State((prev) => ({
        ...prev,
        animation: evt.winner === 'player1' ? 'victory' : evt.winner === 'player2' ? 'defeat' : 'idle'
      }));
      setP2State((prev) => ({
        ...prev,
        animation: evt.winner === 'player2' ? 'victory' : evt.winner === 'player1' ? 'defeat' : 'idle'
      }));

      if (evt.winner === yourSlotRef.current) {
        sound.playVictory();
      } else {
        sound.playError();
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

    // 12. Match Errors / Rejections
    socket.on('match:error', (err: any) => {
      setErrorMessage(`${err.code}: ${err.message}`);
      setTimeout(() => setErrorMessage(null), 4000);
    });

    return () => {
      socket.off('connect');
      socket.off('match:state');
      socket.off('player:joined');
      socket.off('player:character');
      socket.off('player:ready');
      socket.off('match:countdown');
      socket.off('match:started');
      socket.off('typing:progress');
      socket.off('combat:attack');
      socket.off('player:health');
      socket.off('match:finished');
      socket.off('connection:status');
      socket.off('match:error');
    };
  }, [sessionId, initialCharacter.id, triggerImpactFX, triggerScreenShake]);

  // Handle Ready Toggle
  const handleToggleReady = () => {
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

    sound.playKeyClick();

    // Determine current index and character being typed
    const nextCharIndex = userInput.length;
    if (val.length > userInput.length) {
      const typedChar = val[nextCharIndex];

      // Submit sequence-numbered input event to server
      const seq = seqRef.current++;
      socketRef.current.emit('typing:input', {
        seq,
        challengeId,
        index: nextCharIndex,
        char: typedChar,
        timestamp: Date.now()
      });

      // Visual matching for local input field
      const isCorrect = currentSentence[nextCharIndex] === typedChar;
      setHasInputError(!isCorrect);
      if (!isCorrect) {
        sound.playError();
        setTimeout(() => setHasInputError(false), 250);
      } else {
        setUserInput(currentSentence.slice(0, nextCharIndex + 1));
      }
    } else if (val.length < userInput.length) {
      setUserInput(val);
      setHasInputError(false);
    }
  };

  return (
    <div className="battle-screen-layout">
      {/* Online Session Top Navigation & Status Bar */}
      <div className="online-status-bar">
        <div className="online-session-info">
          <div className="online-pill">
            <Wifi size={14} className="text-neon-cyan" />
            <span className="online-room-title">SESSION:</span>
            <code className="online-room-id">{sessionId}</code>
            <button className="copy-session-btn" onClick={handleCopySessionId} title="Copy Session ID">
              {copied ? <Check size={13} color="#00f59b" /> : <Copy size={13} />}
            </button>
          </div>

          <div className="online-slot-tag">
            YOU ARE: <strong>{yourSlot === 'player1' ? 'PLAYER 1 (LEFT)' : 'PLAYER 2 (RIGHT)'}</strong>
          </div>
        </div>

        {/* Reconnection Grace Period Warning */}
        {!opponentConnected && graceSeconds !== null && (
          <div className="reconnect-grace-alert">
            <AlertTriangle size={15} />
            <span>OPPONENT DISCONNECTED. RECONNECTION GRACE: {graceSeconds}s</span>
          </div>
        )}

        {errorMessage && (
          <div className="online-error-toast">
            <span>{errorMessage}</span>
          </div>
        )}

        <button className="navbar-btn outline-btn" onClick={onExit} title="Leave Online Battle">
          <RotateCcw size={15} />
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
      />

      {/* Pre-Match Ready Lobby Overlay if waiting for players */}
      {(phase === 'waiting' || phase === 'ready') && (
        <div className="online-lobby-card">
          <div className="online-lobby-header">
            <Users size={22} className="text-neon-cyan" />
            <div>
              <h3>ONLINE COMBAT CHAMBER</h3>
              <p>
                {phase === 'waiting'
                  ? 'Waiting for second warrior to join room. Share the session ID above!'
                  : 'Both warriors connected! Select your character and signal readiness.'}
              </p>
            </div>
          </div>

          {/* Character selection quick pills */}
          <div className="lobby-char-selector">
            <span className="lobby-selector-title">YOUR WARRIOR:</span>
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
                    <span>{char.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Readiness Controls */}
          <div className="lobby-readiness-row">
            <div className={`readiness-badge ${p1Ready ? 'ready' : ''}`}>
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

            <div className={`readiness-badge ${p2Ready ? 'ready' : ''}`}>
              <CheckCircle2 size={16} />
              <span>PLAYER 2: {p2Ready ? 'READY' : 'CHOOSING...'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Typing Console */}
      <TypingConsole
        sentence={currentSentence}
        userInput={userInput}
        onInputChange={handleInputChange}
        p1State={p1State}
        p2State={p2State}
        hasError={hasInputError}
        disabled={phase !== 'battle' || !!battleResult}
      />

      {/* Battle Results Modal */}
      {battleResult && (
        <BattleResultModal
          result={battleResult}
          p1State={p1State}
          p2State={p2State}
          onRematch={handleToggleReady}
          onCharacterSelect={onExit}
        />
      )}
    </div>
  );
};
