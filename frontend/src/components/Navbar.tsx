import React, { useState } from 'react';
import { Volume2, VolumeX, Swords, RefreshCw, Zap, Shield, Sparkles, Trophy, Wifi } from 'lucide-react';
import { sound } from '../utils/sound';
import type { GameMode } from '../types/game';

interface NavbarProps {
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onReset: () => void;
  onOpenRecords?: () => void;
  inBattle: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  onSelectMode,
  onReset,
  onOpenRecords,
  inBattle
}) => {
  const [muted, setMuted] = useState(sound.getMuted());

  const handleToggleMute = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
  };

  return (
    <header className="navbar-container">
      <div className="navbar-brand" onClick={onReset} style={{ cursor: 'pointer' }}>
        <div className="brand-logo-badge">
          <Swords className="brand-icon" size={24} />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">TYPING BATTLE</h1>
          <span className="brand-subtitle">TYPE FASTER. FIGHT HARDER.</span>
        </div>
      </div>

      <div className="navbar-actions">
        {!inBattle ? (
          <div className="mode-toggle-group">
            <button
              id="mode-vs-bot-btn"
              className={`mode-btn ${mode === 'vs-bot' ? 'active' : ''}`}
              onClick={() => onSelectMode('vs-bot')}
            >
              <Zap size={14} />
              <span>VS COMPUTER</span>
            </button>
            <button
              id="mode-local-duel-btn"
              className={`mode-btn ${mode === 'local-duel' ? 'active' : ''}`}
              onClick={() => onSelectMode('local-duel')}
            >
              <Shield size={14} />
              <span>PRACTICE DUEL</span>
            </button>
            <button
              id="mode-practice-btn"
              className={`mode-btn ${mode === 'practice' ? 'active' : ''}`}
              onClick={() => onSelectMode('practice')}
            >
              <Sparkles size={14} />
              <span>SOLO DOJO</span>
            </button>
            <button
              id="mode-online-duel-btn"
              className={`mode-btn ${mode === 'online-duel' ? 'active' : ''}`}
              onClick={() => onSelectMode('online-duel')}
            >
              <Wifi size={14} />
              <span>ONLINE DUEL</span>
            </button>
          </div>
        ) : (
          <button
            id="surrender-btn"
            className="navbar-btn outline-btn"
            onClick={onReset}
            title="Return to Character Selection"
          >
            <RefreshCw size={15} />
            <span>EXIT MATCH</span>
          </button>
        )}

        {onOpenRecords && (
          <button
            id="dossier-records-btn"
            className="navbar-btn records-btn"
            onClick={onOpenRecords}
            title="View Combat History & Stats Dossier"
          >
            <Trophy size={16} />
            <span className="records-label">DOSSIER</span>
          </button>
        )}

        <button
          id="sound-toggle-btn"
          className={`navbar-btn sound-btn ${muted ? 'muted' : ''}`}
          onClick={handleToggleMute}
          title={muted ? 'Unmute Sound FX' : 'Mute Sound FX'}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          <span className="sound-label">{muted ? 'MUTED' : 'SFX ON'}</span>
        </button>
      </div>
    </header>
  );
};
