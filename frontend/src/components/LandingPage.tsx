import React, { useState } from 'react';
import {
  Swords,
  Zap,
  Sparkles,
  Flame,
  Wifi,
  Dices,
  Shield,
  ArrowRight,
  Target
} from 'lucide-react';
import { CHARACTERS } from '../data/characters';
import { sound } from '../utils/sound';
import { GoogleAuthModal, type GoogleUserProfile } from './GoogleAuthModal';
import type { GameMode, Character } from '../types/game';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  loginType: 'guest' | 'google';
}

interface LandingPageProps {
  onLogin: (user: UserProfile) => void;
  onDirectStart?: (user: UserProfile, mode: GameMode, roomId?: string) => void;
}

const CYBER_CALLSIGNS = [
  'NeonKage',
  'CyberViper',
  'GhostRonin',
  'ShadowStriker',
  'VoidBlade',
  'TurboShinobi',
  'ApexNinja',
  'ZenKatana',
  'ChronoFist',
  'HyperStriker'
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onDirectStart }) => {
  const [guestName, setGuestName] = useState(() => {
    const idx = Math.floor(Math.random() * CYBER_CALLSIGNS.length);
    return CYBER_CALLSIGNS[idx];
  });
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [selectedPreviewChar, setSelectedPreviewChar] = useState<Character>(CHARACTERS[0]);

  const handleRandomizeName = () => {
    sound.playKeyClick();
    const filtered = CYBER_CALLSIGNS.filter((n) => n !== guestName);
    const randomPick = filtered[Math.floor(Math.random() * filtered.length)] || 'CyberWarrior';
    setGuestName(randomPick);
  };

  const createGuestProfile = (): UserProfile => {
    const finalName = guestName.trim() || 'Guest Striker';
    return {
      id: `guest-${Date.now()}`,
      name: finalName,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(finalName)}`,
      loginType: 'guest'
    };
  };

  const handleHostOnline = () => {
    sound.playKeyClick();
    const user = createGuestProfile();
    const autoRoom = `arena-${Math.floor(100 + Math.random() * 900)}`;
    if (onDirectStart) {
      onDirectStart(user, 'online-duel', autoRoom);
    } else {
      onLogin(user);
    }
  };

  const handleJoinOnline = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playKeyClick();
    const user = createGuestProfile();
    const cleanRoom = joinRoomCode.trim().toLowerCase() || 'arena-1';
    if (onDirectStart) {
      onDirectStart(user, 'online-duel', cleanRoom);
    } else {
      onLogin(user);
    }
  };

  const handleStartSolo = (targetMode: GameMode) => {
    sound.playKeyClick();
    const user = createGuestProfile();
    if (onDirectStart) {
      onDirectStart(user, targetMode);
    } else {
      onLogin(user);
    }
  };

  const handleGoogleSuccess = (profile: GoogleUserProfile) => {
    onLogin({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      avatar: profile.avatar,
      loginType: 'google'
    });
  };

  const handleSelectPreviewChar = (char: Character) => {
    setSelectedPreviewChar(char);
    sound.playAttack(char.weaponType);
  };

  return (
    <div className="landing-page-container">
      {/* Dynamic Cyber Grid & Nebula Mesh */}
      <div className="landing-bg-mesh" />
      <div className="landing-cyber-grid-overlay" />

      {/* Top Navbar */}
      <header className="landing-nav-header">
        <div className="navbar-brand">
          <div className="brand-logo-badge pulse-glow">
            <Swords className="brand-icon" size={24} />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">TYPING BATTLE</h1>
            <span className="brand-subtitle">CYBER SHADOW ARENA</span>
          </div>
        </div>

        <div className="landing-nav-stats">
          <span className="landing-stat-pill p2p-pill">
            <Wifi size={13} color="#00f0ff" />
            <span>SERVERLESS P2P ONLINE</span>
          </span>
          <span className="landing-stat-pill">
            <Flame size={13} color="#ff2a5f" />
            <span>3-MIN COMBAT</span>
          </span>
          <span className="landing-stat-pill">
            <Zap size={13} color="#ffb703" />
            <span>CALIBRATED AI</span>
          </span>
        </div>
      </header>

      {/* Hero Showcase Grid */}
      <section className="landing-hero-section">
        {/* Left Column: Title & Mission */}
        <div className="landing-hero-content">
          <div className="landing-badge neon-badge">
            <Sparkles size={14} />
            <span>NEXT-GEN SHADOW FIGHTING MOTOR</span>
          </div>

          <h2 className="landing-hero-title">
            TYPE FASTER. <br />
            <span className="neon-gradient-text">FIGHT HARDER.</span>
          </h2>

          <p className="landing-hero-desc">
            Convert mechanical keystrokes into bone-shattering martial combos. Challenge
            rivals in zero-latency <strong>P2P Online Duels across two laptops</strong> without
            any backend server, train against calibrated AI bots, or drill in the Endless Dojo.
          </p>

          {/* Quick P2P Serverless Highlight Box */}
          <div className="p2p-highlight-card">
            <div className="p2p-card-header">
              <Wifi size={18} className="text-neon-cyan" />
              <div>
                <strong>Direct 2-Laptop Multiplayer (Zero Backend Required)</strong>
                <p>Hosted purely on Vercel via WebRTC DataChannels. No Render sleeps or server disconnects!</p>
              </div>
            </div>
          </div>

          {/* Character Preview Roster Ribbon */}
          <div className="hero-roster-preview-block">
            <span className="hero-roster-label">CHOOSE YOUR MARTIAL ARTIST:</span>
            <div className="hero-roster-avatars">
              {CHARACTERS.map((char) => {
                const isSelected = selectedPreviewChar.id === char.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    className={`hero-char-thumb-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectPreviewChar(char)}
                    style={{
                      borderColor: isSelected ? char.themeColor : 'rgba(255,255,255,0.12)',
                      boxShadow: isSelected ? `0 0 16px ${char.accentGlow}` : 'none'
                    }}
                    title={`${char.name} - ${char.weapon}`}
                  >
                    <img src={char.avatarUrl} alt={char.name} />
                    <span className="thumb-char-name">{char.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Arcade Command Center */}
        <div className="landing-auth-card arcade-command-card">
          <div className="auth-card-header">
            <div className="arcade-header-tag">BATTLE ACCESS PORTAL</div>
            <h3 className="auth-card-title">ENTER THE SHADOW ARENA</h3>
            <p className="auth-card-subtitle">Choose your warrior handle and launch your combat session</p>
          </div>

          {/* Warrior Callsign Input with Randomizer */}
          <div className="callsign-input-block">
            <label className="callsign-label">
              <span>WARRIOR CALLSIGN</span>
              <button
                type="button"
                className="randomize-dice-btn"
                onClick={handleRandomizeName}
                title="Roll random cyber name"
              >
                <Dices size={14} />
                <span>ROLL NAME</span>
              </button>
            </label>
            <div className="callsign-input-wrapper">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter warrior name..."
                className="callsign-input"
                maxLength={20}
              />
            </div>
          </div>

          {/* Game Modes Action Grid */}
          <div className="portal-action-grid">
            {/* Action 1: Host Online Duel */}
            <button
              type="button"
              id="host-online-duel-btn"
              className="portal-action-btn host-btn"
              onClick={handleHostOnline}
            >
              <div className="portal-btn-icon-box">
                <Wifi size={20} />
              </div>
              <div className="portal-btn-text">
                <span className="btn-main-label">HOST ONLINE DUEL</span>
                <span className="btn-sub-label">Create room & invite Laptop 2 (P2P)</span>
              </div>
              <ArrowRight size={18} className="btn-arrow" />
            </button>

            {/* Action 2: Join Online Duel with Room Code */}
            <form onSubmit={handleJoinOnline} className="join-room-form">
              <div className="join-room-input-wrap">
                <input
                  type="text"
                  value={joinRoomCode}
                  onChange={(e) => setJoinRoomCode(e.target.value)}
                  placeholder="Enter Room Code (e.g. ARENA-1)"
                  className="join-room-input"
                />
                <button type="submit" className="join-room-btn">
                  <span>JOIN DUEL</span>
                </button>
              </div>
            </form>

            <div className="portal-divider">
              <span>OR SINGLE PLAYER</span>
            </div>

            {/* Action 3: Play vs AI Bot */}
            <button
              type="button"
              id="play-vs-bot-btn"
              className="portal-action-btn bot-btn"
              onClick={() => handleStartSolo('vs-bot')}
            >
              <div className="portal-btn-icon-box">
                <Target size={18} />
              </div>
              <div className="portal-btn-text">
                <span className="btn-main-label">SOLO VS AI BOT</span>
                <span className="btn-sub-label">3-minute round (20 - 55 WPM calibrated)</span>
              </div>
              <ArrowRight size={16} className="btn-arrow" />
            </button>

            {/* Action 4: Endless Practice Dojo */}
            <button
              type="button"
              id="play-practice-btn"
              className="portal-action-btn practice-btn"
              onClick={() => handleStartSolo('practice')}
            >
              <div className="portal-btn-icon-box">
                <Shield size={18} />
              </div>
              <div className="portal-btn-text">
                <span className="btn-main-label">ENDLESS PRACTICE DOJO</span>
                <span className="btn-sub-label">Unbounded training with live diagnostic WPM</span>
              </div>
              <ArrowRight size={16} className="btn-arrow" />
            </button>
          </div>

          {/* Alternative Google Sign-in */}
          <div className="portal-footer">
            <button
              type="button"
              id="google-login-btn"
              className="google-action-btn"
              onClick={() => setIsGoogleModalOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="google-icon-svg">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>SYNC PROFILE WITH GOOGLE</span>
            </button>
          </div>
        </div>
      </section>

      {/* Selected Fighter Spotlight Card */}
      <section className="landing-spotlight-section">
        <div
          className="fighter-spotlight-card enhanced-spotlight"
          style={{
            borderColor: selectedPreviewChar.themeColor,
            boxShadow: `0 0 45px ${selectedPreviewChar.accentGlow}`
          }}
        >
          <div className="spotlight-avatar-box">
            <img src={selectedPreviewChar.avatarUrl} alt={selectedPreviewChar.name} />
            <div
              className="spotlight-avatar-tag"
              style={{ backgroundColor: selectedPreviewChar.themeColor }}
            >
              WARRIOR DOSSIER
            </div>
          </div>

          <div className="spotlight-info-box">
            <div className="spotlight-title-row">
              <div>
                <h4 style={{ color: selectedPreviewChar.themeColor }}>
                  {selectedPreviewChar.name}
                </h4>
                <span className="spotlight-tag">{selectedPreviewChar.title}</span>
              </div>
              <div className="spotlight-weapon-badge">
                <span className="weapon-label">WEAPON</span>
                <span className="weapon-name">{selectedPreviewChar.weapon}</span>
              </div>
            </div>

            <p className="spotlight-tagline">"{selectedPreviewChar.tagline}"</p>
            <p className="spotlight-desc">{selectedPreviewChar.attackDescription}</p>

            {/* Tactical Stat Bars */}
            <div className="spotlight-stats-row">
              <div className="spotlight-stat-item">
                <div className="stat-meta">
                  <span>SPEED</span>
                  <strong>{selectedPreviewChar.stats.speed}</strong>
                </div>
                <div className="stat-track">
                  <div
                    className="stat-fill"
                    style={{
                      width: `${selectedPreviewChar.stats.speed}%`,
                      backgroundColor: selectedPreviewChar.themeColor
                    }}
                  />
                </div>
              </div>

              <div className="spotlight-stat-item">
                <div className="stat-meta">
                  <span>POWER</span>
                  <strong>{selectedPreviewChar.stats.power}</strong>
                </div>
                <div className="stat-track">
                  <div
                    className="stat-fill"
                    style={{
                      width: `${selectedPreviewChar.stats.power}%`,
                      backgroundColor: selectedPreviewChar.themeColor
                    }}
                  />
                </div>
              </div>

              <div className="spotlight-stat-item">
                <div className="stat-meta">
                  <span>AGILITY</span>
                  <strong>{selectedPreviewChar.stats.agility}</strong>
                </div>
                <div className="stat-track">
                  <div
                    className="stat-fill"
                    style={{
                      width: `${selectedPreviewChar.stats.agility}%`,
                      backgroundColor: selectedPreviewChar.themeColor
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={handleGoogleSuccess}
      />
    </div>
  );
};
