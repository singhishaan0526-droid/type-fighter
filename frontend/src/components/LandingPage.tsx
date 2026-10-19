import React, { useState } from 'react';
import { Swords, Zap, Sparkles, User, Play, CheckCircle2, Flame } from 'lucide-react';
import { CHARACTERS } from '../data/characters';
import { GoogleAuthModal, type GoogleUserProfile } from './GoogleAuthModal';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  loginType: 'guest' | 'google';
}

interface LandingPageProps {
  onLogin: (user: UserProfile) => void;
}

const GUEST_SUGGESTIONS = [
  'ShadowTypist',
  'NeonStriker',
  'CyberGhost',
  'SpeedNinja',
  'ViperKeys',
  'ZenMaster'
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [guestName, setGuestName] = useState(() => {
    const randomIdx = Math.floor(Math.random() * GUEST_SUGGESTIONS.length);
    return GUEST_SUGGESTIONS[randomIdx];
  });
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [selectedPreviewChar, setSelectedPreviewChar] = useState(CHARACTERS[0]);

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = guestName.trim() || 'Guest Striker';
    const guestUser: UserProfile = {
      id: `guest-${Date.now()}`,
      name: finalName,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(finalName)}`,
      loginType: 'guest'
    };
    onLogin(guestUser);
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

  return (
    <div className="landing-page-container">
      {/* Background Ambience */}
      <div className="landing-bg-mesh" />

      {/* Navigation Brand Header */}
      <header className="landing-nav-header">
        <div className="navbar-brand">
          <div className="brand-logo-badge">
            <Swords className="brand-icon" size={24} />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">TYPING BATTLE</h1>
            <span className="brand-subtitle">CYBER SHADOW ARENA</span>
          </div>
        </div>

        <div className="landing-nav-stats">
          <span className="landing-stat-pill">
            <Flame size={14} color="#ff2a5f" /> 3-MIN ROUNDS
          </span>
          <span className="landing-stat-pill">
            <Zap size={14} color="#00e5ff" /> 20-35 WPM AI
          </span>
        </div>
      </header>

      {/* Hero Showcase Grid */}
      <section className="landing-hero-section">
        <div className="landing-hero-content">
          <div className="landing-badge">
            <Sparkles size={14} />
            <span>THE NEXT GENERATION OF TYPING COMBAT</span>
          </div>

          <h2 className="landing-hero-title">
            TYPE FASTER. <br />
            <span className="neon-gradient-text">FIGHT HARDER.</span>
          </h2>

          <p className="landing-hero-desc">
            Transform keystrokes into devastating martial arts combos. Battle adaptive
            shadow bots in 3-minute tournament rounds, or train indefinitely in the
            Endless Dojo with live accuracy diagnostics.
          </p>

          {/* Quick Highlights */}
          <div className="landing-feature-bullets">
            <div className="feature-bullet-item">
              <CheckCircle2 size={16} className="bullet-icon" />
              <span><strong>3-Minute Matches</strong> — Write & fight continuously for a full 3-min drill.</span>
            </div>
            <div className="feature-bullet-item">
              <CheckCircle2 size={16} className="bullet-icon" />
              <span><strong>Calibrated Bot Speeds</strong> — 20 WPM Easy mode, 35 WPM Medium mode.</span>
            </div>
            <div className="feature-bullet-item">
              <CheckCircle2 size={16} className="bullet-icon" />
              <span><strong>Endless Free Practice</strong> — Write as long as you want; hit End for full WPM & Accuracy report.</span>
            </div>
          </div>
        </div>

        {/* Dual Login Card */}
        <div className="landing-auth-card">
          <div className="auth-card-header">
            <h3 className="auth-card-title">CHOOSE ACCESS MODE</h3>
            <p className="auth-card-subtitle">Select guest play or connect with Google</p>
          </div>

          <div className="auth-options-container">
            {/* Option 1: Guest Login */}
            <div className="auth-option-block guest-block">
              <div className="option-badge">OPTION 1</div>
              <h4 className="option-title">GUEST ACCESS</h4>
              <p className="option-desc">Instant play without registration</p>

              <form onSubmit={handleGuestLogin} className="guest-form">
                <div className="guest-input-wrap">
                  <User size={16} className="guest-icon" />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter warrior name..."
                    className="guest-name-input"
                    maxLength={20}
                    required
                  />
                </div>
                <button type="submit" id="guest-login-btn" className="guest-submit-btn">
                  <Play size={16} fill="currentColor" />
                  <span>PLAY AS GUEST</span>
                </button>
              </form>
            </div>

            <div className="auth-option-divider">
              <span>OR</span>
            </div>

            {/* Option 2: Google Login */}
            <div className="auth-option-block google-block">
              <div className="option-badge google-badge">OPTION 2</div>
              <h4 className="option-title">GOOGLE SIGN IN</h4>
              <p className="option-desc">Sync profile, avatar, and match records</p>

              <button
                type="button"
                id="google-login-btn"
                className="google-action-btn"
                onClick={() => setIsGoogleModalOpen(true)}
              >
                {/* Google Logo SVG */}
                <svg width="20" height="20" viewBox="0 0 24 24" className="google-icon-svg">
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
                <span>CONTINUE WITH GOOGLE</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modes & Character Roster Showcase */}
      <section className="landing-roster-preview">
        <div className="section-title-wrap">
          <span className="section-pretitle">CYBER SHADOW ROSTER</span>
          <h3 className="section-title">CHOOSE YOUR MARTIAL ARTIST</h3>
        </div>

        <div className="landing-roster-strip">
          {CHARACTERS.map((char) => (
            <div
              key={char.id}
              className={`roster-preview-pill ${selectedPreviewChar.id === char.id ? 'active' : ''}`}
              onClick={() => setSelectedPreviewChar(char)}
              style={{
                borderColor: selectedPreviewChar.id === char.id ? char.themeColor : undefined
              }}
            >
              <img src={char.avatarUrl} alt={char.name} className="roster-pill-avatar" />
              <div className="roster-pill-meta">
                <span className="roster-pill-name">{char.name}</span>
                <span className="roster-pill-weapon">{char.weapon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Fighter Spotlight */}
        <div
          className="fighter-spotlight-card"
          style={{ borderColor: selectedPreviewChar.themeColor }}
        >
          <div className="spotlight-avatar-box">
            <img src={selectedPreviewChar.avatarUrl} alt={selectedPreviewChar.name} />
          </div>
          <div className="spotlight-info-box">
            <div className="spotlight-title-row">
              <h4 style={{ color: selectedPreviewChar.themeColor }}>
                {selectedPreviewChar.name}
              </h4>
              <span className="spotlight-tag">{selectedPreviewChar.title}</span>
            </div>
            <p className="spotlight-tagline">"{selectedPreviewChar.tagline}"</p>
            <p className="spotlight-desc">{selectedPreviewChar.attackDescription}</p>

            <div className="spotlight-stats-row">
              <div className="spotlight-stat">
                <span>SPEED</span>
                <strong>{selectedPreviewChar.stats.speed}</strong>
              </div>
              <div className="spotlight-stat">
                <span>POWER</span>
                <strong>{selectedPreviewChar.stats.power}</strong>
              </div>
              <div className="spotlight-stat">
                <span>AGILITY</span>
                <strong>{selectedPreviewChar.stats.agility}</strong>
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
