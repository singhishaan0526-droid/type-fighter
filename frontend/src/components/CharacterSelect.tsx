import React, { useState } from 'react';
import { CHARACTERS } from '../data/characters';
import type { Character, GameMode, BotDifficulty } from '../types/game';
import { sound } from '../utils/sound';
import { Swords, Gauge, Flame, Wind, Play, Wifi, Sparkles, Globe } from 'lucide-react';
import { getServerUrl, setServerUrl, REMOTE_PRODUCTION_BACKEND, LOCAL_DEV_BACKEND } from '../utils/socketClient';

interface CharacterSelectProps {
  mode: GameMode;
  onStartBattle: (p1: Character, p2: Character, difficulty: BotDifficulty, onlineSessionId?: string) => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  mode,
  onStartBattle
}) => {
  const [selectedP1, setSelectedP1] = useState<Character>(CHARACTERS[0]); // Byte
  const [selectedP2, setSelectedP2] = useState<Character>(CHARACTERS[1]); // Glitch
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [onlineSessionId, setOnlineSessionId] = useState('arena-1');

  const handleSelectP1 = (char: Character) => {
    setSelectedP1(char);
    sound.playKeyClick();
  };

  const handleSelectP2 = (char: Character) => {
    setSelectedP2(char);
    sound.playKeyClick();
  };

  const handleStart = () => {
    sound.playAttack(selectedP1.weaponType);
    onStartBattle(selectedP1, selectedP2, botDifficulty, onlineSessionId);
  };

  return (
    <div className="char-select-screen">
      {/* Hero Banner / Header */}
      <div className="select-header">
        <div className="select-badge">PHASE A PROTOTYPE</div>
        <h2 className="select-title">SELECT YOUR SHADOW WARRIOR</h2>
        <p className="select-subtitle">
          Each warrior commands an ancient non-gun weapon. Your typing speed fuels their combat strikes.
        </p>
      </div>

      {/* Two-Column Selection or Showcase */}
      <div className="select-layout">
        {/* Left Side: Active Character Preview Showcase */}
        <div
          className="selected-hero-card"
          style={{
            borderColor: selectedP1.themeColor,
            boxShadow: `0 0 35px ${selectedP1.accentGlow}`
          }}
        >
          <div className="hero-banner-image-wrapper">
            <img
              src={selectedP1.avatarUrl}
              alt={selectedP1.name}
              className="hero-full-avatar"
            />
            <div
              className="hero-avatar-overlay"
              style={{
                background: `linear-gradient(to top, rgba(10, 12, 18, 0.95) 15%, transparent 80%)`
              }}
            />
            <div className="hero-tag-floating" style={{ backgroundColor: selectedP1.themeColor }}>
              PLAYER 1
            </div>
          </div>

          <div className="hero-details">
            <div className="hero-name-row">
              <div>
                <h3 className="hero-name" style={{ color: selectedP1.themeColor }}>
                  {selectedP1.name}
                </h3>
                <span className="hero-title">{selectedP1.title}</span>
              </div>
              <div className="hero-weapon-tag">
                <span className="weapon-label">WEAPON</span>
                <span className="weapon-val">{selectedP1.weapon}</span>
              </div>
            </div>

            <p className="hero-quote">"{selectedP1.tagline}"</p>
            <p className="hero-desc">{selectedP1.attackDescription}</p>

            {/* Stat Bars */}
            <div className="hero-stats-panel">
              <div className="stat-item">
                <div className="stat-label">
                  <Wind size={14} /> SPEED
                </div>
                <div className="stat-track">
                  <div
                    className="stat-fill"
                    style={{
                      width: `${selectedP1.stats.speed}%`,
                      backgroundColor: selectedP1.themeColor
                    }}
                  />
                </div>
                <span className="stat-num">{selectedP1.stats.speed}</span>
              </div>

              <div className="stat-item">
                <div className="stat-label">
                  <Flame size={14} /> POWER
                </div>
                <div className="stat-track">
                  <div
                    className="stat-fill"
                    style={{
                      width: `${selectedP1.stats.power}%`,
                      backgroundColor: selectedP1.themeColor
                    }}
                  />
                </div>
                <span className="stat-num">{selectedP1.stats.power}</span>
              </div>

              <div className="stat-item">
                <div className="stat-label">
                  <Gauge size={14} /> AGILITY
                </div>
                <div className="stat-track">
                  <div
                    className="stat-fill"
                    style={{
                      width: `${selectedP1.stats.agility}%`,
                      backgroundColor: selectedP1.themeColor
                    }}
                  />
                </div>
                <span className="stat-num">{selectedP1.stats.agility}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Roster Grid + Battle Configuration */}
        <div className="roster-panel">
          <div className="roster-section-header">
            <h4>CHOOSE FIGHTER</h4>
            <span className="roster-count">{CHARACTERS.length} WARRIORS AVAILABLE</span>
          </div>

          {/* 6 Character Cards Grid */}
          <div className="characters-grid">
            {CHARACTERS.map((char) => {
              const isP1 = selectedP1.id === char.id;
              const isP2 = selectedP2.id === char.id;

              return (
                <div
                  key={char.id}
                  id={`char-card-${char.id}`}
                  className={`char-card ${isP1 ? 'selected-p1' : ''} ${isP2 && mode === 'local-duel' ? 'selected-p2' : ''}`}
                  onClick={() => handleSelectP1(char)}
                  style={{
                    borderColor: isP1 ? char.themeColor : 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="char-card-portrait">
                    <img src={char.avatarUrl} alt={char.name} />
                    {isP1 && (
                      <span className="badge-p1" style={{ backgroundColor: char.themeColor }}>
                        P1
                      </span>
                    )}
                    {isP2 && mode === 'local-duel' && !isP1 && (
                      <span className="badge-p2">P2</span>
                    )}
                  </div>
                  <div className="char-card-info">
                    <span className="char-card-name" style={{ color: isP1 ? char.themeColor : '#fff' }}>
                      {char.name}
                    </span>
                    <span className="char-card-weapon">{char.weapon}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Opponent Selection / Difficulty Config / Online Session */}
          <div className="battle-config-card">
            {mode === 'online-duel' ? (
              <div className="online-duel-config">
                {/* Combat Server Switcher */}
                <div className="config-row">
                  <span className="config-title">COMBAT SERVER</span>
                  <div className="server-selector-group">
                    <button
                      type="button"
                      className={`server-toggle-btn ${!getServerUrl().includes('onrender.com') ? 'active' : ''}`}
                      onClick={() => {
                        const localTarget =
                          typeof window !== 'undefined' && window.location.hostname !== 'localhost'
                            ? `http://${window.location.hostname}:3001`
                            : LOCAL_DEV_BACKEND;
                        setServerUrl(localTarget);
                        sound.playKeyClick();
                      }}
                    >
                      <Wifi size={14} />
                      <span>LOCAL WI-FI</span>
                    </button>
                    <button
                      type="button"
                      className={`server-toggle-btn ${getServerUrl().includes('onrender.com') ? 'active' : ''}`}
                      onClick={() => {
                        setServerUrl(REMOTE_PRODUCTION_BACKEND);
                        sound.playKeyClick();
                      }}
                    >
                      <Globe size={14} />
                      <span>CLOUD ARENA</span>
                    </button>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Active Server: <code style={{ color: 'var(--neon-cyan)' }}>{getServerUrl()}</code>
                  </p>
                </div>

                {/* Session ID */}
                <div className="config-row">
                  <div className="online-session-input-header">
                    <span className="config-title">ROOM SESSION ID</span>
                    <button
                      type="button"
                      className="random-session-btn"
                      onClick={() => setOnlineSessionId(`arena-${Math.floor(100 + Math.random() * 900)}`)}
                    >
                      GENERATE RANDOM
                    </button>
                  </div>
                  <input
                    id="online-session-input"
                    type="text"
                    className="online-session-text-input"
                    value={onlineSessionId}
                    onChange={(e) => setOnlineSessionId(e.target.value.trim().toLowerCase())}
                    placeholder="e.g. arena-1"
                    maxLength={24}
                  />
                  <div className="quick-arena-chips">
                    {['arena-1', 'arena-2', 'arena-cyber'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={`arena-chip ${onlineSessionId === preset ? 'active' : ''}`}
                        onClick={() => setOnlineSessionId(preset)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Both players (Desktop &amp; Mobile) must enter the <strong>exact same Session ID</strong> and be on the same server to duel.
                  </p>
                </div>
              </div>
            ) : mode === 'vs-bot' ? (
              <div className="bot-config">
                <div className="config-row">
                  <span className="config-title">OPPONENT: SHADOW BOT</span>
                  <div className="bot-char-pills">
                    {CHARACTERS.map((char) => (
                      <button
                        key={`bot-pick-${char.id}`}
                        className={`pill-btn ${selectedP2.id === char.id ? 'active' : ''}`}
                        onClick={() => handleSelectP2(char)}
                        style={{
                          borderColor: selectedP2.id === char.id ? char.themeColor : 'transparent'
                        }}
                      >
                        {char.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="config-row">
                  <span className="config-title">DIFFICULTY LEVEL</span>
                  <div className="difficulty-selector">
                    {(['easy', 'medium', 'hard', 'master'] as BotDifficulty[]).map((diff) => (
                      <button
                        key={diff}
                        id={`diff-btn-${diff}`}
                        className={`diff-btn ${botDifficulty === diff ? 'active' : ''}`}
                        onClick={() => setBotDifficulty(diff)}
                      >
                        {diff.toUpperCase()}
                        <span className="diff-wpm-hint">
                          {diff === 'easy' && '~20 WPM'}
                          {diff === 'medium' && '~35 WPM'}
                          {diff === 'hard' && '~55 WPM'}
                          {diff === 'master' && '~80 WPM'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : mode === 'practice' ? (
              <div className="practice-mode-info-config">
                <div className="config-row">
                  <span className="config-title">ENDLESS FREE PRACTICE DOJO</span>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '0.3rem' }}>
                    Type freely without a timer limit. Type as many sentences as you want at your own pace.
                    Click <strong>END SESSION</strong> anytime to display your comprehensive WPM, accuracy, and keystroke metrics.
                  </p>
                </div>
              </div>
            ) : (
              <div className="local-duel-config">
                <span className="config-title">PLAYER 2 CHARACTER</span>
                <div className="bot-char-pills">
                  {CHARACTERS.map((char) => (
                    <button
                      key={`p2-pick-${char.id}`}
                      className={`pill-btn ${selectedP2.id === char.id ? 'active' : ''}`}
                      onClick={() => handleSelectP2(char)}
                      style={{
                        borderColor: selectedP2.id === char.id ? char.themeColor : 'transparent'
                      }}
                    >
                      {char.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              id="start-battle-cta"
              className="start-battle-btn"
              onClick={handleStart}
              style={{
                boxShadow: `0 0 25px ${selectedP1.accentGlow}`
              }}
            >
              {mode === 'online-duel' ? <Wifi size={20} /> : mode === 'practice' ? <Sparkles size={20} /> : <Swords size={20} />}
              <span>
                {mode === 'online-duel'
                  ? 'CONNECT TO ARENA'
                  : mode === 'practice'
                  ? 'ENTER FREE DOJO'
                  : 'COMMENCE BATTLE'}
              </span>
              <Play size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
