import React from 'react';
import type { FighterState } from '../types/game';

interface BattleHUDProps {
  p1State: FighterState;
  p2State: FighterState;
  timeLeft: number;
}

export const BattleHUD: React.FC<BattleHUDProps> = ({
  p1State,
  p2State,
  timeLeft
}) => {
  const p1HpPercent = Math.max(0, Math.min(100, (p1State.currentHp / p1State.maxHp) * 100));
  const p2HpPercent = Math.max(0, Math.min(100, (p2State.currentHp / p2State.maxHp) * 100));

  return (
    <div className="battle-hud-container">
      {/* Player 1 Section */}
      <div className="hud-player-block p1-block">
        <div
          className="hud-avatar-circle"
          style={{
            borderColor: p1State.character.themeColor,
            boxShadow: `0 0 15px ${p1State.character.accentGlow}`
          }}
        >
          <img src={p1State.character.avatarUrl} alt={p1State.character.name} />
        </div>

        <div className="hud-info-column">
          <div className="hud-name-row">
            <span className="hud-player-name" style={{ color: p1State.character.themeColor }}>
              {p1State.character.name}
            </span>
            <span className="hud-hp-text">
              HP <strong>{p1State.currentHp}</strong>/{p1State.maxHp}
            </span>
          </div>

          <div className="hp-bar-frame">
            <div
              className="hp-bar-fill p1-hp-fill"
              style={{
                width: `${p1HpPercent}%`,
                background: `linear-gradient(90deg, ${p1State.character.themeColor}, #00f59b)`
              }}
            />
            {p1State.shieldHp > 0 && (
              <div
                className="shield-bar-overlay"
                style={{ width: `${Math.min(100, (p1State.shieldHp / 50) * 100)}%` }}
              />
            )}
          </div>

          {/* Super Meter Gauge */}
          <div className="super-meter-frame" title="Super Meter (100% unlocks Ultimate)">
            <div
              className={`super-meter-fill ${p1State.superMeter >= 100 ? 'super-ready-glow' : ''}`}
              style={{
                width: `${p1State.superMeter}%`,
                background: p1State.superMeter >= 100 ? 'linear-gradient(90deg, #ffb703, #ff2a5f)' : p1State.character.themeColor
              }}
            />
            {p1State.superMeter >= 100 && <span className="super-ready-tag">ULTIMATE READY</span>}
            {p1State.isFrozen && <span className="frozen-status-tag">FROZEN (2.5s)</span>}
          </div>
        </div>
      </div>

      {/* Center VS & Match Timer */}
      <div className="hud-center-block">
        <div className="timer-badge">
          <span className="timer-val">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60) < 10 ? '0' : ''}{timeLeft % 60}
          </span>
        </div>
        <div className="vs-badge">
          <span className="vs-text">VS</span>
        </div>
      </div>

      {/* Player 2 Section */}
      <div className="hud-player-block p2-block">
        <div className="hud-info-column p2-info">
          <div className="hud-name-row p2-name-row">
            <span className="hud-hp-text">
              HP <strong>{p2State.currentHp}</strong>/{p2State.maxHp}
              {p2State.shieldHp > 0 && <span className="shield-hp-addon"> (+{p2State.shieldHp}🛡️)</span>}
            </span>
            <span className="hud-player-name" style={{ color: p2State.character.themeColor }}>
              {p2State.character.name}
            </span>
          </div>

          <div className="hp-bar-frame p2-frame">
            <div
              className="hp-bar-fill p2-hp-fill"
              style={{
                width: `${p2HpPercent}%`,
                background: `linear-gradient(270deg, ${p2State.character.themeColor}, #ff2a5f)`
              }}
            />
            {p2State.shieldHp > 0 && (
              <div
                className="shield-bar-overlay p2-shield"
                style={{ width: `${Math.min(100, (p2State.shieldHp / 50) * 100)}%` }}
              />
            )}
          </div>

          {/* Super Meter Gauge P2 */}
          <div className="super-meter-frame p2-frame" title="Opponent Super Meter">
            <div
              className={`super-meter-fill ${p2State.superMeter >= 100 ? 'super-ready-glow' : ''}`}
              style={{
                width: `${p2State.superMeter}%`,
                background: p2State.superMeter >= 100 ? 'linear-gradient(270deg, #ffb703, #ff2a5f)' : p2State.character.themeColor
              }}
            />
            {p2State.isFrozen && <span className="frozen-status-tag">FROZEN</span>}
          </div>
        </div>

        <div
          className="hud-avatar-circle"
          style={{
            borderColor: p2State.character.themeColor,
            boxShadow: `0 0 15px ${p2State.character.accentGlow}`
          }}
        >
          <img src={p2State.character.avatarUrl} alt={p2State.character.name} />
        </div>
      </div>
    </div>
  );
};
