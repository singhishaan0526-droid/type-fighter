import React from 'react';
import type { FighterState, FloatingText, Particle, Character } from '../types/game';
import { ShadowFighterSprite } from './ShadowFighterSprite';
import { Sparkles, Swords, Zap, Quote } from 'lucide-react';

export interface FinishingMoveState {
  winner: 'player1' | 'player2';
  winnerChar: Character;
  loserChar: Character;
  step: 'strike' | 'dialogue';
  finisherName: string;
  quote: string;
}

interface ShadowArenaProps {
  p1State: FighterState;
  p2State: FighterState;
  floatingTexts: FloatingText[];
  particles: Particle[];
  isScreenShaking: boolean;
  countdown?: number | null;
  finishingMove?: FinishingMoveState | null;
  onSkipFinisher?: () => void;
}

export const ShadowArena: React.FC<ShadowArenaProps> = ({
  p1State,
  p2State,
  floatingTexts,
  particles,
  isScreenShaking,
  countdown = null,
  finishingMove = null,
  onSkipFinisher
}) => {
  const isClashing =
    p1State.animation === 'attack' ||
    p1State.animation === 'punch' ||
    p1State.animation === 'kick' ||
    p1State.animation === 'unique' ||
    p2State.animation === 'attack' ||
    p2State.animation === 'punch' ||
    p2State.animation === 'kick' ||
    p2State.animation === 'unique';

  const activeAttackMove =
    p1State.animation === 'unique'
      ? `${p1State.character.name}: ${p1State.character.uniqueMoveName}`
      : p2State.animation === 'unique'
      ? `${p2State.character.name}: ${p2State.character.uniqueMoveName}`
      : p1State.animation === 'kick' || p2State.animation === 'kick'
      ? 'FLYING KICK!'
      : p1State.animation === 'punch' || p2State.animation === 'punch'
      ? 'FIST STRIKE!'
      : isClashing
      ? 'WEAPON CLASH!'
      : null;

  return (
    <div className={`shadow-arena-viewport ${isScreenShaking ? 'screen-shake' : ''} ${finishingMove ? 'finisher-active-mode' : ''}`}>
      {/* Background Arena Backdrop */}
      <div className="arena-backdrop" />

      {/* Atmospheric Mist & Vignette */}
      <div className="arena-mist-layer" />

      {/* Floating Particles (Sparks & Embers) */}
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
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              opacity: p.alpha
            }}
          />
        ))}
      </div>

      {/* Floating Combat Text / Damage Numbers */}
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

      {/* Ground Battle Platform */}
      <div className="arena-ground-platform">
        <div className="platform-stone-texture" />
      </div>

      {/* Active Attack Technique Notification Ribbon */}
      {activeAttackMove && !finishingMove && (
        <div className="combat-active-technique-banner">
          <Zap size={14} className="technique-icon" />
          <span>{activeAttackMove.toUpperCase()}</span>
        </div>
      )}

      {/* Side-view Shadow Warriors Stage */}
      <div className={`arena-fighters-stage ${finishingMove ? 'stage-finisher-zoom' : ''}`}>
        {/* Left Fighter (P1) */}
        <div className={`fighter-position-slot p1-slot ${p1State.animation !== 'idle' ? `slot-anim-${p1State.animation}` : ''}`}>
          {p1State.isFrozen && <div className="frozen-ice-aura">❄️ FROZEN</div>}
          {p1State.shieldHp > 0 && <div className="shield-bubble-fx" />}
          {p1State.hasHasteBuff && <div className="haste-aura-fx" />}
          <ShadowFighterSprite
            character={p1State.character}
            animation={p1State.animation}
            isFacingRight={true}
          />
          <div className="fighter-ground-indicator">
            <span className="fighter-name-tag" style={{ color: p1State.character.themeColor }}>
              {p1State.character.name}
            </span>
            <span className="fighter-title-sub">{p1State.character.title}</span>
            {p1State.combo > 1 && (
              <span className="combo-counter-badge" style={{ backgroundColor: p1State.character.themeColor }}>
                {p1State.combo}x COMBO
              </span>
            )}
            {p1State.shieldHp > 0 && (
              <span className="shield-active-badge">🛡️ {p1State.shieldHp}</span>
            )}
            {p1State.hasHasteBuff && (
              <span className="haste-active-badge">⚡ HASTE</span>
            )}
          </div>
        </div>

        {/* Center Clash Zone */}
        <div className="clash-zone-indicator" />

        {/* Right Fighter (P2 / Bot) */}
        <div className={`fighter-position-slot p2-slot ${p2State.animation !== 'idle' ? `slot-anim-${p2State.animation}` : ''}`}>
          {p2State.isFrozen && <div className="frozen-ice-aura">❄️ FROZEN</div>}
          {p2State.shieldHp > 0 && <div className="shield-bubble-fx" />}
          {p2State.hasHasteBuff && <div className="haste-aura-fx" />}
          <ShadowFighterSprite
            character={p2State.character}
            animation={p2State.animation}
            isFacingRight={false}
          />
          <div className="fighter-ground-indicator">
            <span className="fighter-name-tag" style={{ color: p2State.character.themeColor }}>
              {p2State.character.name}
            </span>
            <span className="fighter-title-sub">{p2State.character.title}</span>
            {p2State.combo > 1 && (
              <span className="combo-counter-badge" style={{ backgroundColor: p2State.character.themeColor }}>
                {p2State.combo}x COMBO
              </span>
            )}
            {p2State.shieldHp > 0 && (
              <span className="shield-active-badge">🛡️ {p2State.shieldHp}</span>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Clash Impact Spark at center when punching, kicking, or slashing */}
      {isClashing && (
        <div className="clash-impact-flare">
          <div className="clash-spark-core" />
        </div>
      )}

      {/* Pre-Match Round Countdown Overlay */}
      {countdown !== null && (
        <div className="countdown-overlay">
          <div className="countdown-round-label">ROUND 1</div>
          <div className={`countdown-digit ${countdown === 0 ? 'fight-text' : ''}`}>
            {countdown > 0 ? countdown : 'FIGHT!'}
          </div>
        </div>
      )}

      {/* CINEMATIC FINISHER SEQUENCE & WINNER DIALOGUE */}
      {finishingMove && (
        <div className="finisher-cinematic-overlay">
          <div className="finisher-backdrop-shroud" />

          {finishingMove.step === 'strike' ? (
            /* Stage 1: Impact Banner & Decisive Finishing Strike */
            <div className="finisher-strike-stage">
              <div className="finisher-super-label">DECISIVE FINISHING STRIKE</div>
              <h1
                className="finisher-char-name-hero"
                style={{
                  color: finishingMove.winnerChar.themeColor,
                  textShadow: `0 0 35px ${finishingMove.winnerChar.themeColor}`
                }}
              >
                {finishingMove.winnerChar.name}
              </h1>
              <div className="finisher-move-banner">
                <Sparkles size={20} style={{ color: finishingMove.winnerChar.themeColor }} />
                <span>{finishingMove.finisherName}</span>
                <Sparkles size={20} style={{ color: finishingMove.winnerChar.themeColor }} />
              </div>
            </div>
          ) : (
            /* Stage 2: Winner Dialogue & Victory Cutscene Box */
            <div
              className="finisher-dialogue-card"
              style={{
                borderColor: finishingMove.winnerChar.themeColor,
                boxShadow: `0 0 40px ${finishingMove.winnerChar.accentGlow}`
              }}
            >
              <div className="finisher-dialogue-inner">
                {/* Winner Avatar with pulsing aura */}
                <div
                  className="dialogue-avatar-wrapper"
                  style={{
                    borderColor: finishingMove.winnerChar.themeColor,
                    boxShadow: `0 0 20px ${finishingMove.winnerChar.accentGlow}`
                  }}
                >
                  <img
                    src={finishingMove.winnerChar.avatarUrl}
                    alt={finishingMove.winnerChar.name}
                    className="dialogue-avatar-img"
                  />
                  <div
                    className="dialogue-winner-tag"
                    style={{ backgroundColor: finishingMove.winnerChar.themeColor }}
                  >
                    WINNER
                  </div>
                </div>

                {/* Dialogue Content */}
                <div className="dialogue-content-pane">
                  <div className="dialogue-header-row">
                    <div>
                      <h3
                        className="dialogue-winner-name"
                        style={{ color: finishingMove.winnerChar.themeColor }}
                      >
                        {finishingMove.winnerChar.name}
                      </h3>
                      <span className="dialogue-winner-title">{finishingMove.winnerChar.title}</span>
                    </div>

                    <div className="dialogue-finisher-pill">
                      <Swords size={14} />
                      <span>{finishingMove.finisherName}</span>
                    </div>
                  </div>

                  {/* Speech Bubble Quote */}
                  <div className="dialogue-quote-bubble">
                    <Quote size={20} className="quote-icon" style={{ color: finishingMove.winnerChar.themeColor }} />
                    <p className="dialogue-quote-text">"{finishingMove.quote}"</p>
                  </div>

                  {/* Loser Defeat Reaction Footnote */}
                  <div className="dialogue-loser-reaction">
                    <span className="loser-ko-badge">KO'D</span>
                    <span className="loser-reaction-text">
                      <strong>{finishingMove.loserChar.name}:</strong> "{finishingMove.loserChar.defeatQuote}"
                    </span>
                  </div>
                </div>
              </div>

              {onSkipFinisher && (
                <button
                  type="button"
                  className="skip-finisher-btn"
                  onClick={onSkipFinisher}
                >
                  CONTINUE TO RESULTS &rarr;
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
