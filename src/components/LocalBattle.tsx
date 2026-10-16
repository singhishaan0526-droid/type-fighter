import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Character, FighterState, GameMode, BotDifficulty, BattleResult, FloatingText, Particle } from '../types/game';
import { getRandomSentence } from '../data/sentences';
import { sound } from '../utils/sound';
import {
  calculateWpm,
  calculateAccuracy,
  calculateWordDamage,
  applyMistakePenalty,
  evaluateWinner
} from '../utils/combatMath';
import { BattleHUD } from './BattleHUD';
import { ShadowArena } from './ShadowArena';
import { TypingConsole } from './TypingConsole';
import { BattleResultModal } from './BattleResultModal';
import { CHARACTER_ULTIMATES } from '../types/abilities';
import { saveMatchRecord } from '../utils/recordManager';

interface LocalBattleProps {
  p1Character: Character;
  p2Character: Character;
  mode: GameMode;
  difficulty: BotDifficulty;
  onReturnToSelect: () => void;
}

export const LocalBattle: React.FC<LocalBattleProps> = ({
  p1Character,
  p2Character,
  mode,
  difficulty,
  onReturnToSelect
}) => {
  // Target sentence - starts with classic PRD sentence
  const [currentSentence, setCurrentSentence] = useState('The quick brown fox jumps over the lazy dog.');
  const [userInput, setUserInput] = useState('');
  const [hasInputError, setHasInputError] = useState(false);

  // Time & Match flow
  const [timeLeft, setTimeLeft] = useState(75); // 75 seconds battle timer
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [matchActive, setMatchActive] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [isScreenShaking, setIsScreenShaking] = useState(false);

  // FX: Floating texts & Particles
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Scroll to top on battle enter
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Pre-match Countdown ("3... 2... 1... FIGHT!")
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      sound.playKeyClick();
      const timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
      }, 750);
      return () => clearTimeout(timer);
    } else {
      sound.playAttack('staff');
      const timer = setTimeout(() => {
        setCountdown(null);
        startTimeRef.current = Date.now();
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Player 1 Fighter State
  const [p1State, setP1State] = useState<FighterState>({
    character: p1Character,
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

  // Player 2 / Bot Fighter State
  const [p2State, setP2State] = useState<FighterState>({
    character: p2Character,
    maxHp: 100,
    currentHp: 100,
    combo: 0,
    maxCombo: 0,
    animation: 'idle',
    wpm: 0,
    accuracy: 94,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    mistakes: 0,
    damageDealt: 0,
    superMeter: 0,
    shieldHp: 0,
    isFrozen: false,
    hasHasteBuff: false
  });

  const startTimeRef = useRef<number>(Date.now());
  const lastTypedWordIndexRef = useRef<number>(0);
  const botComboRef = useRef<number>(0);

  // Spawn visual FX helper
  const triggerImpactFX = useCallback((
    target: 'p1' | 'p2',
    text: string,
    type: 'damage' | 'critical' | 'combo' | 'miss',
    color: string
  ) => {
    // Spawn floating text
    const textId = `${Date.now()}-${Math.random()}`;
    const xPos = target === 'p2' ? 68 + (Math.random() * 8 - 4) : 28 + (Math.random() * 8 - 4);
    const yPos = 45 + (Math.random() * 10 - 5);

    setFloatingTexts((prev) => [
      ...prev,
      { id: textId, text, type, x: xPos, y: yPos, color }
    ]);

    // Spawn sparks
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

    // Clean up text after animation
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== textId));
    }, 900);
  }, []);

  // Screen shake helper
  const triggerScreenShake = useCallback(() => {
    setIsScreenShaking(true);
    setTimeout(() => setIsScreenShaking(false), 300);
  }, []);

  // End Battle and compute results
  const finishBattle = useCallback((winner: 'player1' | 'player2' | 'draw') => {
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    
    // Set victory/defeat animations
    setP1State(prev => ({
      ...prev,
      animation: winner === 'player1' ? 'victory' : winner === 'player2' ? 'defeat' : 'idle'
    }));
    setP2State(prev => ({
      ...prev,
      animation: winner === 'player2' ? 'victory' : winner === 'player1' ? 'defeat' : 'idle'
    }));

    setBattleResult({
      winner,
      p1Stats: {
        wpm: p1State.wpm,
        accuracy: p1State.accuracy,
        maxCombo: p1State.maxCombo,
        damageDealt: p1State.damageDealt
      },
      p2Stats: {
        wpm: p2State.wpm,
        accuracy: p2State.accuracy,
        maxCombo: p2State.maxCombo,
        damageDealt: p2State.damageDealt
      },
      elapsedSeconds
    });

    // Save to match history records
    try {
      saveMatchRecord({
        playerCharacterId: p1Character.id,
        opponentCharacterId: p2Character.id,
        winner,
        playerWpm: p1State.wpm,
        opponentWpm: p2State.wpm,
        playerAccuracy: p1State.accuracy,
        playerMaxCombo: p1State.maxCombo,
        playerDamage: p1State.damageDealt,
        difficulty,
        mode
      });
    } catch {
      // safe guard
    }

    setMatchActive(false);
  }, [p1State, p2State, p1Character.id, p2Character.id, difficulty, mode]);

  // Check HP thresholds
  useEffect(() => {
    if (!matchActive || battleResult) return;

    if (p2State.currentHp <= 0) {
      setMatchActive(false);
      finishBattle('player1');
    } else if (p1State.currentHp <= 0) {
      setMatchActive(false);
      finishBattle('player2');
    }
  }, [matchActive, p1State.currentHp, p2State.currentHp, battleResult, finishBattle]);

  // Battle Countdown Timer
  useEffect(() => {
    if (battleResult || countdown !== null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Evaluate winner on time out
          const winner = evaluateWinner(
            p1State.currentHp,
            p1State.accuracy,
            p2State.currentHp,
            p2State.accuracy
          );
          finishBattle(winner);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [battleResult, countdown, p1State, p2State, finishBattle]);

  // Particle physics update loop
  useEffect(() => {
    if (particles.length === 0) return;

    const animFrame = requestAnimationFrame(() => {
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

    return () => cancelAnimationFrame(animFrame);
  }, [particles]);

  // Shadow Bot Combat AI (in 'vs-bot' mode)
  useEffect(() => {
    if (mode !== 'vs-bot' || battleResult || countdown !== null) return;

    // Difficulty tuning
    const config = {
      easy: { intervalMin: 1400, intervalMax: 1800, targetWpm: 42, powerScale: 0.8 },
      medium: { intervalMin: 850, intervalMax: 1150, targetWpm: 65, powerScale: 1.0 },
      hard: { intervalMin: 600, intervalMax: 850, targetWpm: 88, powerScale: 1.2 },
      master: { intervalMin: 420, intervalMax: 620, targetWpm: 110, powerScale: 1.4 }
    }[difficulty];

    let isMounted = true;
    let botTimeoutId: ReturnType<typeof setTimeout>;

    const botAttackStep = () => {
      if (!isMounted || battleResult) return;

      const delay = Math.random() * (config.intervalMax - config.intervalMin) + config.intervalMin;

      botTimeoutId = setTimeout(() => {
        if (!isMounted || battleResult) return;

        // Bot word strike (skip if frozen)
        if (p2State.isFrozen) {
          botAttackStep();
          return;
        }

        const botWordLen = 4 + Math.floor(Math.random() * 4);
        const { damage, isCritical } = calculateWordDamage(botWordLen, botComboRef.current, p2Character.stats.power);
        const finalDamage = Math.max(2, Math.round(damage * 0.3 * config.powerScale));
        botComboRef.current += 1;

        sound.playAttack(p2Character.weaponType);

        // Animate Bot attack & Player 1 hit with shield absorption
        setP2State((prev) => {
          const nextCombo = prev.combo + 1;
          return {
            ...prev,
            animation: 'attack',
            combo: nextCombo,
            maxCombo: Math.max(prev.maxCombo, nextCombo),
            wpm: config.targetWpm + Math.floor(Math.random() * 6 - 3),
            damageDealt: prev.damageDealt + finalDamage
          };
        });

        setP1State((prev) => {
          let damageToHp = finalDamage;
          let newShield = prev.shieldHp;
          if (newShield > 0) {
            if (newShield >= finalDamage) {
              newShield -= finalDamage;
              damageToHp = 0;
            } else {
              damageToHp = finalDamage - newShield;
              newShield = 0;
            }
          }
          return {
            ...prev,
            animation: 'hit',
            shieldHp: newShield,
            currentHp: Math.max(0, prev.currentHp - damageToHp)
          };
        });

        triggerImpactFX(
          'p1',
          isCritical ? `CRIT -${finalDamage}` : `-${finalDamage}`,
          isCritical ? 'critical' : 'damage',
          p2Character.themeColor
        );

        if (isCritical) {
          triggerScreenShake();
        }

        // Reset animations to idle
        setTimeout(() => {
          if (!isMounted) return;
          setP2State((prev) => ({ ...prev, animation: 'idle' }));
          setP1State((prev) => ({ ...prev, animation: 'idle' }));
        }, 350);

        botAttackStep();
      }, delay);
    };

    botAttackStep();

    return () => {
      isMounted = false;
      clearTimeout(botTimeoutId);
    };
  }, [mode, difficulty, battleResult, countdown, p2Character, p2State.isFrozen, triggerImpactFX, triggerScreenShake]);

  // Execute Player 1 attack when a word is completed
  const executePlayerStrike = useCallback((word: string, isEndOfSentence: boolean = false) => {
    const elapsedSecs = Math.max(1, (Date.now() - startTimeRef.current) / 1000);
    const { damage, isCritical } = calculateWordDamage(
      word.length,
      p1State.combo,
      p1Character.stats.power
    );

    const bonusDamage = isEndOfSentence ? 10 : 0;
    const hasteMultiplier = p1State.hasHasteBuff ? 1.5 : 1.0;
    const totalDmg = Math.max(3, Math.round((damage + bonusDamage) * 0.5 * hasteMultiplier));
    const meterGain = isEndOfSentence ? 22 : 12;

    // Audio FX
    sound.playAttack(p1Character.weaponType);
    if (p1State.combo > 2) {
      sound.playCombo(p1State.combo);
    }

    // Trigger visual animations & super meter gain
    setP1State((prev) => {
      const nextCombo = prev.combo + 1;
      const nextMeter = Math.min(100, prev.superMeter + meterGain);
      return {
        ...prev,
        animation: 'attack',
        combo: nextCombo,
        maxCombo: Math.max(prev.maxCombo, nextCombo),
        damageDealt: prev.damageDealt + totalDmg,
        superMeter: nextMeter,
        wpm: calculateWpm(prev.correctKeystrokes, elapsedSecs)
      };
    });

    // P2 damage with shield absorption
    setP2State((prev) => {
      let damageToHp = totalDmg;
      let newShield = prev.shieldHp;
      if (newShield > 0) {
        if (newShield >= totalDmg) {
          newShield -= totalDmg;
          damageToHp = 0;
        } else {
          damageToHp = totalDmg - newShield;
          newShield = 0;
        }
      }
      return {
        ...prev,
        animation: 'hit',
        shieldHp: newShield,
        currentHp: Math.max(0, prev.currentHp - damageToHp)
      };
    });

    // Floating text & spark FX
    const textLabel = isCritical
      ? `CRIT -${totalDmg}!`
      : isEndOfSentence
      ? `FINISHER -${totalDmg}!`
      : `-${totalDmg}`;

    triggerImpactFX(
      'p2',
      textLabel,
      isCritical || isEndOfSentence ? 'critical' : 'damage',
      p1Character.themeColor
    );

    if (isCritical || isEndOfSentence) {
      triggerScreenShake();
    }

    // Reset fighter animations back to idle after strike
    setTimeout(() => {
      setP1State((prev) => ({ ...prev, animation: 'idle' }));
      setP2State((prev) => ({ ...prev, animation: 'idle' }));
    }, 380);
  }, [p1Character, p1State.combo, p1State.hasHasteBuff, triggerImpactFX, triggerScreenShake]);

  // Trigger Ultimate Ability
  const handleTriggerUltimate = useCallback(() => {
    if (p1State.superMeter < 100 || !matchActive || battleResult) return;
    const ult = CHARACTER_ULTIMATES[p1Character.id];
    if (!ult) return;

    sound.playUltimate();
    triggerScreenShake();

    setP1State((prev) => ({
      ...prev,
      superMeter: 0,
      animation: 'attack'
    }));

    switch (p1Character.id) {
      case 'byte': {
        const bonusDmg = 25;
        setP2State((prev) => ({
          ...prev,
          currentHp: Math.max(0, prev.currentHp - bonusDmg),
          isFrozen: true,
          animation: 'hit'
        }));
        triggerImpactFX('p2', `OVERCLOCK! -${bonusDmg} ❄️`, 'critical', p1Character.themeColor);
        setTimeout(() => {
          setP2State((prev) => ({ ...prev, isFrozen: false }));
        }, 2500);
        break;
      }
      case 'glitch': {
        const bonusDmg = 35;
        setP2State((prev) => ({
          ...prev,
          currentHp: Math.max(0, prev.currentHp - bonusDmg),
          animation: 'hit'
        }));
        triggerImpactFX('p2', `CRIMSON SLASH! -${bonusDmg}`, 'critical', p1Character.themeColor);
        break;
      }
      case 'zenko': {
        const bonusDmg = 30;
        botComboRef.current = 0;
        setP2State((prev) => ({
          ...prev,
          currentHp: Math.max(0, prev.currentHp - bonusDmg),
          combo: 0,
          animation: 'hit'
        }));
        triggerImpactFX('p2', `SEISMIC SLAM! -${bonusDmg}`, 'critical', p1Character.themeColor);
        break;
      }
      case 'nova': {
        const bonusDmg = 20;
        setP2State((prev) => ({
          ...prev,
          currentHp: Math.max(0, prev.currentHp - bonusDmg),
          animation: 'hit'
        }));
        setP1State((prev) => ({
          ...prev,
          shieldHp: Math.min(50, prev.shieldHp + 30)
        }));
        triggerImpactFX('p2', `PHANTOM SNARE! -${bonusDmg}`, 'critical', p1Character.themeColor);
        triggerImpactFX('p1', `+30 BARRIER 🛡️`, 'combo', '#bf5af2');
        break;
      }
      case 'zephyr': {
        const bonusDmg = 28;
        setP2State((prev) => ({
          ...prev,
          currentHp: Math.max(0, prev.currentHp - bonusDmg),
          animation: 'hit'
        }));
        setP1State((prev) => ({
          ...prev,
          hasHasteBuff: true
        }));
        triggerImpactFX('p2', `CYCLONE THRUST! -${bonusDmg}`, 'critical', p1Character.themeColor);
        triggerImpactFX('p1', `HASTE ACTIVE ⚡`, 'combo', '#00f59b');
        setTimeout(() => {
          setP1State((prev) => ({ ...prev, hasHasteBuff: false }));
        }, 6000);
        break;
      }
      case 'raven': {
        const bonusDmg = 25;
        const healAmt = 18;
        setP2State((prev) => ({
          ...prev,
          currentHp: Math.max(0, prev.currentHp - bonusDmg),
          animation: 'hit'
        }));
        setP1State((prev) => ({
          ...prev,
          currentHp: Math.min(prev.maxHp, prev.currentHp + healAmt)
        }));
        triggerImpactFX('p2', `SOUL REAP! -${bonusDmg}`, 'critical', p1Character.themeColor);
        triggerImpactFX('p1', `+${healAmt} HP SIPHON 🩸`, 'combo', '#38bdf8');
        break;
      }
    }

    setTimeout(() => {
      setP1State((prev) => ({ ...prev, animation: 'idle' }));
      setP2State((prev) => ({ ...prev, animation: 'idle' }));
    }, 450);
  }, [p1Character, p1State.superMeter, matchActive, battleResult, triggerImpactFX, triggerScreenShake]);

  // Handle Player 1 Typing Input
  const handleInputChange = (value: string) => {
    if (battleResult) return;

    const prevLength = userInput.length;
    const isBackspace = value.length < prevLength;
    const elapsedSecs = Math.max(1, (Date.now() - startTimeRef.current) / 1000);

    // Keystroke sound
    if (!isBackspace) {
      sound.playKeyClick();
    }

    // Validate substring against target sentence
    const isMatching = currentSentence.startsWith(value);

    if (!isMatching) {
      // Mistake detected
      sound.playError();
      setHasInputError(true);

      setP1State((prev) => {
        const nextMistakes = prev.mistakes + 1;
        const total = prev.totalKeystrokes + 1;
        const reducedCombo = applyMistakePenalty(prev.combo);

        return {
          ...prev,
          mistakes: nextMistakes,
          totalKeystrokes: total,
          combo: reducedCombo,
          accuracy: calculateAccuracy(prev.correctKeystrokes, total)
        };
      });

      triggerImpactFX('p1', 'MISS', 'miss', '#ff2a5f');

      setTimeout(() => setHasInputError(false), 250);
      setUserInput(value);
      return;
    }

    // Input is correct prefix so far
    setHasInputError(false);
    setUserInput(value);

    // Keystroke statistics update
    const addedChars = Math.max(0, value.length - prevLength);
    setP1State((prev) => {
      const correct = prev.correctKeystrokes + addedChars;
      const total = prev.totalKeystrokes + addedChars;
      return {
        ...prev,
        correctKeystrokes: correct,
        totalKeystrokes: total,
        accuracy: calculateAccuracy(correct, total),
        wpm: calculateWpm(correct, elapsedSecs)
      };
    });

    // Check if a space was typed or word completed
    if (value.endsWith(' ') || value === currentSentence) {
      const words = value.trim().split(/\s+/);
      const currentWordIdx = words.length - 1;

      if (currentWordIdx >= lastTypedWordIndexRef.current) {
        const completedWord = words[currentWordIdx];
        if (completedWord) {
          executePlayerStrike(completedWord, value === currentSentence);
        }
        lastTypedWordIndexRef.current = currentWordIdx + 1;
      }
    }

    // Check if entire sentence is completed!
    if (value === currentSentence) {
      // Transition to next sentence
      setTimeout(() => {
        const nextSentence = getRandomSentence(currentSentence);
        setCurrentSentence(nextSentence);
        setUserInput('');
        lastTypedWordIndexRef.current = 0;
      }, 200);
    }
  };

  // Rematch Handler
  const handleRematch = () => {
    setP1State((prev) => ({
      ...prev,
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
    }));

    setP2State((prev) => ({
      ...prev,
      currentHp: 100,
      combo: 0,
      maxCombo: 0,
      animation: 'idle',
      wpm: 0,
      accuracy: 94,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      mistakes: 0,
      damageDealt: 0,
      superMeter: 0,
      shieldHp: 0,
      isFrozen: false,
      hasHasteBuff: false
    }));

    setCurrentSentence('The quick brown fox jumps over the lazy dog.');
    setUserInput('');
    setHasInputError(false);
    setTimeLeft(75);
    setCountdown(3);
    setFloatingTexts([]);
    setParticles([]);
    lastTypedWordIndexRef.current = 0;
    botComboRef.current = 0;
    startTimeRef.current = Date.now();
    setBattleResult(null);
    setMatchActive(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="battle-screen-layout">
      {/* Top HUD with HP Bars & Match Timer */}
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

      {/* Bottom Typing Card */}
      <TypingConsole
        sentence={currentSentence}
        userInput={userInput}
        onInputChange={handleInputChange}
        onTriggerUltimate={handleTriggerUltimate}
        p1State={p1State}
        p2State={p2State}
        hasError={hasInputError}
        disabled={!!battleResult || countdown !== null}
      />

      {/* Battle Results Modal */}
      {battleResult && (
        <BattleResultModal
          result={battleResult}
          p1State={p1State}
          p2State={p2State}
          onRematch={handleRematch}
          onCharacterSelect={onReturnToSelect}
        />
      )}
    </div>
  );
};
