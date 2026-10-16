import React, { useState, useRef, useEffect } from 'react';
import type { Character, FloatingText, Particle } from '../types/game';
import { BATTLE_SENTENCES, getRandomSentence } from '../data/sentences';
import { sound } from '../utils/sound';
import { calculateWpm, calculateAccuracy, calculateWordDamage } from '../utils/combatMath';
import { ShadowFighterSprite } from './ShadowFighterSprite';
import { Swords, RotateCcw, Target, Zap, Flame, Sparkles } from 'lucide-react';

interface PracticeModeProps {
  character: Character;
  onExit: () => void;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({ character, onExit }) => {
  const [currentCategory, setCurrentCategory] = useState<'all' | 'classic' | 'combat' | 'cyber'>('all');
  const [currentSentence, setCurrentSentence] = useState('The quick brown fox jumps over the lazy dog.');
  const [userInput, setUserInput] = useState('');
  const [hasError, setHasError] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [animState, setAnimState] = useState<'idle' | 'attack'>('idle');

  // Visual FX
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const lastTypedWordIndexRef = useRef<number>(0);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, []);

  // Filter sentences by category
  const getSentenceForCategory = (cat: 'all' | 'classic' | 'combat' | 'cyber') => {
    if (cat === 'all') return getRandomSentence();
    const filtered = BATTLE_SENTENCES.filter((s) => s.category === cat);
    return filtered[Math.floor(Math.random() * filtered.length)].text;
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
    setWordsCompleted(0);
    lastTypedWordIndexRef.current = 0;
    startTimeRef.current = Date.now();
    if (inputRef.current) inputRef.current.focus({ preventScroll: true });
  };

  const triggerFX = (text: string, type: 'damage' | 'critical' | 'combo') => {
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

  const handleInputChange = (value: string) => {
    const prevLen = userInput.length;
    const isBackspace = value.length < prevLen;
    const elapsedSecs = Math.max(1, (Date.now() - startTimeRef.current) / 1000);

    if (!isBackspace) sound.playKeyClick();

    const isMatching = currentSentence.startsWith(value);

    if (!isMatching) {
      sound.playError();
      setHasError(true);
      setTotalKeystrokes((prev) => prev + 1);
      setCombo(0);
      setAccuracy(calculateAccuracy(correctKeystrokes, totalKeystrokes + 1));
      setTimeout(() => setHasError(false), 220);
      setUserInput(value);
      return;
    }

    setHasError(false);
    setUserInput(value);

    const added = Math.max(0, value.length - prevLen);
    const newCorrect = correctKeystrokes + added;
    const newTotal = totalKeystrokes + added;
    setCorrectKeystrokes(newCorrect);
    setTotalKeystrokes(newTotal);
    setAccuracy(calculateAccuracy(newCorrect, newTotal));
    setWpm(calculateWpm(newCorrect, elapsedSecs));

    if (value.endsWith(' ') || value === currentSentence) {
      const words = value.trim().split(/\s+/);
      const currentWordIdx = words.length - 1;

      if (currentWordIdx >= lastTypedWordIndexRef.current) {
        const completedWord = words[currentWordIdx];
        if (completedWord) {
          const { damage, isCritical } = calculateWordDamage(completedWord.length, combo, character.stats.power);
          sound.playAttack(character.weaponType);
          if (combo > 2) sound.playCombo(combo);

          setAnimState('attack');
          setTimeout(() => setAnimState('idle'), 350);

          const nextCombo = combo + 1;
          setCombo(nextCombo);
          setMaxCombo((prev) => Math.max(prev, nextCombo));
          setWordsCompleted((prev) => prev + 1);

          triggerFX(isCritical ? `CRIT +${damage}` : `+${damage}`, isCritical ? 'critical' : 'damage');
        }
        lastTypedWordIndexRef.current = currentWordIdx + 1;
      }
    }

    if (value === currentSentence) {
      sound.playVictory();
      setTimeout(() => {
        const nextSentence = getSentenceForCategory(currentCategory);
        setCurrentSentence(nextSentence);
        setUserInput('');
        lastTypedWordIndexRef.current = 0;
      }, 300);
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
          <div className="practice-icon-badge" style={{ borderColor: character.themeColor }}>
            <Sparkles size={20} style={{ color: character.themeColor }} />
          </div>
          <div>
            <h2 className="practice-title">DOJO PRACTICE</h2>
            <span className="practice-subtitle">
              PRACTICING WITH {character.name} &bull; {character.weapon.toUpperCase()}
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
            <RotateCcw size={15} />
            <span>RESET</span>
          </button>
          <button className="practice-exit-btn" onClick={onExit}>
            <span>EXIT DOJO</span>
          </button>
        </div>
      </div>

      {/* Mini Shadow Stage */}
      <div className="practice-stage-card">
        <div className="practice-stage-backdrop" />
        
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

        {/* Shadow Warrior Center Showcase */}
        <div className="practice-fighter-center">
          <ShadowFighterSprite
            character={character}
            animation={animState}
            isFacingRight={true}
          />
          <div className="practice-fighter-meta">
            <span className="practice-fighter-name" style={{ color: character.themeColor }}>
              {character.name}
            </span>
            <span className="practice-fighter-tagline">"{character.tagline}"</span>
          </div>
        </div>
      </div>

      {/* Target Sentence Box */}
      <div className={`practice-prompt-card ${hasError ? 'console-shake' : ''}`}>
        <div className="target-sentence-box">
          <div className="sentence-text-stream">
            {renderChars()}
          </div>
        </div>

        {/* Input */}
        <div className="typing-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type at your own rhythm to practice..."
            className={`typing-input ${hasError ? 'input-error' : ''}`}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        {/* Metrics Bar */}
        <div className="practice-metrics-bar">
          <div className="metric-pill">
            <Zap size={16} style={{ color: character.themeColor }} />
            <span className="metric-label">CURRENT SPEED:</span>
            <span className="metric-value" style={{ color: character.themeColor }}>{wpm} WPM</span>
          </div>

          <div className="metric-pill">
            <Target size={16} />
            <span className="metric-label">ACCURACY:</span>
            <span className="metric-value">{accuracy}%</span>
          </div>

          <div className="metric-pill">
            <Flame size={16} />
            <span className="metric-label">COMBO:</span>
            <span className="metric-value">{combo}x (MAX {maxCombo}x)</span>
          </div>

          <div className="metric-pill">
            <Swords size={16} />
            <span className="metric-label">WORDS COMPLETED:</span>
            <span className="metric-value">{wordsCompleted}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
