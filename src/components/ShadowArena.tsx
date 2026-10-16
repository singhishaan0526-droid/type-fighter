import React from 'react';
import type { FighterState, FloatingText, Particle } from '../types/game';
import { ShadowFighterSprite } from './ShadowFighterSprite';

interface ShadowArenaProps {
  p1State: FighterState;
  p2State: FighterState;
  floatingTexts: FloatingText[];
  particles: Particle[];
  isScreenShaking: boolean;
  countdown?: number | null;
}

export const ShadowArena: React.FC<ShadowArenaProps> = ({
  p1State,
  p2State,
  floatingTexts,
  particles,
  isScreenShaking,
  countdown = null
}) => {
  return (
    <div className={`shadow-arena-viewport ${isScreenShaking ? 'screen-shake' : ''}`}>
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

      {/* Side-view Shadow Warriors Stage */}
      <div className="arena-fighters-stage">
        {/* Left Fighter (P1) */}
        <div className="fighter-position-slot p1-slot">
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
        <div className="fighter-position-slot p2-slot">
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

      {/* Pre-Match Round Countdown Overlay */}
      {countdown !== null && (
        <div className="countdown-overlay">
          <div className="countdown-round-label">ROUND 1</div>
          <div className={`countdown-digit ${countdown === 0 ? 'fight-text' : ''}`}>
            {countdown > 0 ? countdown : 'FIGHT!'}
          </div>
        </div>
      )}
    </div>
  );
};
