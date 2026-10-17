import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { BattleResult, FighterState } from '../types/game';
import { Trophy, Skull, RefreshCw, Users, Zap, Target, Flame, Swords } from 'lucide-react';
import { sound } from '../utils/sound';

interface BattleResultModalProps {
  result: BattleResult;
  p1State: FighterState;
  p2State: FighterState;
  onRematch: () => void;
  onCharacterSelect: () => void;
}

export const BattleResultModal: React.FC<BattleResultModalProps> = ({
  result,
  p1State,
  p2State,
  onRematch,
  onCharacterSelect
}) => {
  const isP1Winner = result.winner === 'player1';
  const isDraw = result.winner === 'draw';

  useEffect(() => {
    if (isP1Winner) {
      sound.playVictory();
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe guard
      }
    }
  }, [isP1Winner]);

  return (
    <div className="modal-backdrop">
      <div className="battle-result-card">
        {/* Banner Title */}
        <div className={`result-banner ${isP1Winner ? 'banner-victory' : isDraw ? 'banner-draw' : 'banner-defeat'}`}>
          <div className="result-icon-badge">
            {isP1Winner ? (
              <Trophy size={42} className="trophy-icon" />
            ) : isDraw ? (
              <Swords size={42} className="draw-icon" />
            ) : (
              <Skull size={42} className="defeat-icon" />
            )}
          </div>
          <h2 className="result-heading">
            {isP1Winner ? 'VICTORY!' : isDraw ? 'DRAW BATTLE!' : 'DEFEAT!'}
          </h2>
          <p className="result-subheading">
            {isP1Winner
              ? `${p1State.character.name} struck down the shadow opponent with blazing speed!`
              : isDraw
              ? 'Both warriors fought to a standstill!'
              : `${p2State.character.name} proved too swift in combat.`}
          </p>
        </div>

        {/* Head-to-Head Comparison */}
        <div className="result-stats-comparison">
          {/* Fighter 1 Column */}
          <div className="result-fighter-col p1-col">
            <div
              className="result-avatar"
              style={{
                borderColor: p1State.character.themeColor,
                boxShadow: `0 0 20px ${p1State.character.accentGlow}`
              }}
            >
              <img src={p1State.character.avatarUrl} alt={p1State.character.name} />
            </div>
            <h4 className="result-char-name" style={{ color: p1State.character.themeColor }}>
              {p1State.character.name}
            </h4>
            <span className="result-player-role">PLAYER 1</span>
          </div>

          {/* Stats Rows Table */}
          <div className="comparison-table">
            {/* WPM Row */}
            <div className="comp-row">
              <span className={`comp-val ${result.p1Stats.wpm >= result.p2Stats.wpm ? 'win-val' : ''}`}>
                {result.p1Stats.wpm}
              </span>
              <span className="comp-label">
                <Zap size={14} /> WPM
              </span>
              <span className={`comp-val ${result.p2Stats.wpm >= result.p1Stats.wpm ? 'win-val' : ''}`}>
                {result.p2Stats.wpm}
              </span>
            </div>

            {/* Accuracy Row */}
            <div className="comp-row">
              <span className={`comp-val ${result.p1Stats.accuracy >= result.p2Stats.accuracy ? 'win-val' : ''}`}>
                {result.p1Stats.accuracy}%
              </span>
              <span className="comp-label">
                <Target size={14} /> ACCURACY
              </span>
              <span className={`comp-val ${result.p2Stats.accuracy >= result.p1Stats.accuracy ? 'win-val' : ''}`}>
                {result.p2Stats.accuracy}%
              </span>
            </div>

            {/* Max Combo Row */}
            <div className="comp-row">
              <span className={`comp-val ${result.p1Stats.maxCombo >= result.p2Stats.maxCombo ? 'win-val' : ''}`}>
                {result.p1Stats.maxCombo}x
              </span>
              <span className="comp-label">
                <Flame size={14} /> MAX COMBO
              </span>
              <span className={`comp-val ${result.p2Stats.maxCombo >= result.p1Stats.maxCombo ? 'win-val' : ''}`}>
                {result.p2Stats.maxCombo}x
              </span>
            </div>

            {/* Damage Dealt Row */}
            <div className="comp-row">
              <span className={`comp-val ${result.p1Stats.damageDealt >= result.p2Stats.damageDealt ? 'win-val' : ''}`}>
                {result.p1Stats.damageDealt}
              </span>
              <span className="comp-label">
                <Swords size={14} /> DAMAGE
              </span>
              <span className={`comp-val ${result.p2Stats.damageDealt >= result.p1Stats.damageDealt ? 'win-val' : ''}`}>
                {result.p2Stats.damageDealt}
              </span>
            </div>
          </div>

          {/* Fighter 2 Column */}
          <div className="result-fighter-col p2-col">
            <div
              className="result-avatar"
              style={{
                borderColor: p2State.character.themeColor,
                boxShadow: `0 0 20px ${p2State.character.accentGlow}`
              }}
            >
              <img src={p2State.character.avatarUrl} alt={p2State.character.name} />
            </div>
            <h4 className="result-char-name" style={{ color: p2State.character.themeColor }}>
              {p2State.character.name}
            </h4>
            <span className="result-player-role">OPPONENT</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="result-actions-row">
          <button
            id="result-rematch-btn"
            className="action-btn primary-action-btn"
            onClick={onRematch}
          >
            <RefreshCw size={18} />
            <span>PLAY AGAIN</span>
          </button>
          <button
            id="result-change-char-btn"
            className="action-btn secondary-action-btn"
            onClick={onCharacterSelect}
          >
            <Users size={18} />
            <span>CHANGE CHARACTER</span>
          </button>
        </div>
      </div>
    </div>
  );
};
