import React, { useState } from 'react';
import { Volume2, VolumeX, Swords, RefreshCw, Zap, Shield, Sparkles, Trophy, Wifi, LogOut } from 'lucide-react';
import { sound } from '../utils/sound';
import type { GameMode } from '../types/game';
import type { UserProfile } from './LandingPage';

interface NavbarProps {
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onReset: () => void;
  onOpenRecords?: () => void;
  inBattle: boolean;
  user?: UserProfile | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  onSelectMode,
  onReset,
  onOpenRecords,
  inBattle,
  user,
  onLogout
}) => {
  const [muted, setMuted] = useState(sound.getMuted());

  const handleToggleMute = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
  };

  return (
    <header className="navbar-container">
      {/* Brand logo & title */}
      <div className="navbar-brand" onClick={onReset} style={{ cursor: 'pointer' }}>
        <div className="brand-logo-badge">
          <Swords className="brand-icon" size={22} />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">TYPING BATTLE</h1>
          <span className="brand-subtitle">TYPE FASTER. FIGHT HARDER.</span>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="navbar-center-modes">
        {!inBattle ? (
          <div className="mode-toggle-group">
            <button
              id="mode-vs-bot-btn"
              className={`mode-btn ${mode === 'vs-bot' ? 'active' : ''}`}
              onClick={() => onSelectMode('vs-bot')}
              title="3-Min Combat vs AI Bots"
            >
              <Zap size={13} />
              <span>VS COMPUTER</span>
            </button>
            <button
              id="mode-local-duel-btn"
              className={`mode-btn ${mode === 'local-duel' ? 'active' : ''}`}
              onClick={() => onSelectMode('local-duel')}
              title="Practice Duel with Bot"
            >
              <Shield size={13} />
              <span>PRACTICE DUEL</span>
            </button>
            <button
              id="mode-practice-btn"
              className={`mode-btn ${mode === 'practice' ? 'active' : ''}`}
              onClick={() => onSelectMode('practice')}
              title="Endless Free Typing with WPM/Accuracy Diagnostics"
            >
              <Sparkles size={13} />
              <span>ENDLESS DOJO</span>
            </button>
            <button
              id="mode-online-duel-btn"
              className={`mode-btn ${mode === 'online-duel' ? 'active' : ''}`}
              onClick={() => onSelectMode('online-duel')}
              title="Multiplayer Online Arena"
            >
              <Wifi size={13} />
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
            <RefreshCw size={14} />
            <span>EXIT MATCH</span>
          </button>
        )}
      </div>

      {/* Action Controls & User Profile */}
      <div className="navbar-actions">
        {onOpenRecords && (
          <button
            id="dossier-records-btn"
            className="navbar-btn records-btn"
            onClick={onOpenRecords}
            title="View Combat History & Stats Dossier"
          >
            <Trophy size={15} />
            <span className="records-label">DOSSIER</span>
          </button>
        )}

        <button
          id="sound-toggle-btn"
          className={`navbar-btn sound-btn ${muted ? 'muted' : ''}`}
          onClick={handleToggleMute}
          title={muted ? 'Unmute Sound FX' : 'Mute Sound FX'}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          <span className="sound-label">{muted ? 'MUTED' : 'SFX ON'}</span>
        </button>

        {/* User Profile Pill */}
        {user && (
          <div className="navbar-user-chip">
            <img src={user.avatar} alt={user.name} className="user-chip-avatar" />
            <div className="user-chip-info">
              <span className="user-chip-name">{user.name}</span>
              <span className={`user-chip-badge ${user.loginType}`}>
                {user.loginType.toUpperCase()}
              </span>
            </div>
            {onLogout && (
              <button
                className="user-logout-btn"
                onClick={onLogout}
                title="Log out and return to landing page"
                aria-label="Log out"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
