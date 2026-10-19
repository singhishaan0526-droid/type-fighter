import React, { useState, useRef, useEffect } from 'react';
import type { Character, FloatingText, Particle, CombatAnimationState } from '../types/game';
import { CHARACTERS } from '../data/characters';
import { sound } from '../utils/sound';
import { calculateWordDamage } from '../utils/combatMath';
import { processTypingInput } from '../utils/typingEngine';
import { ShadowFighterSprite } from './ShadowFighterSprite';
import { Swords, RotateCcw, Target, Zap, Flame, Sparkles, StopCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { PracticeSummaryModal, type PracticeStats } from './PracticeSummaryModal';
import { geminiSentenceService } from '../utils/geminiSentenceService';

interface PracticeModeProps {
  character: Character;
  onExit: () => void;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({ character, onExit }) => {
  const [currentCategory, setCurrentCategory] = useState<'all' | 'classic' | 'combat' | 'cyber'>('all');
  const [currentSentence, setCurrentSentence] = useState(() => geminiSentenceService.getNextSentence());
  const [userInput, setUserInput] = useState('');
  const [hasError, setHasError] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);

  // Two-Fighter Sparring State
  const [p1AnimState, setP1AnimState] = useState<CombatAnimationState>('idle');
  const [sparringPartner, setSparringPartner] = useState<Character>(() => {
    return CHARACTERS.find((c) => c.id !== character.id) || CHARACTERS[1];
  });
  const [partnerAnimState, setPartnerAnimState] = useState<CombatAnimationState>('idle');
  const [currentTechnique, setCurrentTechnique] = useState<string | null>(null);

  // Practice Summary Modal state
  const [showSummary, setShowSummary] = useState(false);
  const [finalStats, setFinalStats] = useState<PracticeStats | null>(null);

  // Visual FX
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const lastTypedWordIndexRef = useRef<number>(0);
  const maxCorrectIndexRef = useRef<number>(0);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, []);

  // Filter sentences by category (uses Gemini AI dynamically)
  const getSentenceForCategory = (cat: 'all' | 'classic' | 'combat' | 'cyber') => {
    return geminiSentenceService.getNextSentence(currentSentence, cat === 'all' ? 'combat' : cat);
  };

  const handleSwitchCategory = (cat: 'all' | 'classic' | 'combat' | 'cyber') => {
    setCurrentCategory(cat);
    const nextSentence = getSentenceForCategory(cat);
    setCurrentSentence(nextSentence);
    setUserInput('');
    setHasError(false);
    lastTypedWordIndexRef.current = 0;
    if (inputRef.current) inputRef.current.focus({ preventScroll: true });
  };

  const handleReset = () => {
    setUserInput('');
    setHasError(false);
    setCombo(0);
    setMaxCombo(0);
    setWpm(0);
    setAccuracy(100);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setMistakes(0);
    setWordsCompleted(0);
    lastTypedWordIndexRef.current = 0;
    maxCorrectIndexRef.current = 0;
    startTimeRef.current = Date.now();
    setShowSummary(false);
    setFinalStats(null);
    if (inputRef.current) inputRef.current.focus({ preventScroll: true });
  };

  // User explicitly clicks "END" to finish the endless session and see diagnostics
  const handleEndSession = () => {
    const elapsedSecs = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    sound.playVictory();

    const stats: PracticeStats = {
      wpm,
      accuracy,
      wordsTyped: wordsCompleted,
      totalKeystrokes,
      correctKeystrokes,
      mistakes,
      maxCombo,
      elapsedSeconds: elapsedSecs
    };

    setFinalStats(stats);
    setShowSummary(true);
  };

  const triggerFX = (text: string, type: 'damage' | 'critical' | 'combo' | 'miss') => {
    const textId = `${Date.now()}-${Math.random()}`;
    setFloatingTexts((prev) => [
      ...prev,
      { id: textId, text, type, x: 50 + (Math.random() * 10 - 5), y: 40, color: character.themeColor }
    ]);

    const newSparks: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      newSparks.push({
        id: `${textId}-p-${i}`,
        x: 50,
        y: 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: character.themeColor,
        size: 3 + Math.random() * 3,
        alpha: 1,
        life: 1
      });
    }
    setParticles((prev) => [...prev.slice(-20), ...newSparks]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== textId));
    }, 800);
  };

  // Particle update
  useEffect(() => {
    if (particles.length === 0) return;
    const frame = requestAnimationFrame(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.2,
            y: p.y + p.vy * 0.2,
            alpha: p.alpha - 0.05,
            life: p.life - 0.05
          }))
          .filter((p) => p.life > 0)
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [particles]);

  const handleCyclePartner = () => {
    const currentIndex = CHARACTERS.findIndex((c) => c.id === sparringPartner.id);
    const nextPartner = CHARACTERS[(currentIndex + 1) % CHARACTERS.length];
    setSparringPartner(nextPartner);
    sound.playKeyClick();
  };

  // Ambient martial arts sparring demonstration loop ("just for showing")
  useEffect(() => {
    if (showSummary) return;

    const ambientTimer = setInterval(() => {
      // If neither warrior is currently attacking, perform an ambient sparring exchange
      setP1AnimState((currentP1) => {
        if (currentP1 !== 'idle') return currentP1;

        const partnerAttacks = Math.random() > 0.5;
        if (partnerAttacks) {
          const move = Math.random() > 0.5 ? 'kick' : 'punch';
          setPartnerAnimState(move);
          sound.playDash();
          if (move === 'kick') sound.playKick();
          else sound.playPunch();
          setCurrentTechnique(`${sparringPartner.name}: SPARRING ${move.toUpperCase()}`);

          setTimeout(() => {
            setPartnerAnimState('idle');
            setCurrentTechnique(null);
          }, 450);
          return 'idle';
        } else {
          const move = Math.random() > 0.5 ? 'kick' : 'punch';
          sound.playDash();
          if (move === 'kick') sound.playKick();
          else sound.playPunch();
          setCurrentTechnique(`${character.name}: SPARRING ${move.toUpperCase()}`);

          setTimeout(() => {
            setP1AnimState('idle');
            setCurrentTechnique(null);
          }, 450);
          return move;
        }
      });
    }, 4500);

    return () => clearInterval(ambientTimer);
  }, [showSummary, character.name, sparringPartner.name]);

  const handleInputChange = (value: string) => {
    if (showSummary) return;
    const prevLen = userInput.length;
    const elapsedSecs = Math.max(1, (Date.now() - startTimeRef.current) / 1000);

    const result = processTypingInput(
      value,
      currentSentence,
      {
        userInput,
        maxCorrectIndex: maxCorrectIndexRef.current,
        correctKeystrokes,
        totalKeystrokes,
        mistakes,
        combo,
        accuracy,
        wpm,
        hasInputError: hasError
      },
      elapsedSecs,
      lastTypedWordIndexRef.current
    );

    setUserInput(result.nextState.userInput);
    maxCorrectIndexRef.current = result.nextState.maxCorrectIndex;
    setHasError(result.nextState.hasInputError);

    if (result.isMistake) {
      sound.playError();
      triggerFX('MISS', 'miss');
      setTimeout(() => setHasError(false), 220);
    } else if (value.length > prevLen) {
      sound.playKeyClick();
    }

    setCorrectKeystrokes(result.nextState.correctKeystrokes);
    setTotalKeystrokes(result.nextState.totalKeystrokes);
    setMistakes(result.nextState.mistakes);
    setCombo(result.nextState.combo);
    setMaxCombo((prev) => Math.max(prev, result.nextState.combo));
    setAccuracy(result.nextState.accuracy);
    setWpm(result.nextState.wpm);

    if (result.isCompletedWord && result.completedWord) {
      const { damage, isCritical } = calculateWordDamage(
        result.completedWord.length,
        result.nextState.combo,
        character.stats.power
      );

      // Martial arts rotation: Punch -> Kick -> Weapon Slash -> Unique Move
      const step = result.nextState.combo % 4;
      let moveAnim: CombatAnimationState = 'punch';
      let moveLabel = 'PUNCH';

      sound.playDash();
      if (result.isSentenceCompleted || isCritical || step === 3) {
        moveAnim = 'unique';
        moveLabel = character.uniqueMoveName;
        sound.playUltimate();
        sound.playAttack(character.weaponType);
      } else if (step === 1) {
        moveAnim = 'kick';
        moveLabel = 'HIGH KICK';
        sound.playKick();
      } else if (step === 2) {
        moveAnim = 'attack';
        moveLabel = `${character.weapon.toUpperCase()}`;
        sound.playAttack(character.weaponType);
      } else {
        moveAnim = 'punch';
        moveLabel = 'FIST STRIKE';
        sound.playPunch();
      }

      if (result.nextState.combo > 2) sound.playCombo(result.nextState.combo);

      setP1AnimState(moveAnim);
      setPartnerAnimState('hit');
      setCurrentTechnique(moveLabel);

      setTimeout(() => {
        setP1AnimState('idle');
        setPartnerAnimState('idle');
      }, 420);

      setWordsCompleted((prev) => prev + 1);
      triggerFX(isCritical ? `CRIT ${moveLabel} +${damage}` : `${moveLabel} +${damage}`, isCritical ? 'critical' : 'damage');

      const words = result.nextState.userInput.trim().split(/\s+/);
      lastTypedWordIndexRef.current = words.length;
    }

    if (result.isSentenceCompleted) {
      sound.playVictory();
      const nextSentence = getSentenceForCategory(currentCategory);
      setCurrentSentence(nextSentence);
      setUserInput('');
      lastTypedWordIndexRef.current = 0;
      maxCorrectIndexRef.current = 0;
      setHasError(false);
    }
  };

  const renderChars = () => {
    return currentSentence.split('').map((char, index) => {
      let statusClass = 'char-pending';
      if (index < userInput.length) {
        statusClass = userInput[index] === char ? 'char-correct' : 'char-incorrect';
      } else if (index === userInput.length) {
        statusClass = `char-current ${hasError ? 'char-error-active' : ''}`;
      }

      return (
        <span
          key={`practice-char-${index}`}
          className={`sentence-char ${statusClass}`}
          style={{
            color:
              index < userInput.length && userInput[index] === char
                ? character.themeColor
                : undefined
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  return (
    <div className="practice-mode-container">
      {/* Top Controls & Category Filter */}
      <div className="practice-header-bar">
        <div className="practice-title-group">
          <button className="practice-back-btn" onClick={onExit} title="Back to Character Select">
            <ArrowLeft size={16} />
          </button>
          <div className="practice-icon-badge" style={{ borderColor: character.themeColor }}>
            <Sparkles size={18} style={{ color: character.themeColor }} />
          </div>
          <div>
            <h2 className="practice-title">FREE PRACTICE DOJO</h2>
            <span className="practice-subtitle">
              ENDLESS TYPING &bull; {character.name.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="practice-category-pills">
          {(['all', 'classic', 'combat', 'cyber'] as const).map((cat) => (
            <button
              key={cat}
              className={`cat-pill ${currentCategory === cat ? 'active' : ''}`}
              onClick={() => handleSwitchCategory(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="practice-action-buttons">
          <button className="practice-reset-btn" onClick={handleReset} title="Reset Speed Drill">
            <RotateCcw size={14} />
            <span>RESET</span>
          </button>

          {/* Dedicated END SESSION Button */}
          <button
            id="end-practice-session-btn"
            className="practice-end-btn"
            onClick={handleEndSession}
            title="End typing session and view full WPM and accuracy diagnostics"
          >
            <StopCircle size={16} />
            <span>END SESSION</span>
          </button>
        </div>
      </div>

      {/* 2-Fighter Dojo Sparring Arena Stage */}
      <div className="practice-stage-card">
        <div className="practice-stage-backdrop" />

        {/* Switch Sparring Partner Button */}
        <button
          type="button"
          className="practice-partner-selector-chip"
          onClick={handleCyclePartner}
          title="Switch sparring partner warrior"
        >
          <RefreshCw size={12} />
          <span>SPARRING RIVAL: <strong>{sparringPartner.name}</strong> [SWITCH]</span>
        </button>

        {/* Dynamic Sparring Technique Banner */}
        {currentTechnique && (
          <div className="practice-sparring-banner">
            <Zap size={14} />
            <span>{currentTechnique.toUpperCase()}</span>
          </div>
        )}

        {/* Floating FX */}
        <div className="arena-floating-texts">
          {floatingTexts.map((ft) => (
            <div
              key={ft.id}
              className={`floating-combat-text ft-${ft.type}`}
              style={{
                left: `${ft.x}%`,
                top: `${ft.y}%`,
                color: ft.color,
                textShadow: `0 0 12px ${ft.color}`
              }}
            >
              {ft.text}
            </div>
          ))}
        </div>

        <div className="arena-particles-container">
          {particles.map((p) => (
            <div
              key={p.id}
              className="combat-particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                opacity: p.alpha
              }}
            />
          ))}
        </div>

        {/* Ground Battle Platform */}
        <div className="arena-ground-platform">
          <div className="platform-stone-texture" />
        </div>

        {/* 2 Fighters Sparring Stage */}
        <div className="practice-fighters-arena">
          {/* Left Fighter: Player Warrior */}
          <div className="fighter-position-slot p1-slot">
            <ShadowFighterSprite
              character={character}
              animation={p1AnimState}
              isFacingRight={true}
            />
            <div className="fighter-ground-indicator">
              <span className="fighter-name-tag" style={{ color: character.themeColor }}>
                {character.name} (YOU)
              </span>
              <span className="fighter-title-sub">{character.title}</span>
            </div>
          </div>

          {/* Center Dynamic Clash Impact Spark */}
          {(p1AnimState !== 'idle' || partnerAnimState !== 'idle') && (
            <div className="clash-impact-flare">
              <div className="clash-spark-core" />
            </div>
          )}

          {/* Right Fighter: Sparring Partner */}
          <div className="fighter-position-slot p2-slot">
            <ShadowFighterSprite
              character={sparringPartner}
              animation={partnerAnimState}
              isFacingRight={false}
            />
            <div className="fighter-ground-indicator">
              <span className="fighter-name-tag" style={{ color: sparringPartner.themeColor }}>
                {sparringPartner.name} (RIVAL)
              </span>
              <span className="fighter-title-sub">{sparringPartner.title}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Sentence Box */}
      <div className={`practice-prompt-card ${hasError ? 'console-shake' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', padding: '0 0.2rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TARGET PHRASE:</span>
          {geminiSentenceService.isAIGenerated(currentSentence) && (
            <span className="ai-sentence-badge" title="Generated in real-time by Google Gemini AI">
              <Sparkles size={12} color="#00e5ff" />
              <span>GEMINI AI</span>
            </span>
          )}
        </div>
        <div className="target-sentence-box">
          <div className="sentence-text-stream">{renderChars()}</div>
        </div>

        {/* Input Bar with Quick End CTA */}
        <div className="typing-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type freely at your own speed... Click 'END SESSION' when done."
            className={`typing-input ${hasError ? 'input-error' : ''}`}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button
            className="input-end-trigger-btn"
            onClick={handleEndSession}
            title="Finish practice and view typing metrics"
          >
            <StopCircle size={15} />
            <span>END</span>
          </button>
        </div>

        {/* Metrics Bar */}
        <div className="practice-metrics-bar">
          <div className="metric-pill">
            <Zap size={15} style={{ color: character.themeColor }} />
            <span className="metric-label">SPEED:</span>
            <span className="metric-value" style={{ color: character.themeColor }}>
              {wpm} WPM
            </span>
          </div>

          <div className="metric-pill">
            <Target size={15} />
            <span className="metric-label">ACCURACY:</span>
            <span className="metric-value">{accuracy}%</span>
          </div>

          <div className="metric-pill">
            <Flame size={15} />
            <span className="metric-label">COMBO:</span>
            <span className="metric-value">{combo}x</span>
          </div>

          <div className="metric-pill">
            <Swords size={15} />
            <span className="metric-label">WORDS:</span>
            <span className="metric-value">{wordsCompleted}</span>
          </div>
        </div>
      </div>

      {/* Dedicated Practice Summary Diagnostics Modal */}
      {showSummary && finalStats && (
        <PracticeSummaryModal
          stats={finalStats}
          character={character}
          onPracticeAgain={handleReset}
          onExit={onExit}
        />
      )}
    </div>
  );
};
